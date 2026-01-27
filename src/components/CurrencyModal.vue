<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', payload: { numeric: string; code: string; name: string; country: string }): void
}>()

function close() {
  emit('update:modelValue', false)
}

function selectCurrency(numeric: string, code: string, name: string, country: string) {
  emit('select', { numeric, code, name, country })
  close()
}

defineExpose({ close })
</script>

<template>
  <!-- 貨幣選擇器模態框 -->
  <div
    id="currencyModal"
    v-show="props.modelValue"
    class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
  >
    <div class="card bg-base-100 border border-base-300 shadow-lg w-full max-w-3xl max-h-[80vh]">
      <div class="card-body p-6 overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">選擇貨幣</h3>
          <button class="btn btn-ghost btn-sm" @click="close">關閉</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('901', 'TWD', '新台幣', '台灣')"
          >
            <div class="font-semibold">台灣</div>
            <div class="text-sm text-base-content/70">新台幣 (TWD)</div>
            <div class="text-xs text-base-content/50">代碼: 901</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('840', 'USD', '美元', '美國')"
          >
            <div class="font-semibold">美國</div>
            <div class="text-sm text-base-content/70">美元 (USD)</div>
            <div class="text-xs text-base-content/50">代碼: 840</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('156', 'CNY', '人民幣', '中國')"
          >
            <div class="font-semibold">中國</div>
            <div class="text-sm text-base-content/70">人民幣 (CNY)</div>
            <div class="text-xs text-base-content/50">代碼: 156</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('392', 'JPY', '日圓', '日本')"
          >
            <div class="font-semibold">日本</div>
            <div class="text-sm text-base-content/70">日圓 (JPY)</div>
            <div class="text-xs text-base-content/50">代碼: 392</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('344', 'HKD', '港幣', '香港')"
          >
            <div class="font-semibold">香港</div>
            <div class="text-sm text-base-content/70">港幣 (HKD)</div>
            <div class="text-xs text-base-content/50">代碼: 344</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('410', 'KRW', '韓元', '韓國')"
          >
            <div class="font-semibold">韓國</div>
            <div class="text-sm text-base-content/70">韓元 (KRW)</div>
            <div class="text-xs text-base-content/50">代碼: 410</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('702', 'SGD', '新加坡元', '新加坡')"
          >
            <div class="font-semibold">新加坡</div>
            <div class="text-sm text-base-content/70">新加坡元 (SGD)</div>
            <div class="text-xs text-base-content/50">代碼: 702</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('036', 'AUD', '澳幣（澳元）', '澳洲')"
          >
            <div class="font-semibold">澳洲</div>
            <div class="text-sm text-base-content/70">澳幣（澳元） (AUD)</div>
            <div class="text-xs text-base-content/50">代碼: 036</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('124', 'CAD', '加幣（加元）', '加拿大')"
          >
            <div class="font-semibold">加拿大</div>
            <div class="text-sm text-base-content/70">加幣（加元） (CAD)</div>
            <div class="text-xs text-base-content/50">代碼: 124</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('978', 'EUR', '歐元', '歐元區')"
          >
            <div class="font-semibold">歐元區</div>
            <div class="text-sm text-base-content/70">歐元 (EUR)</div>
            <div class="text-xs text-base-content/50">代碼: 978</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('826', 'GBP', '英鎊', '英國')"
          >
            <div class="font-semibold">英國</div>
            <div class="text-sm text-base-content/70">英鎊 (GBP)</div>
            <div class="text-xs text-base-content/50">代碼: 826</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('764', 'THB', '泰銖', '泰國')"
          >
            <div class="font-semibold">泰國</div>
            <div class="text-sm text-base-content/70">泰銖 (THB)</div>
            <div class="text-xs text-base-content/50">代碼: 764</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('704', 'VND', '越南盾', '越南')"
          >
            <div class="font-semibold">越南</div>
            <div class="text-sm text-base-content/70">越南盾 (VND)</div>
            <div class="text-xs text-base-content/50">代碼: 704</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('458', 'MYR', '馬幣（令吉）', '馬來西亞')"
          >
            <div class="font-semibold">馬來西亞</div>
            <div class="text-sm text-base-content/70">馬幣（令吉） (MYR)</div>
            <div class="text-xs text-base-content/50">代碼: 458</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('360', 'IDR', '印尼盾（盧比）', '印尼')"
          >
            <div class="font-semibold">印尼</div>
            <div class="text-sm text-base-content/70">印尼盾（盧比） (IDR)</div>
            <div class="text-xs text-base-content/50">代碼: 360</div>
          </div>
          <div
            class="border border-base-300 rounded-lg p-3 hover:bg-base-200 cursor-pointer"
            @click="selectCurrency('608', 'PHP', '菲律賓比索', '菲律賓')"
          >
            <div class="font-semibold">菲律賓</div>
            <div class="text-sm text-base-content/70">菲律賓比索 (PHP)</div>
            <div class="text-xs text-base-content/50">代碼: 608</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
