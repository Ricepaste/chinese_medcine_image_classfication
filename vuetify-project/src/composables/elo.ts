// src/composables/elo.ts
import { loadStateFromLocalUtil } from '@/utils/localStorageUtils'
import { ref, type Ref } from 'vue'

const defaultKFactorUser = 24
const defaultKFactorFlashcard = 32
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
  competitorId: string,
  competitorType: 'user' | 'flashcard'
): Competitor => {
  let competitor = competitors.value.get(competitorId)
  if (!competitor) {
    const kFactor = competitorType === 'user' ? defaultKFactorUser : defaultKFactorFlashcard
    competitor = {
      id: competitorId,
      rating: initialRating,
      kFactor: kFactor
    }
    competitors.value.set(competitorId, competitor)
  }
  return competitor
}

const loadEloStateFromLocal = () => {
  competitors.value = new Map(loadStateFromLocalUtil<Map<string, Competitor>>(eloStateKey) ?? [])
}

const saveEloStateToLocal = () => {
  localStorage.setItem(eloStateKey, JSON.stringify(Array.from(competitors.value.entries()))) // need to convert map to array before save
  console.log('Elo state saved to localStorage.')
}

const loadEloHistoryFromLocal = () => {
  eloHistory.value = loadStateFromLocalUtil<EloHistoryRecord[]>(eloHistoryKey) ?? []
}
const saveEloHistoryToLocal = () => {
  localStorage.setItem(eloHistoryKey, JSON.stringify(eloHistory.value))
  console.log('Elo history saved to localStorage.')
}
const getCompetitor = (competitorId: string, competitorType: 'user' | 'flashcard'): Competitor => {
  return getOrCreateCompetitorUtil(competitorId, competitorType)
}

export function useElo() {
  if (!isInitialized) {
    loadEloStateFromLocal()
    loadEloHistoryFromLocal()
    isInitialized = true
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
    // console.log('eloHistory:', eloHistory)
  }
  const getProbabilityByElo = (flashcardRating: number): number => {
    const userRating = getCompetitor('user', 'user').rating
    const probability = Math.exp((flashcardRating - userRating) / 400)
    return probability / (1 + probability)
  }

  return {
    competitors,
    eloHistory,
    updateRatings,
    getCompetitor,
    getProbabilityByElo,
    loadEloStateFromLocal,
    saveEloStateToLocal,
    loadEloHistoryFromLocal,
    saveEloHistoryToLocal
  }
}
