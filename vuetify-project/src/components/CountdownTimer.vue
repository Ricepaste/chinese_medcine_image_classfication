<!-- src/components/CountdownTimer.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const timeLeft = ref(15) // Countdown time in seconds
let timerInterval: number | null = null

onMounted(() => {
  startTimer()
})

onBeforeUnmount(() => {
  stopTimer()
})

const startTimer = () => {
  if (timerInterval) return // Prevent multiple timers from starting

  timeLeft.value = 15 // Reset time when timer starts
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      stopTimer()
      // ...logic
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}
</script>

<template>
  <div>
    {{ timeLeft }}
  </div>
</template>

<style scoped>
/*  */
</style>
