<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import TestInputLayout from '@/components/TestInputLayout.vue'
import TestInputForm from '@/components/TestInputForm.vue'
import NotificationPanel from '@/components/NotificationPanel.vue'
import CurrencyModal from '@/components/CurrencyModal.vue'

const mode = ref<'unified' | 'acs' | 'dss'>('unified')
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

function onChangeMode(m: 'unified' | 'acs' | 'dss') {
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
    if (mode.value === 'unified') {
      const sharedTs = form.generateSharedTimestamp?.(data)
      const acs = form.buildDocument?.(data, 'unified', 'acs-transaction', sharedTs)
      const dss = form.buildDocument?.(data, 'unified', '3dss-transaction', sharedTs)
      if (!acs || !dss) return
      const acsIndex = `acs-transaction-${acs.utcDateStr}`
      const dssIndex = `3dss-transaction-${dss.utcDateStr}`
      const bulk =
        [
          JSON.stringify({ index: { _index: acsIndex } }),
          JSON.stringify(acs.document),
          JSON.stringify({ index: { _index: dssIndex } }),
          JSON.stringify(dss.document)
        ].join('\n') + '\n'
      const res = await fetch(`${baseUrl}/_bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-ndjson', Authorization: auth },
        body: bulk
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.errors) {
        const items = (json.items || []) as Array<{ index?: { error?: { reason?: string } } }>
        const reasons = items
          .filter((it) => it?.index?.error)
          .map((it) => it.index?.error?.reason || '')
          .filter(Boolean)
          .join('; ')
        throw new Error(reasons || '部分或全部索引失敗')
      }
      form.setStatus?.('已插入到 ACS 與 3DSS 索引', 'success')
    } else {
      const indexBase = mode.value === 'acs' ? 'acs-transaction' : '3dss-transaction'
      const sharedTs = form.generateSharedTimestamp?.(data)
      const built = form.buildDocument?.(data, mode.value, indexBase, sharedTs)
      if (!built) return
      const fullIndex = `${indexBase}-${built.utcDateStr}`
      const bulk =
        [JSON.stringify({ index: { _index: fullIndex } }), JSON.stringify(built.document)].join(
          '\n'
        ) + '\n'
      const res = await fetch(`${baseUrl}/_bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-ndjson', Authorization: auth },
        body: bulk
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.errors) throw new Error('索引失敗')
      form.setStatus?.(`已插入到 ${fullIndex}`, 'success')
    }
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
  const total = Math.max(1, parseInt(String(batchCount.value || 10)))
  const days = Math.max(0, parseInt(String(batchDays.value || 0)))
  if (
    days === 0 ||
    (form.getFormData?.()?.enableCustomTimeRange === 'on' &&
      form.getFormData?.()?.enableAutoTimeRange === 'on')
  ) {
    form.updateCustomTimeRangeFromNow?.()
  }
  panel?.show?.('正在批量處理...', total)
  panel?.addLog?.(
    'info',
    `開始批量處理，共 ${total} 筆，天數 ${days}${days === 0 ? '（當前時間）' : ''}`
  )
  const errorDetails: string[] = []
  // 計算每天分配
  const dailyCounts: number[] = []
  const distributionDays = Math.max(1, days)
  const average = Math.max(1, Math.floor(total / distributionDays))
  let remaining = total
  for (let d = 0; d < distributionDays; d++) {
    const take =
      d === distributionDays - 1
        ? remaining
        : Math.min(remaining, Math.max(1, average + Math.floor((Math.random() - 0.5) * average)))
    dailyCounts.push(take)
    remaining -= take
  }
  // 進度
  let success = 0
  let errorCount = 0 // 用於進度統計的可變計數器
  const startAt = Date.now()
  const dataBase = form.getFormData?.()
  if (!dataBase) {
    form.setStatus?.('表單資料為空', 'error')
    return
  }
  const isCustomRange = dataBase.enableCustomTimeRange === 'on'
  if (isCustomRange && (!dataBase.startDateTime || !dataBase.endDateTime)) {
    form.setStatus?.('請先設定自訂時間區間的起訖時間', 'error')
    return
  }
  const baseUrl = dataBase.baseUrl
  const auth = 'Basic ' + btoa(`${dataBase.username}:${dataBase.password}`)
  const BULK_RECORD_LIMIT = 500
  type BulkRecordMeta = { itemCount: number; dateStr: string }
  const bulkLines: string[] = []
  let bulkRecords: BulkRecordMeta[] = []
  function appendBulk(lines: string[], meta: BulkRecordMeta) {
    bulkLines.push(...lines)
    bulkRecords.push(meta)
  }
  function analyzeBulkItems(
    items: Array<{ index?: { error?: { reason?: string } } }>,
    records: BulkRecordMeta[]
  ) {
    let cursor = 0
    let successRecords = 0
    let errorRecords = 0
    const errorReasons: string[] = []
    for (const record of records) {
      let recordError = false
      let reason = ''
      for (let i = 0; i < record.itemCount; i++) {
        const item = items[cursor]
        cursor += 1
        if (!item) {
          recordError = true
          if (!reason) reason = '批次回應不足'
          continue
        }
        const err = item.index?.error
        if (err) {
          recordError = true
          if (!reason) reason = err.reason || '索引失敗'
        }
      }
      if (recordError) {
        errorRecords += 1
        errorReasons.push(`日期 ${record.dateStr}：${reason || '索引失敗'}`)
      } else {
        successRecords += 1
      }
    }
    return { successRecords, errorRecords, errorReasons }
  }
  async function flushBulk(force = false) {
    if (bulkRecords.length === 0) return
    if (!force && bulkRecords.length < BULK_RECORD_LIMIT) return
    const records = bulkRecords
    const payload = bulkLines.join('\n') + '\n'
    bulkRecords = []
    bulkLines.length = 0
    try {
      const res = await fetch(`${baseUrl}/_bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-ndjson', Authorization: auth },
        body: payload
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      if (json.errors) {
        const items = (json.items || []) as Array<{ index?: { error?: { reason?: string } } }>
        const analyzed = analyzeBulkItems(items, records)
        success += analyzed.successRecords
        errorCount += analyzed.errorRecords
        errorDetails.push(...analyzed.errorReasons)
      } else {
        success += records.length
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      errorCount += records.length
      records.forEach((record) => {
        errorDetails.push(`日期 ${record.dateStr}：索引失敗${msg ? ` (${msg})` : ''}`)
      })
    } finally {
      panel?.setProgress?.(success + errorCount, total, success, errorCount, startAt)
    }
  }
  // 逐日處理
  const startDate = dataBase.currentDate || ''
  if (!isCustomRange && !startDate) {
    form.setStatus?.('請先選擇日期', 'error')
    return
  }
  const loopDays = isCustomRange ? 1 : days
  const dailyCountsFinal = isCustomRange ? [total] : dailyCounts
  const baseDate = !isCustomRange
    ? new Date(
        parseInt(startDate.split('-')[0] || '0'),
        parseInt(startDate.split('-')[1] || '1') - 1,
        parseInt(startDate.split('-')[2] || '1')
      )
    : null
  for (let d = 0; d < loopDays; d++) {
    const date = baseDate ? new Date(baseDate) : null
    if (date) date.setDate(baseDate!.getDate() - d)
    const dateStr = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
          date.getDate()
        ).padStart(2, '0')}`
      : `${dataBase.startDateTime} ~ ${dataBase.endDateTime}`
    const count = dailyCountsFinal[d] ?? 0
    panel?.addLog?.('info', `第 ${d + 1} 天 (${dateStr}) 開始，數量 ${count}`)
    panel?.setText?.('progressStatus', `第 ${d + 1} 天 (${dateStr}) 處理中...`)
    for (let iTask = 0; iTask < count; iTask++) {
      try {
        // 每筆先依原規則隨機，再取表單資料
        form.generateRandom?.()
        const data = form.getFormData?.()
        if (!data) throw new Error('表單資料為空')
        // 覆寫當日日期
        if (date) data.currentDate = dateStr
        if (mode.value === 'unified') {
          const sharedTs = form.generateSharedTimestamp?.(data)
          const acs = form.buildDocument?.(data, 'unified', 'acs-transaction', sharedTs)
          const dss = form.buildDocument?.(data, 'unified', '3dss-transaction', sharedTs)
          if (!acs || !dss) throw new Error('構建文件失敗')
          const acsIndex = `acs-transaction-${acs.utcDateStr}`
          const dssIndex = `3dss-transaction-${dss.utcDateStr}`
          appendBulk(
            [
              JSON.stringify({ index: { _index: acsIndex } }),
              JSON.stringify(acs.document),
              JSON.stringify({ index: { _index: dssIndex } }),
              JSON.stringify(dss.document)
            ],
            { itemCount: 2, dateStr }
          )
        } else {
          const indexBase = mode.value === 'acs' ? 'acs-transaction' : '3dss-transaction'
          const sharedTs = form.generateSharedTimestamp?.(data)
          const built = form.buildDocument?.(data, mode.value, indexBase, sharedTs)
          if (!built) throw new Error('構建文件失敗')
          const fullIndex = `${indexBase}-${built.utcDateStr}`
          appendBulk(
            [JSON.stringify({ index: { _index: fullIndex } }), JSON.stringify(built.document)],
            { itemCount: 1, dateStr }
          )
        }
        await flushBulk()
      } catch {
        errorCount++
        errorDetails.push(`日期 ${dateStr}：索引失敗`)
        panel?.setProgress?.(success + errorCount, total, success, errorCount, startAt)
      }
    }
    await flushBulk(true)
  }
  panel?.setText?.('progressStatus', '處理完成')
  panel?.setErrors?.(errorDetails)
  if (errorCount === 0) form.setStatus?.(`批量完成，成功 ${success}/${total}`, 'success')
  else if (success === 0) form.setStatus?.(`批量失敗，全部失敗 ${errorCount}/${total}`, 'error')
  else form.setStatus?.(`部分成功：成功 ${success}，失敗 ${errorCount}`, 'warning')
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
