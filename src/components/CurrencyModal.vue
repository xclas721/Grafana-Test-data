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
    style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    "
  >
    <div
      style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
      "
    >
      <h3 style="margin-bottom: 20px; color: #2c3e50">選擇貨幣</h3>
      <div
        style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        "
      >
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('901', 'TWD', '新台幣', '台灣')"
        >
          <strong>台灣</strong><br />新台幣 (TWD)<br /><small style="color: #666">代碼: 901</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('840', 'USD', '美元', '美國')"
        >
          <strong>美國</strong><br />美元 (USD)<br /><small style="color: #666">代碼: 840</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('156', 'CNY', '人民幣', '中國')"
        >
          <strong>中國</strong><br />人民幣 (CNY)<br /><small style="color: #666">代碼: 156</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('392', 'JPY', '日圓', '日本')"
        >
          <strong>日本</strong><br />日圓 (JPY)<br /><small style="color: #666">代碼: 392</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('344', 'HKD', '港幣', '香港')"
        >
          <strong>香港</strong><br />港幣 (HKD)<br /><small style="color: #666">代碼: 344</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('410', 'KRW', '韓元', '韓國')"
        >
          <strong>韓國</strong><br />韓元 (KRW)<br /><small style="color: #666">代碼: 410</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('702', 'SGD', '新加坡元', '新加坡')"
        >
          <strong>新加坡</strong><br />新加坡元 (SGD)<br /><small style="color: #666"
            >代碼: 702</small
          >
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('036', 'AUD', '澳幣（澳元）', '澳洲')"
        >
          <strong>澳洲</strong><br />澳幣（澳元） (AUD)<br /><small style="color: #666"
            >代碼: 036</small
          >
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('124', 'CAD', '加幣（加元）', '加拿大')"
        >
          <strong>加拿大</strong><br />加幣（加元） (CAD)<br /><small style="color: #666"
            >代碼: 124</small
          >
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('978', 'EUR', '歐元', '歐元區')"
        >
          <strong>歐元區</strong><br />歐元 (EUR)<br /><small style="color: #666">代碼: 978</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('826', 'GBP', '英鎊', '英國')"
        >
          <strong>英國</strong><br />英鎊 (GBP)<br /><small style="color: #666">代碼: 826</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('764', 'THB', '泰銖', '泰國')"
        >
          <strong>泰國</strong><br />泰銖 (THB)<br /><small style="color: #666">代碼: 764</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('704', 'VND', '越南盾', '越南')"
        >
          <strong>越南</strong><br />越南盾 (VND)<br /><small style="color: #666">代碼: 704</small>
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('458', 'MYR', '馬幣（令吉）', '馬來西亞')"
        >
          <strong>馬來西亞</strong><br />馬幣（令吉） (MYR)<br /><small style="color: #666"
            >代碼: 458</small
          >
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('360', 'IDR', '印尼盾（盧比）', '印尼')"
        >
          <strong>印尼</strong><br />印尼盾（盧比） (IDR)<br /><small style="color: #666"
            >代碼: 360</small
          >
        </div>
        <div
          style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer"
          @click="selectCurrency('608', 'PHP', '菲律賓比索', '菲律賓')"
        >
          <strong>菲律賓</strong><br />菲律賓比索 (PHP)<br /><small style="color: #666"
            >代碼: 608</small
          >
        </div>
      </div>
      <button
        style="
          padding: 10px 20px;
          background: #95a5a6;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        "
        @click="close"
      >
        關閉
      </button>
    </div>
  </div>
</template>

<style scoped></style>
