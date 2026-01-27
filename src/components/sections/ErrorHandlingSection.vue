<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
</script>

<template>
  <!-- 10.錯誤處理 -->
  <section id="error-handling" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">
        10.錯誤處理(暫時都NULL_VALUE，也不隨機)
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input id="errorComponent" label="錯誤組件 (errorComponent)" :modelValue="'NULL_VALUE'" />
        <Input
          id="errorDescription"
          label="錯誤描述 (errorDescription)"
          :modelValue="'NULL_VALUE'"
        />
        <Input id="errorCode" label="錯誤代碼 (errorCode)" :modelValue="'NULL_VALUE'" />
        <Input id="errorDetail" label="錯誤詳情 (errorDetail)" :modelValue="'NULL_VALUE'" />
        <Input
          id="errorMessageType"
          label="錯誤訊息類型 (errorMessageType)"
          :modelValue="'NULL_VALUE'"
        />
      </div>
    </Card>
  </section>
</template>
