<script setup lang="ts">
// src/components/History.vue
import { onMounted, onBeforeUnmount, computed, ref } from 'vue'
import { useFlashcard } from '@/composables/flashcard'
import { useElo } from '@/composables/elo'

const { historyRecords, SaveHistorytoLocal } = useFlashcard()
const { eloHistory, saveEloHistoryToLocal, saveEloStateToLocal } = useElo()

const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const sortState = ref<'all' | 'correctFirst' | 'incorrectFirst'>('all')
const sortedHistory = computed(() => {
  const records = [...historyRecords.value].reverse()
  switch (sortState.value) {
    case 'all':
      break
    case 'correctFirst':
      records.sort((a, b) => {
        if (a.isCorrect && !b.isCorrect) {
          return -1
        } else if (!a.isCorrect && b.isCorrect) {
          return 1
        } else {
          return 0
        }
      })
      break
    case 'incorrectFirst':
      records.sort((a, b) => {
        if (!a.isCorrect && b.isCorrect) {
          return -1
        } else if (a.isCorrect && !b.isCorrect) {
          return 1
        } else {
          return 0
        }
      })
      break
  }
  return records
})
const eloHistoryRecords = computed(() => {
  return [...eloHistory.value].reverse()
})

const toggleSortState = () => {
  switch (sortState.value) {
    case 'all':
      sortState.value = 'correctFirst'
      break
    case 'correctFirst':
      sortState.value = 'incorrectFirst'
      break
    case 'incorrectFirst':
      sortState.value = 'all'
      break
  }
}

const beforeUnloadHandler = () => {
  SaveHistorytoLocal()
  saveEloHistoryToLocal()
  saveEloStateToLocal()
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
  <v-dialog
    v-model="dialog"
    max-width="700"
  >
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

    <!-- #default="{ isActive }" -->
    <template #default="">
      <v-card>
        <template #title>
          <span>
            <v-icon
              :style="{
                cursor: 'pointer',
                color:
                  sortState === 'all' ? 'white' : sortState === 'correctFirst' ? 'green' : 'red'
              }"
              @click="toggleSortState"
            >
              {{
                sortState === 'all'
                  ? 'mdi-filter-outline'
                  : sortState === 'correctFirst'
                    ? 'mdi-filter-check'
                    : 'mdi-filter-off-outline'
              }}</v-icon
            >
            History {{ sortState.toUpperCase() }}- Accuracy: {{ accuracy }}
          </span>
        </template>
        <template #text>
          <div class="d-flex justify-center">
            <v-list>
              <v-list-item
                v-for="(record, index) in sortedHistory"
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

            <v-list>
              <v-list-item
                v-for="(record, index) in eloHistoryRecords"
                :key="index"
              >
                <v-list-item-title
                  ><span :style="{ color: record.isCorrect ? 'green' : 'red' }">
                    {{ record.isCorrect ? '答對' : '答錯' }}
                  </span>
                  - {{ record.userRatingBefore }} -> {{ record.userRatingAfter }} -
                  {{ new Date(record.timestamp).toLocaleString() }}</v-list-item-title
                >
                <v-list-item-subtitle>
                  {{ record.flashcardId }} - {{ record.flashcardRatingBefore }} ->
                  {{ record.flashcardRatingAfter }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </template>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="dialog = false"
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
