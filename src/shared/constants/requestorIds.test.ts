import { describe, expect, it } from 'vitest'
import {
  DEFAULT_REQUESTOR_ID,
  REQUESTOR_ID_OPTIONS,
  REQUESTOR_MERCHANT_WEIGHTS,
  REQUESTOR_WEIGHT_TOTAL,
  pickWeightedIndex
} from './requestorIds'

describe('requestorIds', () => {
  it('固定 15 個 requestor，預設用第一筆', () => {
    expect(REQUESTOR_ID_OPTIONS).toHaveLength(15)
    expect(DEFAULT_REQUESTOR_ID).toBe('12128301823081230123')
    expect([...REQUESTOR_ID_OPTIONS]).toEqual([
      '12128301823081230123',
      '123123',
      '456456',
      '789789',
      '987987',
      '000000',
      '111111',
      '222222',
      '333333',
      '444444',
      '555555',
      '666666',
      '777777',
      '888888',
      '999999'
    ])
  })

  it('權重 3000／250×4／100×10，總和 5000', () => {
    expect(REQUESTOR_MERCHANT_WEIGHTS).toHaveLength(REQUESTOR_ID_OPTIONS.length)
    expect([...REQUESTOR_MERCHANT_WEIGHTS]).toEqual([
      3000, 250, 250, 250, 250, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100
    ])
    expect(REQUESTOR_WEIGHT_TOTAL).toBe(5000)
  })

  it('pickWeightedIndex 依權重落桶', () => {
    expect(pickWeightedIndex(REQUESTOR_MERCHANT_WEIGHTS, () => 0)).toBe(0)
    expect(pickWeightedIndex(REQUESTOR_MERCHANT_WEIGHTS, () => 0.5)).toBe(1)
  })
})
