<!-- src/components/RecordsImportExport.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useElo } from '@/composables/elo'
import type { Competitor } from '@/composables/elo'

const { saveEloStateToLocal, saveEloHistoryToLocal, competitors, eloHistory } = useElo()

const textAreaContent = ref('')
const validationError = ref('')

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const encodeData = async (data: string): Promise<string> => {
  try {
    const uint8Array = encoder.encode(data)
    const compressionStream = new CompressionStream('gzip')
    const writer = compressionStream.writable.getWriter()
    writer.write(uint8Array)
    writer.close()

    // Read compressed data from the readable stream
    const reader = compressionStream.readable.getReader()
    const compressedUnit8ArrayChunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      compressedUnit8ArrayChunks.push(value ?? new Uint8Array())
    }

    let compressedUnit8Array: Uint8Array
    if (compressedUnit8ArrayChunks.length === 1)
      compressedUnit8Array = compressedUnit8ArrayChunks[0]
    else {
      const totalLength = compressedUnit8ArrayChunks.reduce((acc, chunk) => acc + chunk.length, 0)
      compressedUnit8Array = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of compressedUnit8ArrayChunks) {
        compressedUnit8Array.set(chunk, offset)
        offset += chunk.length
      }
    }
    const compressedBinaryString = String.fromCharCode(...compressedUnit8Array)
    return btoa(compressedBinaryString)
  } catch (e) {
    console.error('Encoding error:', e) // Encoding error:
    return ''
  }
}

const decodeData = async (encodedData: string): Promise<string> => {
  const binaryString = atob(encodedData)
  const uint8Array = Uint8Array.from(binaryString, (char) => char.charCodeAt(0))

  // Create a writable stream for decompression
  const decompressStream = new DecompressionStream('gzip')
  const readableStream = new Response(uint8Array).body!
  const readableStreamClosed = readableStream.pipeThrough(decompressStream)

  // Read decompressed data from the readable stream and decode to string
  const decompressedChunks: Uint8Array[] = []
  const reader = readableStreamClosed.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    decompressedChunks.push(value ?? new Uint8Array())
  }
  const totalLength = decompressedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const decompressedUnit8Array = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of decompressedChunks) {
    decompressedUnit8Array.set(chunk, offset)
    offset += chunk.length
  }
  if (decompressedUnit8Array.length === 0) {
    return ''
  }
  return decoder.decode(decompressedUnit8Array)
}

const validateData = async (data: string): Promise<boolean | string> => {
  try {
    const decodedData = await decodeData(data)
    const parsedData = JSON.parse(decodedData)
    if (typeof parsedData !== 'object') {
      return '資料格式不正確，應為 JSON 物件。' // Incorrect data format, should be a JSON object.
    }
    if (!parsedData.eloState || !parsedData.eloHistory) {
      return 'JSON 資料應包含 "eloState" 和 "eloHistory" 屬性。' // JSON data should include "eloState" and "eloHistory" properties.
    }

    // TODO: check eloState 和 eloHistory type and structure
    return true
  } catch (e) {
    throw new Error('無效的 JSON 格式。' + e) // Invalid JSON format.
  }
}

const handleImport = async () => {
  const validationResult = await validateData(textAreaContent.value)
  if (validationResult === true) {
    validationError.value = ''
    try {
      const importedData = JSON.parse(await decodeData(textAreaContent.value))

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

const handleExport = async () => {
  validationError.value = '' // 清除之前的錯誤訊息 // Clear previous error messages.
  const exportData = {
    eloState: Array.from(competitors.value.entries()),
    eloHistory: eloHistory.value
  }
  textAreaContent.value = await encodeData(JSON.stringify(exportData, null, 2))
}

const handleExportTxt = async () => {
  validationError.value = '' // 清除之前的錯誤訊息 // Clear previous error messages.
  const exportData = {
    eloState: Array.from(competitors.value.entries()),
    eloHistory: eloHistory.value
  }
  const textData = await encodeData(JSON.stringify(exportData, null, 2))
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

:deep(.v-card-actions) {
  /* 使用 >>> 或 ::v-deep 穿透 scoped style */
  flex-wrap: wrap;
}
</style>
