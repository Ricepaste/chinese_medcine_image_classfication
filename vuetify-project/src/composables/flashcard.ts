// src/composables/flashcard.ts
import type { Flashcard } from '@/types/Flashcard'
import { ref, type Ref } from 'vue'

interface HistoryRecord {
  flashcard: Flashcard
  isCorrect: boolean
  timestamp: number
}

// State variables (Singleton instances, defined outside useFlashcard for shared state)
const currentDeck: Ref<Flashcard[]> = ref([])
const loadFinished: Ref<boolean> = ref(false)
const flashcard: Ref<Flashcard> = ref({ imageSrc: '', name: '' })
const showAnswer: Ref<boolean> = ref(false)
const historyRecords: Ref<HistoryRecord[]> = ref([])
let cardIndex: number = 0
let isInitialized: boolean = false // use singleton pattern

// Helper function (defined outside useFlashcard as it's a utility function not directly related to component instance)
const loadImageBySrc = async (src: string, itemName: string): Promise<void> => {
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

const loadDeckfromLocal = async () => {
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
    // console.error('Error loading or parsing deck-config.json', error)
    itemNames = []
  }

  let _ = 0
  // let total = 0
  for (const itemName of itemNames) {
    if (_++ === 10) break
    if (!currentDeck.value) {
      throw new Error('currentDeck is not initialized when loading images')
    }
    let count = 0

    // load itemName.png/jpg
    const imageSrcPng = `${photoFolderPath}${itemName}.png`
    try {
      await loadImageBySrc(imageSrcPng, itemName)
      count++
    } catch (error) {
      // console.error(`Error loading image by src: ${imageSrcPng}`, error)
    }

    const imageSrcJpg = `${photoFolderPath}${itemName}.jpg`
    try {
      await loadImageBySrc(imageSrcJpg, itemName)
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
        await loadImageBySrc(imagePngSrc, itemName)
        count++
      } catch (error) {
        // console.error(`Error loading image ${imagePngSrc} : ${error}`, error)
        // break
        pngFlag = true
      }
      const imageJpgSrc = `${photoFolderPath}${itemName}${imageIndex}.jpg`
      try {
        await loadImageBySrc(imageJpgSrc, itemName)
        count++
      } catch (error) {
        // console.error(`Error loading image ${imageJpgSrc} : ${error}`, error)
        jpgFlag = true
      }
      if (pngFlag && jpgFlag) break
      imageIndex++
    }
    console.log(`Loaded ${count} images for ${itemName}`)
    // total += count
  }
  // console.log(`Loaded ${total} images in total`) // move this into .test
  loadFinished.value = true
}

const loadHistoryFromLocal = () => {
  const historyString = localStorage.getItem('flashcardHistory')
  if (historyString) {
    historyRecords.value = JSON.parse(historyString)
  }
}

const SaveHistoryToLocal = () => {
  localStorage.setItem('flashcardHistory', JSON.stringify(historyRecords.value))
}

// Exported function (composable function that encapsulates flashcard logic)
export function useFlashcard() {
  if (!isInitialized) {
    loadHistoryFromLocal()
    loadDeckfromLocal()
    isInitialized = true
  }

  // Action functions (defined inside useFlashcard as it manipulates component state)
  const nextCard = () => {
    // cardIndex = (cardIndex + 1) % currentDeck.value.length
    cardIndex = Math.floor(Math.random() * currentDeck.value.length)

    flashcard.value = currentDeck.value[cardIndex] ?? { imageSrc: '', name: '' }
    showAnswer.value = false // Reset showAnswer to false
    console.log(`nextCard: ${flashcard.value.name} cardIndex: ${cardIndex}`)
  }

  const addHistoryRecord = (isCorrect: boolean) => {
    if (!flashcard.value) return
    const record: HistoryRecord = {
      flashcard: { ...flashcard.value }, // clone the flashcard
      isCorrect,
      timestamp: Date.now()
    }
    historyRecords.value.push(record)
    if (historyRecords.value.length > 100) {
      historyRecords.value.shift()
    }
    console.log(`addHistoryRecord: ${record.flashcard.name} isCorrect: ${isCorrect}`)
    console.log(historyRecords.value)
  }

  const initFlashcard = async () => {
    await loadDeckfromLocal()
    if (currentDeck.value.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentDeck.value.length)
      flashcard.value = currentDeck.value[randomIndex]
    }
  }

  const handleCorrect = () => {
    addHistoryRecord(true)
    nextCard()
  }

  const handleIncorrect = () => {
    addHistoryRecord(false)
    nextCard()
  }

  return {
    currentDeck,
    loadFinished,
    flashcard,
    showAnswer,
    historyRecords,
    LoadDeckfromLocal: loadDeckfromLocal, // Expose for potential testing or direct use - consider if needed
    LoadHistoryFromLocal: loadHistoryFromLocal, // Expose for potential testing or direct use - consider if needed
    SaveHistoryToLocal, // Expose for potential testing or direct use - consider if needed
    initFlashcard,
    handleCorrect,
    handleIncorrect
  }
}
