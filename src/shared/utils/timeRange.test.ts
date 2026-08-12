import { describe, expect, it } from 'vitest'
import {
  buildTimeRangeDisplayHtml,
  computeAutoTimeRangeFromNow,
  convertToUTC,
  formatZonedDateTime,
  generateSharedTimestamp,
  getCustomRangeUtc,
  getCustomRangeUtcFromForm,
  parseDateTimeLocal
} from './timeRange'

describe('timeRange', () => {
  it('parseDateTimeLocal 會解析有效 datetime-local 字串', () => {
    const parsed = parseDateTimeLocal('2026-08-12T14:30:45')
    expect(parsed).not.toBeNull()
    expect(parsed!.getFullYear()).toBe(2026)
    expect(parsed!.getMonth()).toBe(7)
    expect(parsed!.getDate()).toBe(12)
    expect(parsed!.getHours()).toBe(14)
    expect(parsed!.getMinutes()).toBe(30)
    expect(parsed!.getSeconds()).toBe(45)
  })

  it('parseDateTimeLocal 對空字串回傳 null', () => {
    expect(parseDateTimeLocal('')).toBeNull()
    expect(parseDateTimeLocal('2026-08-12')).toBeNull()
  })

  it('convertToUTC 在 browser／UTC 時區回傳相同 Date', () => {
    const date = new Date(2026, 7, 12, 10, 0, 0)
    expect(convertToUTC(date, 'browser').getTime()).toBe(date.getTime())
    expect(convertToUTC(date, 'UTC').getTime()).toBe(date.getTime())
  })

  it('getCustomRangeUtc 會交換顛倒的起訖時間', () => {
    const range = getCustomRangeUtc(
      '2026-08-12T10:00:00',
      '2026-08-12T08:00:00',
      'browser'
    )
    expect(range).not.toBeNull()
    expect(range!.startUtcMs).toBeLessThanOrEqual(range!.clampedEndUtcMs)
  })

  it('getCustomRangeUtcFromForm 在非自訂模式回傳 null', () => {
    expect(
      getCustomRangeUtcFromForm({
        enableCustomTimeRange: 'off',
        startDateTime: '2026-08-12T00:00:00',
        endDateTime: '2026-08-12T23:59:59',
        timezone: 'UTC'
      })
    ).toBeNull()
  })

  it('buildTimeRangeDisplayHtml 無日期且非自訂時回傳提示', () => {
    expect(
      buildTimeRangeDisplayHtml({
        currentDate: '',
        timezone: 'UTC',
        batchDays: 0,
        useCustomRange: false,
        startDateTime: '',
        endDateTime: ''
      })
    ).toBe('請選擇日期')
  })

  it('buildTimeRangeDisplayHtml 自訂區間缺少起訖時提示選擇', () => {
    const html = buildTimeRangeDisplayHtml({
      currentDate: '2026-08-12',
      timezone: 'UTC',
      batchDays: 0,
      useCustomRange: true,
      startDateTime: '',
      endDateTime: ''
    })
    expect(html).toContain('請選擇起訖時間')
  })

  it('computeAutoTimeRangeFromNow 結束時間晚於開始時間', () => {
    const now = new Date('2026-08-12T12:00:00')
    const { startDateTime, endDateTime } = computeAutoTimeRangeFromNow(now, 'UTC', 3)
    expect(startDateTime).toMatch(/^2026-08-09T/)
    expect(endDateTime).toMatch(/^2026-08-12T/)
    expect(startDateTime < endDateTime).toBe(true)
  })

  it('formatZonedDateTime 輸出 datetime-local 格式', () => {
    const formatted = formatZonedDateTime(new Date('2026-08-12T08:05:06Z'), 'UTC')
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
  })

  it('generateSharedTimestamp 自訂區間依 random 比例取時間', () => {
    const form = {
      enableCustomTimeRange: 'on',
      startDateTime: '2026-08-12T00:00:00',
      endDateTime: '2026-08-12T02:00:00',
      timezone: 'UTC',
      currentDate: '2026-08-12'
    }
    const range = getCustomRangeUtc(form.startDateTime, form.endDateTime, form.timezone)!
    const expected = new Date(
      range.startUtcMs + 0.5 * (range.endUtcMs - range.startUtcMs)
    ).toISOString()
    expect(generateSharedTimestamp(form, () => 0.5)).toBe(expected)
  })
})
