import { describe, expect, it } from 'vitest'
import { DEFAULT_REQUESTOR_ID, REQUESTOR_ID_OPTIONS } from './requestorIds'

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
})
