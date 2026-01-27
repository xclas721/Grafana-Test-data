<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import Select, { type SelectOption } from '@/shared/components/Select.vue'

const merchantCountryOptions: SelectOption[] = [
  { value: '156', label: '156 - 中國 (CN)' },
  { value: '158', label: '158 - 台灣 (TW)' },
  { value: '840', label: '840 - 美國 (US)' },
  { value: '392', label: '392 - 日本 (JP)' },
  { value: '344', label: '344 - 香港 (HK)' },
  { value: '410', label: '410 - 韓國 (KR)' },
  { value: '702', label: '702 - 新加坡 (SG)' },
  { value: '036', label: '036 - 澳洲 (AU)' },
  { value: '124', label: '124 - 加拿大 (CA)' },
  { value: '978', label: '978 - 歐元區 (EU)' },
  { value: '826', label: '826 - 英國 (GB)' },
  { value: '764', label: '764 - 泰國 (TH)' },
  { value: '704', label: '704 - 越南 (VN)' },
  { value: '458', label: '458 - 馬來西亞 (MY)' },
  { value: '360', label: '360 - 印尼 (ID)' },
  { value: '608', label: '608 - 菲律賓 (PH)' }
]
</script>

<template>
  <!-- 3.商戶信息 -->
  <section id="merchant-info" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">3.商戶信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="merchantName"
          label="商戶名稱 (merchantName)"
          :modelValue="'HiTRUST EMV Demo Merchant'"
          required
        />
        <div>
          <Select
            id="merchantCountryCode"
            label="商戶國家代碼 (merchantCountryCode)"
            :modelValue="'156'"
            :options="merchantCountryOptions"
            required
          />
          <p class="text-xs text-base-content/60 mt-1">選擇商戶所在國家/地區</p>
        </div>
        <div>
          <Input
            id="acquirerMerchantId"
            label="收單機構商戶 ID (acquirerMerchantID)"
            :modelValue="'8909191'"
            required
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableAcquirerMerchantIdRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enableAcquirerMerchantIdRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (1-9999999)，預設關閉</p>
        </div>
        <Input
          id="acquirerBin"
          label="收單機構 BIN (acquirerBIN)"
          :modelValue="'1231234'"
          required
        />
        <Input id="mcc" label="商戶類別代碼 (mcc)" :modelValue="'5661'" required />
      </div>
    </Card>
  </section>
</template>
