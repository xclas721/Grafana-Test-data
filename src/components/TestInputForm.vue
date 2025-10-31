<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'

const props = defineProps<{ activeMode?: 'unified' | 'acs' | 'dss' }>()

const modeText = computed(() => {
  if (props.activeMode === 'acs') return 'ACS'
  if (props.activeMode === 'dss') return '3DSS'
  return '統一'
})

const modeClass = computed(() => {
  if (props.activeMode === 'acs') return 'mode-indicator acs'
  if (props.activeMode === 'dss') return 'mode-indicator dss'
  return 'mode-indicator unified'
})

function setText(id: string, text: string) {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}

function setClassName(id: string, className: string) {
  const el = document.getElementById(id)
  if (el) el.className = className
}

function updateModeIndicator() {
  setText('modeIndicator', modeText.value)
  setClassName('modeIndicator', modeClass.value)
}

function updateCardInfoFromAcctNumber() {
  const acct = (document.getElementById('acctNumber') as HTMLInputElement | null)?.value || ''
  const setVal = (id: string, val: string) => {
    const el = document.getElementById(id) as HTMLInputElement | null
    if (el) el.value = val
  }
  if (acct.length >= 6) setVal('cardbin6', acct.substring(0, 6))
  if (acct.length >= 8) setVal('cardbin8', acct.substring(0, 8))
  if (acct.length >= 10) {
    const first6 = acct.substring(0, 6)
    const last4 = acct.substring(acct.length - 4)
    setVal('acctNumberMask', first6 + '******' + last4)
    // 優先採用 WebCrypto HMAC-SHA256 + Base64，失敗再退回簡化
    calculateAcctNumberHashed(acct)
  }
}
async function calculateAcctNumberHashed(acctNumber: string) {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode('default_hmac_key')
    const messageData = encoder.encode(acctNumber)
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, messageData)
    const hashArray = new Uint8Array(signature)
    let binary = ''
    for (let i = 0; i < hashArray.length; i++) binary += String.fromCharCode(Number(hashArray[i]))
    const hashBase64 = btoa(binary)
    const el = document.getElementById('acctNumberHashed') as HTMLInputElement | null
    if (el) el.value = hashBase64
  } catch {
    // 簡化版雜湊：Base64(簡單hash+前8)
    let hash = 0
    for (let i = 0; i < acctNumber.length; i++) {
      hash = (hash << 5) - hash + acctNumber.charCodeAt(i)
      hash |= 0
    }
    const hashStr = Math.abs(hash).toString(16).padStart(8, '0')
    const el = document.getElementById('acctNumberHashed') as HTMLInputElement | null
    if (el) el.value = btoa(hashStr + acctNumber.substring(0, 8))
  }
}

function wireStatusLinks() {
  const ares = document.getElementById('aresTransStatus') as HTMLSelectElement | null
  const rreq = document.getElementById('rreqTransStatus') as HTMLSelectElement | null
  const trans = document.getElementById('transStatus') as HTMLInputElement | null
  const reason = document.getElementById('transStatusReason') as HTMLSelectElement | null
  const stateMachineReason = document.getElementById(
    'stateMachineReason'
  ) as HTMLSelectElement | null
  const challengeCancel = document.getElementById('challengeCancel') as HTMLSelectElement | null
  if (!ares || !rreq || !trans || !reason || !stateMachineReason || !challengeCancel) return

  const updateChallengeCancel = () => {
    if (ares.value === 'C' && rreq.value === 'N') {
      challengeCancel.disabled = false
      if (challengeCancel.value === 'NULL_VALUE') challengeCancel.value = '01'
    } else {
      challengeCancel.disabled = true
      challengeCancel.value = 'NULL_VALUE'
    }
  }

  ares.addEventListener('change', () => {
    const val = ares.value
    if (val === 'C' || val === 'D') {
      rreq.disabled = false
      if (rreq.value === 'NULL_VALUE') rreq.value = 'Y'
      trans.value = rreq.value
    } else {
      rreq.disabled = true
      rreq.value = 'NULL_VALUE'
      trans.value = val
    }
    if (val === 'R') {
      reason.disabled = false
      if (reason.value === 'NULL_VALUE') reason.value = '01'
      stateMachineReason.disabled = false
      if (stateMachineReason.value === 'NULL_VALUE') stateMachineReason.value = '1001'
    } else {
      reason.disabled = true
      reason.value = 'NULL_VALUE'
      stateMachineReason.disabled = true
      stateMachineReason.value = 'NULL_VALUE'
    }
    updateChallengeCancel()
  })
  rreq.addEventListener('change', () => {
    const val = ares.value
    if (val === 'C' || val === 'D') {
      trans.value = rreq.value
    }
    updateChallengeCancel()
  })
  // 初始化時也更新 challengeCancel 狀態
  updateChallengeCancel()
}

function updateTimeRangeDisplay() {
  const currentDate = (document.getElementById('currentDate') as HTMLInputElement | null)?.value
  const timezone = ((document.getElementById('timezone') as HTMLSelectElement | null)?.value ??
    'browser') as string
  const batchDays = parseInt(
    ((document.getElementById('batchDays') as HTMLInputElement | null)?.value ?? '1') as string
  )
  const textEl = document.getElementById('timeRangeText')
  if (!currentDate || !textEl) return
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
  function toUTC(date: Date): Date {
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
    } catch {}
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000)
  }
  const startLocal = new Date(`${currentDate}T00:00:00`)
  const endLocal =
    currentDate === today
      ? new Date(
          `${currentDate}T${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
        )
      : new Date(`${currentDate}T23:59:59`)
  const utcStart = toUTC(startLocal).toISOString()
  const utcEnd = toUTC(endLocal).toISOString()
  const timezoneNames: Record<string, string> = {
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
  const tzName = timezoneNames[timezone] || timezone
  if (batchDays === 1) {
    const note =
      currentDate === today
        ? '<small>注意：時間範圍限制在當前時間之前</small>'
        : '<small>注意：可以生成全天24小時的任意時間</small>'
    textEl.innerHTML = `<div style="font-size: 0.9em;">
      <div><strong>選擇時區：</strong>${tzName}</div>
      <div><strong>UTC 時間範圍：</strong>${utcStart} ~ ${utcEnd}</div>
      <div style="color:#666;margin-top:5px;">${note}</div>
    </div>`
  } else {
    const endDate = new Date(startLocal)
    endDate.setDate(startLocal.getDate() - (batchDays - 1))
    const endOfEnd = new Date(
      `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(
        endDate.getDate()
      ).padStart(2, '0')}T23:59:59`
    )
    const multiEndUTC = toUTC(endOfEnd).toISOString()
    const dateRangeText = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ~ ${currentDate}`
    const note =
      currentDate === today
        ? '<small>注意：第1天限制在當前時間之前，其他天為全天24小時</small>'
        : '<small>注意：所有天都可以生成全天24小時的任意時間</small>'
    textEl.innerHTML = `<div style="font-size: 0.9em;">
      <div><strong>選擇時區：</strong>${tzName}</div>
      <div><strong>生成天數：</strong>${batchDays} 天 (${dateRangeText})</div>
      <div><strong>UTC 時間範圍：</strong>${utcStart} ~ ${multiEndUTC}</div>
      <div style="color:#666;margin-top:5px;">${note}</div>
    </div>`
  }
}

function loadDefaults() {
  const set = (id: string, val: string) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null
    if (!el) return
    if ('value' in el) el.value = val
  }
  set('baseUrl', 'http://localhost:9200')
  set('username', 'elastic')
  set('password', '123456')
  set('issuerOid', 'ed8544c4-fc50-289d-ee05-ee41c86bb6f5')
  set('acsTransId', cryptoRandomUUID())
  set('threeDSServerTransId', cryptoRandomUUID().toLowerCase())
  set('aresTransStatus', 'N')
  set('transStatus', 'N')
  set('rreqTransStatus', 'NULL_VALUE')
  set('transStatusReason', 'NULL_VALUE')
  set('stateMachineReason', 'NULL_VALUE')
  set('merchantName', 'HiTRUST EMV Demo Merchant')
  set('merchantCountryCode', '156')
  set('acquirerMerchantId', '8909191')
  set('acquirerBin', '1231234')
  set('mcc', '5661')
  set('purchaseAmount', '100')
  set('purchaseCurrency', '156')
  set('purchaseExponent', '2')
  set('usdAmount', '0.13841979956813022')
  set('exchangeRate', '7.2244')
  set('exchangeBase', 'USD')
  set('exchangeTarget', 'CNY')
  set('currencyCodeForRate', 'CNY')
  set('cardScheme', 'V')
  set('acctNumber', '4143520000000123')
  updateCardInfoFromAcctNumber()
  set('messageCategory', '01')
  set('deviceChannel', '02')
  set('authenticationMethod', '02')
  set('authenticationType', '02')
  set('deviceIpAddress', '::1')
  set('devicePlatform', 'MacIntel')
  set('deviceLocale', 'zh-TW')
  set('deviceAdvertisingId', '4d4427f20375a66287430edd54bd82d2')
  set('threeDSCompInd', 'Y')
  set('merchantCountryCodeStr', '156')
  set('performancePath', '/acs-auth/auth/V/2.2.0/ed8544c4-fc50-289d-ee05-ee41c86bb6f5/001/areq')
  set('execTime', '5437')
  set('creqExecTime', '500')
  set('rreqExecTime', '400')
  set('rbaExecTime', '100')
  set('cavvExecTime', '20')
  set('otpExecTime', '50')
  set('errorComponent', 'NULL_VALUE')
  set('errorDescription', 'NULL_VALUE')
  set('errorCode', 'NULL_VALUE')
  set('errorDetail', 'NULL_VALUE')
  set('errorMessageType', 'NULL_VALUE')
  set('challengeCancel', 'NULL_VALUE')
  set('browserIP', '::1')
  set('countryAlpha2', 'CN')
  set('countryNumeric', '156')
  set('countryAlpha3', 'CHN')
  set('countryName', 'China')
  set('currencyMinorUnit', '2')
  set('currencyName', 'Yuan Renminbi')
  set('currencyAlphabeticCode', 'CNY')
  set('currencyNumericCode', '156')
  setStatus('預設值已載入 (Vue 移植版)', 'success')
}

function generateRandom() {
  const set = (id: string, val: string) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null
    if (el) el.value = val
  }
  set('acsTransId', cryptoRandomUUID())
  set('threeDSServerTransId', cryptoRandomUUID().toLowerCase())
  // 金額
  const enableAmt = (
    document.getElementById('enablePurchaseAmountRandom') as HTMLInputElement | null
  )?.checked
  if (enableAmt) set('purchaseAmount', (Math.random() * 990 + 10).toFixed(2))
  // 執行時間
  const enableExec = (document.getElementById('enableExecTimeRandom') as HTMLInputElement | null)
    ?.checked
  if (enableExec) set('execTime', String(Math.floor(Math.random() * 5000 + 1000)))
  const enableCreqExec = (
    document.getElementById('enableCreqExecTimeRandom') as HTMLInputElement | null
  )?.checked
  if (enableCreqExec) set('creqExecTime', String(Math.floor(Math.random() * 500 + 300)))
  const enableRreqExec = (
    document.getElementById('enableRreqExecTimeRandom') as HTMLInputElement | null
  )?.checked
  if (enableRreqExec) set('rreqExecTime', String(Math.floor(Math.random() * 400 + 200)))
  const enableRbaExec = (
    document.getElementById('enableRbaExecTimeRandom') as HTMLInputElement | null
  )?.checked
  if (enableRbaExec) set('rbaExecTime', String(Math.floor(Math.random() * 150 + 50)))
  const enableCavvExec = (
    document.getElementById('enableCavvExecTimeRandom') as HTMLInputElement | null
  )?.checked
  if (enableCavvExec) set('cavvExecTime', String(Math.floor(Math.random() * 21 + 10)))
  const enableOtpExec = (
    document.getElementById('enableOtpExecTimeRandom') as HTMLInputElement | null
  )?.checked
  if (enableOtpExec) set('otpExecTime', String(Math.floor(Math.random() * 61 + 20)))
  // 狀態（依照 Grafana-Test-Input.html 的權重分佈）
  const r = Math.random()
  let st: string
  if (r < 0.4)
    st = 'Y' // 40%
  else if (r < 0.45)
    st = 'N' // 5%
  else if (r < 0.5)
    st = 'R' // 5%
  else if (r < 0.75)
    st = 'C' // 25%
  else if (r < 0.8)
    st = 'D' // 5%
  else if (r < 0.85)
    st = 'A' // 5%
  else if (r < 0.9)
    st = 'I' // 5%
  else if (r < 0.95)
    st = 'S' // 5%
  else st = 'U' // 5%
  set('aresTransStatus', String(st))
  const rreq = document.getElementById('rreqTransStatus') as HTMLSelectElement | null
  const trans = document.getElementById('transStatus') as HTMLInputElement | null
  if (st === 'C' || st === 'D') {
    if (rreq) rreq.value = Math.random() < 0.8 ? 'Y' : 'N'
    if (trans && rreq) trans.value = rreq.value
  } else {
    if (rreq) rreq.value = 'NULL_VALUE'
    if (trans) trans.value = String(st)
  }
  // 當 ARes 為 R 時，transStatusReason 從 01~30/81/89/90 隨機；否則為 NULL_VALUE
  const reasonEl = document.getElementById('transStatusReason') as HTMLSelectElement | null
  if (reasonEl) {
    if (st === 'R') {
      const reasons: string[] = []
      for (let i = 1; i <= 30; i++) reasons.push(String(i).padStart(2, '0'))
      reasons.push('81', '89', '90')
      reasonEl.disabled = false
      if (reasons.length > 0) {
        const idx = Math.floor(Math.random() * reasons.length)
        reasonEl.value = reasons[idx] as string
      } else {
        reasonEl.value = '01'
      }
    } else {
      reasonEl.disabled = true
      reasonEl.value = 'NULL_VALUE'
    }
  }
  // 當 ARes 為 R 時，stateMachineReason 從所有 StateMachineReasonEnum 值隨機；否則為 NULL_VALUE
  const stateMachineReasonEl = document.getElementById(
    'stateMachineReason'
  ) as HTMLSelectElement | null
  if (stateMachineReasonEl) {
    if (st === 'R') {
      const stateMachineReasons: string[] = [
        '1001',
        '1002',
        '1003',
        '1004',
        '1005',
        '1006',
        '1007',
        '1008',
        '1009',
        '1010',
        '2001',
        '2002',
        '2101',
        '2102',
        '2103',
        '3001',
        '3002',
        '3101',
        '3102',
        '3199',
        '3201',
        '3202',
        '3299',
        '3301',
        '3302',
        '3399',
        '3401',
        '3402',
        '3403',
        '3404',
        '3499',
        '3501',
        '3502',
        '3503',
        '3504',
        '3601',
        '3602',
        '3604',
        '4001',
        '4101',
        '4102',
        '4103',
        '4104',
        '4105',
        '4106',
        '4107',
        '4108',
        '4109',
        '4110',
        '4111',
        '4201',
        '4202',
        '5101',
        '5102',
        '5103',
        '5104',
        '5105',
        '5106',
        '5201',
        '5202',
        '5203',
        '5204',
        '6101',
        '6102',
        '6103',
        '6201',
        '6301',
        '6401',
        '6402',
        '6403',
        '7101',
        '7102',
        '7103',
        '7201',
        '7202',
        '7203',
        '7204',
        '7205',
        '7206',
        '7207',
        '8101',
        '0000',
        '9999'
      ]
      stateMachineReasonEl.disabled = false
      if (stateMachineReasons.length > 0) {
        const idx = Math.floor(Math.random() * stateMachineReasons.length)
        stateMachineReasonEl.value = stateMachineReasons[idx] as string
      } else {
        stateMachineReasonEl.value = '1001'
      }
    } else {
      stateMachineReasonEl.disabled = true
      stateMachineReasonEl.value = 'NULL_VALUE'
    }
  }
  // 帳號原始值（依卡別前綴）- 僅在勾選時隨機
  const acctToggle = document.getElementById('enableAcctNumberRandom') as HTMLInputElement | null
  if (acctToggle?.checked) {
    generateRandomAcctNumber()
  }
  // acquirerMerchantID 隨機（僅在勾選時）
  const acqToggle = document.getElementById(
    'enableAcquirerMerchantIdRandom'
  ) as HTMLInputElement | null
  if (acqToggle?.checked) {
    const len = 7
    let rnd = ''
    for (let i = 0; i < len; i++) rnd += Math.floor(Math.random() * 10)
    if (rnd.startsWith('0')) rnd = '1' + rnd.substring(1)
    set('acquirerMerchantId', rnd)
  }
  // Visa Score 隨機（僅在勾選時）
  const visaToggle = document.getElementById('enableVisaScoreRandom') as HTMLInputElement | null
  if (visaToggle?.checked) {
    const score = Math.floor(Math.random() * 100) // 0-99
    set('visaRiskBasedAuthenticationScore', String(score))
    const scheme = document.getElementById('cardScheme') as HTMLSelectElement | null
    if (scheme) scheme.value = 'V'
  }
  // Mastercard 擴展 Score/Decision 隨機（僅在啟用且勾選隨機時）
  const mcEnable = (document.getElementById('enableMastercardExtension') as HTMLInputElement | null)
    ?.checked
  const mcRand = (
    document.getElementById('enableMastercardExtensionRandom') as HTMLInputElement | null
  )?.checked
  if (mcEnable && mcRand) {
    const scoreEl = document.getElementById('mastercardScore') as HTMLInputElement | null
    const decisionEl = document.getElementById('mastercardDecision') as HTMLSelectElement | null
    if (scoreEl) scoreEl.value = String(Math.floor(Math.random() * 651)) // 0-650
    if (decisionEl && decisionEl.options.length > 0) {
      const len = decisionEl.options.length
      const idx = Math.floor(Math.random() * len)
      const opt = decisionEl.options.item(idx)
      if (opt) decisionEl.value = opt.value
    }
    const scheme = document.getElementById('cardScheme') as HTMLSelectElement | null
    if (scheme) scheme.value = 'M'
  }
  // messageCategory 隨機（僅在勾選時）
  const msgToggle = document.getElementById('enableMessageCategory') as HTMLInputElement | null
  if (msgToggle?.checked) {
    const categories = ['01', '02', '80', '85', '86']
    const mc = categories[Math.floor(Math.random() * categories.length)] as string
    set('messageCategory', mc)
  }
  // deviceChannel 隨機（僅在勾選時）
  const devToggle = document.getElementById('enableDeviceChannel') as HTMLInputElement | null
  if (devToggle?.checked) {
    const chans = ['02', '03']
    const ch = chans[Math.floor(Math.random() * chans.length)] as string
    set('deviceChannel', ch)
  }
  // threeDSRequestorChallengeInd 隨機（僅在勾選時）- 無狀態限制，值域 01~10
  const ciToggle = document.getElementById(
    'enableThreeDSRequestorChallengeInd'
  ) as HTMLInputElement | null
  if (ciToggle?.checked) {
    const cis = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']
    const pick = cis[Math.floor(Math.random() * cis.length)] as string
    set('threeDSRequestorChallengeInd', pick)
  }
  // challengeCancel 自動隨機生成（僅在 ARes=C 且 RReq=N 時才會生效）
  const aresStatusEl = document.getElementById('aresTransStatus') as HTMLSelectElement | null
  const rreqStatusEl = document.getElementById('rreqTransStatus') as HTMLSelectElement | null
  if (aresStatusEl?.value === 'C' && rreqStatusEl?.value === 'N') {
    // challengeCancel 值：01, 02, 03, 04, 05, 06, 07, 09, 10
    const challengeCancelValues = ['01', '02', '03', '04', '05', '06', '07', '09', '10']
    // 8% 機率生成實際值，92% 機率為 NULL_VALUE（確保 NULL_VALUE > 90%）
    const shouldSetValue = Math.random() < 0.08
    if (shouldSetValue) {
      const cc = challengeCancelValues[
        Math.floor(Math.random() * challengeCancelValues.length)
      ] as string
      set('challengeCancel', cc)
    } else {
      set('challengeCancel', 'NULL_VALUE')
    }
  } else {
    set('challengeCancel', 'NULL_VALUE')
  }
  // deviceIpAddress 隨機（IPv4/IPv6 混合，預設 50/50）- 以設備 IP 為主
  function randInt(max: number): number {
    return Math.floor(Math.random() * (max + 1))
  }
  function randomIPv4(): string {
    return `${randInt(255)}.${randInt(255)}.${randInt(255)}.${randInt(255)}`
  }
  function h4(): string {
    return Math.floor(Math.random() * 0x10000).toString(16)
  }
  function randomIPv6(): string {
    return `${h4()}:${h4()}:${h4()}:${h4()}:${h4()}:${h4()}:${h4()}:${h4()}`
  }
  const deviceIpToggle = document.getElementById(
    'enableDeviceIpAddressRandom'
  ) as HTMLInputElement | null
  if (deviceIpToggle?.checked) {
    const deviceIp = Math.random() < 0.5 ? randomIPv4() : randomIPv6()
    set('deviceIpAddress', deviceIp)
    // 瀏覽器 IP 跟隨設備 IP
    const browserIpEl = document.getElementById('browserIP') as HTMLInputElement | null
    if (browserIpEl) browserIpEl.value = deviceIp
  }

  // devicePlatform 隨機（僅在勾選時）
  const devicePlatformToggle = document.getElementById(
    'enableDevicePlatformRandom'
  ) as HTMLInputElement | null
  if (devicePlatformToggle?.checked) {
    const platforms = ['MacIntel', 'Win32', 'Linux x86_64', 'iPhone', 'Android']
    const platform = platforms[Math.floor(Math.random() * platforms.length)] as string
    set('devicePlatform', platform)
  }

  // deviceLocale 隨機（僅在勾選時）
  const deviceLocaleToggle = document.getElementById(
    'enableDeviceLocaleRandom'
  ) as HTMLInputElement | null
  if (deviceLocaleToggle?.checked) {
    const locales = ['zh-TW', 'zh-CN', 'en-US', 'en-GB', 'ja-JP', 'ko-KR']
    const locale = locales[Math.floor(Math.random() * locales.length)] as string
    set('deviceLocale', locale)
  }

  // deviceAdvertisingId 隨機（僅在勾選時）
  const deviceAdIdToggle = document.getElementById(
    'enableDeviceAdvertisingIdRandom'
  ) as HTMLInputElement | null
  if (deviceAdIdToggle?.checked) {
    let adId = ''
    for (let i = 0; i < 32; i++) {
      adId += Math.floor(Math.random() * 16).toString(16)
    }
    set('deviceAdvertisingId', adId)
  }

  // threeDSCompInd 隨機（僅在勾選時）
  const threeDSCompIndToggle = document.getElementById(
    'enableThreeDSCompIndRandom'
  ) as HTMLInputElement | null
  if (threeDSCompIndToggle?.checked) {
    const compInd = Math.random() < 0.5 ? 'Y' : 'N'
    set('threeDSCompInd', compInd)
  }

  // merchantCountryCodeStr 隨機（僅在勾選時）
  const merchantCountryCodeStrToggle = document.getElementById(
    'enableMerchantCountryCodeStrRandom'
  ) as HTMLInputElement | null
  const merchantCountryCodeStrEl = document.getElementById(
    'merchantCountryCodeStr'
  ) as HTMLSelectElement | null
  if (
    merchantCountryCodeStrToggle?.checked &&
    merchantCountryCodeStrEl &&
    merchantCountryCodeStrEl.options.length > 0
  ) {
    // 從選單中隨機選擇一個選項（排除空值選項）
    const options = Array.from(merchantCountryCodeStrEl.options).filter((opt) => opt.value !== '')
    if (options.length > 0) {
      const randomOption = options[Math.floor(Math.random() * options.length)]!
      set('merchantCountryCodeStr', randomOption.value)
    }
  }
  // 如果沒有勾選，使用當前選單中的值（不需要額外設置，因為 getFormData 會讀取）

  // authenticationMethod 隨機（僅在勾選時）
  const authMethodToggle = document.getElementById(
    'enableAuthenticationMethodRandom'
  ) as HTMLInputElement | null
  if (authMethodToggle?.checked) {
    const authMethods = ['01', '02', '03', '04', '05']
    const authMethod = authMethods[Math.floor(Math.random() * authMethods.length)] as string
    set('authenticationMethod', authMethod)
  }

  // authenticationType 隨機（僅在勾選時）
  const authTypeToggle = document.getElementById(
    'enableAuthenticationTypeRandom'
  ) as HTMLInputElement | null
  if (authTypeToggle?.checked) {
    const authTypes = ['01', '02', '03', '04', '05']
    const authType = authTypes[Math.floor(Math.random() * authTypes.length)] as string
    set('authenticationType', authType)
  }

  setStatus('隨機數據已生成', 'success')
}

function generateRandomAcctNumber() {
  const schemeEl = document.getElementById('cardScheme') as HTMLSelectElement | null
  const scheme = schemeEl?.value || 'V'
  let prefix = '414352'
  if (scheme === 'M') prefix = '515352'
  // 產出 13 位亂數字串
  let suffix = ''
  for (let i = 0; i < 13; i++) suffix += Math.floor(Math.random() * 10)
  const acct = prefix + suffix
  const acctEl = document.getElementById('acctNumber') as HTMLInputElement | null
  if (acctEl) {
    acctEl.value = acct
    updateCardInfoFromAcctNumber()
  }
}

function setStatus(message: string, type: 'success' | 'error' | 'info' | 'warning') {
  const statusDiv = document.getElementById('statusMessage')
  if (!statusDiv) return
  statusDiv.innerHTML = `<div class="status-message status-${type}">${message}</div>`
}

function cryptoRandomUUID(): string {
  interface MinimalCrypto {
    randomUUID?: () => string
  }
  const w =
    typeof window !== 'undefined'
      ? (window as unknown as { crypto?: MinimalCrypto })
      : { crypto: undefined }
  const uuid = w.crypto?.randomUUID?.()
  if (uuid) return uuid
  const s: string[] = []
  const hex = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
  for (const c of hex) {
    if (c === 'x' || c === 'y') {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      s.push(v.toString(16))
    } else s.push(c)
  }
  return s.join('')
}

onMounted(() => {
  // 設定當天日期
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`
  const dateEl = document.getElementById('currentDate') as HTMLInputElement | null
  if (dateEl && !dateEl.value) dateEl.value = dateStr
  // 綁定聯動與計算
  const acctEl = document.getElementById('acctNumber') as HTMLInputElement | null
  acctEl?.addEventListener('input', updateCardInfoFromAcctNumber)
  wireStatusLinks()
  // 綁定 deviceIpAddress 與 browserIP 同步（以設備 IP 為主）
  const browserIpEl = document.getElementById('browserIP') as HTMLInputElement | null
  const deviceIpEl = document.getElementById('deviceIpAddress') as HTMLInputElement | null
  // 初始化時同步
  if (browserIpEl && deviceIpEl && deviceIpEl.value) {
    browserIpEl.value = deviceIpEl.value
  }
  // 監聽設備 IP 變化，自動同步到瀏覽器 IP
  deviceIpEl?.addEventListener('input', () => {
    if (browserIpEl && deviceIpEl) {
      browserIpEl.value = deviceIpEl.value
    }
  })
  // 3DS 參數全選功能
  const enableAll3DSParamsCheckbox = document.getElementById(
    'enableAll3DSParamsRandom'
  ) as HTMLInputElement | null
  const threeDSParamCheckboxes = [
    'enableMessageCategory',
    'enableDeviceChannel',
    'enableThreeDSRequestorChallengeInd',
    'enableAuthenticationMethodRandom',
    'enableAuthenticationTypeRandom',
    'enableDeviceIpAddressRandom',
    'enableDevicePlatformRandom',
    'enableDeviceLocaleRandom',
    'enableDeviceAdvertisingIdRandom',
    'enableThreeDSCompIndRandom',
    'enableMerchantCountryCodeStrRandom'
  ]
  function updateAll3DSParamsCheckbox() {
    if (!enableAll3DSParamsCheckbox) return
    const allChecked = threeDSParamCheckboxes.every((id) => {
      const checkbox = document.getElementById(id) as HTMLInputElement | null
      return checkbox?.checked ?? false
    })
    enableAll3DSParamsCheckbox.checked = allChecked
  }
  function toggleAll3DSParams(checked: boolean) {
    // 批量更新所有子 checkbox
    // 注意：這會觸發每個子 checkbox 的 change 事件，每個都會調用 updateAll3DSParamsCheckbox
    // 但這是預期的行為，因為需要確保全選 checkbox 的狀態與子 checkbox 一致
    threeDSParamCheckboxes.forEach((id) => {
      const checkbox = document.getElementById(id) as HTMLInputElement | null
      if (checkbox) {
        checkbox.checked = checked
      }
    })
    // 不需要手動更新全選 checkbox，因為子 checkbox 的 change 事件會自動觸發 updateAll3DSParamsCheckbox
  }
  enableAll3DSParamsCheckbox?.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    toggleAll3DSParams(target.checked)
  })
  // 為每個子 checkbox 添加事件監聽器
  threeDSParamCheckboxes.forEach((id) => {
    const checkbox = document.getElementById(id) as HTMLInputElement | null
    checkbox?.addEventListener('change', updateAll3DSParamsCheckbox)
  })
  // 初始化時檢查全選狀態
  updateAll3DSParamsCheckbox()
  // 時間區間顯示
  document.getElementById('currentDate')?.addEventListener('change', updateTimeRangeDisplay)
  document.getElementById('timezone')?.addEventListener('change', updateTimeRangeDisplay)
  document.getElementById('batchDays')?.addEventListener('input', updateTimeRangeDisplay)
  updateModeIndicator()
  updateTimeRangeDisplay()

  // 初始化 Visa/MC 互斥與顯示/禁用（還原舊版行為）
  const visaScoreCheckbox = document.getElementById(
    'enableVisaScoreRandom'
  ) as HTMLInputElement | null
  const mcEnableCheckbox = document.getElementById(
    'enableMastercardExtension'
  ) as HTMLInputElement | null
  const cardSchemeSelect = document.getElementById('cardScheme') as HTMLSelectElement | null
  const mcContainer = document.getElementById(
    'mastercardExtensionContainer'
  ) as HTMLDivElement | null
  function applyVisaMcRules() {
    const visaOn = !!visaScoreCheckbox?.checked
    const mcOn = !!mcEnableCheckbox?.checked
    if (visaOn) {
      if (cardSchemeSelect) {
        cardSchemeSelect.value = 'V'
        cardSchemeSelect.disabled = true
      }
      if (mcEnableCheckbox) mcEnableCheckbox.disabled = true
      setStatus('Visa Score 已開啟，卡別鎖定為 Visa，Mastercard 已禁用', 'info')
    } else if (mcOn) {
      if (cardSchemeSelect) {
        cardSchemeSelect.value = 'M'
        cardSchemeSelect.disabled = true
      }
      if (visaScoreCheckbox) visaScoreCheckbox.disabled = true
      if (mcContainer) mcContainer.style.display = 'block'
      setStatus('Mastercard 擴展已開啟，卡別鎖定為 Mastercard，Visa Score 已禁用', 'info')
    } else {
      if (cardSchemeSelect) cardSchemeSelect.disabled = false
      if (visaScoreCheckbox) visaScoreCheckbox.disabled = false
      if (mcContainer) mcContainer.style.display = 'none'
      setStatus('卡別選擇與擴展設定恢復可調整', 'info')
    }
  }
  visaScoreCheckbox?.addEventListener('change', applyVisaMcRules)
  mcEnableCheckbox?.addEventListener('change', applyVisaMcRules)
  applyVisaMcRules()
})

watch(
  () => props.activeMode,
  () => {
    updateModeIndicator()
  }
)

type FormMap = Record<string, string>

function getFormData(): FormMap {
  const form = document.getElementById('acsForm') as HTMLFormElement | null
  const data: FormMap = {}
  if (!form) return data
  const inputs = form.querySelectorAll('input, select')
  inputs.forEach((el) => {
    const id = (el as HTMLInputElement).id
    if (!id) return
    if ((el as HTMLInputElement).type === 'checkbox') {
      data[id] = (el as HTMLInputElement).checked ? 'on' : 'off'
    } else {
      data[id] = (el as HTMLInputElement).value
    }
  })
  return data
}

function convertToUTC(date: Date, timezone: string): Date {
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
  } catch {}
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000)
}

function generateSharedTimestamp(form: FormMap) {
  const currentDate = form.currentDate
  const tz = form.timezone || 'browser'
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
  let hh: number, mm: number, ss: number
  if (currentDate === today) {
    hh = Math.floor(Math.random() * (now.getHours() + 1))
    mm =
      hh === now.getHours()
        ? Math.floor(Math.random() * (now.getMinutes() + 1))
        : Math.floor(Math.random() * 60)
    ss =
      hh === now.getHours() && mm === now.getMinutes()
        ? Math.floor(Math.random() * (now.getSeconds() + 1))
        : Math.floor(Math.random() * 60)
  } else {
    hh = Math.floor(Math.random() * 24)
    mm = Math.floor(Math.random() * 60)
    ss = Math.floor(Math.random() * 60)
  }
  const local = new Date(
    `${currentDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  )
  const utc = convertToUTC(local, tz)
  return utc.toISOString()
}

function buildDocument(
  form: FormMap,
  mode: 'unified' | 'acs' | 'dss',
  indexName: string,
  sharedTimestamp?: string
) {
  const currentDate = form.currentDate
  const tz = form.timezone || 'browser'
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
  let hh: number, mm: number, ss: number
  if (!sharedTimestamp && currentDate === today) {
    hh = Math.floor(Math.random() * (now.getHours() + 1))
    mm =
      hh === now.getHours()
        ? Math.floor(Math.random() * (now.getMinutes() + 1))
        : Math.floor(Math.random() * 60)
    ss =
      hh === now.getHours() && mm === now.getMinutes()
        ? Math.floor(Math.random() * (now.getSeconds() + 1))
        : Math.floor(Math.random() * 60)
  } else if (!sharedTimestamp) {
    hh = Math.floor(Math.random() * 24)
    mm = Math.floor(Math.random() * 60)
    ss = Math.floor(Math.random() * 60)
  }
  const currentDateTime = sharedTimestamp
    ? sharedTimestamp
    : convertToUTC(
        new Date(
          `${currentDate}T${String(hh!).padStart(2, '0')}:${String(mm!).padStart(2, '0')}:${String(ss!).padStart(2, '0')}`
        ),
        tz
      ).toISOString()
  // 產生一個歷史日期（用於 exchange_rate）
  const randomDaysAgo = Math.floor(Math.random() * 365)
  const historicalDate = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000)
  const historicalDateStr = historicalDate.toISOString().split('T')[0]
  type BuiltDoc = {
    last_update_timestamp: string
    first_seen_timestamp: string
    messageCategory?: string
    deviceChannel?: string
    merchantName?: string
    merchantCountryCode?: string
    mcc?: string
    acquirerMerchantID?: string
    acquirerBIN?: string
    purchaseAmount?: string
    purchaseCurrency?: string
    purchaseExponent?: string
    usdAmount?: number
    ares_transStatus?: string
    transStatus?: string
    rreq_transStatus?: string
    transStatusReason?: string
    stateMachineReason?: string
    cardScheme?: string
    acctNumberHashed?: string
    acctNumberMask?: string
    cardbin6?: string
    cardbin8?: string
    performance_metrics?: Array<{ path?: string; execTime?: number }>
    browserIP?: string
    errorComponent?: string
    errorDescription?: string
    errorCode?: string
    errorDetail?: string
    errorMessageType?: string
    challengeCancel?: string
    acsTransID?: string
    issuerOid?: string
    threeDSServerTransID?: string
    [key: string]: unknown
  }
  const doc: BuiltDoc = {
    last_update_timestamp: currentDateTime,
    first_seen_timestamp: currentDateTime,
    messageCategory: form.messageCategory,
    deviceChannel: form.deviceChannel,
    merchantName: form.merchantName,
    merchantCountryCode: form.merchantCountryCode,
    mcc: form.mcc,
    acquirerMerchantID: String(form.acquirerMerchantId),
    acquirerBIN: form.acquirerBin,
    purchaseAmount: String(form.purchaseAmount),
    purchaseCurrency: form.purchaseCurrency,
    purchaseExponent: String(form.purchaseExponent),
    usdAmount: Number(form.usdAmount || 0),
    ares_transStatus: form.aresTransStatus,
    transStatus: form.transStatus,
    rreq_transStatus: form.rreqTransStatus,
    transStatusReason: form.transStatusReason,
    stateMachineReason: form.stateMachineReason,
    cardScheme: form.cardScheme,
    acctNumberHashed: form.acctNumberHashed,
    acctNumberMask: form.acctNumberMask,
    cardbin6: form.cardbin6,
    cardbin8: form.cardbin8,
    performance_metrics: [
      { path: form.performancePath, execTime: Number(form.execTime || 0) },
      {
        path: 'CardSchemeService.caculateCavv',
        execTime: Number(form.cavvExecTime || Math.floor(Math.random() * 21 + 10))
      },
      {
        path: 'VerificationCodeService.sendVerificationCode',
        execTime: Number(form.otpExecTime || Math.floor(Math.random() * 61 + 20))
      },
      {
        path: `/challenge/brw/V/2.3.1/${form.issuerOid}/1/${form.acsTransId}/creq`,
        execTime: Number(form.creqExecTime || Math.floor(Math.random() * 501 + 300))
      },
      {
        path: `/acs-auth/auth/V/2.2.0/${form.issuerOid}/001/areq`,
        execTime: Number(form.execTime || Math.floor(Math.random() * 701 + 800))
      },
      {
        path: `/acs-auth/auth/V/2.2.0/${form.issuerOid}/001/rreq`,
        execTime: Number(form.rreqExecTime || Math.floor(Math.random() * 401 + 200))
      },
      {
        path: 'RiskEvaluationService.evaluate',
        execTime: Number(form.rbaExecTime || Math.floor(Math.random() * 151 + 50))
      }
    ],
    browserIP: form.browserIP,
    errorComponent: form.errorComponent,
    errorDescription: form.errorDescription,
    errorCode: form.errorCode,
    errorDetail: form.errorDetail,
    errorMessageType: form.errorMessageType,
    challengeCancel:
      form.challengeCancel && form.challengeCancel !== 'NULL_VALUE'
        ? form.challengeCancel
        : undefined
  }
  // 添加設備相關欄位（如果存在）
  if (form.deviceIpAddress && form.deviceIpAddress.trim() !== '') {
    doc.deviceIpAddress = form.deviceIpAddress
  }
  if (form.devicePlatform && form.devicePlatform.trim() !== '') {
    doc.devicePlatform = form.devicePlatform
  }
  if (form.deviceLocale && form.deviceLocale.trim() !== '') {
    doc.deviceLocale = form.deviceLocale
  }
  if (form.deviceAdvertisingId && form.deviceAdvertisingId.trim() !== '') {
    doc.deviceAdvertisingId = form.deviceAdvertisingId
  }
  if (form.threeDSCompInd && form.threeDSCompInd.trim() !== '') {
    doc.threeDSCompInd = form.threeDSCompInd
  }
  if (form.merchantCountryCodeStr && form.merchantCountryCodeStr.trim() !== '') {
    doc.merchantCountryCodeStr = form.merchantCountryCodeStr
  }
  if (form.authenticationMethod && form.authenticationMethod !== 'NULL_VALUE') {
    doc.authenticationMethod = form.authenticationMethod
  }
  if (form.authenticationType && form.authenticationType !== 'NULL_VALUE') {
    doc.authenticationType = form.authenticationType
  }
  // 國家代碼到國家資訊的映射（用於 GeoIP 生成）
  const countryCodeMap: Record<string, { name: string; alpha2: string }> = {
    '156': { name: 'China', alpha2: 'CN' },
    '158': { name: 'Taiwan', alpha2: 'TW' },
    '840': { name: 'United States', alpha2: 'US' },
    '392': { name: 'Japan', alpha2: 'JP' },
    '344': { name: 'Hong Kong', alpha2: 'HK' },
    '410': { name: 'South Korea', alpha2: 'KR' },
    '702': { name: 'Singapore', alpha2: 'SG' },
    '036': { name: 'Australia', alpha2: 'AU' },
    '124': { name: 'Canada', alpha2: 'CA' },
    '978': { name: 'Eurozone', alpha2: 'EU' },
    '826': { name: 'United Kingdom', alpha2: 'GB' }
  }
  // 生成 GeoIP 資訊（如果啟用）
  function generateGeoIP(
    countryCode: string,
    countryName: string,
    countryAlpha2: string
  ): Record<string, unknown> {
    const cities: Record<
      string,
      Array<{ name: string; lat: number; lon: number; region: string }>
    > = {
      '156': [
        { name: 'Beijing', lat: 39.9042, lon: 116.4074, region: 'CN-BJ' },
        { name: 'Shanghai', lat: 31.2304, lon: 121.4737, region: 'CN-SH' },
        { name: 'Guangzhou', lat: 23.1291, lon: 113.2644, region: 'CN-GD' },
        { name: 'Shenzhen', lat: 22.5431, lon: 114.0579, region: 'CN-GD' },
        { name: 'Chengdu', lat: 30.6624, lon: 104.0633, region: 'CN-SC' },
        { name: 'Hangzhou', lat: 30.2741, lon: 120.1551, region: 'CN-ZJ' },
        { name: 'Nanjing', lat: 32.0603, lon: 118.7969, region: 'CN-JS' },
        { name: 'Wuhan', lat: 30.5928, lon: 114.3055, region: 'CN-HB' },
        { name: "Xi'an", lat: 34.3416, lon: 108.9398, region: 'CN-SN' },
        { name: 'Tianjin', lat: 39.3434, lon: 117.3616, region: 'CN-TJ' }
      ],
      '158': [
        // 直轄市
        { name: 'Taipei', lat: 25.033, lon: 121.5654, region: 'TW-TPE' },
        { name: 'New Taipei', lat: 25.0169, lon: 121.4629, region: 'TW-NTP' },
        { name: 'Taoyuan', lat: 24.9936, lon: 121.301, region: 'TW-TAO' },
        { name: 'Taichung', lat: 24.1477, lon: 120.6736, region: 'TW-TXG' },
        { name: 'Tainan', lat: 22.9993, lon: 120.2269, region: 'TW-TNN' },
        { name: 'Kaohsiung', lat: 22.6148, lon: 120.3139, region: 'TW-KHH' },
        // 省轄市
        { name: 'Keelung', lat: 25.1276, lon: 121.7395, region: 'TW-KEE' },
        { name: 'Hsinchu', lat: 24.8036, lon: 120.9686, region: 'TW-HSQ' },
        { name: 'Chiayi', lat: 23.4801, lon: 120.4491, region: 'TW-CYI' },
        // 縣
        { name: 'Hsinchu County', lat: 24.8387, lon: 121.0177, region: 'TW-HSQ' },
        { name: 'Miaoli', lat: 24.5658, lon: 120.8239, region: 'TW-MIA' },
        { name: 'Changhua', lat: 24.072, lon: 120.5418, region: 'TW-CHA' },
        { name: 'Nantou', lat: 23.9167, lon: 120.6833, region: 'TW-NAN' },
        { name: 'Yunlin', lat: 23.7078, lon: 120.4313, region: 'TW-YUN' },
        { name: 'Chiayi County', lat: 23.4518, lon: 120.255, region: 'TW-CYQ' },
        { name: 'Pingtung', lat: 22.6716, lon: 120.4882, region: 'TW-PIF' },
        { name: 'Yilan', lat: 24.7021, lon: 121.7378, region: 'TW-ILA' },
        { name: 'Hualien', lat: 23.9739, lon: 121.6014, region: 'TW-HUA' },
        { name: 'Taitung', lat: 22.7603, lon: 121.1449, region: 'TW-TTT' },
        { name: 'Penghu', lat: 23.5712, lon: 119.5794, region: 'TW-PEN' },
        { name: 'Kinmen', lat: 24.4333, lon: 118.3667, region: 'TW-KIN' },
        { name: 'Lienchiang', lat: 26.1594, lon: 119.9378, region: 'TW-LIE' }
      ],
      '840': [
        { name: 'New York', lat: 40.7128, lon: -74.006, region: 'US-NY' },
        { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, region: 'US-CA' },
        { name: 'Chicago', lat: 41.8781, lon: -87.6298, region: 'US-IL' },
        { name: 'Houston', lat: 29.7604, lon: -95.3698, region: 'US-TX' },
        { name: 'San Francisco', lat: 37.7749, lon: -122.4194, region: 'US-CA' },
        { name: 'Phoenix', lat: 33.4484, lon: -112.074, region: 'US-AZ' },
        { name: 'Philadelphia', lat: 39.9526, lon: -75.1652, region: 'US-PA' },
        { name: 'San Antonio', lat: 29.4241, lon: -98.4936, region: 'US-TX' },
        { name: 'San Diego', lat: 32.7157, lon: -117.1611, region: 'US-CA' },
        { name: 'Dallas', lat: 32.7767, lon: -96.797, region: 'US-TX' }
      ],
      '392': [
        { name: 'Tokyo', lat: 35.6762, lon: 139.6503, region: 'JP-13' },
        { name: 'Osaka', lat: 34.6937, lon: 135.5023, region: 'JP-27' },
        { name: 'Yokohama', lat: 35.4437, lon: 139.638, region: 'JP-14' },
        { name: 'Kyoto', lat: 35.0116, lon: 135.7681, region: 'JP-26' },
        { name: 'Sapporo', lat: 43.0642, lon: 141.3469, region: 'JP-01' },
        { name: 'Nagoya', lat: 35.1815, lon: 136.9066, region: 'JP-23' },
        { name: 'Fukuoka', lat: 33.5904, lon: 130.4017, region: 'JP-40' },
        { name: 'Kobe', lat: 34.6901, lon: 135.1956, region: 'JP-28' },
        { name: 'Sendai', lat: 38.2682, lon: 140.8694, region: 'JP-04' },
        { name: 'Hiroshima', lat: 34.3853, lon: 132.4553, region: 'JP-34' }
      ],
      '344': [
        { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, region: 'HK' },
        { name: 'Kowloon', lat: 22.3167, lon: 114.1833, region: 'HK' },
        { name: 'New Territories', lat: 22.4, lon: 114.2, region: 'HK' },
        { name: 'Central', lat: 22.2819, lon: 114.1556, region: 'HK' },
        { name: 'Wan Chai', lat: 22.2783, lon: 114.1747, region: 'HK' }
      ],
      '410': [
        { name: 'Seoul', lat: 37.5665, lon: 126.978, region: 'KR-11' },
        { name: 'Busan', lat: 35.1796, lon: 129.0756, region: 'KR-26' },
        { name: 'Incheon', lat: 37.4563, lon: 126.7052, region: 'KR-28' },
        { name: 'Daegu', lat: 35.8714, lon: 128.6014, region: 'KR-27' },
        { name: 'Daejeon', lat: 36.3504, lon: 127.3845, region: 'KR-30' },
        { name: 'Gwangju', lat: 35.1595, lon: 126.8526, region: 'KR-29' },
        { name: 'Ulsan', lat: 35.5384, lon: 129.3114, region: 'KR-31' },
        { name: 'Suwon', lat: 37.2636, lon: 127.0286, region: 'KR-41' }
      ],
      '702': [
        { name: 'Singapore', lat: 1.3521, lon: 103.8198, region: 'SG' },
        { name: 'Central Region', lat: 1.2966, lon: 103.8526, region: 'SG' },
        { name: 'East Region', lat: 1.3441, lon: 103.9442, region: 'SG' },
        { name: 'West Region', lat: 1.3574, lon: 103.7058, region: 'SG' }
      ],
      '036': [
        { name: 'Sydney', lat: -33.8688, lon: 151.2093, region: 'AU-NSW' },
        { name: 'Melbourne', lat: -37.8136, lon: 144.9631, region: 'AU-VIC' },
        { name: 'Brisbane', lat: -27.4698, lon: 153.0251, region: 'AU-QLD' },
        { name: 'Perth', lat: -31.9505, lon: 115.8605, region: 'AU-WA' },
        { name: 'Adelaide', lat: -34.9285, lon: 138.6007, region: 'AU-SA' },
        { name: 'Gold Coast', lat: -28.0167, lon: 153.4, region: 'AU-QLD' },
        { name: 'Canberra', lat: -35.2809, lon: 149.13, region: 'AU-ACT' }
      ],
      '124': [
        { name: 'Toronto', lat: 43.6532, lon: -79.3832, region: 'CA-ON' },
        { name: 'Vancouver', lat: 49.2827, lon: -123.1207, region: 'CA-BC' },
        { name: 'Montreal', lat: 45.5017, lon: -73.5673, region: 'CA-QC' },
        { name: 'Calgary', lat: 51.0447, lon: -114.0719, region: 'CA-AB' },
        { name: 'Ottawa', lat: 45.4215, lon: -75.6972, region: 'CA-ON' },
        { name: 'Edmonton', lat: 53.5461, lon: -113.4938, region: 'CA-AB' },
        { name: 'Winnipeg', lat: 49.8951, lon: -97.1384, region: 'CA-MB' },
        { name: 'Quebec City', lat: 46.8139, lon: -71.208, region: 'CA-QC' }
      ],
      '978': [
        { name: 'Paris', lat: 48.8566, lon: 2.3522, region: 'FR-IDF' },
        { name: 'Berlin', lat: 52.52, lon: 13.405, region: 'DE-BE' },
        { name: 'Madrid', lat: 40.4168, lon: -3.7038, region: 'ES-MD' },
        { name: 'Rome', lat: 41.9028, lon: 12.4964, region: 'IT-LAZ' },
        { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, region: 'NL-NH' },
        { name: 'Brussels', lat: 50.8503, lon: 4.3517, region: 'BE-BRU' },
        { name: 'Vienna', lat: 48.2082, lon: 16.3738, region: 'AT-9' },
        { name: 'Dublin', lat: 53.3498, lon: -6.2603, region: 'IE-D' }
      ],
      '826': [
        { name: 'London', lat: 51.5074, lon: -0.1278, region: 'GB-ENG' },
        { name: 'Manchester', lat: 53.4808, lon: -2.2426, region: 'GB-ENG' },
        { name: 'Birmingham', lat: 52.4862, lon: -1.8904, region: 'GB-ENG' },
        { name: 'Glasgow', lat: 55.8642, lon: -4.2518, region: 'GB-SCT' },
        { name: 'Edinburgh', lat: 55.9533, lon: -3.1883, region: 'GB-SCT' },
        { name: 'Liverpool', lat: 53.4084, lon: -2.9916, region: 'GB-ENG' }
      ]
    }
    const cityList = cities[countryCode] || [{ name: 'Unknown', lat: 0, lon: 0, region: 'UN' }]
    const city = cityList[Math.floor(Math.random() * cityList.length)]!
    // 判斷洲名
    let continentName = 'Unknown'
    if (['156', '158', '392', '344', '410', '702'].includes(countryCode)) {
      continentName = 'Asia'
    } else if (['840', '124'].includes(countryCode)) {
      continentName = 'North America'
    } else if (countryCode === '036') {
      continentName = 'Oceania'
    } else if (['978', '826'].includes(countryCode)) {
      continentName = 'Europe'
    }
    return {
      region_iso_code: city.region,
      continent_name: continentName,
      city_name: city.name,
      country_iso_code: countryAlpha2,
      country_name: countryName,
      location: {
        lat: city.lat + (Math.random() - 0.5) * 0.1,
        lon: city.lon + (Math.random() - 0.5) * 0.1
      },
      region_name: city.name
    }
  }
  // 使用 merchantCountryCodeStr 來生成 GeoIP（如果有的話，否則使用 merchantCountryCode）
  const countryCodeForGeoIP = form.merchantCountryCodeStr || form.merchantCountryCode || '156'
  const countryInfo = countryCodeMap[countryCodeForGeoIP] || countryCodeMap['156']!
  // browserGeoIP（預設生成，基於 merchantCountryCodeStr）
  const enableBrowserGeoIP = document.getElementById(
    'enableBrowserGeoIPRandom'
  ) as HTMLInputElement | null
  // 預設生成，除非 checkbox 明確取消勾選
  if (enableBrowserGeoIP?.checked !== false) {
    ;(doc as unknown as Record<string, unknown>).browserGeoIP = generateGeoIP(
      countryCodeForGeoIP,
      countryInfo.name,
      countryInfo.alpha2
    )
  }
  // deviceGeoIP（預設生成，基於 merchantCountryCodeStr）
  const enableDeviceGeoIP = document.getElementById(
    'enableDeviceGeoIPRandom'
  ) as HTMLInputElement | null
  // 預設生成，除非 checkbox 明確取消勾選
  if (enableDeviceGeoIP?.checked !== false) {
    ;(doc as unknown as Record<string, unknown>).deviceGeoIP = generateGeoIP(
      countryCodeForGeoIP,
      countryInfo.name,
      countryInfo.alpha2
    )
  }
  // visaDafMessageExtension（始終為 null，但需要存在）
  ;(doc as unknown as Record<string, unknown>).visaDafMessageExtension = null
  // 擴充：貨幣/國家巢狀資訊
  ;(doc as unknown as Record<string, unknown>)['purchaseCurrency-country_info'] = {
    'ISO4217-currency_minor_unit': form.currencyMinorUnit,
    'ISO4217-currency_name': form.currencyName,
    'ISO4217-currency_alphabetic_code': form.currencyAlphabeticCode,
    'ISO4217-currency_numeric_code': form.currencyNumericCode
  }
  // threeDS 請求方挑戰指標（以索引正名輸出）
  ;(doc as unknown as Record<string, unknown>).threedsRequestorChlgInd =
    form.threeDSRequestorChallengeInd
  ;(doc as unknown as Record<string, unknown>).merchantCountryCode_country_info = {
    'ISO3166-1-Alpha-2': form.countryAlpha2,
    'ISO3166-1-numeric': form.countryNumeric,
    'ISO3166-1-Alpha-3': form.countryAlpha3,
    official_name_en: form.countryName
  }
  ;(doc as unknown as Record<string, unknown>).purchaseCurrencyStr = form.purchaseCurrency
  // currencyCodeForRate（如果存在）
  if (form.currencyCodeForRate && form.currencyCodeForRate.trim() !== '') {
    ;(doc as unknown as Record<string, unknown>).currencyCodeForRate = form.currencyCodeForRate
  }
  ;(doc as unknown as Record<string, unknown>).exchangeKey =
    `${form.currencyCodeForRate || form.currencyAlphabeticCode || 'CNY'}-${currentDateTime.split('T')[0]}`
  ;(doc as unknown as Record<string, unknown>).exchange_rate = {
    date: `${historicalDateStr}T00:00:00.000Z`,
    '@timestamp': `${historicalDateStr}T00:00:02.000Z`,
    rate: form.exchangeRate,
    target: form.exchangeTarget,
    base: form.exchangeBase
  }
  // Visa 分數擴展
  if (
    form.visaRiskBasedAuthenticationScore &&
    String(form.visaRiskBasedAuthenticationScore).trim() !== ''
  ) {
    ;(doc as unknown as Record<string, unknown>).visaScoreMessageExtension = {
      visaRiskBasedAuthenticationScore: parseInt(form.visaRiskBasedAuthenticationScore)
    }
  } else {
    ;(doc as unknown as Record<string, unknown>).visaScoreMessageExtension = null
  }
  // MC 訊息擴展
  if (form.enableMastercardExtension === 'on') {
    if (form.mastercardMessageExtension && form.mastercardMessageExtension.startsWith('{')) {
      try {
        ;(doc as unknown as Record<string, unknown>).mastercardMessageExtension = JSON.parse(
          form.mastercardMessageExtension
        )
      } catch {
        ;(doc as unknown as Record<string, unknown>).mastercardMessageExtension = null
      }
    } else {
      ;(doc as unknown as Record<string, unknown>).mastercardMessageExtension = {
        score: parseInt(form.mastercardScore || '600'),
        reasonCode2: form.mastercardReasonCode2 || '',
        reasonCode1: form.mastercardReasonCode1 || 'A',
        decision: form.mastercardDecision || 'Not Low Risk',
        status: form.mastercardStatus || 'success'
      }
    }
  } else {
    ;(doc as unknown as Record<string, unknown>).mastercardMessageExtension = null
  }
  if (indexName.includes('acs-transaction')) {
    doc.acsTransID = form.acsTransId
    doc.issuerOid = form.issuerOid
  }
  if (indexName.includes('3dss-transaction')) {
    doc.threeDSServerTransID = form.threeDSServerTransId
  }
  return { document: doc, utcDateStr: currentDateTime.split('T')[0] }
}

defineExpose({
  loadDefaults,
  generateRandom,
  getFormData,
  buildDocument,
  generateSharedTimestamp,
  setStatus
})
</script>

<template>
  <div id="statusMessage"></div>

  <form id="acsForm">
    <!-- 基礎配置 -->
    <div class="form-section">
      <h3>基礎配置 <span id="modeIndicator" class="mode-indicator unified">統一</span></h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="baseUrl" class="bilingual-label">
            <span class="zh">Elasticsearch URL</span>
            <span class="en">base_url</span>
          </label>
          <input type="url" id="baseUrl" value="http://localhost:9200" required />
          <small>Elasticsearch 服務地址</small>
        </div>
        <div class="form-group">
          <label for="username" class="bilingual-label">
            <span class="zh">用戶名</span>
            <span class="en">username</span>
          </label>
          <input type="text" id="username" value="elastic" required />
        </div>
        <div class="form-group">
          <label for="password" class="bilingual-label">
            <span class="zh">密碼</span>
            <span class="en">password</span>
          </label>
          <input type="password" id="password" value="123456" required />
        </div>
        <div class="form-group">
          <label for="currentDate" class="bilingual-label">
            <span class="zh">當前日期</span>
            <span class="en">current_date</span>
          </label>
          <input type="date" id="currentDate" required />
          <small>交易日期 (YYYY-MM-DD-HH:MM:SS)</small>
          <small style="color: red"
            >HH:MM:SS將自動生成隨機時間，並依據時區轉換為 UTC
            時間，根據UTC時間決定儲存的索引名稱</small
          >
        </div>
        <div class="form-group">
          <label for="timezone" class="bilingual-label">
            <span class="zh">時區</span>
            <span class="en">timezone</span>
          </label>
          <select id="timezone" required>
            <option value="browser">瀏覽器時區 (自動檢測)</option>
            <option value="Asia/Taipei">台灣 (UTC+8)</option>
            <option value="Asia/Shanghai">中國 (UTC+8)</option>
            <option value="Asia/Tokyo">日本 (UTC+9)</option>
            <option value="Asia/Seoul">韓國 (UTC+9)</option>
            <option value="Asia/Singapore">新加坡 (UTC+8)</option>
            <option value="Asia/Hong_Kong">香港 (UTC+8)</option>
            <option value="America/New_York">美國東部 (UTC-5/-4)</option>
            <option value="America/Los_Angeles">美國西部 (UTC-8/-7)</option>
            <option value="Europe/London">英國 (UTC+0/+1)</option>
            <option value="Europe/Paris">法國 (UTC+1/+2)</option>
            <option value="Australia/Sydney">澳洲東部 (UTC+10/+11)</option>
            <option value="UTC">UTC (UTC+0)</option>
          </select>
          <small>選擇時區用於時間轉換，預設使用瀏覽器時區</small>
        </div>
        <div class="form-group">
          <label class="bilingual-label">
            <span class="zh">UTC時間區間</span>
            <span class="en">Time Range</span>
          </label>
          <div id="timeRangeDisplay" style="padding: 8px; background: #f8f9fa; border-radius: 4px">
            <span id="timeRangeText" style="color: #7f8c8d">請選擇日期</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 交易識別（節錄核心欄位，其餘區塊將續移植） -->
    <div class="form-section">
      <h3>1.交易識別</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="issuerOid" class="bilingual-label">
            <span class="zh">發卡機構 OID</span>
            <span class="en">issuerOid</span>
          </label>
          <input type="text" id="issuerOid" value="06b4b203-da05-73f9-256f-454929df6076" required />
        </div>
        <div class="form-group">
          <label for="acsTransId" class="bilingual-label">
            <span class="zh">ACS 交易 ID</span>
            <span class="en">acsTransID</span>
          </label>
          <input
            type="text"
            id="acsTransId"
            value="17616cb5-96d5-42cb-990a-08b28ff72874"
            required
          />
          <small style="color: red">可隨機生成</small>
        </div>
        <div class="form-group">
          <label for="threeDSServerTransId" class="bilingual-label">
            <span class="zh">3DS Server 交易 ID</span>
            <span class="en">threeDSServerTransID</span>
          </label>
          <input
            type="text"
            id="threeDSServerTransId"
            value="79c42c48-b25a-49f1-a791-fb45123cd944"
            required
          />
          <small style="color: red">可隨機生成</small>
        </div>
      </div>
    </div>

    <!-- 交易狀態（節錄核心欄位，其餘區塊將續移植） -->
    <div class="form-section">
      <h3>2.交易狀態</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="aresTransStatus" class="bilingual-label">
            <span class="zh">ARes 交易狀態</span>
            <span class="en">ares_transStatus</span>
          </label>
          <select id="aresTransStatus" required>
            <option value="Y">Y</option>
            <option value="N" selected>N</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="R">R</option>
            <option value="A">A</option>
            <option value="I">I</option>
            <option value="S">S</option>
            <option value="U">U</option>
          </select>
          <small style="color: red">可隨機生成</small>
        </div>
        <div class="form-group">
          <label for="transStatus" class="bilingual-label">
            <span class="zh">交易狀態</span>
            <span class="en">transStatus</span>
          </label>
          <input type="text" id="transStatus" value="N" required />
          <small>通常等於 ARes 交易狀態</small>
        </div>
        <div class="form-group">
          <label for="rreqTransStatus" class="bilingual-label">
            <span class="zh">RReq 交易狀態</span>
            <span class="en">rreq_transStatus</span>
          </label>
          <select id="rreqTransStatus" disabled>
            <option value="NULL_VALUE" selected>NULL_VALUE</option>
            <option value="Y">Y - 認證成功</option>
            <option value="N">N - 認證失敗</option>
          </select>
          <small>只有當 ARes 狀態為 C/D 時才可選擇</small>
          <small style="color: red">可隨機生成</small>
        </div>
        <div class="form-group">
          <label for="transStatusReason" class="bilingual-label">
            <span class="zh">交易狀態原因</span>
            <span class="en">transStatusReason</span>
          </label>
          <select id="transStatusReason" disabled>
            <option value="NULL_VALUE" selected>NULL_VALUE</option>
            <option value="01">01 - Card authentication failed</option>
            <option value="02">02 - Unknown device</option>
            <option value="03">03 - Unsupported device</option>
            <option value="04">04 - Exceeds authentication frequency limit</option>
            <option value="05">05 - Expired card</option>
            <option value="06">06 - Invalid card number</option>
            <option value="07">07 - Invalid transaction</option>
            <option value="08">08 - No card record</option>
            <option value="09">09 - Security failure</option>
            <option value="10">10 - Stolen card</option>
            <option value="11">11 - Suspected fraud</option>
            <option value="12">12 - Transaction not permitted to Cardholder</option>
            <option value="13">13 - Cardholder not enrolled in service</option>
            <option value="14">14 - Transaction timed out at the ACS</option>
            <option value="15">15 - Low confidence</option>
            <option value="16">16 - Medium confidence</option>
            <option value="17">17 - High confidence</option>
            <option value="18">18 - Very high confidence</option>
            <option value="19">19 - Exceeds ACS maximum challenges</option>
            <option value="20">20 - Non-Payment transaction not supported</option>
            <option value="21">21 - 3RI transaction not supported</option>
            <option value="22">22 - ACS technical issue</option>
            <option value="23">
              23 - Decoupled Authentication required by ACS but not requested by 3DS Requestor
            </option>
            <option value="24">24 - 3DS Requestor Decoupled Max Expiry Time exceeded</option>
            <option value="25">
              25 - Decoupled Authentication was provided insufficient time to authenticate
              Cardholder. ACS will not make attempt
            </option>
            <option value="26">
              26 - Authentication attempted but not performed by the Cardholder
            </option>
            <option value="27">27 - Preferred Authentication Method not supported</option>
            <option value="28">28 - Validation of content security policy failed</option>
            <option value="29">
              29 - Authentication attempted but not completed by the Cardholder. Fall back to
              Decoupled Authentication
            </option>
            <option value="30">
              30 - Authentication completed successfully but additional authentication of the
              Cardholder required. Reinitiate as Decoupled Authentication
            </option>
            <option value="81">81 - Mastercard SCA Exemption</option>
            <option value="89">89 - Visa SCP Exemption</option>
            <option value="90">90 - Visa Issuer SCA Required</option>
          </select>
          <small>只有當 ARes 狀態為 R 時才可選擇</small>
          <small style="color: red">可隨機生成</small>
        </div>
        <div class="form-group">
          <label for="stateMachineReason" class="bilingual-label">
            <span class="zh">狀態機原因</span>
            <span class="en">stateMachineReason</span>
          </label>
          <select id="stateMachineReason" disabled>
            <option value="NULL_VALUE" selected>NULL_VALUE</option>
            <option value="1001">1001 - Device not support</option>
            <option value="1002">1002 - Exceeds amount limit</option>
            <option value="1003">1003 - Exceeds auth frequency limit</option>
            <option value="1004">1004 - User abandon</option>
            <option value="1005">1005 - Trans timeout</option>
            <option value="1006">1006 - Card scheme not supported</option>
            <option value="1007">1007 - Invalid trans status</option>
            <option value="1008">1008 - CReq not received</option>
            <option value="1009">1009 - User not responsed</option>
            <option value="1010">1010 - Dec auth not performed</option>
            <option value="2001">2001 - Invalid message</option>
            <option value="2002">2002 - Invalid message out of BIN range</option>
            <option value="2101">2101 - Invalid ISO currency code</option>
            <option value="2102">2102 - Invalid ISO currency exponent</option>
            <option value="2103">2103 - Invalid ISO country code</option>
            <option value="3001">3001 - Network connect timeout</option>
            <option value="3002">3002 - Network read timeout</option>
            <option value="3101">3101 - DS connect failed</option>
            <option value="3102">3102 - DS read timeout</option>
            <option value="3199">3199 - DS error</option>
            <option value="3201">3201 - Card system connect failed</option>
            <option value="3202">3202 - Card system read timeout</option>
            <option value="3299">3299 - Card system error</option>
            <option value="3301">3301 - HSM connect failed</option>
            <option value="3302">3302 - HSM read timeout</option>
            <option value="3399">3399 - HSM error</option>
            <option value="3401">3401 - OTP sender connect failed</option>
            <option value="3402">3402 - OTP sender read timeout</option>
            <option value="3403">3403 - OTP sender exceeds frequency limit</option>
            <option value="3404">3404 - OTP sender less than resend interval</option>
            <option value="3499">3499 - OTP sender error</option>
            <option value="3501">3501 - RReq connect failed</option>
            <option value="3502">3502 - RReq read timeout</option>
            <option value="3503">3503 - RRes response failed</option>
            <option value="3504">3504 - RRes response error</option>
            <option value="3601">3601 - OOB connect failed</option>
            <option value="3602">3602 - OOB read timeout</option>
            <option value="3604">3604 - OOBS response error</option>
            <option value="4001">4001 - High risk</option>
            <option value="4101">4101 - Black list</option>
            <option value="4102">4102 - Black list IP</option>
            <option value="4103">4103 - Black list email</option>
            <option value="4104">4104 - Black list MID</option>
            <option value="4105">4105 - Black list device ID</option>
            <option value="4106">4106 - Black list acct number</option>
            <option value="4107">4107 - Black list acct ID</option>
            <option value="4108">4108 - Black list phone</option>
            <option value="4109">4109 - Black list src country</option>
            <option value="4110">4110 - Black list mer URL</option>
            <option value="4111">4111 - Black list mer country</option>
            <option value="4201">4201 - High risk RBA</option>
            <option value="4202">4202 - 3RI challenge not support</option>
            <option value="5101">5101 - Invalid acct number</option>
            <option value="5102">5102 - Invalid expiry date</option>
            <option value="5103">5103 - Acct number locked</option>
            <option value="5104">5104 - Acct number not enrolled</option>
            <option value="5105">5105 - Acct number not effective</option>
            <option value="5106">5106 - Acct number expired</option>
            <option value="5201">5201 - Invalid acct ID</option>
            <option value="5202">5202 - Acct ID lock</option>
            <option value="5203">5203 - Acct ID not enrolled</option>
            <option value="5204">5204 - Acct ID not effective</option>
            <option value="6101">6101 - Passcode invalid</option>
            <option value="6102">6102 - Passcode expired</option>
            <option value="6103">6103 - Passcode used</option>
            <option value="6201">6201 - OOB not completed</option>
            <option value="6301">6301 - KBA answer invalid</option>
            <option value="6401">6401 - FIDO not completed</option>
            <option value="6402">6402 - FIDO connect failed</option>
            <option value="6403">6403 - FIDO read timeout</option>
            <option value="7101">7101 - 3RI not support</option>
            <option value="7102">7102 - 3RI invalid 3RI ind</option>
            <option value="7103">7103 - 3RI NPA frictionless</option>
            <option value="7201">7201 - 3RI recurring prior trans not found</option>
            <option value="7202">7202 - 3RI recurring prior trans not auth</option>
            <option value="7203">7203 - 3RI recurring prior trans expiried</option>
            <option value="7204">7204 - 3RI recurring currency different</option>
            <option value="7205">7205 - 3RI recurring amount over prior trans</option>
            <option value="7206">7206 - 3RI recurring acct number different</option>
            <option value="7207">7207 - 3RI instaldata over limit</option>
            <option value="8101">8101 - Recurring date expiried</option>
            <option value="0000">0000 - Completed</option>
            <option value="9999">9999 - Unexcepted error</option>
          </select>
          <small>只有當 ARes 狀態為 R 時才可選擇</small>
          <small style="color: red">可隨機生成</small>
        </div>
        <div class="form-group">
          <label for="challengeCancel" class="bilingual-label">
            <span class="zh">挑戰驗證取消指標</span>
            <span class="en">challengeCancel</span>
          </label>
          <select id="challengeCancel" disabled>
            <option value="NULL_VALUE" selected>NULL_VALUE (留空)</option>
            <option value="01">01 - 持卡人選擇「取消」</option>
            <option value="02">02 - 3DS 請求者取消了身份驗證</option>
            <option value="03">03 - 交易被放棄 (Decoupled Authentication timeout)</option>
            <option value="04">04 - ACS 其他超時的交易超時</option>
            <option value="05">05 - ACS 未收到 ACS-First CReq 的事務超時</option>
            <option value="06">06 - 交易錯誤</option>
            <option value="07">07 - 未知</option>
            <option value="09">09 - Error Message in response to the CRes message</option>
            <option value="10">10 - Error Message in response to the CReq message</option>
          </select>
          <small>只有當 ARes 狀態為 C 且 RReq 狀態為 N 時才可選擇</small>
          <small style="color: red">可隨機生成</small>
          <small style="color: red"
            >Edit 8 監控指標：challengeCancel ≠ null / ARes=C 的放棄率需 ≤ 10%</small
          >
        </div>
      </div>
    </div>

    <!-- 3.商戶信息 -->
    <div class="form-section">
      <h3>3.商戶信息</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="merchantName" class="bilingual-label">
            <span class="zh">商戶名稱</span>
            <span class="en">merchantName</span>
          </label>
          <input type="text" id="merchantName" value="HiTRUST EMV Demo Merchant" required />
        </div>
        <div class="form-group">
          <label for="merchantCountryCode" class="bilingual-label">
            <span class="zh">商戶國家代碼</span>
            <span class="en">merchantCountryCode</span>
          </label>
          <select id="merchantCountryCode" required>
            <option value="156" selected>156 - 中國 (CN)</option>
            <option value="158">158 - 台灣 (TW)</option>
            <option value="840">840 - 美國 (US)</option>
            <option value="392">392 - 日本 (JP)</option>
            <option value="344">344 - 香港 (HK)</option>
            <option value="410">410 - 韓國 (KR)</option>
            <option value="702">702 - 新加坡 (SG)</option>
            <option value="036">036 - 澳洲 (AU)</option>
            <option value="124">124 - 加拿大 (CA)</option>
            <option value="978">978 - 歐元區 (EU)</option>
            <option value="826">826 - 英國 (GB)</option>
            <option value="764">764 - 泰國 (TH)</option>
            <option value="704">704 - 越南 (VN)</option>
            <option value="458">458 - 馬來西亞 (MY)</option>
            <option value="360">360 - 印尼 (ID)</option>
            <option value="608">608 - 菲律賓 (PH)</option>
          </select>
          <small>選擇商戶所在國家/地區</small>
        </div>
        <div class="form-group">
          <label for="acquirerMerchantId" class="bilingual-label">
            <span class="zh">收單機構商戶 ID</span>
            <span class="en">acquirerMerchantID</span>
          </label>
          <input type="text" id="acquirerMerchantId" value="8909191" required />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableAcquirerMerchantIdRandom" style="margin: 0" checked />
            <label
              for="enableAcquirerMerchantIdRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (1-9999999)，預設關閉</small>
        </div>
        <div class="form-group">
          <label for="acquirerBin" class="bilingual-label">
            <span class="zh">收單機構 BIN</span>
            <span class="en">acquirerBIN</span>
          </label>
          <input type="text" id="acquirerBin" value="1231234" required />
        </div>
        <div class="form-group">
          <label for="mcc" class="bilingual-label">
            <span class="zh">商戶類別代碼</span>
            <span class="en">mcc</span>
          </label>
          <input type="text" id="mcc" value="5661" required />
        </div>
      </div>
    </div>

    <!-- 4.交易金額 -->
    <div class="form-section">
      <h3>4.交易金額</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="purchaseAmount" class="bilingual-label">
            <span class="zh">購買金額</span>
            <span class="en">purchaseAmount</span>
          </label>
          <input type="number" id="purchaseAmount" value="100" step="0.01" required />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enablePurchaseAmountRandom" style="margin: 0" checked />
            <label
              for="enablePurchaseAmountRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (10-1000)，預設開啟</small>
        </div>
        <div class="form-group">
          <label for="purchaseCurrency" class="bilingual-label">
            <span class="zh">購買貨幣代碼</span>
            <span class="en">purchaseCurrency</span>
          </label>
          <select id="purchaseCurrency" required>
            <option value="156" selected>156 - 中國人民幣 (CNY)</option>
            <option value="901">901 - 台灣新台幣 (TWD)</option>
            <option value="840">840 - 美國美元 (USD)</option>
            <option value="392">392 - 日本日圓 (JPY)</option>
            <option value="344">344 - 香港港幣 (HKD)</option>
            <option value="410">410 - 韓國韓元 (KRW)</option>
            <option value="702">702 - 新加坡新加坡元 (SGD)</option>
            <option value="036">036 - 澳洲澳幣（澳元） (AUD)</option>
            <option value="124">124 - 加拿大加幣（加元） (CAD)</option>
            <option value="978">978 - 歐元區歐元 (EUR)</option>
            <option value="826">826 - 英國英鎊 (GBP)</option>
            <option value="764">764 - 泰國泰銖 (THB)</option>
            <option value="704">704 - 越南越南盾 (VND)</option>
            <option value="458">458 - 馬來西亞馬幣（令吉） (MYR)</option>
            <option value="360">360 - 印尼印尼盾（盧比） (IDR)</option>
            <option value="608">608 - 菲律賓菲律賓比索 (PHP)</option>
          </select>
          <small>選擇貨幣類型</small>
        </div>
        <div class="form-group">
          <label for="purchaseExponent" class="bilingual-label">
            <span class="zh">購買金額指數</span>
            <span class="en">purchaseExponent</span>
          </label>
          <input type="number" id="purchaseExponent" value="2" required />
        </div>
        <div class="form-group">
          <label for="usdAmount" class="bilingual-label">
            <span class="zh">美元金額</span>
            <span class="en">usdAmount</span>
          </label>
          <input
            type="number"
            id="usdAmount"
            value="0.13841979956813022"
            step="0.000000000000000001"
          />
        </div>
      </div>
    </div>

    <!-- 5.國家和貨幣信息 -->
    <div class="form-section">
      <h3>5.國家和貨幣信息</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="countryAlpha2" class="bilingual-label">
            <span class="zh">國家代碼 (Alpha-2)</span>
            <span class="en">countryAlpha2</span>
          </label>
          <input type="text" id="countryAlpha2" value="CN" maxlength="2" />
        </div>
        <div class="form-group">
          <label for="countryNumeric" class="bilingual-label">
            <span class="zh">國家代碼 (數字)</span>
            <span class="en">countryNumeric</span>
          </label>
          <input type="text" id="countryNumeric" value="156" />
        </div>
        <div class="form-group">
          <label for="countryAlpha3" class="bilingual-label">
            <span class="zh">國家代碼 (Alpha-3)</span>
            <span class="en">countryAlpha3</span>
          </label>
          <input type="text" id="countryAlpha3" value="CHN" maxlength="3" />
        </div>
        <div class="form-group">
          <label for="countryName" class="bilingual-label">
            <span class="zh">國家名稱 (英文)</span>
            <span class="en">countryName</span>
          </label>
          <input type="text" id="countryName" value="China" />
        </div>
        <div class="form-group">
          <label for="currencyMinorUnit" class="bilingual-label">
            <span class="zh">貨幣小數位數</span>
            <span class="en">currencyMinorUnit</span>
          </label>
          <input type="number" id="currencyMinorUnit" value="2" />
        </div>
        <div class="form-group">
          <label for="currencyName" class="bilingual-label">
            <span class="zh">貨幣名稱 (英文)</span>
            <span class="en">currencyName</span>
          </label>
          <input type="text" id="currencyName" value="Yuan Renminbi" />
        </div>
        <div class="form-group">
          <label for="currencyAlphabeticCode" class="bilingual-label">
            <span class="zh">貨幣代碼 (字母)</span>
            <span class="en">currencyAlphabeticCode</span>
          </label>
          <input type="text" id="currencyAlphabeticCode" value="CNY" maxlength="3" />
        </div>
        <div class="form-group">
          <label for="currencyNumericCode" class="bilingual-label">
            <span class="zh">貨幣代碼 (數字)</span>
            <span class="en">currencyNumericCode</span>
          </label>
          <input type="text" id="currencyNumericCode" value="156" />
        </div>
      </div>
    </div>

    <!-- 6.匯率信息 -->
    <div class="form-section">
      <h3>6.匯率信息</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="exchangeRate" class="bilingual-label">
            <span class="zh">匯率</span>
            <span class="en">exchangeRate</span>
          </label>
          <input type="number" id="exchangeRate" value="7.2244" step="0.0001" />
        </div>
        <div class="form-group">
          <label for="exchangeBase" class="bilingual-label">
            <span class="zh">基礎貨幣</span>
            <span class="en">exchangeBase</span>
          </label>
          <input type="text" id="exchangeBase" value="USD" />
        </div>
        <div class="form-group">
          <label for="exchangeTarget" class="bilingual-label">
            <span class="zh">目標貨幣</span>
            <span class="en">exchangeTarget</span>
          </label>
          <input type="text" id="exchangeTarget" value="CNY" />
        </div>
        <div class="form-group">
          <label for="currencyCodeForRate" class="bilingual-label">
            <span class="zh">匯率貨幣代碼</span>
            <span class="en">currencyCodeForRate</span>
          </label>
          <input type="text" id="currencyCodeForRate" value="CNY" />
        </div>
      </div>
    </div>

    <!-- 7.卡片信息 -->
    <div class="form-section">
      <h3>7.卡片信息</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="cardScheme" class="bilingual-label">
            <span class="zh">卡片組織</span>
            <span class="en">cardScheme</span>
          </label>
          <select id="cardScheme" required>
            <option value="V" selected>V - Visa</option>
            <option value="M">M - Mastercard</option>
            <option value="J">J - JCB</option>
            <option value="A">A - American Express</option>
            <option value="C">C - UnionPay</option>
            <option value="P">P - PayNet</option>
            <option value="S">S - Saudi MADA</option>
            <option value="E">E - EftPos</option>
            <option value="U">U - EMVLab</option>
          </select>
        </div>
        <div class="form-group">
          <label for="acctNumber" class="bilingual-label">
            <span class="zh">帳號原始值</span>
            <span class="en">acctNumber</span>
          </label>
          <input type="text" id="acctNumber" value="4143520000000123" maxlength="19" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableAcctNumberRandom" style="margin: 0" checked />
            <label
              for="enableAcctNumberRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">此欄位不會 POST 出去，僅用於自動生成其他欄位</small>
          <small style="color: red">Visa: 4143520000000000~4143529999999999</small>
          <small style="color: red">MasterCard: 5153520000000000~5153529999999999</small>
        </div>
        <div class="form-group">
          <label for="cardbin6" class="bilingual-label">
            <span class="zh">卡片 BIN (6位)</span>
            <span class="en">cardbin6</span>
          </label>
          <input type="text" id="cardbin6" value="414352" maxlength="6" required disabled />
          <small>自動從帳號原始值前6碼生成</small>
        </div>
        <div class="form-group">
          <label for="acctNumberHashed" class="bilingual-label">
            <span class="zh">帳號雜湊值</span>
            <span class="en">acctNumberHashed</span>
          </label>
          <input
            type="text"
            id="acctNumberHashed"
            value="2hpBkDB7ELbcpebGl5RM+HWTQGx3qciOwskcbsEVKC4="
            disabled
          />
          <small>自動從帳號原始值計算 (HMAC-SHA256 + Base64)</small>
        </div>
        <div class="form-group">
          <label for="acctNumberMask" class="bilingual-label">
            <span class="zh">帳號遮罩</span>
            <span class="en">acctNumberMask</span>
          </label>
          <input type="text" id="acctNumberMask" value="414352******0123" disabled />
          <small>自動從帳號原始值生成（前6碼+******+後4碼）</small>
        </div>
        <div class="form-group">
          <label for="cardbin8" class="bilingual-label">
            <span class="zh">卡片 BIN (8位)</span>
            <span class="en">cardbin8</span>
          </label>
          <input type="text" id="cardbin8" value="41435200" maxlength="8" required disabled />
          <small>自動從帳號原始值前8碼生成</small>
        </div>

        <!-- 卡片組織擴展內容（Visa / Mastercard）-->
        <div class="form-group">
          <label for="visaDafMessageExtension" class="bilingual-label">
            <span class="zh">Visa DAF 訊息擴展</span>
            <span class="en">visaDafMessageExtension</span>
          </label>
          <input type="text" id="visaDafMessageExtension" value="null" />
        </div>
        <div class="form-group">
          <label for="mastercardMessageExtension" class="bilingual-label">
            <span class="zh">Mastercard 訊息擴展</span>
            <span class="en">mastercardMessageExtension</span>
          </label>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px">
            <input type="checkbox" id="enableMastercardExtension" style="margin: 0" />
            <label
              for="enableMastercardExtension"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >啟用 Mastercard 訊息擴展</label
            >
          </div>
          <div
            id="mastercardExtensionContainer"
            style="border: 1px solid #ddd; border-radius: 5px; padding: 10px; background: #f9f9f9"
          >
            <div
              style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px"
            >
              <div>
                <label for="mastercardScore" style="font-size: 0.8em; color: #666"
                  >Score (0-650)</label
                >
                <input
                  type="number"
                  id="mastercardScore"
                  value="600"
                  min="0"
                  max="650"
                  style="width: 100%; padding: 5px"
                />
              </div>
              <div>
                <label for="mastercardDecision" style="font-size: 0.8em; color: #666"
                  >Decision</label
                >
                <select id="mastercardDecision" style="width: 100%; padding: 5px">
                  <option value="Not Low Risk" selected>Not Low Risk</option>
                  <option value="Low Risk">Low Risk</option>
                </select>
              </div>
            </div>
            <div
              style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px"
            >
              <div>
                <label for="mastercardReasonCode1" style="font-size: 0.8em; color: #666"
                  >Reason Code 1</label
                >
                <input
                  type="text"
                  id="mastercardReasonCode1"
                  value="A"
                  maxlength="1"
                  style="width: 100%; padding: 5px"
                />
              </div>
              <div>
                <label for="mastercardReasonCode2" style="font-size: 0.8em; color: #666"
                  >Reason Code 2</label
                >
                <input
                  type="text"
                  id="mastercardReasonCode2"
                  value=""
                  maxlength="1"
                  style="width: 100%; padding: 5px"
                />
              </div>
            </div>
            <div>
              <label for="mastercardStatus" style="font-size: 0.8em; color: #666">Status</label>
              <input
                type="text"
                id="mastercardStatus"
                value="success"
                style="width: 100%; padding: 5px"
              />
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px">
              <input type="checkbox" id="enableMastercardExtensionRandom" style="margin: 0" />
              <label
                for="enableMastercardExtensionRandom"
                style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
                >隨機生成時包含此欄位</label
              >
            </div>
            <small style="color: red">可隨機生成：Score、Decision，其他欄位保持預設值</small>
          </div>
        </div>
        <div class="form-group">
          <label for="visaRiskBasedAuthenticationScore" class="bilingual-label">
            <span class="zh">Visa 風險基礎認證分數</span>
            <span class="en">visaRiskBasedAuthenticationScore</span>
          </label>
          <input
            type="number"
            id="visaRiskBasedAuthenticationScore"
            value=""
            min="0"
            max="99"
            placeholder="留空為 NULL"
          />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableVisaScoreRandom" style="margin: 0" />
            <label
              for="enableVisaScoreRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (0-99)，留空為 NULL</small>
        </div>
      </div>
    </div>

    <!-- 8.3DS 參數 -->
    <div class="form-section">
      <h3>8.3DS 參數</h3>
      <div
        style="
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 5px;
        "
      >
        <input type="checkbox" id="enableAll3DSParamsRandom" style="margin: 0" />
        <label
          for="enableAll3DSParamsRandom"
          style="margin: 0; font-weight: bold; color: #333; font-size: 1em"
          >全選：隨機生成時包含所有 3DS 參數欄位</label
        >
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="messageCategory" class="bilingual-label">
            <span class="zh">訊息類別</span>
            <span class="en">messageCategory</span>
          </label>
          <select id="messageCategory" required>
            <option value="01" selected>01 - PA (Payment Authentication)</option>
            <option value="02">02 - NPA (Non-Payment Authentication)</option>
            <option value="80">80 - Mastercard Identity Check Insights</option>
            <option value="85">85 - Mastercard PVPA</option>
            <option value="86">86 - Mastercard PVNPA</option>
          </select>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableMessageCategory" style="margin: 0" />
            <label
              for="enableMessageCategory"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成，預設關閉</small>
        </div>
        <div class="form-group">
          <label for="deviceChannel" class="bilingual-label">
            <span class="zh">裝置通道</span>
            <span class="en">deviceChannel</span>
          </label>
          <select id="deviceChannel" required>
            <option value="02" selected>02 - Browser (BRW)</option>
            <option value="03">03 - 3DS Requestor Initiated (3RI)</option>
          </select>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableDeviceChannel" style="margin: 0" />
            <label
              for="enableDeviceChannel"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成，預設關閉</small>
        </div>
        <div class="form-group">
          <label for="threeDSRequestorChallengeInd" class="bilingual-label">
            <span class="zh">3DS 請求方挑戰指標</span>
            <span class="en">RequestorChlgInd</span>
          </label>
          <select id="threeDSRequestorChallengeInd" required>
            <option value="01" selected>01 = No preference</option>
            <option value="02">02 = No challenge requested</option>
            <option value="03">03 = Challenge requested: 3DS Requestor Preference</option>
            <option value="04">04 = Challenge requested: Mandate</option>
            <option value="05">
              05 = No challenge requested (transactional risk analysis is already performed)
            </option>
            <option value="06">06 = No challenge requested (Data share only)</option>
            <option value="07">
              07 = No challenge requested (strong consumer authentication is already performed)
            </option>
            <option value="08">
              08 = No challenge requested (utilise Trust List exemption if no challenge required)
            </option>
            <option value="09">
              09 = Challenge requested (Trust List prompt requested if challenge required)
            </option>
            <option value="10">10 = No challenge requested (utilise low value exemption)</option>
            <option value="11">
              11 = No challenge requested (Secure corporate payment exemption)
            </option>
            <option value="12">
              12 = Challenge requested (Device Binding prompt requested if challenge required)
            </option>
            <option value="13">13 = Challenge requested (Issuer requested)</option>
            <option value="14">14 = Challenge requested (Merchant initiated transactions)</option>
            <option value="80">
              80 = (Visa) Remove specified VMID+PAN from Trusted Listing database
            </option>
            <option value="82">
              82 = (Visa) NO CHALLENGE REQUESTED. Secure Corporate Exemption
            </option>
          </select>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableThreeDSRequestorChallengeInd" style="margin: 0" />
            <label
              for="enableThreeDSRequestorChallengeInd"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位（Visa 才會隨機到 80/82）</label
            >
          </div>
          <small style="color: red">可隨機生成，預設關閉</small>
        </div>
        <div class="form-group">
          <label for="authenticationMethod" class="bilingual-label">
            <span class="zh">認證方法</span>
            <span class="en">authenticationMethod</span>
          </label>
          <input type="text" id="authenticationMethod" value="02" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableAuthenticationMethodRandom" style="margin: 0" />
            <label
              for="enableAuthenticationMethodRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (01-05)</small>
        </div>
        <div class="form-group">
          <label for="authenticationType" class="bilingual-label">
            <span class="zh">認證類型</span>
            <span class="en">authenticationType</span>
          </label>
          <input type="text" id="authenticationType" value="02" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableAuthenticationTypeRandom" style="margin: 0" />
            <label
              for="enableAuthenticationTypeRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (01-05)</small>
        </div>
        <div class="form-group">
          <label for="deviceIpAddress" class="bilingual-label">
            <span class="zh">設備 IP 位址</span>
            <span class="en">deviceIpAddress</span>
          </label>
          <input type="text" id="deviceIpAddress" value="::1" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableDeviceIpAddressRandom" style="margin: 0" />
            <label
              for="enableDeviceIpAddressRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位（瀏覽器 IP 會跟隨）</label
            >
          </div>
          <small style="color: red">可隨機生成 IPv4/IPv6，瀏覽器 IP 會自動跟隨</small>
        </div>
        <div class="form-group">
          <label for="browserIP" class="bilingual-label">
            <span class="zh">瀏覽器 IP</span>
            <span class="en">browserIP</span>
          </label>
          <input type="text" id="browserIP" value="::1" />
          <small>自動跟隨設備 IP 位址</small>
        </div>
        <div class="form-group">
          <label for="devicePlatform" class="bilingual-label">
            <span class="zh">設備平台</span>
            <span class="en">devicePlatform</span>
          </label>
          <input type="text" id="devicePlatform" value="MacIntel" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableDevicePlatformRandom" style="margin: 0" />
            <label
              for="enableDevicePlatformRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (如: MacIntel, Win32, Linux x86_64)</small>
        </div>
        <div class="form-group">
          <label for="deviceLocale" class="bilingual-label">
            <span class="zh">設備語言設定</span>
            <span class="en">deviceLocale</span>
          </label>
          <input type="text" id="deviceLocale" value="zh-TW" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableDeviceLocaleRandom" style="margin: 0" />
            <label
              for="enableDeviceLocaleRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (如: zh-TW, zh-CN, en-US)</small>
        </div>
        <div class="form-group">
          <label for="deviceAdvertisingId" class="bilingual-label">
            <span class="zh">設備廣告 ID</span>
            <span class="en">deviceAdvertisingId</span>
          </label>
          <input type="text" id="deviceAdvertisingId" value="4d4427f20375a66287430edd54bd82d2" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableDeviceAdvertisingIdRandom" style="margin: 0" />
            <label
              for="enableDeviceAdvertisingIdRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 32 位十六進制字串</small>
        </div>
        <div class="form-group">
          <label for="threeDSCompInd" class="bilingual-label">
            <span class="zh">3DS 完成指示</span>
            <span class="en">threeDSCompInd</span>
          </label>
          <select id="threeDSCompInd">
            <option value="">留空</option>
            <option value="Y" selected>Y - Yes</option>
            <option value="N">N - No</option>
          </select>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableThreeDSCompIndRandom" style="margin: 0" />
            <label
              for="enableThreeDSCompIndRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (Y/N)</small>
        </div>
        <div class="form-group">
          <label for="merchantCountryCodeStr" class="bilingual-label">
            <span class="zh">商戶國家代碼 (字串)</span>
            <span class="en">merchantCountryCodeStr</span>
          </label>
          <select id="merchantCountryCodeStr">
            <option value="156" selected>156 - 中國 (CN)</option>
            <option value="158">158 - 台灣 (TW)</option>
            <option value="840">840 - 美國 (US)</option>
            <option value="392">392 - 日本 (JP)</option>
            <option value="344">344 - 香港 (HK)</option>
            <option value="410">410 - 韓國 (KR)</option>
            <option value="702">702 - 新加坡 (SG)</option>
            <option value="036">036 - 澳洲 (AU)</option>
            <option value="124">124 - 加拿大 (CA)</option>
            <option value="978">978 - 歐元區 (EU)</option>
            <option value="826">826 - 英國 (GB)</option>
          </select>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableMerchantCountryCodeStrRandom" style="margin: 0" />
            <label
              for="enableMerchantCountryCodeStrRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成，從選單中隨機選擇</small>
        </div>
        <div class="form-group">
          <label for="browserGeoIP" class="bilingual-label">
            <span class="zh">瀏覽器 IP 地理位置</span>
            <span class="en">browserGeoIP</span>
          </label>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableBrowserGeoIPRandom" style="margin: 0" checked />
            <label
              for="enableBrowserGeoIPRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位（預設開啟）</label
            >
          </div>
          <small style="color: red"
            >預設生成地理位置資訊（基於國家代碼），可隨機生成城市、座標等</small
          >
        </div>
        <div class="form-group">
          <label for="deviceGeoIP" class="bilingual-label">
            <span class="zh">設備 IP 地理位置</span>
            <span class="en">deviceGeoIP</span>
          </label>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableDeviceGeoIPRandom" style="margin: 0" checked />
            <label
              for="enableDeviceGeoIPRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位（預設開啟）</label
            >
          </div>
          <small style="color: red"
            >預設生成地理位置資訊（基於國家代碼），可隨機生成城市、座標等</small
          >
        </div>
      </div>
    </div>

    <!-- 9.效能監控 -->
    <div class="form-section">
      <h3>9.效能監控</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="performancePath" class="bilingual-label">
            <span class="zh">Areq URL</span>
            <span class="en">performancePath</span>
          </label>
          <input
            type="text"
            id="performancePath"
            value="/acs-auth/auth/V/2.2.0/ed8544c4-fc50-289d-ee05-ee41c86bb6f5/001/areq"
          />
        </div>
        <div class="form-group">
          <label for="execTime" class="bilingual-label">
            <span class="zh">AReq 執行時間 (毫秒)</span>
            <span class="en">AReq execTime</span>
          </label>
          <input type="number" id="execTime" value="5437" required />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableExecTimeRandom" style="margin: 0" checked />
            <label
              for="enableExecTimeRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (1000-6000ms)，預設開啟</small>
        </div>
        <div class="form-group">
          <label for="creqExecTime" class="bilingual-label">
            <span class="zh">CReq 執行時間 (毫秒)</span>
            <span class="en">CReq execTime</span>
          </label>
          <input type="number" id="creqExecTime" value="500" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableCreqExecTimeRandom" style="margin: 0" checked />
            <label
              for="enableCreqExecTimeRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (300-800ms)，預設開啟</small>
        </div>
        <div class="form-group">
          <label for="rreqExecTime" class="bilingual-label">
            <span class="zh">RReq 執行時間 (毫秒)</span>
            <span class="en">RReq execTime</span>
          </label>
          <input type="number" id="rreqExecTime" value="400" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableRreqExecTimeRandom" style="margin: 0" checked />
            <label
              for="enableRreqExecTimeRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (200-600ms)，預設開啟</small>
        </div>
        <div class="form-group">
          <label for="rbaExecTime" class="bilingual-label">
            <span class="zh">RBA 執行時間 (毫秒)</span>
            <span class="en">RBA execTime</span>
          </label>
          <input type="number" id="rbaExecTime" value="100" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableRbaExecTimeRandom" style="margin: 0" checked />
            <label
              for="enableRbaExecTimeRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (50-200ms)，預設開啟</small>
        </div>
        <div class="form-group">
          <label for="cavvExecTime" class="bilingual-label">
            <span class="zh">CAVV 響應時間 (毫秒)</span>
            <span class="en">CAVV execTime</span>
          </label>
          <input type="number" id="cavvExecTime" value="20" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableCavvExecTimeRandom" style="margin: 0" checked />
            <label
              for="enableCavvExecTimeRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (10-30ms)，預設開啟</small>
        </div>
        <div class="form-group">
          <label for="otpExecTime" class="bilingual-label">
            <span class="zh">簡訊OTP響應時間 (毫秒)</span>
            <span class="en">OTP execTime</span>
          </label>
          <input type="number" id="otpExecTime" value="50" />
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
            <input type="checkbox" id="enableOtpExecTimeRandom" style="margin: 0" checked />
            <label
              for="enableOtpExecTimeRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成 (20-80ms)，預設開啟</small>
        </div>
      </div>
    </div>

    <!-- 10.錯誤處理 -->
    <div class="form-section">
      <h3>10.錯誤處理(暫時都NULL_VALUE，也不隨機)</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="errorComponent" class="bilingual-label">
            <span class="zh">錯誤組件</span>
            <span class="en">errorComponent</span>
          </label>
          <input type="text" id="errorComponent" value="NULL_VALUE" />
        </div>
        <div class="form-group">
          <label for="errorDescription" class="bilingual-label">
            <span class="zh">錯誤描述</span>
            <span class="en">errorDescription</span>
          </label>
          <input type="text" id="errorDescription" value="NULL_VALUE" />
        </div>
        <div class="form-group">
          <label for="errorCode" class="bilingual-label">
            <span class="zh">錯誤代碼</span>
            <span class="en">errorCode</span>
          </label>
          <input type="text" id="errorCode" value="NULL_VALUE" />
        </div>
        <div class="form-group">
          <label for="errorDetail" class="bilingual-label">
            <span class="zh">錯誤詳情</span>
            <span class="en">errorDetail</span>
          </label>
          <input type="text" id="errorDetail" value="NULL_VALUE" />
        </div>
        <div class="form-group">
          <label for="errorMessageType" class="bilingual-label">
            <span class="zh">錯誤訊息類型</span>
            <span class="en">errorMessageType</span>
          </label>
          <input type="text" id="errorMessageType" value="NULL_VALUE" />
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped></style>
