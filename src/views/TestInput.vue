<script setup lang="ts">
import { ref } from 'vue'
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

async function insertOnce() {
  try {
    const form = formRef.value
    if (!form) return
    const data = form.getFormData?.()
    if (!data) return
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
      const built = form.buildDocument?.(data, mode.value, indexBase)
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
  // 國家推導（簡化：台灣/美國/中國/日本）
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
    菲律賓: { alpha2: 'PH', alpha3: 'PHL', numeric: '608', name: 'Philippines' }
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
  const days = Math.max(1, parseInt(String(batchDays.value || 1)))
  panel.show?.('正在批量處理...', total)
  panel.addLog?.('info', `開始批量處理，共 ${total} 筆，天數 ${days}`)
  const errorDetails: string[] = []
  // 計算每天分配
  const dailyCounts: number[] = []
  const average = Math.max(1, Math.floor(total / days))
  let remaining = total
  for (let d = 0; d < days; d++) {
    const take =
      d === days - 1
        ? remaining
        : Math.min(remaining, Math.max(1, average + Math.floor((Math.random() - 0.5) * average)))
    dailyCounts.push(take)
    remaining -= take
  }
  // 進度
  let success = 0
  let errorCount = 0 // 用於進度統計的可變計數器
  const startAt = Date.now()
  // 併發控制
  const CONCURRENCY = 5
  async function processPool<T>(
    items: T[],
    worker: (item: T, idx: number) => Promise<void>,
    concurrency: number
  ) {
    let i = 0
    const runners: Promise<void>[] = []
    async function runOne() {
      const idx = i++
      if (idx >= items.length) return
      const it = items[idx] as T
      await worker(it, idx)
      return runOne()
    }
    for (let k = 0; k < Math.min(concurrency, items.length); k++) runners.push(runOne())
    await Promise.all(runners)
  }
  const dataBase = form.getFormData?.()
  if (!dataBase) {
    form.setStatus?.('表單資料為空', 'error')
    return
  }
  const baseUrl = dataBase.baseUrl
  const auth = 'Basic ' + btoa(`${dataBase.username}:${dataBase.password}`)
  // 逐日處理
  const startDate = dataBase.currentDate
  if (!startDate) {
    form.setStatus?.('請先選擇日期', 'error')
    return
  }
  const parts = startDate.split('-')
  const y = parseInt(parts[0] || '0')
  const m = parseInt(parts[1] || '1')
  const dd = parseInt(parts[2] || '1')
  const baseDate = new Date(y, m - 1, dd)
  for (let d = 0; d < days; d++) {
    const date = new Date(baseDate)
    date.setDate(baseDate.getDate() - d)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const count = dailyCounts[d] ?? 0
    panel.addLog?.('info', `第 ${d + 1} 天 (${dateStr}) 開始，數量 ${count}`)
    panel.setText?.('progressStatus', `第 ${d + 1} 天 (${dateStr}) 處理中...`)
    const tasks: number[] = []
    for (let iTask = 0; iTask < count; iTask++) tasks.push(iTask)
    await processPool(
      tasks,
      async () => {
        try {
          // 每筆先依原規則隨機，再取表單資料
          form.generateRandom?.()
          const data = form.getFormData?.()
          if (!data) throw new Error('表單資料為空')
          // 覆寫當日日期
          data.currentDate = dateStr
          if (mode.value === 'unified') {
            const sharedTs = form.generateSharedTimestamp?.(data)
            const acs = form.buildDocument?.(data, 'unified', 'acs-transaction', sharedTs)
            const dss = form.buildDocument?.(data, 'unified', '3dss-transaction', sharedTs)
            if (!acs || !dss) throw new Error('構建文件失敗')
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
            const json = await res.json()
            if (!res.ok || json.errors) {
              let reason = `HTTP ${res.status}`
              if (json.errors) {
                const items = (json.items || []) as Array<{
                  index?: { error?: { reason?: string } }
                }>
                const reasons = items
                  .filter((it) => it?.index?.error)
                  .map((it) => it.index?.error?.reason || '')
                  .filter(Boolean)
                  .join('; ')
                if (reasons) reason = reasons
              }
              throw new Error(reason)
            }
          } else {
            const indexBase = mode.value === 'acs' ? 'acs-transaction' : '3dss-transaction'
            const built = form.buildDocument?.(data, mode.value, indexBase)
            if (!built) throw new Error('構建文件失敗')
            const fullIndex = `${indexBase}-${built.utcDateStr}`
            const bulk =
              [
                JSON.stringify({ index: { _index: fullIndex } }),
                JSON.stringify(built.document)
              ].join('\n') + '\n'
            const res = await fetch(`${baseUrl}/_bulk`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-ndjson', Authorization: auth },
              body: bulk
            })
            const json2 = await res.json()
            if (!res.ok || json2.errors) {
              let reason = `HTTP ${res.status}`
              if (json2.errors) {
                const items = (json2.items || []) as Array<{
                  index?: { error?: { reason?: string } }
                }>
                const reasons = items
                  .filter((it) => it?.index?.error)
                  .map((it) => it.index?.error?.reason || '')
                  .filter(Boolean)
                  .join('; ')
                if (reasons) reason = reasons
              }
              throw new Error(reason)
            }
            // 已於前段 json2 分支處理錯誤與原因
          }
          success++
        } catch {
          errorCount++
          errorDetails.push(`日期 ${dateStr}：索引失敗`)
        }
        panel.setProgress?.(success + errorCount, total, success, errorCount, startAt)
      },
      CONCURRENCY
    )
  }
  panel.setText?.('progressStatus', '處理完成')
  panel.setErrors?.(errorDetails)
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
    @changeMode="onChangeMode"
    @loadDefaults="onLoadDefaults"
    @generateRandom="onGenerateRandom"
    @insertData="onInsertData"
    @batchInsert="onBatchInsert"
  >
    <TestInputForm ref="formRef" :activeMode="mode" :batchDays="batchDays" />
    <NotificationPanel ref="panelRef" />
    <CurrencyModal v-model="currencyModalVisible" @select="onCurrencySelect" />
  </TestInputLayout>
</template>

<style scoped></style>
