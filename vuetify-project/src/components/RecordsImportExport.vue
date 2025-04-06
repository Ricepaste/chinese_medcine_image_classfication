<script setup lang="ts">
// src/components/RecordsImportExport.vue

import { ref } from 'vue'
import { useElo } from '@/composables/elo'
import type { Competitor } from '@/composables/elo'

const { saveEloStateToLocal, saveEloHistoryToLocal, competitors, eloHistory } = useElo()

const textAreaContent = ref('')
const validationError = ref('')

const validateData = (data: string): boolean | string => {
  try {
    const parsedData = JSON.parse(data)
    if (typeof parsedData !== 'object') {
      return '資料格式不正確，應為 JSON 物件。' // Incorrect data format, should be a JSON object.
    }
    if (!parsedData.eloState || !parsedData.eloHistory) {
      return 'JSON 資料應包含 "eloState" 和 "eloHistory" 屬性。' // JSON data should include "eloState" and "eloHistory" properties.
    }
    // 可以加入更詳細的資料結構驗證，例如檢查 eloState 和 eloHistory 的類型和結構
    return true
  } catch (e) {
    throw new Error('無效的 JSON 格式。' + e) // Invalid JSON format.
  }
}

const handleImport = () => {
  const validationResult = validateData(textAreaContent.value)
  if (validationResult === true) {
    validationError.value = ''
    try {
      const importedData = JSON.parse(textAreaContent.value)
      // 清空現有的 competitors 和 eloHistory，然後設定新的值
      competitors.value.clear()
      importedData.eloState.forEach(([key, value]: [string, Competitor]) => {
        competitors.value.set(key, value)
      })
      eloHistory.value = importedData.eloHistory

      saveEloStateToLocal() // Save to localStorage
      saveEloHistoryToLocal() // Save to localStorage

      alert('Elo 狀態和歷史記錄已成功匯入！') // Elo state and history imported successfully!
    } catch (error) {
      validationError.value = '匯入資料時發生錯誤，請檢查資料格式。' // Error occurred while importing data, please check data format.
      console.error('匯入錯誤:', error) // Import error:
    }
  } else {
    validationError.value = validationResult as string
  }
}

const handleExport = () => {
  validationError.value = '' // 清除之前的錯誤訊息 // Clear previous error messages.
  const exportData = {
    eloState: Array.from(competitors.value.entries()),
    eloHistory: eloHistory.value
  }
  textAreaContent.value = JSON.stringify(exportData, null, 2)
}

const handleExportTxt = () => {
  validationError.value = '' // 清除之前的錯誤訊息 // Clear previous error messages.
  const exportData = {
    eloState: Array.from(competitors.value.entries()),
    eloHistory: eloHistory.value
  }
  const textData = JSON.stringify(exportData, null, 2)
  const blob = new Blob([textData], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'record_export.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const resetValidation = () => {
  validationError.value = ''
}

const emit = defineEmits(['closeDialog'])

const closeDialog = () => {
  textAreaContent.value = ''
  validationError.value = ''
  emit('closeDialog')
}
</script>

<template>
  <v-card class="pa-4">
    <v-card-title>紀錄匯入/匯出</v-card-title>
    <v-card-text>
      <v-textarea
        v-model="textAreaContent"
        label="紀錄(JSON)"
        rows="14"
        @input="resetValidation"
      />
      <div
        v-if="validationError"
        class="error-message"
      >
        {{ validationError }}
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn
        color="primary"
        @click="handleImport"
      >
        匯入
      </v-btn>
      <v-btn
        color="secondary"
        @click="handleExport"
      >
        匯出
      </v-btn>
      <v-btn
        color="secondary"
        @click="handleExportTxt"
      >
        匯出為 TXT
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        @click="closeDialog"
      >
        關閉
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.error-message {
  color: red;
  margin-top: 10px;
}

::v-deep .v-card-actions {
  /* 使用 >>> 或 ::v-deep 穿透 scoped style */
  flex-wrap: wrap;
}
</style>
