<script setup lang="ts">
// src/components/FlashCard.vue
import { useFlashcard } from '@/composables/flashcard'
import { onMounted } from 'vue'
import History from '@/components/History.vue'

const { currentDeck, loadFinished, flashcard, showAnswer, HandleCorrect, HandleIncorrect } =
  useFlashcard()

onMounted(() => {
  // initFlashcard()
  window.addEventListener('keyup', handleKeyUp)
})

const handleKeyUp = (event: KeyboardEvent) => {
  if (!loadFinished.value) return

  switch (event.key) {
    case 'w':
    case 'W':
    case 'ArrowUp':
      showAnswer.value = true
      break
    case 'a':
    case 'A':
    case 'ArrowLeft':
      if (showAnswer.value) HandleCorrect()
      break
    case 'd':
    case 'D':
    case 'ArrowRight':
      if (showAnswer.value) HandleIncorrect()
      break
    case 's':
    case 'S':
    case 'ArrowDown':
      console.log('History button pressed')
      // TODO: Handle History button press
      break
  }
}
</script>
<template>
  <v-container
    class="flashcard-container"
    justify-center
  >
    <v-img
      v-if="loadFinished"
      :src="flashcard.imageSrc"
      :class="`flashcard-image ${showAnswer ? 'default' : 'cursor-pointer'}`"
      @click="showAnswer = true"
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
      <v-toolbar-title class="flashcard-title">
        <span v-if="showAnswer">{{ flashcard.name }}</span>
        <span v-else>???</span>
      </v-toolbar-title>
    </v-toolbar>

    <v-container class="flashcard-actions-bar">
      <v-btn
        class="icon-button"
        color="primary"
        :disabled="!showAnswer"
        @click="HandleCorrect"
      >
        <v-icon>mdi-check</v-icon>
      </v-btn>
      <History :disabled="!loadFinished" />
      <v-btn
        class="icon-button"
        color="error"
        :disabled="!showAnswer"
        @click="HandleIncorrect"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-container>
  </v-container>
  <div v-if="!loadFinished">
    <h1>currentDeck length: {{ currentDeck.length }}</h1>
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
  height: 100vh; /* 設定 flashcard-container 高度為 100vh (viewport height) */
  border: 2px solid #ccc; /* 加入邊框，模擬卡片效果 */
  border-radius: 24px;
  overflow: hidden;
  padding: 0px;
}

.flashcard-image {
  width: 100%;
  object-fit: contain; /* 圖片填滿容器，可能黑邊 */
  flex: 1; /* 讓圖片佔據剩餘空間 */
  min-height: 200px; /* 設定圖片最小高度 */
  /* cursor: v-bind(showAnswer ? 'pointer' : 'default'); */
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
  height: 40px;
  background-color: transparent;
  box-shadow: none;
}

.flashcard-title {
  font-size: 2rem;
  line-height: 2rem;
  font-weight: bold;
  text-align: center; /* 確保標題文字置中 */
}

.flashcard-actions-bar {
  display: flex; /* 保持 Flexbox 佈局 */
  background-color: transparent; /* 保持透明背景或移除背景色 */
  box-shadow: none; /* 移除陰影 */
  padding: 16px;
  justify-content: space-around;
}

.icon-button {
  display: flex; /* 使用 Flexbox */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  flex: 1; /* 佔據可用空間 */
  cursor: pointer;
  font-size: 1.5rem; /* 或您想要的任何大小 */
  line-height: 2rem;
  border-radius: 8px;
  margin: 0 8px;
  /* border: 2px solid #cccccc80; */
}
.icon-button:first-child {
  margin-left: 0px;
}
.icon-button:last-child {
  margin-right: 0px;
}
.icon-button[disabled] {
  opacity: 0.5; /* 或您想要的任何禁用樣式 */
}
</style>
