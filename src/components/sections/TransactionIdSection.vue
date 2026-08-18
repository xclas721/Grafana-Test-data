<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import { REQUESTOR_ID_OPTIONS } from '@/shared/constants/requestorIds'

const props = defineProps<{
  issuerOid: string
  requestorId: string
  enableRequestorRandom: boolean
  acsTransId: string
  threeDSServerTransId: string
}>()

const emit = defineEmits<{
  'update:issuerOid': [value: string]
  'update:requestorId': [value: string]
  'update:enableRequestorRandom': [value: boolean]
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
          <div class="form-control w-full">
            <label class="label" for="requestorId">
              <span class="label-text">
                Requestor ID (requestorId)
                <span class="text-error">*</span>
              </span>
            </label>
            <select
              id="requestorId"
              class="select select-bordered select-sm w-full"
              required
              :value="props.requestorId"
              @change="
                emit('update:requestorId', String(($event.target as HTMLSelectElement).value))
              "
            >
              <option v-for="id in REQUESTOR_ID_OPTIONS" :key="id" :value="id">{{ id }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableRequestorRandom"
              class="checkbox checkbox-sm"
              :checked="props.enableRequestorRandom"
              @change="
                (event) =>
                  emit('update:enableRequestorRandom', (event.target as HTMLInputElement).checked)
              "
            />
            <label for="enableRequestorRandom" class="text-sm text-base-content/60">
              隨機 Requestor ID
            </label>
          </div>
          <p class="text-xs text-error mt-2">
            15 個；勾選後依 3000／250×4／100×10 加權，預設不隨機
          </p>
        </div>
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
