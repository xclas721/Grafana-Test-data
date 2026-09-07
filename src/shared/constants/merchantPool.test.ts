import { describe, expect, it } from 'vitest'
import { REQUESTOR_ID_OPTIONS, REQUESTOR_MERCHANT_WEIGHTS } from './requestorIds'
import {
  MERCHANT_MCC_BASE,
  MERCHANT_MCC_OPTIONS,
  MERCHANT_POOL_SIZE,
  REQUESTOR_MERCHANT_POOL_MAP,
  buildMerchantPool,
  pickZipfIndex
} from './merchantPool'

describe('merchantPool', () => {
  it('隨機池 5000 筆且名稱不重複，沒有編號變體', () => {
    expect(MERCHANT_POOL_SIZE).toBe(5000)
    expect(MERCHANT_MCC_OPTIONS).toHaveLength(5000)
    expect(new Set(MERCHANT_MCC_OPTIONS.map((m) => m.name)).size).toBe(5000)
    expect(MERCHANT_MCC_OPTIONS.some((m) => /#\d{4}$/.test(m.name))).toBe(false)
  })

  it('前 22 筆是品牌種子', () => {
    expect(MERCHANT_MCC_OPTIONS.slice(0, MERCHANT_MCC_BASE.length)).toEqual([...MERCHANT_MCC_BASE])
  })

  it('品牌 MCC 對齊常見卡組分類', () => {
    const byName = Object.fromEntries(MERCHANT_MCC_BASE.map((m) => [m.name, m.mcc]))
    expect(byName["McDonald's"]).toBe('5814')
    expect(byName.Starbucks).toBe('5814')
    expect(byName['Pizza Hut']).toBe('5814')
    expect(byName["Domino's Pizza"]).toBe('5814')
    expect(byName['Amazon Marketplace']).toBe('5399')
    expect(byName['Nike Retail Store']).toBe('5941')
    expect(byName['Adidas Retail Store']).toBe('5941')
    expect(byName['HiTRUST EMV Demo Merchant']).toBe('5999')
  })

  it('Zipf 抽樣偏向池子前面的店', () => {
    expect(pickZipfIndex(3000, () => 0)).toBe(0)
    expect(pickZipfIndex(3000, () => 0.99)).toBeGreaterThan(0)
  })

  it('buildMerchantPool 可指定大小', () => {
    const pool = buildMerchantPool(3, MERCHANT_MCC_BASE)
    expect(pool).toHaveLength(3)
    expect(pool[0]?.name).toBe('HiTRUST EMV Demo Merchant')
  })

  it('requestor 商店池為 3000／250×4／100×10，主池與 250 池會重複', () => {
    const primaryId = REQUESTOR_ID_OPTIONS[0]
    const midId = REQUESTOR_ID_OPTIONS[1]
    const smallId = REQUESTOR_ID_OPTIONS[5]
    expect(primaryId && REQUESTOR_MERCHANT_POOL_MAP[primaryId]?.length).toBe(3000)
    expect(midId && REQUESTOR_MERCHANT_POOL_MAP[midId]?.length).toBe(250)
    expect(smallId && REQUESTOR_MERCHANT_POOL_MAP[smallId]?.length).toBe(100)
    expect(
      REQUESTOR_ID_OPTIONS.every(
        (id, i) => REQUESTOR_MERCHANT_POOL_MAP[id]?.length === REQUESTOR_MERCHANT_WEIGHTS[i]
      )
    ).toBe(true)

    const primaryNames = new Set(
      (REQUESTOR_MERCHANT_POOL_MAP[primaryId ?? ''] ?? []).map((m) => m.name)
    )
    const midNames = (REQUESTOR_MERCHANT_POOL_MAP[midId ?? ''] ?? []).map((m) => m.name)
    expect(midNames.every((name) => primaryNames.has(name))).toBe(true)

    const smallNames = (REQUESTOR_MERCHANT_POOL_MAP[smallId ?? ''] ?? []).map((m) => m.name)
    expect(smallNames.some((name) => primaryNames.has(name))).toBe(false)
  })
})
