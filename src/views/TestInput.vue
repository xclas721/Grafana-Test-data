<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import TestInputLayout from '@/components/TestInputLayout.vue'
import TestInputForm from '@/components/TestInputForm.vue'
import NotificationPanel from '@/components/NotificationPanel.vue'
import CurrencyModal from '@/components/CurrencyModal.vue'
import { runBatchInsert } from '@/composables/useBatchInsert'
import { fetchElasticsearchBulk } from '@/shared/utils/elasticsearchBulk'

const mode = ref<'acs' | 'dss'>('acs')
const formRef = ref<InstanceType<typeof TestInputForm> | null>(null)
const panelRef = ref<InstanceType<typeof NotificationPanel> | null>(null)
const currencyModalVisible = ref(false)
const batchCount = ref(10)
const batchDays = ref(1)
const enableAutoTimeRange = ref(true)
const scheduleEnabled = ref(false)
const scheduleIntervalSeconds = ref(60)
const nextRunInSeconds = ref(0)
const scheduleRunning = ref(false)
const scheduleBusy = ref(false)
let scheduleTimer: number | null = null

function onChangeMode(m: 'acs' | 'dss') {
  mode.value = m
}

function onLoadDefaults() {
  formRef.value?.loadDefaults?.()
}

function onGenerateRandom() {
  formRef.value?.generateRandom?.()
}

function onInsertData() {
  void insertOnce()
}

function onBatchInsert() {
  void batchInsert()
}

function clearScheduleTimer() {
  if (scheduleTimer !== null) {
    window.clearInterval(scheduleTimer)
    scheduleTimer = null
  }
}

async function runScheduledBatch() {
  if (scheduleBusy.value) return
  scheduleBusy.value = true
  try {
    await batchInsert()
  } finally {
    scheduleBusy.value = false
  }
}

function onStartSchedule() {
  if (!scheduleEnabled.value || scheduleRunning.value) return
  batchDays.value = 0
  scheduleRunning.value = true
  nextRunInSeconds.value = Math.max(1, Math.floor(scheduleIntervalSeconds.value || 1))
  void runScheduledBatch()
  clearScheduleTimer()
  scheduleTimer = window.setInterval(() => {
    if (!scheduleRunning.value) return
    if (nextRunInSeconds.value <= 1) {
      nextRunInSeconds.value = Math.max(1, Math.floor(scheduleIntervalSeconds.value || 1))
      void runScheduledBatch()
      return
    }
    nextRunInSeconds.value -= 1
  }, 1000)
}

function onStopSchedule() {
  scheduleRunning.value = false
  clearScheduleTimer()
}

function onToggleScheduleEnabled(value: boolean) {
  scheduleEnabled.value = value
  if (value) {
    batchDays.value = 0
  } else {
    onStopSchedule()
  }
}

function onUpdateScheduleIntervalSeconds(value: number) {
  scheduleIntervalSeconds.value = value
  if (scheduleRunning.value) {
    nextRunInSeconds.value = Math.max(1, Math.floor(value || 1))
  }
}

onBeforeUnmount(() => {
  onStopSchedule()
})

async function insertOnce() {
  try {
    const form = formRef.value
    if (!form) return
    const data = form.getFormData?.()
    if (!data) return
    const refreshNowOnly = batchDays.value === 0
    if (
      refreshNowOnly ||
      (data.enableCustomTimeRange === 'on' && data.enableAutoTimeRange === 'on')
    ) {
      form.updateCustomTimeRangeFromNow?.()
    }
    if (data.enableCustomTimeRange === 'on' && (!data.startDateTime || !data.endDateTime)) {
      form.setStatus?.('請先設定自訂時間區間的起訖時間', 'error')
      return
    }
    const baseUrl = data.baseUrl
    const auth = 'Basic ' + btoa(`${data.username}:${data.password}`)
    const indexBase = mode.value === 'acs' ? 'acs-transaction' : '3dss-transaction'
    const sharedTs = form.generateSharedTimestamp?.(data)
    const built = form.buildDocument?.(data, indexBase, sharedTs)
    if (!built) return
    const fullIndex = `${indexBase}-${built.utcDateStr}`
    const bulk =
      [JSON.stringify({ index: { _index: fullIndex } }), JSON.stringify(built.document)].join(
        '\n'
      ) + '\n'
    const res = await fetchElasticsearchBulk(baseUrl, auth, bulk)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (json.errors) throw new Error('索引失敗')
    form.setStatus?.(`已插入到 ${fullIndex}`, 'success')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    formRef.value?.setStatus?.('插入失敗: ' + msg, 'error')
  }
}

function onCurrencySelect(payload: {
  numeric: string
  code: string
  name: string
  country: string
}) {
  const form = formRef.value
  if (!form) return
  const updates: Record<string, string> = {
    purchaseCurrency: payload.numeric,
    currencyCodeForRate: payload.code,
    currencyAlphabeticCode: payload.code,
    currencyNumericCode: payload.numeric,
    currencyName: payload.name
  }
  // 國家推導（簡化：台灣/美國/中國/日本/巴西等）
  const map: Record<
    string,
    { alpha2: string; alpha3: string; numeric: string; name: string; mcc?: string }
  > = {
    台灣: { alpha2: 'TW', alpha3: 'TWN', numeric: '158', name: 'Taiwan' },
    美國: { alpha2: 'US', alpha3: 'USA', numeric: '840', name: 'United States' },
    中國: { alpha2: 'CN', alpha3: 'CHN', numeric: '156', name: 'China' },
    日本: { alpha2: 'JP', alpha3: 'JPN', numeric: '392', name: 'Japan' },
    香港: { alpha2: 'HK', alpha3: 'HKG', numeric: '344', name: 'Hong Kong' },
    韓國: { alpha2: 'KR', alpha3: 'KOR', numeric: '410', name: 'South Korea' },
    新加坡: { alpha2: 'SG', alpha3: 'SGP', numeric: '702', name: 'Singapore' },
    澳洲: { alpha2: 'AU', alpha3: 'AUS', numeric: '036', name: 'Australia' },
    加拿大: { alpha2: 'CA', alpha3: 'CAN', numeric: '124', name: 'Canada' },
    歐元區: { alpha2: 'EU', alpha3: 'EUR', numeric: '978', name: 'European Union' },
    英國: { alpha2: 'GB', alpha3: 'GBR', numeric: '826', name: 'United Kingdom' },
    泰國: { alpha2: 'TH', alpha3: 'THA', numeric: '764', name: 'Thailand' },
    越南: { alpha2: 'VN', alpha3: 'VNM', numeric: '704', name: 'Vietnam' },
    馬來西亞: { alpha2: 'MY', alpha3: 'MYS', numeric: '458', name: 'Malaysia' },
    印尼: { alpha2: 'ID', alpha3: 'IDN', numeric: '360', name: 'Indonesia' },
    菲律賓: { alpha2: 'PH', alpha3: 'PHL', numeric: '608', name: 'Philippines' },
    柬埔寨: { alpha2: 'KH', alpha3: 'KHM', numeric: '116', name: 'Cambodia' },
    巴西: { alpha2: 'BR', alpha3: 'BRA', numeric: '076', name: 'Brazil' }
  }
  const info = map[payload.country]
  if (info) {
    updates.merchantCountryCode = info.numeric
    updates.countryAlpha2 = info.alpha2
    updates.countryAlpha3 = info.alpha3
    updates.countryNumeric = info.numeric
    updates.countryName = info.name
  }
  form.setFields?.(updates)
  form.setStatus?.(`已選擇 ${payload.country} ${payload.name} (${payload.code})`, 'success')
}

async function batchInsert() {
  const form = formRef.value
  const panel = panelRef.value
  if (!form || !panel) return
  await runBatchInsert({
    mode: mode.value,
    batchCount: batchCount.value,
    batchDays: batchDays.value,
    form,
    panel
  })
}
</script>

<template>
  <TestInputLayout
    :activeMode="mode"
    v-model:batchCount="batchCount"
    v-model:batchDays="batchDays"
    :disableBatchDays="!enableAutoTimeRange || scheduleEnabled"
    :scheduleEnabled="scheduleEnabled"
    :scheduleIntervalSeconds="scheduleIntervalSeconds"
    :nextRunInSeconds="nextRunInSeconds"
    :scheduleRunning="scheduleRunning"
    @changeMode="onChangeMode"
    @loadDefaults="onLoadDefaults"
    @generateRandom="onGenerateRandom"
    @insertData="onInsertData"
    @batchInsert="onBatchInsert"
    @update:scheduleEnabled="onToggleScheduleEnabled"
    @update:scheduleIntervalSeconds="onUpdateScheduleIntervalSeconds"
    @startSchedule="onStartSchedule"
    @stopSchedule="onStopSchedule"
  >
    <TestInputForm
      ref="formRef"
      v-model:enableAutoTimeRange="enableAutoTimeRange"
      :activeMode="mode"
      :batchDays="batchDays"
    />
    <NotificationPanel ref="panelRef" />
    <CurrencyModal v-model="currencyModalVisible" @select="onCurrencySelect" />
  </TestInputLayout>
</template>

<style scoped></style>
