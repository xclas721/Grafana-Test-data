<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import BaseConfigSection from './sections/BaseConfigSection.vue'
import TransactionIdSection from './sections/TransactionIdSection.vue'
import TransactionStatusSection from './sections/TransactionStatusSection.vue'
import MerchantInfoSection from './sections/MerchantInfoSection.vue'
import PurchaseAmountSection from './sections/PurchaseAmountSection.vue'
import CountryCurrencySection from './sections/CountryCurrencySection.vue'
import ExchangeRateSection from './sections/ExchangeRateSection.vue'
import CardInfoSection from './sections/CardInfoSection.vue'
import ThreeDSParamsSection from './sections/ThreeDSParamsSection.vue'
import PerformanceSection from './sections/PerformanceSection.vue'
import ErrorHandlingSection from './sections/ErrorHandlingSection.vue'

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
  const alertClass =
    type === 'success'
      ? 'alert alert-success'
      : type === 'error'
        ? 'alert alert-error'
        : type === 'warning'
          ? 'alert alert-warning'
          : 'alert alert-info'
  statusDiv.innerHTML = `<div class="${alertClass} text-sm">${message}</div>`
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

  <form id="acsForm" class="space-y-6">
    <BaseConfigSection />

    <TransactionIdSection />

    <TransactionStatusSection />

    <MerchantInfoSection />

    <PurchaseAmountSection />

    <CountryCurrencySection />

    <ExchangeRateSection />

    <CardInfoSection />

    <ThreeDSParamsSection />

    <PerformanceSection />

    <ErrorHandlingSection />
  </form>
</template>

<style scoped></style>
