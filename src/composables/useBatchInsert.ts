import {
  PRESET_NO_ERROR,
  applyErrorPresetToFormData,
  pickRandomBatchErrorPreset
} from '@/shared/constants/emvThreeDSErrorPresets'
import {
  DEFAULT_BATCH_ERROR_MIX_PERCENT,
  getBatchErrorMixPercent,
  isBatchErrorMixEnabled
} from '@/shared/utils/batchErrorMix'
import { applyChallengeVerificationMix } from '@/shared/utils/challengeVerificationMix'
import { fetchElasticsearchBulk } from '@/shared/utils/elasticsearchBulk'
import {
  RANDOM_CARD_SCHEMES,
  generateCardPool,
  type PoolCard
} from '@/composables/useBusinessFieldRandomizer'

export const BULK_RECORD_LIMIT = 2000
export const BULK_CONCURRENCY = 6

export type BulkRecordMeta = { itemCount: number; dateStr: string }

export type BatchInsertFormApi = {
  getFormData?: () => Record<string, string> | undefined
  getFormDataForBatchInsert?: () => Record<string, string> | undefined
  generateRandom?: (forcedCard?: PoolCard) => void
  generateSharedTimestamp?: (data: Record<string, string>) => string
  buildDocument?: (
    data: Record<string, string>,
    indexBase: string,
    sharedTs?: string
  ) => { document: unknown; utcDateStr?: string } | undefined
  updateCustomTimeRangeFromNow?: () => void
  setStatus?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
}

export type BatchInsertPanelApi = {
  show?: (text: string, total: number) => void
  addLog?: (level: string, message: string) => void
  setProgress?: (
    current: number,
    total: number,
    success: number,
    error: number,
    startAt: number
  ) => void
  setText?: (key: string, value: string) => void
  setErrors?: (errors: string[]) => void
}

export type BatchInsertRunParams = {
  mode: 'acs' | 'dss'
  batchCount: number
  batchDays: number
  form: BatchInsertFormApi
  panel: BatchInsertPanelApi
  fetchBulk?: typeof fetchElasticsearchBulk
  random?: () => number
}

export function shouldRefreshCustomTimeRange(
  days: number,
  data: Record<string, string> | undefined
): boolean {
  return (
    days === 0 ||
    (data?.enableCustomTimeRange === 'on' && data?.enableAutoTimeRange === 'on')
  )
}

/** 將 total 筆資料分配到 distributionDays 個日曆日（最後一日收斂剩餘筆數） */
export function computeDailyCounts(
  total: number,
  days: number,
  random: () => number = Math.random
): number[] {
  const distributionDays = Math.max(1, days)
  const average = Math.max(1, Math.floor(total / distributionDays))
  let remaining = total
  const dailyCounts: number[] = []
  for (let d = 0; d < distributionDays; d++) {
    const take =
      d === distributionDays - 1
        ? remaining
        : Math.min(remaining, Math.max(1, average + Math.floor((random() - 0.5) * average)))
    dailyCounts.push(take)
    remaining -= take
  }
  return dailyCounts
}

export function analyzeBulkItems(
  items: Array<{ index?: { error?: { reason?: string } } }>,
  records: BulkRecordMeta[]
): { successRecords: number; errorRecords: number; errorReasons: string[] } {
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

export function formatCalendarDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

export function resolveCardPool(
  dataBase: Record<string, string>,
  total: number,
  random: () => number = Math.random
): { pool: PoolCard[]; poolSize: number; ratio: number } | null {
  if (dataBase.enableAcctNumberRandom !== 'on') return null
  const ratio = Math.max(1, parseInt(String(dataBase.cardPoolRatio || '10')) || 1)
  if (ratio <= 1) return null
  const schemes =
    dataBase.enableCardSchemeRandom === 'on'
      ? [...RANDOM_CARD_SCHEMES]
      : [String(dataBase.cardScheme || 'V')]
  const poolSize = Math.max(1, Math.ceil(total / ratio))
  return { pool: generateCardPool(poolSize, schemes, random), poolSize, ratio }
}

export async function runBatchInsert(params: BatchInsertRunParams): Promise<void> {
  const { mode, form, panel } = params
  const random = params.random ?? Math.random
  const fetchBulk = params.fetchBulk ?? fetchElasticsearchBulk
  const total = Math.max(1, parseInt(String(params.batchCount || 10)))
  const days = Math.max(0, parseInt(String(params.batchDays || 0)))

  if (shouldRefreshCustomTimeRange(days, form.getFormData?.())) {
    form.updateCustomTimeRangeFromNow?.()
  }

  panel.show?.('正在批量處理...', total)
  panel.addLog?.(
    'info',
    `開始批量處理，共 ${total} 筆，天數 ${days}${days === 0 ? '（當前時間）' : ''}`
  )

  const errorDetails: string[] = []
  const dailyCounts = computeDailyCounts(total, days, random)

  let success = 0
  let errorCount = 0
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

  if (isBatchErrorMixEnabled(dataBase)) {
    const pct = getBatchErrorMixPercent(dataBase)
    const emptyUsesDefault =
      String(dataBase.batchErrorMixPercent ?? '').trim() === ''
        ? `（空白欄位已用預設 ${DEFAULT_BATCH_ERROR_MIX_PERCENT}%）`
        : ''
    panel.addLog?.(
      'info',
      `批次錯誤混入已啟用：每筆 ${pct}% 機率寫入非 NULL 的 errorCode（${mode === 'dss' ? '3DSS：S／D／A 混合' : 'ACS：以 A 為主'}抽樣）${emptyUsesDefault}`
    )
    if (!isCustomRange && days > 1) {
      panel.addLog?.(
        'warning',
        `後端錯誤統計依 first_seen_timestamp；本批資料會攤在過去 ${days} 個日曆日、每日時間隨機。若儀表只選「最近 15 分鐘／1 小時」，錯誤筆數會遠小於約 ${total}×${pct}%。請拉長時間範圍涵蓋這些日期，或改勾「自訂時間」並開啟「自動更新區間」。`
      )
    }
    if (isCustomRange && dataBase.enableAutoTimeRange === 'on') {
      panel.addLog?.(
        'info',
        '已使用自訂時間且自動更新：first_seen_timestamp 會落在起訖區間內，較易與即時儀表對齊。'
      )
    }
  }

  const cardPoolInfo = resolveCardPool(dataBase, total, random)
  const cardPool = cardPoolInfo?.pool ?? null
  if (cardPoolInfo) {
    panel.addLog?.(
      'info',
      `卡號重複池：${cardPoolInfo.poolSize} 張卡（倍率 ${cardPoolInfo.ratio}，共 ${total} 筆，平均每卡約 ${cardPoolInfo.ratio} 次）`
    )
  }

  const baseUrl = dataBase.baseUrl
  const auth = 'Basic ' + btoa(`${dataBase.username}:${dataBase.password}`)
  const inFlight = new Set<Promise<void>>()

  async function waitForBulkSlot() {
    while (inFlight.size >= BULK_CONCURRENCY) {
      await Promise.race([...inFlight])
      await Promise.resolve()
    }
  }

  panel.addLog?.(
    'info',
    `每批 ${BULK_RECORD_LIMIT} 筆，同時最多 ${BULK_CONCURRENCY} 個 _bulk 請求`
  )

  const bulkLines: string[] = []
  let bulkRecords: BulkRecordMeta[] = []

  function appendBulk(lines: string[], meta: BulkRecordMeta) {
    bulkLines.push(...lines)
    bulkRecords.push(meta)
  }

  async function flushBulk(force = false) {
    if (bulkRecords.length === 0) return
    if (!force && bulkRecords.length < BULK_RECORD_LIMIT) return
    await waitForBulkSlot()
    const records = bulkRecords
    const payload = bulkLines.join('\n') + '\n'
    bulkRecords = []
    bulkLines.length = 0
    const task = (async () => {
      try {
        const res = await fetchBulk(baseUrl, auth, payload)
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
        panel.setProgress?.(success + errorCount, total, success, errorCount, startAt)
      }
    })()
    inFlight.add(task)
    void task.finally(() => inFlight.delete(task))
  }

  const startDate = dataBase.currentDate || ''
  if (!isCustomRange && !startDate) {
    form.setStatus?.('請先選擇日期', 'error')
    return
  }

  const loopDays = isCustomRange ? 1 : Math.max(1, days)
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
      ? formatCalendarDate(date)
      : `${dataBase.startDateTime} ~ ${dataBase.endDateTime}`
    const count = dailyCountsFinal[d] ?? 0
    panel.addLog?.('info', `第 ${d + 1} 天 (${dateStr}) 開始，數量 ${count}`)
    panel.setText?.('progressStatus', `第 ${d + 1} 天 (${dateStr}) 處理中...`)

    for (let iTask = 0; iTask < count; iTask++) {
      try {
        const forcedCard = cardPool
          ? cardPool[Math.floor(random() * cardPool.length)]!
          : undefined
        form.generateRandom?.(forcedCard)
        const data = form.getFormDataForBatchInsert?.() ?? form.getFormData?.()
        if (!data || Object.keys(data).length === 0) throw new Error('表單資料為空')

        if (isBatchErrorMixEnabled(data)) {
          const pct = getBatchErrorMixPercent(data)
          if (random() * 100 < pct) {
            applyErrorPresetToFormData(data, pickRandomBatchErrorPreset(mode))
          } else {
            applyErrorPresetToFormData(data, PRESET_NO_ERROR)
          }
        }
        if (mode === 'acs' && data.enableAuthenticationMethodRandom === 'on') {
          applyChallengeVerificationMix(data, random)
        }
        if (date) data.currentDate = dateStr

        const indexBase = mode === 'acs' ? 'acs-transaction' : '3dss-transaction'
        const sharedTs = form.generateSharedTimestamp?.(data)
        const built = form.buildDocument?.(data, indexBase, sharedTs)
        if (!built) throw new Error('構建文件失敗')

        const fullIndex = `${indexBase}-${built.utcDateStr}`
        appendBulk(
          [JSON.stringify({ index: { _index: fullIndex } }), JSON.stringify(built.document)],
          { itemCount: 1, dateStr }
        )
        if (bulkRecords.length >= BULK_RECORD_LIMIT) await flushBulk()
        if (iTask > 0 && iTask % 50 === 0) await Promise.resolve()
      } catch {
        errorCount++
        errorDetails.push(`日期 ${dateStr}：索引失敗`)
        panel.setProgress?.(success + errorCount, total, success, errorCount, startAt)
      }
    }
  }

  await flushBulk(true)
  await Promise.all([...inFlight])
  panel.setText?.('progressStatus', '處理完成')
  panel.setErrors?.(errorDetails)

  const grafanaHint =
    isBatchErrorMixEnabled(dataBase) && !isCustomRange && days > 1
      ? '（錯誤儀表請拉長時間以涵蓋 first_seen_timestamp）'
      : ''
  if (errorCount === 0) {
    form.setStatus?.(`批量完成，成功 ${success}/${total}${grafanaHint}`, 'success')
  } else if (success === 0) {
    form.setStatus?.(`批量失敗，全部失敗 ${errorCount}/${total}`, 'error')
  } else {
    form.setStatus?.(`部分成功：成功 ${success}，失敗 ${errorCount}`, 'warning')
  }
}

export function useBatchInsert() {
  return { runBatchInsert }
}
