// src/composables/flashcard.ts
import { loadStateFromLocalUtil } from '@/utils/localStorageUtils'
import type { Flashcard } from '@/types/Flashcard'
import { ref, watch, type Ref } from 'vue'
import { useElo } from './elo'

// State variables (Singleton instances, defined outside useFlashcard for shared state)
const currentDeck: Ref<Flashcard[]> = ref([])
const loadFinished: Ref<boolean> = ref(false)
const flashcard: Ref<Flashcard> = ref({ imageSrc: '', name: '' })
const showAnswer: Ref<boolean> = ref(false)
let cardIndex: number = 0
let isInitialized: boolean = false // use singleton pattern
const deckCacheKey = 'flashcardDeck'

// Helper function (defined outside useFlashcard as it's a utility function not directly related to component instance)
const LoadImageBySrc = async (src: string, itemName: string): Promise<void> => {
  const response = await fetch(src)
  if (!response.ok) throw new Error(`Failed to load image: ${src}: ${response.statusText}`)

  const blob = await response.blob()
  if (blob.type === 'image/jpeg' || blob.type === 'image/png') {
    currentDeck.value.push({ imageSrc: src, name: itemName } as Flashcard)
  } else {
    // console.log(`Not a jpeg or png image: ${src}`)
    throw new Error('Not a jpeg or png image')
  }
}
const saveDeckCache = async (decks: Flashcard[]) => {
  localStorage.setItem(deckCacheKey, JSON.stringify(decks))
  // console.log('Deck cache saved to localStorage.')
}
const LoadDeckfromCache = (): Flashcard[] | null => {
  return loadStateFromLocalUtil<Flashcard[]>(deckCacheKey)
}

const LoadDeckfromLocal = async () => {
  let itemNames: string[] = []
  const photoFolderPath = `${import.meta.env.BASE_URL}photo/`

  // Load itemNames from deck-config.json
  try {
    const configResponse = await fetch(`${photoFolderPath}deck-config.json`)

    const config: { itemNames: string[] } = await configResponse.json()

    if (!Array.isArray(config.itemNames)) {
      throw new Error('deck-config.json failed to parse itemNames')
    }
    itemNames = config.itemNames
  } catch (error) {
    console.error('Error loading or parsing deck-config.json', error)
    itemNames = []
  }
  // let total = 0

  // randomly shuffle itemNames
  itemNames.sort(() => Math.random() - 0.5)
  for (const itemName of itemNames) {
    if (!currentDeck.value) {
      throw new Error('currentDeck is not initialized when loading images')
    }
    let count = 0

    // load itemName.png/jpg
    const imageSrcPng = `${photoFolderPath}${itemName}.png`
    try {
      await LoadImageBySrc(imageSrcPng, itemName)
      count++
    } catch (error) {
      // console.error(`Error loading image by src: ${imageSrcPng}`, error)
    }

    const imageSrcJpg = `${photoFolderPath}${itemName}.jpg`
    try {
      await LoadImageBySrc(imageSrcJpg, itemName)
      count++
    } catch (error) {
      // console.error(`Error loading image by src: ${imageSrcJpg}`, error)
    }

    // load itemNameIndex.png/jpg
    let imageIndex = 1 // Start index from 1 (itemName1.png, itemName2.png, ...)
    let pngFlag = false
    let jpgFlag = false
    while (imageIndex < 10) {
      const imagePngSrc = `${photoFolderPath}${itemName}${imageIndex}.png`
      try {
        await LoadImageBySrc(imagePngSrc, itemName)
        count++
      } catch (error) {
        // console.error(`Error loading image ${imagePngSrc} : ${error}`, error)
        pngFlag = true
      }
      const imageJpgSrc = `${photoFolderPath}${itemName}${imageIndex}.jpg`
      try {
        await LoadImageBySrc(imageJpgSrc, itemName)
        count++
      } catch (error) {
        // console.error(`Error loading image ${imageJpgSrc} : ${error}`, error)
        jpgFlag = true
      }
      if (pngFlag && jpgFlag) break
      imageIndex++
    }
    console.log(`Loaded ${count} images for ${itemName}`)
    if (count > 0) loadFinished.value = true
    // total += count
  }
  // console.log(`Loaded ${total} images in total`) // move this into .test
  saveDeckCache(currentDeck.value)
}

const initFlashcard = () => {
  if (currentDeck.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * currentDeck.value.length)
    flashcard.value = currentDeck.value[randomIndex]
  } else {
    console.error('currentDeck is empty')
  }
}
// Exported function (composable function that encapsulates flashcard logic)
export function useFlashcard() {
  const { getCompetitor, updateRatings, loadEloStateFromLocal, loadEloHistoryFromLocal } = useElo()
  if (!isInitialized) {
    const cachedDeck = LoadDeckfromCache()
    if (cachedDeck) {
      currentDeck.value = cachedDeck
      loadFinished.value = true

      loadEloStateFromLocal()
      loadEloHistoryFromLocal()

      initFlashcard()
    } else {
      LoadDeckfromLocal()
      watch(
        loadFinished,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (newValue, oldValue) => {
          if (newValue) {
            initFlashcard()
          }
        },
        { immediate: true }
      )
    }

    isInitialized = true
  }

  // Action functions (defined inside useFlashcard as it manipulates component state)
  const NextCard = () => {
    // cardIndex = (cardIndex + 1) % currentDeck.value.length
    cardIndex = Math.floor(Math.random() * currentDeck.value.length)

    flashcard.value = currentDeck.value[cardIndex] ?? { imageSrc: '', name: '' }
    showAnswer.value = false // Reset showAnswer to false
    console.log(`nextCard: ${flashcard.value.name} cardIndex: ${cardIndex}`)
  }

  const handleAnswer = (isCorrect: boolean) => {
    updateRatings(
      getCompetitor('user', 'user').id,
      getCompetitor(flashcard.value.imageSrc, 'flashcard').id,
      isCorrect
    )

    NextCard()
  }
  const HandleCorrect = () => handleAnswer(true)
  const HandleIncorrect = () => handleAnswer(false)

  return {
    currentDeck,
    loadFinished,
    flashcard,
    showAnswer,
    LoadDeckfromLocal,
    HandleCorrect,
    HandleIncorrect
  }
}
