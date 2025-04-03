// src/composables/elo.ts

import { loadStateFromLocalUtil } from '@/utils/localStorageUtils'
import { ref, type Ref } from 'vue'

const defaultKFactorUser = 24
const defaultKFactorFlashcard = 32
const initialRating = 1500

let isInitialized: boolean = false

const competitors: Ref<Map<string, Competitor>> = ref(new Map())
const eloHistory: Ref<EloHistoryRecord[]> = ref([])

const sortedCompetitors: Ref<string[]> = ref([]) // contains competitor.id sorted by rating

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

const initializeSortedCompetitors = (competitorsMap: Map<string, Competitor>) => {
  const flashcardCompetitors: Competitor[] = []
  competitorsMap.forEach((competitor) => {
    // if (competitor.id !== 'user') {
    flashcardCompetitors.push(competitor)
    // }
  })
  flashcardCompetitors.sort((a, b) => a.rating - b.rating)
  sortedCompetitors.value = flashcardCompetitors.map((competitor) => competitor.id)
  console.log('initializeSortedCompetitors', sortedCompetitors.value)
}

const updateSortedFlashcardRatings = (flashcardId: string, newRating: number) => {
  const currentRatings = sortedCompetitors.value
  // try to retrieve the old index after randomly pick one
  const flashcardIndex = currentRatings.findIndex((id) => id === flashcardId)

  if (flashcardIndex !== -1) {
    currentRatings.splice(flashcardIndex, 1) // Remove old position
  }

  // Find the correct position using binary search
  let insertIndex = currentRatings.findIndex((id) => competitors.value.get(id)!.rating < newRating)
  if (insertIndex === -1) {
    insertIndex = currentRatings.length // Insert at the end if no lower rating is found
  }

  currentRatings.splice(insertIndex, 0, flashcardId) // Insert at new position
}

const getUserRank = (userRating: number) => {
  const currentRatings = sortedCompetitors.value
  const userRank = currentRatings.findIndex((id) => competitors.value.get(id)!.rating >= userRating)
  console.log(`userRank: ${userRank}, userRating: ${userRating}`) // Debugging line
  if (userRank === -1) {
    return currentRatings.length // User is the lowest ranked
  }
  return userRank
}
const getFlashcardInUserRatingRange = (userRating: number, rangePercentage: number) => {
  // if (sortedFlashcardRatings.value.length === 0) return []

  const userRank = getUserRank(userRating)
  // console.log(`userRank: ${userRank}, userRating: ${userRating}`) // Debugging line

  const deckSize = sortedCompetitors.value.length
  let startIndex = Math.max(0, Math.floor(userRank - deckSize * rangePercentage))
  let endIndex = Math.min(deckSize, Math.ceil(userRank + deckSize * rangePercentage))

  if (userRank < deckSize * rangePercentage) {
    endIndex = Math.min(deckSize, Math.ceil(deckSize * rangePercentage * 2)) // 0-20% if user rank is low
  }
  if (userRank > deckSize * (1 - rangePercentage)) {
    startIndex = Math.max(0, Math.floor(deckSize * (1 - rangePercentage * 2))) // 80-100% if user rank is high
  }

  const sampleRange = sortedCompetitors.value.slice(startIndex, endIndex)
  // console.log(
  //   `userRank: ${userRank}, startIndex: ${startIndex}, endIndex: ${endIndex}, sampleRange: ${JSON.stringify(sampleRange)}`
  // )
  return sampleRange
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
    updateSortedFlashcardRatings(flashcardCompetitorId, updatedFlashcardRating)
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
