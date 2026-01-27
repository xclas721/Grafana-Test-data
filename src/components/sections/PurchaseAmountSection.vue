<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import Select, { type SelectOption } from '@/shared/components/Select.vue'

const purchaseCurrencyOptions: SelectOption[] = [
  { value: '156', label: '156 - 中國人民幣 (CNY)' },
  { value: '901', label: '901 - 台灣新台幣 (TWD)' },
  { value: '840', label: '840 - 美國美元 (USD)' },
  { value: '392', label: '392 - 日本日圓 (JPY)' },
  { value: '344', label: '344 - 香港港幣 (HKD)' },
  { value: '410', label: '410 - 韓國韓元 (KRW)' },
  { value: '702', label: '702 - 新加坡新加坡元 (SGD)' },
  { value: '036', label: '036 - 澳洲澳幣（澳元） (AUD)' },
  { value: '124', label: '124 - 加拿大加幣（加元） (CAD)' },
  { value: '978', label: '978 - 歐元區歐元 (EUR)' },
  { value: '826', label: '826 - 英國英鎊 (GBP)' },
  { value: '764', label: '764 - 泰國泰銖 (THB)' },
  { value: '704', label: '704 - 越南越南盾 (VND)' },
  { value: '458', label: '458 - 馬來西亞馬幣（令吉） (MYR)' },
  { value: '360', label: '360 - 印尼印尼盾（盧比） (IDR)' },
  { value: '608', label: '608 - 菲律賓菲律賓比索 (PHP)' }
]
</script>

<template>
  <!-- 4.交易金額 -->
  <section id="purchase-amount" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">4.交易金額</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            id="purchaseAmount"
            type="number"
            label="購買金額 (purchaseAmount)"
            :modelValue="'100'"
            required
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enablePurchaseAmountRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enablePurchaseAmountRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (10-1000)，預設開啟</p>
        </div>
        <div>
          <Select
            id="purchaseCurrency"
            label="購買貨幣代碼 (purchaseCurrency)"
            :modelValue="'156'"
            :options="purchaseCurrencyOptions"
            required
          />
          <p class="text-xs text-base-content/60 mt-1">選擇貨幣類型</p>
        </div>
        <Input
          id="purchaseExponent"
          type="number"
          label="購買金額指數 (purchaseExponent)"
          :modelValue="'2'"
          required
        />
        <Input
          id="usdAmount"
          type="number"
          label="美元金額 (usdAmount)"
          :modelValue="'0.13841979956813022'"
        />
      </div>
    </Card>
  </section>
</template>
