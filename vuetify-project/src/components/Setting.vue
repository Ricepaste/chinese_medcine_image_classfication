<script setup lang="ts">
// src/components/Setting.vue

import { computed } from 'vue'
import RecordsImportExport from '@/components/RecordsImportExport.vue'

const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
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
        class="setting_icon"
        @click.stop=""
      >
        <v-icon>mdi-cog</v-icon>
      </div>
    </template>

    <template #default="">
      <records-import-export @close-dialog="dialog = false" />
    </template>
  </v-dialog>
</template>

<style scoped>
.setting_icon {
  font-size: 1.5rem;
  line-height: 2rem;
  cursor: pointer;
  align-items: center;
  padding: 0px 1rem 0px 0.5rem;
}
</style>
