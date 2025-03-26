<script setup lang="ts">
// src/components/History.vue
import { useFlashcard } from '@/composables/flashcard'
import { onMounted, onBeforeUnmount } from 'vue'

//
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
</script>
<template>
  <v-dialog max-width="700">
    <template #activator="{ props: activatorProps }">
      <div
        v-bind="activatorProps"
        class="history_icon"
        @click="showHistory"
      >
        <v-icon>mdi-history</v-icon>
      </div>
    </template>

    <template #default="{ isActive }">
      <v-card title="History">
        <template #text>
          <!-- <v-list>
            <v-list-item
              v-for="(record, index) in history"
              :key="index"
            ></v-list-item>
          </v-list> -->
          <p>{{ JSON.stringify(historyRecords) }}</p>
        </template>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
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
