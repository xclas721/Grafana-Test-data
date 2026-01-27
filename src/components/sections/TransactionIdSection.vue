<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'

const props = defineProps<{
  issuerOid: string
  acsTransId: string
  threeDSServerTransId: string
}>()

const emit = defineEmits<{
  'update:issuerOid': [value: string]
  'update:acsTransId': [value: string]
  'update:threeDSServerTransId': [value: string]
}>()
</script>

<template>
  <!-- 交易識別（節錄核心欄位，其餘區塊將續移植） -->
  <section id="transaction-id" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">1.交易識別</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          id="issuerOid"
          label="發卡機構 OID (issuerOid)"
          :modelValue="props.issuerOid"
          required
          @update:modelValue="(value) => emit('update:issuerOid', String(value))"
        />
        <div>
          <Input
            id="acsTransId"
            label="ACS 交易 ID (acsTransID)"
            :modelValue="props.acsTransId"
            required
            @update:modelValue="(value) => emit('update:acsTransId', String(value))"
          />
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Input
            id="threeDSServerTransId"
            label="3DS Server 交易 ID (threeDSServerTransID)"
            :modelValue="props.threeDSServerTransId"
            required
            @update:modelValue="(value) => emit('update:threeDSServerTransId', String(value))"
          />
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
      </div>
    </Card>
  </section>
</template>
