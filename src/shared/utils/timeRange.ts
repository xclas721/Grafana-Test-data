export const TIMEZONE_DISPLAY_NAMES: Record<string, string> = {
  browser: `瀏覽器時區 (${Intl.DateTimeFormat().resolvedOptions().timeZone})`,
  'Asia/Taipei': '台灣 (UTC+8)',
  'Asia/Shanghai': '中國 (UTC+8)',
  'Asia/Tokyo': '日本 (UTC+9)',
  'Asia/Seoul': '韓國 (UTC+9)',
  'Asia/Singapore': '新加坡 (UTC+8)',
  'Asia/Hong_Kong': '香港 (UTC+8)',
  'America/New_York': '美國東部 (UTC-5/-4)',
  'America/Los_Angeles': '美國西部 (UTC-8/-7)',
  'Europe/London': '英國 (UTC+0/+1)',
  'Europe/Paris': '法國 (UTC+1/+2)',
  'Australia/Sydney': '澳洲東部 (UTC+10/+11)',
  UTC: 'UTC (UTC+0)'
}

export function convertToUTC(date: Date, timezone: string): Date {
  if (timezone === 'browser' || timezone === 'UTC') return date
  try {
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes()
    ).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
    const test = new Date(iso + 'Z')
    const fmt = new Intl.DateTimeFormat('en', { timeZone: timezone, timeZoneName: 'longOffset' })
    const parts = fmt.formatToParts(test)
    const off = parts.find((p) => p.type === 'timeZoneName')?.value || ''
    const m = off.match(/GMT([+-])(\d{2}):(\d{2})/)
    if (m) {
      const sign = m[1] === '+' ? 1 : -1
      const hh = parseInt(m[2] as string)
      const mm = parseInt(m[3] as string)
      const minutes = sign * (hh * 60 + mm)
      return new Date(date.getTime() - minutes * 60000)
    }
  } catch {
    // fall through
  }
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000)
}

export function formatZonedDateTime(date: Date, timezone: string): string {
  const zone = timezone === 'browser' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const parts = formatter.formatToParts(date)
  const lookup: Record<string, string> = {}
  for (const part of parts) {
    lookup[part.type] = part.value
  }
  return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}`
}

export function parseDateTimeLocal(value: string): Date | null {
  if (!value) return null
  const [datePart, timePartRaw] = value.trim().split('T')
  if (!datePart || !timePartRaw) return null
  const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10))
  const [hh, mm, ss] = timePartRaw.split(':').map((v) => parseInt(v, 10))
  if (!y || !m || !d) return null
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0)
}

export function getCustomRangeUtc(
  startDateTime: string,
  endDateTime: string,
  timezone: string
): { startUtcMs: number; endUtcMs: number; clampedEndUtcMs: number; clamped: boolean } | null {
  const startLocal = parseDateTimeLocal(startDateTime)
  const endLocal = parseDateTimeLocal(endDateTime)
  if (!startLocal || !endLocal) return null
  let startUtcMs = convertToUTC(startLocal, timezone).getTime()
  let endUtcMs = convertToUTC(endLocal, timezone).getTime()
  if (endUtcMs < startUtcMs) {
    const temp = startUtcMs
    startUtcMs = endUtcMs
    endUtcMs = temp
  }
  const nowUtc = Date.now()
  const clampedEndUtcMs = Math.min(endUtcMs, nowUtc)
  if (startUtcMs > clampedEndUtcMs) startUtcMs = clampedEndUtcMs
  return { startUtcMs, endUtcMs, clampedEndUtcMs, clamped: clampedEndUtcMs !== endUtcMs }
}

export function getCustomRangeUtcFromForm(form: Record<string, string>) {
  if (form.enableCustomTimeRange !== 'on') return null
  const tz = form.timezone || 'browser'
  return getCustomRangeUtc(form.startDateTime || '', form.endDateTime || '', tz)
}

export function computeAutoTimeRangeFromNow(
  now: Date,
  timezone: string,
  batchDays: number
): { startDateTime: string; endDateTime: string } {
  const endDateTime = formatZonedDateTime(now, timezone)
  const start = new Date(now.getTime() - batchDays * 24 * 60 * 60 * 1000)
  const startDateTime = formatZonedDateTime(start, timezone)
  return { startDateTime, endDateTime }
}

export type TimeRangeDisplayInput = {
  currentDate: string
  timezone: string
  batchDays: number
  useCustomRange: boolean
  startDateTime: string
  endDateTime: string
  now?: Date
}

export function buildTimeRangeDisplayHtml(input: TimeRangeDisplayInput): string {
  const {
    currentDate,
    timezone,
    batchDays,
    useCustomRange,
    startDateTime,
    endDateTime,
    now = new Date()
  } = input

  if (!currentDate && !useCustomRange) {
    return '請選擇日期'
  }

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`

  const customRange = useCustomRange
    ? getCustomRangeUtc(startDateTime, endDateTime, timezone)
    : null
  const tzName = TIMEZONE_DISPLAY_NAMES[timezone] || timezone

  if (useCustomRange) {
    if (!customRange) {
      return `<div style="font-size: 0.9em;">
        <div><strong>選擇時區：</strong>${tzName}</div>
        <div style="color:#666;margin-top:5px;">請選擇起訖時間</div>
      </div>`
    }
    const utcStart = new Date(customRange.startUtcMs).toISOString()
    const utcEnd = new Date(customRange.clampedEndUtcMs).toISOString()
    const note = customRange.clamped
      ? '<small>注意：結束時間超過現在，已限制到目前時間</small>'
      : '<small>自訂時間區間</small>'
    return `<div style="font-size: 0.9em;">
      <div><strong>選擇時區：</strong>${tzName}</div>
      <div><strong>UTC 時間範圍：</strong>${utcStart} ~ ${utcEnd}</div>
      <div style="color:#666;margin-top:5px;">${note}</div>
    </div>`
  }

  if (batchDays === 0) {
    const utcNow = convertToUTC(now, timezone).toISOString()
    return `<div style="font-size: 0.9em;">
      <div><strong>選擇時區：</strong>${tzName}</div>
      <div><strong>UTC 時間範圍：</strong>${utcNow} ~ ${utcNow}</div>
      <div style="color:#666;margin-top:5px;"><small>僅使用現在時間</small></div>
    </div>`
  }

  if (batchDays === 1) {
    const startLocal = new Date(`${currentDate}T00:00:00`)
    const endLocal =
      currentDate === today
        ? new Date(
            `${currentDate}T${String(now.getHours()).padStart(2, '0')}:${String(
              now.getMinutes()
            ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
          )
        : new Date(`${currentDate}T23:59:59`)
    const utcStart = convertToUTC(startLocal, timezone).toISOString()
    const utcEnd = convertToUTC(endLocal, timezone).toISOString()
    const note =
      currentDate === today
        ? '<small>注意：時間範圍限制在當前時間之前</small>'
        : '<small>注意：可以生成全天24小時的任意時間</small>'
    return `<div style="font-size: 0.9em;">
      <div><strong>選擇時區：</strong>${tzName}</div>
      <div><strong>UTC 時間範圍：</strong>${utcStart} ~ ${utcEnd}</div>
      <div style="color:#666;margin-top:5px;">${note}</div>
    </div>`
  }

  const startLocal = new Date(`${currentDate}T00:00:00`)
  const utcStart = convertToUTC(startLocal, timezone).toISOString()
  const endDate = new Date(startLocal)
  endDate.setDate(startLocal.getDate() - (batchDays - 1))
  const endOfEnd = new Date(
    `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(
      endDate.getDate()
    ).padStart(2, '0')}T23:59:59`
  )
  const multiEndUTC = convertToUTC(endOfEnd, timezone).toISOString()
  const dateRangeText = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ~ ${currentDate}`
  const note =
    currentDate === today
      ? '<small>注意：第1天限制在當前時間之前，其他天為全天24小時</small>'
      : '<small>注意：所有天都可以生成全天24小時的任意時間</small>'
  return `<div style="font-size: 0.9em;">
    <div><strong>選擇時區：</strong>${tzName}</div>
    <div><strong>生成天數：</strong>${batchDays} 天 (${dateRangeText})</div>
    <div><strong>UTC 時間範圍：</strong>${utcStart} ~ ${multiEndUTC}</div>
    <div style="color:#666;margin-top:5px;">${note}</div>
  </div>`
}

export function generateSharedTimestamp(
  form: Record<string, string>,
  random: () => number = Math.random
): string {
  const useCustomRange = form.enableCustomTimeRange === 'on'
  if (useCustomRange) {
    const range = getCustomRangeUtcFromForm(form)
    if (range) {
      const span = Math.max(0, range.endUtcMs - range.startUtcMs)
      const pick = range.startUtcMs + random() * (span || 1)
      return new Date(pick).toISOString()
    }
  }
  const currentDate = form.currentDate
  const tz = form.timezone || 'browser'
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
  let hh: number, mm: number, ss: number
  if (currentDate === today) {
    hh = Math.floor(random() * (now.getHours() + 1))
    mm =
      hh === now.getHours()
        ? Math.floor(random() * (now.getMinutes() + 1))
        : Math.floor(random() * 60)
    ss =
      hh === now.getHours() && mm === now.getMinutes()
        ? Math.floor(random() * (now.getSeconds() + 1))
        : Math.floor(random() * 60)
  } else {
    hh = Math.floor(random() * 24)
    mm = Math.floor(random() * 60)
    ss = Math.floor(random() * 60)
  }
  const local = new Date(
    `${currentDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  )
  return convertToUTC(local, tz).toISOString()
}
