<script setup lang="ts">
// src/components/History.vue
import { useFlashcard } from '@/composables/flashcard'
import { onMounted, onBeforeUnmount, computed } from 'vue'

const { historyRecords, SaveHistoryToLocal } = useFlashcard()

const beforeUnloadHandler = () => {
  SaveHistoryToLocal()
}
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

const showHistory = () => {
  console.log('showHistory')
  console.log(historyRecords)
}

const accuracy = computed(() => {
  if (historyRecords.value.length === 0) return '0%'
  const correctCount = historyRecords.value.filter((record) => record.isCorrect).length
  const accuracyRate = (correctCount / historyRecords.value.length) * 100
  return `${accuracyRate.toFixed(0)}% (${correctCount}/${historyRecords.value.length})`
})
</script>
<template>
  <v-dialog max-width="700">
    <template #activator="{ props: activatorProps }">
      <div
        v-bind="activatorProps"
        class="history_icon"
        @click.stop=""
        @click="showHistory"
      >
        <v-icon>mdi-history</v-icon>
      </div>
    </template>

    <template #default="{ isActive }">
      <v-card :title="`History - Accuracy: ${accuracy}`">
        <template #text>
          <v-list>
            <v-list-item
              v-for="(record, index) in [...historyRecords].reverse()"
              :key="index"
            >
              <v-list-item-title
                ><span :style="{ color: record.isCorrect ? 'green' : 'red' }">
                  {{ record.isCorrect ? '答對' : '答錯' }}
                </span>
                - {{ record.flashcard.name }} -
                {{ new Date(record.timestamp).toLocaleString() }}</v-list-item-title
              >
              <v-list-item-subtitle>
                {{ record.flashcard.imageSrc }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </template>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="isActive.value = false"
            >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
<style scoped>
.history_icon {
  font-size: 1.5rem;
  line-height: 2rem;
  cursor: pointer;
  align-items: center;
  padding: 0px 1rem 0px 1rem;
}
</style>
