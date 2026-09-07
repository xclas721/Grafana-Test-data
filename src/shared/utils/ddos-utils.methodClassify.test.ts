import { describe, expect, it } from 'vitest'
import { classifyThreeDSMethodResponse } from './ddos-utils'

describe('classifyThreeDSMethodResponse', () => {
  it('collect 頁（含指紋）算 PASS', () => {
    expect(
      classifyThreeDSMethodResponse(200, '<script src="/js/fingerprint2.min.js"></script>')
    ).toEqual({ outcome: 'pass', reason: 'collect page' })
  })

  it('限流 END 快取的 response 頁算 BLOCKED', () => {
    const html =
      '<form id="form1"><input name="threeDSMethodData" value="x" /></form><script>$("#form1").attr("action"</script>'
    expect(classifyThreeDSMethodResponse(200, html)).toEqual({
      outcome: 'blocked',
      reason: 'cached/response page'
    })
  })

  it('DDoS／Invalid ACS 錯誤頁算 BLOCKED', () => {
    expect(classifyThreeDSMethodResponse(200, 'Invalid ACS Transaction ID!')).toEqual({
      outcome: 'blocked',
      reason: 'error page'
    })
  })
})
