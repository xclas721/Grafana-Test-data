import { describe, expect, it } from 'vitest'
import {
  MERCHANT_MCC_BASE,
  MERCHANT_MCC_OPTIONS,
  MERCHANT_POOL_SIZE,
  buildMerchantPool
} from './merchantPool'

describe('merchantPool', () => {
  it('隨機池 5000 筆且名稱不重複', () => {
    expect(MERCHANT_POOL_SIZE).toBe(5000)
    expect(MERCHANT_MCC_OPTIONS).toHaveLength(5000)
    expect(new Set(MERCHANT_MCC_OPTIONS.map((m) => m.name)).size).toBe(5000)
  })

  it('前 22 筆是品牌種子', () => {
    expect(MERCHANT_MCC_OPTIONS.slice(0, MERCHANT_MCC_BASE.length)).toEqual([...MERCHANT_MCC_BASE])
  })

  it('buildMerchantPool 可指定大小', () => {
    const pool = buildMerchantPool(3, MERCHANT_MCC_BASE)
    expect(pool).toHaveLength(3)
    expect(pool[0]?.name).toBe('HiTRUST EMV Demo Merchant')
  })
})
