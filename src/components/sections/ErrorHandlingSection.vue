<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'

const props = defineProps<{
  errorComponent: string
  errorDescription: string
  errorCode: string
  errorDetail: string
  errorMessageType: string
}>()

const emit = defineEmits<{
  'update:errorComponent': [value: string]
  'update:errorDescription': [value: string]
  'update:errorCode': [value: string]
  'update:errorDetail': [value: string]
  'update:errorMessageType': [value: string]
}>()
</script>

<template>
  <!-- 10.錯誤處理 -->
  <section id="error-handling" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">
        10.錯誤處理(暫時都NULL_VALUE，也不隨機)
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          id="errorComponent"
          label="錯誤組件 (errorComponent)"
          :modelValue="props.errorComponent"
          @update:modelValue="(value) => emit('update:errorComponent', String(value))"
        />
        <Input
          id="errorDescription"
          label="錯誤描述 (errorDescription)"
          :modelValue="props.errorDescription"
          @update:modelValue="(value) => emit('update:errorDescription', String(value))"
        />
        <Input
          id="errorCode"
          label="錯誤代碼 (errorCode)"
          :modelValue="props.errorCode"
          @update:modelValue="(value) => emit('update:errorCode', String(value))"
        />
        <Input
          id="errorDetail"
          label="錯誤詳情 (errorDetail)"
          :modelValue="props.errorDetail"
          @update:modelValue="(value) => emit('update:errorDetail', String(value))"
        />
        <Input
          id="errorMessageType"
          label="錯誤訊息類型 (errorMessageType)"
          :modelValue="props.errorMessageType"
          @update:modelValue="(value) => emit('update:errorMessageType', String(value))"
        />
      </div>
    </Card>
  </section>
</template>
