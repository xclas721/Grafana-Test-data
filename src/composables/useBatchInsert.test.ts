import { describe, expect, it, vi } from 'vitest'
import {
  analyzeBulkItems,
  computeDailyCounts,
  formatCalendarDate,
  resolveCardPool,
  runBatchInsert,
  shouldRefreshCustomTimeRange
} from './useBatchInsert'

describe('useBatchInsert helpers', () => {
  it('computeDailyCounts 加總等於 total', () => {
    const counts = computeDailyCounts(10, 3, () => 0.5)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(10)
    expect(counts).toHaveLength(3)
  })

  it('computeDailyCounts days=0 時仍至少 1 天', () => {
    const counts = computeDailyCounts(5, 0, () => 0.5)
    expect(counts).toEqual([5])
  })

  it('shouldRefreshCustomTimeRange 在 days=0 或自動自訂區間時為 true', () => {
    expect(shouldRefreshCustomTimeRange(0, undefined)).toBe(true)
    expect(
      shouldRefreshCustomTimeRange(1, {
        enableCustomTimeRange: 'on',
        enableAutoTimeRange: 'on'
      })
    ).toBe(true)
    expect(
      shouldRefreshCustomTimeRange(1, {
        enableCustomTimeRange: 'off',
        enableAutoTimeRange: 'on'
      })
    ).toBe(false)
  })

  it('analyzeBulkItems 統計成功與失敗', () => {
    const result = analyzeBulkItems(
      [{ index: {} }, { index: { error: { reason: 'mapper failed' } } }],
      [
        { itemCount: 1, dateStr: '2020-01-01' },
        { itemCount: 1, dateStr: '2020-01-02' }
      ]
    )
    expect(result.successRecords).toBe(1)
    expect(result.errorRecords).toBe(1)
    expect(result.errorReasons[0]).toContain('mapper failed')
  })

  it('formatCalendarDate 輸出 YYYY-MM-DD', () => {
    expect(formatCalendarDate(new Date(2020, 0, 15))).toBe('2020-01-15')
  })

  it('resolveCardPool 在倍率 <=1 或未啟用隨機時回傳 null', () => {
    expect(resolveCardPool({ enableAcctNumberRandom: 'off', cardPoolRatio: '10' }, 20)).toBeNull()
    expect(
      resolveCardPool({ enableAcctNumberRandom: 'on', cardPoolRatio: '1', cardScheme: 'V' }, 20)
    ).toBeNull()
  })

  it('resolveCardPool 啟用時建立固定大小卡池', () => {
    const info = resolveCardPool(
      {
        enableAcctNumberRandom: 'on',
        cardPoolRatio: '10',
        cardScheme: 'V',
        enableCardSchemeRandom: 'off'
      },
      25,
      () => 0
    )
    expect(info).not.toBeNull()
    expect(info!.poolSize).toBe(3)
    expect(info!.pool).toHaveLength(3)
    expect(info!.pool[0]?.scheme).toBe('V')
  })
})

describe('runBatchInsert', () => {
  it('表單資料為空時提早結束', async () => {
    const setStatus = vi.fn()
    await runBatchInsert({
      mode: 'acs',
      batchCount: 2,
      batchDays: 0,
      form: { getFormData: () => undefined, setStatus },
      panel: {}
    })
    expect(setStatus).toHaveBeenCalledWith('表單資料為空', 'error')
  })

  it('自訂區間缺少起訖時提早結束', async () => {
    const setStatus = vi.fn()
    await runBatchInsert({
      mode: 'acs',
      batchCount: 2,
      batchDays: 0,
      form: {
        getFormData: () => ({
          enableCustomTimeRange: 'on',
          startDateTime: '',
          endDateTime: '',
          baseUrl: 'http://localhost:9200',
          username: 'u',
          password: 'p'
        }),
        setStatus
      },
      panel: { show: vi.fn(), addLog: vi.fn() }
    })
    expect(setStatus).toHaveBeenCalledWith('請先設定自訂時間區間的起訖時間', 'error')
  })

  it('成功批量插入並回報狀態', async () => {
    const setStatus = vi.fn()
    const show = vi.fn()
    const fetchBulk = vi.fn(async () => ({
      ok: true,
      json: async () => ({ errors: false })
    })) as unknown as typeof import('@/shared/utils/elasticsearchBulk').fetchElasticsearchBulk

    let generated = 0
    await runBatchInsert({
      mode: 'acs',
      batchCount: 2,
      batchDays: 0,
      random: () => 0,
      fetchBulk,
      form: {
        getFormData: () => ({
          baseUrl: 'http://localhost:9200',
          username: 'elastic',
          password: '123456',
          currentDate: '2020-01-15',
          enableCustomTimeRange: 'off',
          enableBatchErrorMix: 'off'
        }),
        getFormDataForBatchInsert: () => ({
          baseUrl: 'http://localhost:9200',
          username: 'elastic',
          password: '123456',
          currentDate: '2020-01-15',
          enableCustomTimeRange: 'off',
          enableBatchErrorMix: 'off'
        }),
        generateRandom: () => {
          generated += 1
        },
        generateSharedTimestamp: () => '2020-01-15T08:00:00.000Z',
        buildDocument: () => ({
          document: { acsTransID: 'x' },
          utcDateStr: '2020-01-15'
        }),
        setStatus
      },
      panel: { show, addLog: vi.fn(), setProgress: vi.fn(), setText: vi.fn(), setErrors: vi.fn() }
    })

    expect(generated).toBe(2)
    expect(fetchBulk).toHaveBeenCalledTimes(1)
    expect(setStatus).toHaveBeenCalledWith('批量完成，成功 2/2', 'success')
  })
})
