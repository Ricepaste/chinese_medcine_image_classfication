<script setup lang="ts">
import type { Flashcard } from '@/types/Flashcard'
import type { Ref } from 'vue'
import { onMounted, ref } from 'vue'
type CardDeck = Flashcard[]

const currentDeck: Ref<CardDeck> = ref([])
const showAnswer = ref(false)
let cardIndex = 0
const loadFinished = ref(false)
const flashcard: Ref<Flashcard> = ref({ imageSrc: '', name: '' })
/**
 * check if src is valid image(jpeg or png), then store Flashcard to currentDeck, if not valid, throw error
 * @param src : image source
 * @param itemName : item name
 */
const loadImageBySrc = async (src: string, itemName: string): Promise<void> => {
  try {
    const response = await fetch(src)
    const blob = await response.blob()
    if (blob.type === 'image/jpeg' || blob.type === 'image/png') {
      currentDeck.value.push(<Flashcard>{ imageSrc: src, name: itemName })
    } else {
      throw new Error('Not a jpeg image')
    }
  } catch (error) {
    console.error(`Error loading image ${src}`, error)
  }
}

// const preloadImages = (imageUrls: string[]) => {
//   imageUrls.forEach((url) => {
//     const img = new Image()
//     img.src = url
//   })
//   console.log(`Preloading ${imageUrls.length} images...`)
// }

/**
 * load deck from folder public/photo/itemname*.{png, jpg}
 */
const LoadDeckfromLocal = async () => {
  let itemNames: string[] = []
  const photoFolderPath = `${import.meta.env.BASE_URL}photo/`

  try {
    const configResponse = await fetch(`${photoFolderPath}deck-config.json`)

    const config: { itemNames: string[] } = await configResponse.json()
    // console.log(`config: ${JSON.stringify(config)}`)

    if (!Array.isArray(config.itemNames)) {
      throw new Error('deck-config.json failed to parse itemNames')
    }
    itemNames = config.itemNames
  } catch (error) {
    console.error('Error loading or parsing deck-config.json', error)
    itemNames = []
  }

  // let _ = 0
  for (const itemName of itemNames) {
    // if (_++ === 3) break
    if (!currentDeck.value) {
      throw new Error('currentDeck is not initialized when loading images')
    }
    const imageSrc = `${photoFolderPath}${itemName}.png`
    let count = 0
    // get itemName.png
    try {
      await loadImageBySrc(imageSrc, itemName)
      count++
    } catch (error) {
      console.error(`Error loading image by src: ${imageSrc}`, error)
    }

    // get itemNameIndex.png
    let imageIndex = 1 // Start index from 1 (itemName1.png, itemName2.png, ...)

    while (imageIndex < 4) {
      const imageSrc = `${photoFolderPath}${itemName}${imageIndex}.png`
      try {
        const response = await fetch(imageSrc)
        const blob = await response.blob()
        if (blob.type !== 'image/jpeg') {
          break
        }
        currentDeck.value.push(<Flashcard>{ imageSrc: imageSrc, name: itemName })
        count++
        imageIndex++
      } catch (error) {
        console.error(`Error loading image ${imageSrc}`, error)
        break
      }
    }
    console.log(`Loaded ${count} images for ${itemName}`)
  }
  loadFinished.value = true
}

/**
 * handle next card button click
 */
const nextCard = () => {
  // TODO: user could click nextCard before the image is loaded
  // TODO: randomize the card order
  cardIndex = (cardIndex + 1) % currentDeck.value.length
  flashcard.value = currentDeck.value[cardIndex] ?? null
  showAnswer.value = false
  console.log(`nextCard: ${flashcard.value.name} cardIndex: ${cardIndex}`)
  // ...
}
onMounted(async () => {
  await LoadDeckfromLocal()
  if (currentDeck.value.length > 0) {
    flashcard.value = currentDeck.value[0]
  }
})
</script>
<template>
  <v-container
    class="flashcard-container"
    justify-center
  >
    <v-img
      v-if="loadFinished"
      :src="flashcard.imageSrc"
      class="flashcard-image"
      rounded="xl"
    />
    <p
      v-else
      class="loading-placeholder"
    >
      Loading..
    </p>

    <v-toolbar
      flat
      class="flashcard-title-bar"
    >
      <v-toolbar-title class="justify-center flashcard-title">
        <span v-if="showAnswer">{{ flashcard.name }}</span>
        <span v-else>???</span>
      </v-toolbar-title>
    </v-toolbar>

    <v-container class="flashcard-actions-bar">
      <v-btn
        color="primary"
        :disabled="showAnswer || !loadFinished"
        @click="showAnswer = true"
      >
        顯示答案
      </v-btn>
      <v-btn
        color="secondary"
        :disabled="!loadFinished"
        @click="nextCard"
      >
        下一張
      </v-btn>
    </v-container>
  </v-container>
  <div>
    <!-- <h1>{{ currentDeck2 ? currentDeck2[0].imageSrc : 'loading' }}</h1> -->
    <!-- <h1>currentDeck.imageSrc[0]: {{ currentDeck.imageSrc[0] }}</h1> -->
    <!-- <h1>{{ flashcard ?? 'loading' }}</h1> -->
  </div>
</template>

<style scoped>
html,
body {
  height: 100%;
  margin: 0; /* 移除 body 的預設 margin，避免滾動條 */
}
.flashcard-container {
  display: flex;
  flex-direction: column;
  align-items: stretch; /* 確保子元素可以水平延展 */
  max-width: 720px; /* 設定卡片最大寬度，你可以根據需要調整 */
  width: 100%; /* 在較小螢幕上佔滿寬度 */
  height: 100vh; /* **關鍵**: 設定 flashcard-container 高度為 100vh (viewport height) */
  border: 2px solid #ccc; /* 加入邊框，模擬卡片效果 */
  border-radius: 8px; /* 加入圓角，讓邊框更柔和 */
  overflow: visible; /* 確保內容超出邊界時被隱藏 */
  padding: 0px;
}

.flashcard-image {
  width: 100%;
  object-fit: contain; /* 圖片填滿容器，可能黑邊 */
  flex: 1; /* 讓圖片佔據剩餘空間 */
  min-height: 200px; /* 設定圖片最小高度，你可以根據需要調整 */
}

.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1; /* 讓載入訊息佔據剩餘空間 */
  min-height: 200px; /* 與圖片最小高度一致 */
  color: grey;
}

.flashcard-title-bar {
  background-color: transparent; /* 移除 toolbar 背景色 */
  box-shadow: none; /* 移除 toolbar 陰影 */
}

.flashcard-title {
  font-size: 2rem;
  line-height: 2rem;
  font-weight: bold;
  text-align: center; /* 確保標題文字置中 */
}

.flashcard-actions-bar {
  background-color: transparent; /* 保持透明背景或移除背景色 */
  box-shadow: none; /* 保持移除陰影 */
  padding: 16px;
  display: flex; /* 保持 Flexbox 佈局 */
  justify-content: space-around; /* 再次使用 space-between，現在應該會生效 */
}
</style>
