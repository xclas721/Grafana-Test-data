<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  activeMode: 'unified' | 'acs' | 'dss'
  batchCount?: number
  batchDays?: number
}>()

const emit = defineEmits<{
  (e: 'changeMode', mode: 'unified' | 'acs' | 'dss'): void
  (e: 'loadDefaults'): void
  (e: 'generateRandom'): void
  (e: 'insertData'): void
  (e: 'batchInsert'): void
}>()

const isUnified = computed(() => props.activeMode === 'unified')
const isAcs = computed(() => props.activeMode === 'acs')
const isDss = computed(() => props.activeMode === 'dss')

const insertButtonText = computed(() => {
  if (isUnified.value) return '插入到 ACS & 3DSS'
  if (isAcs.value) return '插入到 ACS'
  return '插入到 3DSS'
})
</script>

<template>
  <div class="container">
    <div class="mode-switch-container">
      <div class="mode-switch">
        <button
          id="unifiedMode"
          class="mode-btn"
          :class="{ active: isUnified }"
          @click="emit('changeMode', 'unified')"
        >
          統一模式
        </button>
        <button
          id="acsMode"
          class="mode-btn"
          :class="{ active: isAcs }"
          @click="emit('changeMode', 'acs')"
        >
          ACS 模式
        </button>
        <button
          id="dssMode"
          class="mode-btn"
          :class="{ active: isDss }"
          @click="emit('changeMode', 'dss')"
        >
          3DSS 模式
        </button>
      </div>
    </div>

    <div class="form-container">
      <div class="quick-actions">
        <button class="quick-btn" @click="emit('loadDefaults')">載入預設值</button>
        <button class="quick-btn" @click="emit('generateRandom')">生成隨機數據</button>
        <button class="quick-btn btn-primary" @click="emit('insertData')">
          {{ insertButtonText }}
        </button>
        <div class="batch-container">
          <label for="batchCount" style="font-size: 12px; color: #666">數量:</label>
          <input
            type="number"
            id="batchCount"
            :value="props.batchCount ?? 10"
            min="1"
            max="100000"
            class="batch-input"
            placeholder="10"
            @input="emit('changeMode', activeMode)"
          />
          <label for="batchDays" style="font-size: 12px; color: #666">天數:</label>
          <input
            type="number"
            id="batchDays"
            :value="props.batchDays ?? 1"
            min="1"
            max="30"
            class="batch-input"
            placeholder="1"
            title="生成多少天的數據"
          />
          <button class="quick-btn btn-success" @click="emit('batchInsert')">批量生成並POST</button>
        </div>
      </div>

      <!-- 插槽：其餘內容由外層提供（逐步從 HTML 移植過來） -->
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
