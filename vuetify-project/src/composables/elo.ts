// src/composables/elo.ts

import { loadStateFromLocalUtil } from '@/utils/localStorageUtils'
import { ref, type Ref } from 'vue'

const defaultKFactorUser = 32
const defaultKFactorFlashcard = 24
const initialRating = 1500

let isInitialized: boolean = false

const competitors: Ref<Map<string, Competitor>> = ref(new Map())
const eloHistory: Ref<EloHistoryRecord[]> = ref([])

const eloStateKey = 'eloState'
const eloHistoryKey = 'eloHistory'

export interface Competitor {
  id: string
  rating: number
  kFactor: number
}

export interface EloHistoryRecord {
  timestamp: number
  userRatingBefore: number
  userRatingAfter: number
  flashcardRatingBefore: number
  flashcardRatingAfter: number
  flashcardId: string
  isCorrect: boolean
}

const calculateExpectedScoreUtil = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

const updateEloRatingUtil = (
  ratingA: number,
  ratingB: number,
  scoreA: number,
  kFactorA: number,
  kFactorB: number
): { updatedRatingA: number; updatedRatingB: number } => {
  const expectedScoreA = calculateExpectedScoreUtil(ratingA, ratingB)
  const expectedScoreB = calculateExpectedScoreUtil(ratingB, ratingA)

  const updatedRatingA = Math.round(ratingA + kFactorA * (scoreA - expectedScoreA))
  const updatedRatingB = Math.round(ratingB + kFactorB * (1 - scoreA - expectedScoreB)) // (1 - scoreA) is score for player B

  return { updatedRatingA, updatedRatingB }
}

const getOrCreateCompetitorUtil = (
  competitors: Map<string, Competitor>,
  competitorId: string,
  competitorType: 'user' | 'flashcard'
): Competitor => {
  let competitor = competitors.get(competitorId)
  if (!competitor) {
    const kFactor = competitorType === 'user' ? defaultKFactorUser : defaultKFactorFlashcard
    competitor = {
      id: competitorId,
      rating: initialRating,
      kFactor: kFactor
    }
    competitors.set(competitorId, competitor)
  }
  return competitor
}

const loadEloStateFromLocal = () => {
  competitors.value = new Map(loadStateFromLocalUtil<Map<string, Competitor>>(eloStateKey) ?? [])
  // const storedState = localStorage.getItem(eloStateKey)
  // if (storedState) {
  //   try {
  //     const parsedState = JSON.parse(storedState) as [string, Competitor][] //local storage return string
  //     competitors.value = new Map(parsedState)
  //     console.log('Elo state loaded from localStorage.')
  //   } catch (e) {
  //     console.error('Error parsing elo state from localStorage:', e)
  //     localStorage.removeItem(eloStateKey) // Remove invalid cache
  //   }
  // }
}

const saveEloStateToLocal = () => {
  localStorage.setItem(eloStateKey, JSON.stringify(Array.from(competitors.value.entries()))) // need to convert map to array before save
  console.log('Elo state saved to localStorage.')
}

const loadEloHistoryFromLocal = () => {
  eloHistory.value = loadStateFromLocalUtil<EloHistoryRecord[]>(eloHistoryKey) ?? []
  // const storedState = localStorage.getItem(eloHistoryKey)
  // if (storedState) {
  //   try {
  //     const parsedState = JSON.parse(storedState) as EloHistoryRecord[]
  //     historyRecords.value = parsedState
  //     console.log('Elo history loaded from localStorage.')
  //   } catch (e) {
  //     console.error('Error parsing elo history from localStorage:', e)
  //     localStorage.removeItem(eloHistoryKey) // Remove invalid cache
  //   }
  // }
}
const saveEloHistoryToLocal = () => {
  localStorage.setItem(eloHistoryKey, JSON.stringify(eloHistory.value))
  console.log('Elo history saved to localStorage.')
}
export function useElo() {
  if (!isInitialized) {
    loadEloStateFromLocal()
    loadEloHistoryFromLocal()
    isInitialized = true
  }

  const getCompetitor = (
    competitorId: string,
    competitorType: 'user' | 'flashcard'
  ): Competitor => {
    return getOrCreateCompetitorUtil(competitors.value, competitorId, competitorType)
  }

  const updateRatings = (
    userCompetitorId: string,
    flashcardCompetitorId: string,
    isCorrect: boolean
  ) => {
    const userCompetitor = getCompetitor(userCompetitorId, 'user')
    const flashcardCompetitor = getCompetitor(flashcardCompetitorId, 'flashcard')

    const score = isCorrect ? 1 : 0

    const userRatingBefore = userCompetitor.rating
    const flashcardRatingBefore = flashcardCompetitor.rating

    const { updatedRatingA: updatedUserRating, updatedRatingB: updatedFlashcardRating } =
      updateEloRatingUtil(
        userCompetitor.rating,
        flashcardCompetitor.rating,
        score,
        userCompetitor.kFactor,
        flashcardCompetitor.kFactor
      )

    userCompetitor.rating = updatedUserRating
    flashcardCompetitor.rating = updatedFlashcardRating
    competitors.value.set(userCompetitorId, userCompetitor) // important to update value in map
    competitors.value.set(flashcardCompetitorId, flashcardCompetitor) // important to update value in map

    const historyRecord: EloHistoryRecord = {
      timestamp: Date.now(),
      userRatingBefore: userRatingBefore,
      userRatingAfter: updatedUserRating,
      flashcardRatingBefore: flashcardRatingBefore,
      flashcardRatingAfter: updatedFlashcardRating,
      flashcardId: flashcardCompetitorId,
      isCorrect: isCorrect
    }
    eloHistory.value.push(historyRecord)
    if (eloHistory.value.length > 100) eloHistory.value.shift() //keep history record within 100 records
    console.log('eloHistory:', eloHistory)

    // saveEloStateToLocal() // been moved to History.vue
    // saveEloHistoryToLocal() // been moved to History.vue
  }

  return {
    competitors,
    eloHistory,
    loadEloStateFromLocal,
    saveEloStateToLocal,
    loadEloHistoryFromLocal,
    saveEloHistoryToLocal,
    getCompetitor,
    updateRatings
  }
}
