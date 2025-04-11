<!-- src/components/History.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, ref } from 'vue'
import { useElo } from '@/composables/elo'

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
  const records = [...eloHistory.value].reverse()
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
}

const accuracy = computed(() => {
  if (eloHistory.value.length === 0) return '0%'
  const correctCount = eloHistory.value.filter((record) => record.isCorrect).length
  const accuracyRate = (correctCount / eloHistory.value.length) * 100
  return `${accuracyRate.toFixed(0)}% (${correctCount}/${eloHistory.value.length})`
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
      <v-card class="pa-4">
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
                    ? 'mdi-filter-check-outline'
                    : 'mdi-filter-off-outline'
              }}</v-icon
            >
            History {{ sortState.toUpperCase() }}- Accuracy: {{ accuracy }}
          </span>
        </template>
        <v-card-text class="ps-2 pe-2">
          <v-list :max-height="'600'">
            <v-list-item
              v-for="(record, index) in sortedHistory"
              :key="index"
            >
              <v-divider v-if="index % 5 === 0 && index !== 0" />
              <v-list-item-title
                ><span :style="{ color: record.isCorrect ? 'green' : 'red' }">
                  {{ record.isCorrect ? '答對' : '答錯' }}
                </span>
                - {{ record.userRatingBefore }} -> {{ record.userRatingAfter }}
              </v-list-item-title>
              <v-list-item-subtitle style="display: inline-block">
                {{ record.flashcardId }} - {{ record.flashcardRatingBefore }} ->
                {{ record.flashcardRatingAfter }} -
                {{ new Date(record.timestamp).toLocaleString() }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
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
  padding: 0px 0.5rem 0px 1rem;
}
</style>
