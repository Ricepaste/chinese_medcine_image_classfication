/* eslint-disable @typescript-eslint/no-unused-vars */
// src/composables/useFlashcard.ts
import type { Flashcard } from '@/types/Flashcard'
import { ref, type Ref } from 'vue'

export function useFlashcard() {
  const currentDeck: Ref<Flashcard[]> = ref([])
  const loadFinished = ref(false)
  const flashcard: Ref<Flashcard> = ref({ imageSrc: '', name: '' })
  const showAnswer = ref(false) // Add showAnswer here
  let cardIndex = 0

  const loadImageBySrc = async (src: string, itemName: string): Promise<void> => {
    const response = await fetch(src)
    const blob = await response.blob()
    if (blob.type === 'image/jpeg' || blob.type === 'image/png') {
      currentDeck.value.push({ imageSrc: src, name: itemName } as Flashcard)
    } else {
      // console.log(`Not a jpeg or png image: ${src}`)
      throw new Error('Not a jpeg or png image')
    }
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
      // console.error('Error loading or parsing deck-config.json', error)
      itemNames = []
    }

    // let _ = 0
    // let total = 0
    for (const itemName of itemNames) {
      // if (_++ === 10) break
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
  const nextCard = () => {
    // cardIndex = (cardIndex + 1) % currentDeck.value.length
    cardIndex = Math.floor(Math.random() * currentDeck.value.length)

    flashcard.value = currentDeck.value[cardIndex] ?? { imageSrc: '', name: '' }
    showAnswer.value = false // Reset showAnswer to false
    console.log(`nextCard: ${flashcard.value.name} cardIndex: ${cardIndex}`)
  }

  const initFlashcard = async () => {
    await LoadDeckfromLocal()
    if (currentDeck.value.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentDeck.value.length)
      flashcard.value = currentDeck.value[randomIndex]
    }
  }

  return {
    currentDeck,
    loadFinished,
    flashcard,
    showAnswer,
    loadImageBySrc,
    LoadDeckfromLocal,
    nextCard,
    initFlashcard
  }
}
