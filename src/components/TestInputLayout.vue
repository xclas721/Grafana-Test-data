<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, nextTick } from 'vue'

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
const headerRef = ref<HTMLElement | null>(null)
const headerHeight = ref(0)

function measure() {
  if (headerRef.value) headerHeight.value = headerRef.value.offsetHeight
}

onMounted(async () => {
  await nextTick()
  measure()
  window.addEventListener('resize', measure)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <!-- 固定在頂端的控制列 -->
  <div class="container fixed-header" ref="headerRef">
    <div class="content-width">
      <div class="header-row">
        <div class="quick-actions">
          <button
            id="unifiedMode"
            class="quick-btn"
            :class="{ 'btn-primary': isUnified }"
            @click="emit('changeMode', 'unified')"
          >
            統一模式
          </button>
          <button
            id="acsMode"
            class="quick-btn"
            :class="{ 'btn-primary': isAcs }"
            @click="emit('changeMode', 'acs')"
          >
            ACS 模式
          </button>
          <button
            id="dssMode"
            class="quick-btn"
            :class="{ 'btn-primary': isDss }"
            @click="emit('changeMode', 'dss')"
          >
            3DSS 模式
          </button>
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
            <button class="quick-btn btn-success" @click="emit('batchInsert')">
              批量生成並POST
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 占位：避免被固定區塊覆蓋 -->
  <div :style="{ height: headerHeight + 'px' }"></div>
  <!-- 插槽：其餘內容正常佈局，不會被覆蓋 -->
  <div class="content-width">
    <slot />
  </div>
</template>

<style scoped>
.fixed-header {
  max-height: 80px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
.content-width {
  max-width: 1200px;
  margin: 0 auto;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
}
</style>
