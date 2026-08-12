import { describe, expect, it, vi, afterEach } from 'vitest'
import { useDDoSTestRunner } from './useDDoSTestRunner'

describe('useDDoSTestRunner', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('beginTest 重置 stats／logs 並設 isTesting', () => {
    vi.useFakeTimers()
    const runner = useDDoSTestRunner()
    runner.stats.successCount = 9
    runner.addLog('info', 'old')
    runner.beginTest()
    expect(runner.stats.successCount).toBe(0)
    expect(runner.stats.rateLimitCount).toBe(0)
    expect(runner.stats.otherErrorCount).toBe(0)
    expect(runner.logs.value).toHaveLength(0)
    expect(runner.isTesting.value).toBe(true)
    expect(runner.shouldStop.value).toBe(false)
  })

  it('addLog 寫入 type／message', () => {
    vi.useFakeTimers()
    const runner = useDDoSTestRunner()
    runner.addLog('success', 'ok', 'detail')
    expect(runner.logs.value).toHaveLength(1)
    expect(runner.logs.value[0]?.type).toBe('success')
    expect(runner.logs.value[0]?.message).toBe('ok')
    expect(runner.logs.value[0]?.details).toBe('detail')
  })

  it('stopTest／endTest 切換旗標', () => {
    vi.useFakeTimers()
    const runner = useDDoSTestRunner()
    runner.beginTest()
    runner.stopTest()
    expect(runner.shouldStop.value).toBe(true)
    runner.endTest()
    expect(runner.isTesting.value).toBe(false)
    expect(runner.shouldStop.value).toBe(false)
  })

  it('getLogClass 對應 DaisyUI 色系 class', () => {
    const runner = useDDoSTestRunner()
    expect(runner.getLogClass('error')).toBe('text-error')
    expect(runner.getLogClass('info')).toBe('text-info')
  })
})
