<script setup lang="ts">
import { useFlashcard } from '@/composables/FlashCard'
import { onMounted } from 'vue'

const { currentDeck, loadFinished, flashcard, showAnswer, nextCard, initFlashcard } = useFlashcard() // Destructure showAnswer

onMounted(async () => {
  await initFlashcard()
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
