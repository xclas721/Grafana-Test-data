import { describe, expect, it } from 'vitest'
import {
  MERCHANT_KINDS,
  MERCHANT_NAME_CORES,
  MERCHANT_NAME_PREFIXES
} from './merchantNameLexicon'

describe('merchantNameLexicon', () => {
  it('詞庫組合數足以湊滿 5000 個不重複店名', () => {
    const combo =
      MERCHANT_NAME_PREFIXES.length * MERCHANT_NAME_CORES.length * MERCHANT_KINDS.length
    expect(combo).toBeGreaterThanOrEqual(5000)
  })
})
