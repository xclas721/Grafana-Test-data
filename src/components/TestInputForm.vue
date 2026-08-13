<script setup lang="ts">
import { onMounted, watch, computed, ref } from 'vue'
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
import {
  COUNTRY_NUMERIC_MAP,
  CURRENCY_NUMERIC_MAP,
  MERCHANT_COUNTRY_CODE_ASIA_VALUES,
  MERCHANT_COUNTRY_CODE_STR_VALUES
} from '@/shared/constants/countryCurrency'
import {
  MERCHANT_MCC_OPTIONS,
  REQUESTOR_MERCHANT_POOL_MAP
} from '@/shared/constants/merchantPool'
import { NULL_VALUE } from '@/shared/constants/nullValue'
import {
  DEFAULT_REQUESTOR_ID,
  REQUESTOR_ID_OPTIONS,
  REQUESTOR_MERCHANT_WEIGHTS
} from '@/shared/constants/requestorIds'
import { defaultStateMachineReason } from '@/shared/constants/stateMachineReason'
import {
  buildTimeRangeDisplayHtml,
  computeAutoTimeRangeFromNow,
  generateSharedTimestamp
} from '@/shared/utils/timeRange'
import { buildDocument } from '@/shared/utils/testDataDocument'
import {
  computeAresWeightTotal,
  computeExpectedRates,
  computeRreqWeightTotal,
  parsePercent,
  rollRandomStatuses,
  resolveStatusDependencies
} from '@/composables/useTransactionStatusRules'
import { randomizeBusinessFields } from '@/composables/useBusinessFieldRandomizer'
import { useTestInputFormState } from '@/composables/useTestInputFormState'
import { randomizeThreeDSDeviceFields } from '@/composables/useTestDataRandomizer'
import { randomizeTimingAndGeoFields } from '@/composables/useTimingAndGeoRandomizer'

const props = defineProps<{
  activeMode?: 'acs' | 'dss'
  batchDays?: number
  enableAutoTimeRange?: boolean
}>()
const emit = defineEmits<{
  (e: 'update:enableAutoTimeRange', value: boolean): void
}>()

const modeText = computed(() => {
  if (props.activeMode === 'dss') return '3DSS'
  return 'ACS'
})

const modeClass = computed(() => {
  if (props.activeMode === 'dss') return 'mode-indicator dss'
  return 'mode-indicator acs'
})

const timeRangeHtml = ref('請選擇日期')
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info' | 'warning'>('info')

const statusClass = computed(() => {
  return statusType.value === 'success'
    ? 'alert alert-success'
    : statusType.value === 'error'
      ? 'alert alert-error'
      : statusType.value === 'warning'
        ? 'alert alert-warning'
        : 'alert alert-info'
})

const disableMastercardExtension = computed(() => formState.enableVisaScoreRandom)
const disableVisaScoreRandom = computed(() => formState.enableMastercardExtension)
const showMastercardExtension = computed(() => formState.enableMastercardExtension)

const { formState, setField, setFields, getFormData, getFormDataForBatchInsert } =
  useTestInputFormState({ enableAutoTimeRange: props.enableAutoTimeRange })

const threeDSParamKeys = [
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
] as const

type ThreeDSParamKey = (typeof threeDSParamKeys)[number]

let syncingAll3DSParams = false

watch(
  () => threeDSParamKeys.map((key) => formState[key]),
  () => {
    const allChecked = threeDSParamKeys.every((key) => formState[key])
    if (formState.enableAll3DSParamsRandom !== allChecked) {
      syncingAll3DSParams = true
      formState.enableAll3DSParamsRandom = allChecked
    }
  }
)

watch(
  () => formState.enableAll3DSParamsRandom,
  (checked) => {
    if (syncingAll3DSParams) {
      syncingAll3DSParams = false
      return
    }
    threeDSParamKeys.forEach((key) => {
      formState[key as ThreeDSParamKey] = checked
    })
  }
)

watch(
  () => props.activeMode,
  (mode) => {
    const v = String(formState.stateMachineReason || '').trim()
    if (mode === 'dss') {
      if (/^[0-9]{4}$/.test(v)) setField('stateMachineReason', 'S3401')
    } else if (mode === 'acs') {
      if (/^S[0-9]+$/.test(v)) setField('stateMachineReason', '0000')
    }
  }
)

const ARES_WEIGHT_KEYS = [
  'aresWeightY',
  'aresWeightN',
  'aresWeightR',
  'aresWeightC',
  'aresWeightD',
  'aresWeightA',
  'aresWeightI',
  'aresWeightS',
  'aresWeightU'
] as const

const DEFAULT_CHALLENGE_CANCEL_RATE = 0.08

const ACQUIRER_BIN_OPTIONS = ['1231234', '1239999', '9991234', '9999999'] as const

const aresWeightTotal = computed(() => computeAresWeightTotal(formState))
const aresWeightUnallocated = computed(() => 100 - aresWeightTotal.value)

const rreqWeightTotal = computed(() => computeRreqWeightTotal(formState))
const rreqWeightUnallocated = computed(() => 100 - rreqWeightTotal.value)

const expectedRates = computed(() => computeExpectedRates(formState))
const expectedFrictionlessRate = computed(() => expectedRates.value.expectedFrictionlessRate)
const expectedChallengeSuccessRate = computed(
  () => expectedRates.value.expectedChallengeSuccessRate
)
const expectedTransactionSuccessRate = computed(
  () => expectedRates.value.expectedTransactionSuccessRate
)

function calculateAcctNumberHashed(acctNumber: string) {
  // 假資料用途：同步 cyrb53，穩定且每卡唯一即可（A-06 distinct 測試用）
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < acctNumber.length; i++) {
    const ch = acctNumber.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hashNum = 4294967296 * (2097151 & h2) + (h1 >>> 0)
  const hashHex = hashNum.toString(16).padStart(16, '0')
  setField('acctNumberHashed', btoa(hashHex + acctNumber.substring(0, 8)))
}

function updateCardInfoFromAcctNumber() {
  const acct = formState.acctNumber || ''
  if (acct.length >= 6) setField('cardbin6', acct.substring(0, 6))
  if (acct.length >= 8) setField('cardbin8', acct.substring(0, 8))
  if (acct.length >= 10) {
    const first6 = acct.substring(0, 6)
    const last4 = acct.substring(acct.length - 4)
    setField('acctNumberMask', first6 + '******' + last4)
    calculateAcctNumberHashed(acct)
  }
}

function syncStatusDependencies() {
  const next = resolveStatusDependencies({
    activeMode: props.activeMode,
    aresTransStatus: formState.aresTransStatus,
    rreqTransStatus: formState.rreqTransStatus,
    transStatusReason: formState.transStatusReason,
    stateMachineReason: formState.stateMachineReason,
    challengeCancel: formState.challengeCancel
  })

  formState.disableRreqTransStatus = next.disableRreqTransStatus
  formState.disableTransStatusReason = next.disableTransStatusReason
  formState.disableStateMachineReason = next.disableStateMachineReason
  formState.disableChallengeCancel = next.disableChallengeCancel

  setField('rreqTransStatus', next.rreqTransStatus)
  setField('transStatus', next.transStatus)
  setField('transStatusReason', next.transStatusReason)
  setField('stateMachineReason', next.stateMachineReason)
  if (next.aresTransStatus) setField('aresTransStatus', next.aresTransStatus)
  if (next.stateMachineReasonMode) setField('stateMachineReasonMode', next.stateMachineReasonMode)

  if (next.disableChallengeCancel) {
    if (formState.challengeCancel !== NULL_VALUE) setField('challengeCancel', NULL_VALUE)
  } else if (formState.challengeCancel === NULL_VALUE) {
    setField('challengeCancel', '01')
  }
}

function updateTimeRangeDisplay() {
  timeRangeHtml.value = buildTimeRangeDisplayHtml({
    currentDate: formState.currentDate,
    timezone: formState.timezone || 'browser',
    batchDays: Math.max(0, Math.floor(props.batchDays ?? 0)),
    useCustomRange: formState.enableCustomTimeRange,
    startDateTime: formState.startDateTime,
    endDateTime: formState.endDateTime
  })
}

function loadDefaults() {
  setField('baseUrl', 'http://localhost:9200')
  setField('username', 'elastic')
  setField('password', '123456')
  formState.enableCustomTimeRange = true
  formState.enableAutoTimeRange = true
  setField('startDateTime', '')
  setField('endDateTime', '')
  updateCustomTimeRangeFromNow()
  setField('issuerOid', '06b4b203-da05-73f9-256f-454929df6076')
  setField('requestorId', DEFAULT_REQUESTOR_ID)
  setField('acsTransId', cryptoRandomUUID())
  setField('threeDSServerTransId', cryptoRandomUUID().toLowerCase())
  setField('aresTransStatus', 'N')
  setField('transStatus', 'N')
  setField('rreqTransStatus', NULL_VALUE)
  setField('transStatusReason', NULL_VALUE)
  setField('stateMachineReason', defaultStateMachineReason(props.activeMode))
  setField('transStatusReasonMode', 'random')
  setField('stateMachineReasonMode', 'random')
  setField('merchantName', 'HiTRUST EMV Demo Merchant')
  setField('merchantCountryCode', '156')
  setField('acquirerMerchantId', '8909191')
  setField('acquirerBin', '1231234')
  setField('mcc', '5661')
  setField('purchaseAmount', '100')
  setField('purchaseCurrency', '156')
  setField('purchaseExponent', '2')
  setField('usdAmount', '0.13841979956813022')
  setField('exchangeRate', '7.2244')
  setField('exchangeBase', 'USD')
  setField('exchangeTarget', 'CNY')
  setField('currencyCodeForRate', 'CNY')
  setField('cardScheme', 'V')
  setField('acctNumber', '4143520000000123')
  setField('cardbin6', '414352')
  setField('cardbin8', '41435200')
  setField('acctNumberMask', '414352******0123')
  setField('acctNumberHashed', '2hpBkDB7ELbcpebGl5RM+HWTQGx3qciOwskcbsEVKC4=')
  setField('visaDafMessageExtension', 'null')
  setField('mastercardScore', '600')
  setField('mastercardDecision', 'Not Low Risk')
  setField('mastercardReasonCode1', 'A')
  setField('mastercardReasonCode2', '')
  setField('mastercardStatus', 'success')
  setField('visaRiskBasedAuthenticationScore', '')
  updateCardInfoFromAcctNumber()
  setField('messageCategory', '01')
  setField('messageVersion', '2.2.0')
  setField('deviceChannel', '02')
  setField('threeDSRequestorChallengeInd', '01')
  setField('authenticationMethod', '02')
  setField('authenticationType', '02')
  setField('deviceIpAddress', '::1')
  setField('browserIP', '::1')
  setField('devicePlatform', 'MacIntel')
  setField('deviceLocale', 'zh-TW')
  setField('deviceAdvertisingId', '4d4427f20375a66287430edd54bd82d2')
  setField('threeDSCompInd', 'Y')
  setField('merchantCountryCodeStr', '156')
  setField(
    'performancePath',
    '/acs-auth/auth/V/2.2.0/06b4b203-da05-73f9-256f-454929df6076/001/areq'
  )
  setField('execTime', '5437')
  setField('creqExecTime', '500')
  setField('rreqExecTime', '400')
  setField('rbaExecTime', '100')
  setField('cavvExecTime', '20')
  setField('otpExecTime', '50')
  setField('errorComponent', NULL_VALUE)
  setField('errorDescription', NULL_VALUE)
  setField('errorCode', NULL_VALUE)
  setField('errorDetail', NULL_VALUE)
  setField('errorMessageType', NULL_VALUE)
  formState.enableBatchErrorMix = true
  setField('batchErrorMixPercent', '15')
  setField('challengeCancel', NULL_VALUE)
  setField('countryAlpha2', 'CN')
  setField('countryNumeric', '156')
  setField('countryAlpha3', 'CHN')
  setField('countryName', 'China')
  setField('currencyMinorUnit', '2')
  setField('currencyName', 'Yuan Renminbi')
  setField('currencyAlphabeticCode', 'CNY')
  setField('currencyNumericCode', '156')
  syncStatusDependencies()
  setField('aresWeightY', '6')
  setField('aresWeightN', '10')
  setField('aresWeightR', '10')
  setField('aresWeightC', '64')
  setField('aresWeightD', '0')
  setField('aresWeightA', '0')
  setField('aresWeightI', '1')
  setField('aresWeightS', '0')
  setField('aresWeightU', '9')
  setField('rreqWeightNull', '5')
  setField('rreqWeightY', '74')
  setField('rreqWeightN', '8')
  setField('rreqWeightU', '7')
  setField('rreqWeightR', '6')
  setField('challengeCancelRate', '8')
  formState.enablePurchaseAmountRandom = true
  formState.enablePurchaseCurrencyRandom = true
  formState.enableAcquirerMerchantIdRandom = true
  formState.enableAcquirerBinRandom = true
  formState.enableAcctNumberRandom = true
  formState.enableMerchantCountryCodeRandom = true
  formState.enableMerchantCountryAsiaOnly = true
  formState.enableMerchantRandom = true
  formState.enableRequestorRandom = false
  formState.enableCardSchemeRandom = true
  formState.enableMastercardExtension = false
  formState.enableMastercardExtensionRandom = false
  formState.enableVisaScoreRandom = false
  formState.enableExecTimeRandom = true
  formState.enableCreqExecTimeRandom = true
  formState.enableRreqExecTimeRandom = true
  formState.enableRbaExecTimeRandom = true
  formState.enableCavvExecTimeRandom = true
  formState.enableOtpExecTimeRandom = true
  formState.enableAll3DSParamsRandom = true
  formState.enableMessageCategory = true
  formState.enableDeviceChannel = true
  formState.enableThreeDSRequestorChallengeInd = true
  formState.enableAuthenticationMethodRandom = true
  formState.enableAuthenticationTypeRandom = true
  formState.enableDeviceIpAddressRandom = true
  formState.enableDevicePlatformRandom = true
  formState.enableDeviceLocaleRandom = true
  formState.enableDeviceAdvertisingIdRandom = true
  formState.enableThreeDSCompIndRandom = true
  formState.enableMerchantCountryCodeStrRandom = false
  formState.enableBrowserGeoIPRandom = true
  formState.enableDeviceGeoIPRandom = true
  setStatus('預設值已載入 (Vue 移植版)', 'success')
}

function generateRandom(forcedCard?: { scheme: string; acctNumber: string }) {
  const set = (id: string, val: string) => setField(id, val)
  const applyUpdates = (updates: Record<string, string>) => {
    for (const [key, value] of Object.entries(updates)) set(key, value)
  }

  // 1) 先刷新交易 ID，確保每次隨機都有新樣本
  applyUpdates({
    acsTransId: cryptoRandomUUID(),
    threeDSServerTransId: cryptoRandomUUID().toLowerCase()
  })

  // 2) 權重總和校驗：不符合就直接中止
  if (aresWeightTotal.value !== 100) {
    setStatus(`ARes 權重未分配 ${aresWeightUnallocated.value}% ，請調整至 100%`, 'warning')
    return
  }
  if (rreqWeightTotal.value !== 100) {
    setStatus(`RReq 權重未分配 ${rreqWeightUnallocated.value}% ，請調整至 100%`, 'warning')
    return
  }

  // 3) 時間/幣別/國別同步
  const timingGeoUpdates = randomizeTimingAndGeoFields({
    purchaseCurrency: formState.purchaseCurrency,
    merchantCountryCode: formState.merchantCountryCode,
    merchantCountryCodeStr: formState.merchantCountryCodeStr,
    enablePurchaseCurrencyRandom: formState.enablePurchaseCurrencyRandom,
    enableMerchantCountryCodeRandom: formState.enableMerchantCountryCodeRandom,
    enableMerchantCountryAsiaOnly: formState.enableMerchantCountryAsiaOnly,
    enableExecTimeRandom: formState.enableExecTimeRandom,
    enableCreqExecTimeRandom: formState.enableCreqExecTimeRandom,
    enableRreqExecTimeRandom: formState.enableRreqExecTimeRandom,
    enableRbaExecTimeRandom: formState.enableRbaExecTimeRandom,
    enableCavvExecTimeRandom: formState.enableCavvExecTimeRandom,
    enableOtpExecTimeRandom: formState.enableOtpExecTimeRandom,
    countryNumericMap: COUNTRY_NUMERIC_MAP,
    currencyNumericMap: CURRENCY_NUMERIC_MAP,
    merchantCountryAsiaValues: MERCHANT_COUNTRY_CODE_ASIA_VALUES,
    merchantCountryValues: MERCHANT_COUNTRY_CODE_STR_VALUES
  })
  applyUpdates(timingGeoUpdates)

  // 4) 狀態（依照 Grafana-Test-Input.html 的權重分佈）
  const rolledStatuses = rollRandomStatuses({
    activeMode: props.activeMode,
    stateMachineReasonMode: formState.stateMachineReasonMode,
    stateMachineReason: formState.stateMachineReason,
    aresWeightY: formState.aresWeightY,
    aresWeightN: formState.aresWeightN,
    aresWeightR: formState.aresWeightR,
    aresWeightC: formState.aresWeightC,
    aresWeightD: formState.aresWeightD,
    aresWeightA: formState.aresWeightA,
    aresWeightI: formState.aresWeightI,
    aresWeightS: formState.aresWeightS,
    aresWeightU: formState.aresWeightU,
    rreqWeightNull: formState.rreqWeightNull,
    rreqWeightY: formState.rreqWeightY,
    rreqWeightN: formState.rreqWeightN,
    rreqWeightU: formState.rreqWeightU,
    rreqWeightR: formState.rreqWeightR
  })
  const st = rolledStatuses.aresTransStatus
  const challengeCancelRate =
    parsePercent(formState.challengeCancelRate, DEFAULT_CHALLENGE_CANCEL_RATE * 100) / 100
  applyUpdates({
    aresTransStatus: rolledStatuses.aresTransStatus,
    rreqTransStatus: rolledStatuses.rreqTransStatus,
    transStatus: rolledStatuses.transStatus,
    stateMachineReason: rolledStatuses.stateMachineReason
  })

  // 5) 商務欄位（卡組織/卡號/商戶/reason/challengeCancel）
  const businessRandomResult = randomizeBusinessFields({
    activeMode: props.activeMode,
    aresTransStatus: st,
    rreqTransStatus: rolledStatuses.rreqTransStatus,
    transStatusReasonMode: formState.transStatusReasonMode,
    transStatusReason: formState.transStatusReason,
    challengeCancelRate,
    cardScheme: formState.cardScheme,
    enablePurchaseAmountRandom: formState.enablePurchaseAmountRandom,
    enableCardSchemeRandom: formState.enableCardSchemeRandom,
    enableAcctNumberRandom: formState.enableAcctNumberRandom,
    enableAcquirerMerchantIdRandom: formState.enableAcquirerMerchantIdRandom,
    enableAcquirerBinRandom: formState.enableAcquirerBinRandom,
    enableMerchantRandom: formState.enableMerchantRandom,
    enableRequestorRandom: formState.enableRequestorRandom,
    enableVisaScoreRandom: formState.enableVisaScoreRandom,
    enableMastercardExtension: formState.enableMastercardExtension,
    enableMastercardExtensionRandom: formState.enableMastercardExtensionRandom,
    acquirerBinOptions: ACQUIRER_BIN_OPTIONS,
    merchantOptions: MERCHANT_MCC_OPTIONS,
    requestorIdOptions: REQUESTOR_ID_OPTIONS,
    requestorId: formState.requestorId,
    requestorWeights: REQUESTOR_MERCHANT_WEIGHTS,
    merchantPoolsByRequestor: REQUESTOR_MERCHANT_POOL_MAP,
    forcedCardScheme: forcedCard?.scheme,
    forcedAcctNumber: forcedCard?.acctNumber
  })
  applyUpdates(businessRandomResult.updates)
  if (businessRandomResult.updates.cardScheme) {
    syncCardSchemeToggles(businessRandomResult.updates.cardScheme)
  }
  if (businessRandomResult.updates.acctNumber) {
    updateCardInfoFromAcctNumber()
  }

  // 6) 3DS/裝置欄位
  const threeDSDeviceUpdates = randomizeThreeDSDeviceFields({
    enableMessageCategory: formState.enableMessageCategory,
    enableDeviceChannel: formState.enableDeviceChannel,
    enableThreeDSRequestorChallengeInd: formState.enableThreeDSRequestorChallengeInd,
    enableDeviceIpAddressRandom: formState.enableDeviceIpAddressRandom,
    enableDevicePlatformRandom: formState.enableDevicePlatformRandom,
    enableDeviceLocaleRandom: formState.enableDeviceLocaleRandom,
    enableDeviceAdvertisingIdRandom: formState.enableDeviceAdvertisingIdRandom,
    enableThreeDSCompIndRandom: formState.enableThreeDSCompIndRandom,
    enableAuthenticationMethodRandom: formState.enableAuthenticationMethodRandom,
    enableAuthenticationTypeRandom: formState.enableAuthenticationTypeRandom
  })
  applyUpdates(
    Object.fromEntries(Object.entries(threeDSDeviceUpdates).map(([k, v]) => [k, String(v)]))
  )

  setStatus('隨機數據已生成', 'success')
}

function syncCardSchemeToggles(scheme: string) {
  if (scheme === 'V') {
    formState.enableVisaScoreRandom = true
    formState.enableMastercardExtension = false
    formState.enableMastercardExtensionRandom = false
  } else if (scheme === 'M') {
    formState.enableVisaScoreRandom = false
    formState.enableMastercardExtension = true
    formState.enableMastercardExtensionRandom = true
  } else {
    formState.enableVisaScoreRandom = false
    formState.enableMastercardExtension = false
    formState.enableMastercardExtensionRandom = false
  }
}

function setStatus(message: string, type: 'success' | 'error' | 'info' | 'warning') {
  statusMessage.value = message
  statusType.value = type
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
  if (!formState.currentDate) setField('currentDate', dateStr)
  if (formState.enableCustomTimeRange) {
    updateCustomTimeRangeFromNow()
  }
  // 時間區間顯示
  updateTimeRangeDisplay()

  watch(
    () => [formState.enableVisaScoreRandom, formState.enableMastercardExtension],
    ([visaOn, mcOn]) => {
      if (visaOn) {
        setField('cardScheme', 'V')
        setStatus('Visa Score 已開啟，卡別鎖定為 Visa，Mastercard 已禁用', 'info')
      } else if (mcOn) {
        setField('cardScheme', 'M')
        setStatus('Mastercard 擴展已開啟，卡別鎖定為 Mastercard，Visa Score 已禁用', 'info')
      } else {
        setStatus('卡別選擇與擴展設定恢復可調整', 'info')
      }
    },
    { immediate: true }
  )
})

watch(
  () => props.enableAutoTimeRange,
  (value) => {
    if (value === undefined) return
    if (formState.enableAutoTimeRange !== value) {
      formState.enableAutoTimeRange = value
    }
  },
  { immediate: true }
)

watch(
  () => formState.enableAutoTimeRange,
  (value) => {
    emit('update:enableAutoTimeRange', value)
  },
  { immediate: true }
)

watch(
  () => [
    formState.currentDate,
    formState.enableCustomTimeRange,
    formState.enableAutoTimeRange,
    formState.timezone,
    props.batchDays
  ],
  () => {
    if (formState.enableCustomTimeRange && formState.enableAutoTimeRange) {
      updateCustomTimeRangeFromNow()
    }
    updateTimeRangeDisplay()
  }
)

watch(
  () => [formState.aresTransStatus, formState.rreqTransStatus, formState.challengeCancel],
  () => {
    syncStatusDependencies()
  },
  { immediate: true }
)

watch(
  () => formState.acctNumber,
  () => {
    updateCardInfoFromAcctNumber()
  }
)

watch(
  () => formState.deviceIpAddress,
  (value) => {
    if (value && value !== formState.browserIP) setField('browserIP', value)
  }
)

watch(
  () => formState.cardScheme,
  (scheme) => {
    if (scheme === 'V') {
      if (!formState.enableVisaScoreRandom) formState.enableVisaScoreRandom = true
      if (formState.enableMastercardExtension) formState.enableMastercardExtension = false
      if (formState.enableMastercardExtensionRandom) {
        formState.enableMastercardExtensionRandom = false
      }
    } else if (scheme === 'M') {
      if (formState.enableVisaScoreRandom) formState.enableVisaScoreRandom = false
      if (!formState.enableMastercardExtension) formState.enableMastercardExtension = true
      if (!formState.enableMastercardExtensionRandom) {
        formState.enableMastercardExtensionRandom = true
      }
    } else if (formState.enableVisaScoreRandom) {
      formState.enableVisaScoreRandom = false
    } else if (formState.enableMastercardExtension) {
      formState.enableMastercardExtension = false
      formState.enableMastercardExtensionRandom = false
    }
  },
  { immediate: true }
)

function updateCustomTimeRangeFromNow() {
  if (!formState.enableCustomTimeRange || !formState.enableAutoTimeRange) return
  const tz = formState.timezone || 'browser'
  const days = Math.max(0, Math.floor(props.batchDays ?? 0))
  const { startDateTime, endDateTime } = computeAutoTimeRangeFromNow(new Date(), tz, days)
  setField('endDateTime', endDateTime)
  setField('startDateTime', startDateTime)
}
defineExpose({
  loadDefaults,
  generateRandom,
  getFormData,
  getFormDataForBatchInsert,
  buildDocument,
  generateSharedTimestamp,
  setStatus,
  setFields,
  updateCustomTimeRangeFromNow
})
</script>

<template>
  <div v-if="statusMessage" class="mb-4">
    <div :class="statusClass" class="text-sm">{{ statusMessage }}</div>
  </div>

  <form id="acsForm" class="space-y-6">
    <BaseConfigSection
      v-model:baseUrl="formState.baseUrl"
      v-model:username="formState.username"
      v-model:password="formState.password"
      v-model:currentDate="formState.currentDate"
      v-model:enableCustomTimeRange="formState.enableCustomTimeRange"
      v-model:enableAutoTimeRange="formState.enableAutoTimeRange"
      v-model:startDateTime="formState.startDateTime"
      v-model:endDateTime="formState.endDateTime"
      v-model:timezone="formState.timezone"
      :modeText="modeText"
      :modeClass="modeClass"
      :timeRangeHtml="timeRangeHtml"
    />

    <TransactionIdSection
      v-model:issuerOid="formState.issuerOid"
      v-model:requestorId="formState.requestorId"
      v-model:enableRequestorRandom="formState.enableRequestorRandom"
      v-model:acsTransId="formState.acsTransId"
      v-model:threeDSServerTransId="formState.threeDSServerTransId"
    />

    <TransactionStatusSection
      :activeMode="props.activeMode"
      v-model:aresTransStatus="formState.aresTransStatus"
      v-model:transStatus="formState.transStatus"
      v-model:rreqTransStatus="formState.rreqTransStatus"
      v-model:transStatusReason="formState.transStatusReason"
      v-model:stateMachineReason="formState.stateMachineReason"
      v-model:transStatusReasonMode="formState.transStatusReasonMode"
      v-model:stateMachineReasonMode="formState.stateMachineReasonMode"
      v-model:challengeCancel="formState.challengeCancel"
      v-model:aresWeightY="formState.aresWeightY"
      v-model:aresWeightN="formState.aresWeightN"
      v-model:aresWeightR="formState.aresWeightR"
      v-model:aresWeightC="formState.aresWeightC"
      v-model:aresWeightD="formState.aresWeightD"
      v-model:aresWeightA="formState.aresWeightA"
      v-model:aresWeightI="formState.aresWeightI"
      v-model:aresWeightS="formState.aresWeightS"
      v-model:aresWeightU="formState.aresWeightU"
      v-model:rreqWeightNull="formState.rreqWeightNull"
      v-model:rreqWeightY="formState.rreqWeightY"
      v-model:rreqWeightN="formState.rreqWeightN"
      v-model:rreqWeightU="formState.rreqWeightU"
      v-model:rreqWeightR="formState.rreqWeightR"
      v-model:challengeCancelRate="formState.challengeCancelRate"
      :aresWeightTotal="aresWeightTotal"
      :aresWeightUnallocated="aresWeightUnallocated"
      :rreqWeightTotal="rreqWeightTotal"
      :rreqWeightUnallocated="rreqWeightUnallocated"
      :expectedTransactionSuccessRate="expectedTransactionSuccessRate"
      :expectedFrictionlessRate="expectedFrictionlessRate"
      :expectedChallengeSuccessRate="expectedChallengeSuccessRate"
      :disableRreqTransStatus="formState.disableRreqTransStatus"
      :disableTransStatusReason="formState.disableTransStatusReason"
      :disableStateMachineReason="formState.disableStateMachineReason"
      :disableChallengeCancel="formState.disableChallengeCancel"
    />

    <MerchantInfoSection
      v-model:merchantName="formState.merchantName"
      v-model:merchantCountryCode="formState.merchantCountryCode"
      v-model:acquirerMerchantId="formState.acquirerMerchantId"
      v-model:acquirerBin="formState.acquirerBin"
      v-model:mcc="formState.mcc"
      v-model:enableAcquirerMerchantIdRandom="formState.enableAcquirerMerchantIdRandom"
      v-model:enableAcquirerBinRandom="formState.enableAcquirerBinRandom"
      v-model:enableMerchantCountryCodeRandom="formState.enableMerchantCountryCodeRandom"
      v-model:enableMerchantCountryAsiaOnly="formState.enableMerchantCountryAsiaOnly"
      v-model:enableMerchantRandom="formState.enableMerchantRandom"
    />

    <PurchaseAmountSection
      v-model:purchaseAmount="formState.purchaseAmount"
      v-model:purchaseCurrency="formState.purchaseCurrency"
      v-model:purchaseExponent="formState.purchaseExponent"
      v-model:usdAmount="formState.usdAmount"
      v-model:enablePurchaseAmountRandom="formState.enablePurchaseAmountRandom"
      v-model:enablePurchaseCurrencyRandom="formState.enablePurchaseCurrencyRandom"
    />

    <CountryCurrencySection
      v-model:countryAlpha2="formState.countryAlpha2"
      v-model:countryNumeric="formState.countryNumeric"
      v-model:countryAlpha3="formState.countryAlpha3"
      v-model:countryName="formState.countryName"
      v-model:currencyMinorUnit="formState.currencyMinorUnit"
      v-model:currencyName="formState.currencyName"
      v-model:currencyAlphabeticCode="formState.currencyAlphabeticCode"
      v-model:currencyNumericCode="formState.currencyNumericCode"
    />

    <ExchangeRateSection
      v-model:exchangeRate="formState.exchangeRate"
      v-model:exchangeBase="formState.exchangeBase"
      v-model:exchangeTarget="formState.exchangeTarget"
      v-model:currencyCodeForRate="formState.currencyCodeForRate"
    />

    <CardInfoSection
      v-model:cardScheme="formState.cardScheme"
      v-model:acctNumber="formState.acctNumber"
      v-model:cardbin6="formState.cardbin6"
      v-model:acctNumberHashed="formState.acctNumberHashed"
      v-model:acctNumberMask="formState.acctNumberMask"
      v-model:cardbin8="formState.cardbin8"
      v-model:enableCardSchemeRandom="formState.enableCardSchemeRandom"
      v-model:visaDafMessageExtension="formState.visaDafMessageExtension"
      v-model:mastercardScore="formState.mastercardScore"
      v-model:mastercardDecision="formState.mastercardDecision"
      v-model:mastercardReasonCode1="formState.mastercardReasonCode1"
      v-model:mastercardReasonCode2="formState.mastercardReasonCode2"
      v-model:mastercardStatus="formState.mastercardStatus"
      v-model:visaRiskBasedAuthenticationScore="formState.visaRiskBasedAuthenticationScore"
      v-model:enableAcctNumberRandom="formState.enableAcctNumberRandom"
      v-model:cardPoolRatio="formState.cardPoolRatio"
      v-model:enableMastercardExtension="formState.enableMastercardExtension"
      v-model:enableMastercardExtensionRandom="formState.enableMastercardExtensionRandom"
      v-model:enableVisaScoreRandom="formState.enableVisaScoreRandom"
      :disableMastercardExtension="disableMastercardExtension"
      :disableVisaScoreRandom="disableVisaScoreRandom"
      :showMastercardExtension="showMastercardExtension"
    />

    <ThreeDSParamsSection
      v-model:messageCategory="formState.messageCategory"
      v-model:messageVersion="formState.messageVersion"
      v-model:deviceChannel="formState.deviceChannel"
      v-model:threeDSRequestorChallengeInd="formState.threeDSRequestorChallengeInd"
      v-model:authenticationMethod="formState.authenticationMethod"
      v-model:authenticationType="formState.authenticationType"
      v-model:deviceIpAddress="formState.deviceIpAddress"
      v-model:browserIP="formState.browserIP"
      v-model:devicePlatform="formState.devicePlatform"
      v-model:deviceLocale="formState.deviceLocale"
      v-model:deviceAdvertisingId="formState.deviceAdvertisingId"
      v-model:threeDSCompInd="formState.threeDSCompInd"
      v-model:merchantCountryCodeStr="formState.merchantCountryCodeStr"
      v-model:enableAll3DSParamsRandom="formState.enableAll3DSParamsRandom"
      v-model:enableMessageCategory="formState.enableMessageCategory"
      v-model:enableDeviceChannel="formState.enableDeviceChannel"
      v-model:enableThreeDSRequestorChallengeInd="formState.enableThreeDSRequestorChallengeInd"
      v-model:enableAuthenticationMethodRandom="formState.enableAuthenticationMethodRandom"
      v-model:enableAuthenticationTypeRandom="formState.enableAuthenticationTypeRandom"
      v-model:enableDeviceIpAddressRandom="formState.enableDeviceIpAddressRandom"
      v-model:enableDevicePlatformRandom="formState.enableDevicePlatformRandom"
      v-model:enableDeviceLocaleRandom="formState.enableDeviceLocaleRandom"
      v-model:enableDeviceAdvertisingIdRandom="formState.enableDeviceAdvertisingIdRandom"
      v-model:enableThreeDSCompIndRandom="formState.enableThreeDSCompIndRandom"
      v-model:enableMerchantCountryCodeStrRandom="formState.enableMerchantCountryCodeStrRandom"
      v-model:enableBrowserGeoIPRandom="formState.enableBrowserGeoIPRandom"
      v-model:enableDeviceGeoIPRandom="formState.enableDeviceGeoIPRandom"
    />

    <PerformanceSection
      v-model:performancePath="formState.performancePath"
      v-model:execTime="formState.execTime"
      v-model:creqExecTime="formState.creqExecTime"
      v-model:rreqExecTime="formState.rreqExecTime"
      v-model:rbaExecTime="formState.rbaExecTime"
      v-model:cavvExecTime="formState.cavvExecTime"
      v-model:otpExecTime="formState.otpExecTime"
      v-model:enableExecTimeRandom="formState.enableExecTimeRandom"
      v-model:enableCreqExecTimeRandom="formState.enableCreqExecTimeRandom"
      v-model:enableRreqExecTimeRandom="formState.enableRreqExecTimeRandom"
      v-model:enableRbaExecTimeRandom="formState.enableRbaExecTimeRandom"
      v-model:enableCavvExecTimeRandom="formState.enableCavvExecTimeRandom"
      v-model:enableOtpExecTimeRandom="formState.enableOtpExecTimeRandom"
    />

    <ErrorHandlingSection
      :activeMode="props.activeMode"
      v-model:enableBatchErrorMix="formState.enableBatchErrorMix"
      v-model:batchErrorMixPercent="formState.batchErrorMixPercent"
      v-model:errorComponent="formState.errorComponent"
      v-model:errorDescription="formState.errorDescription"
      v-model:errorCode="formState.errorCode"
      v-model:errorDetail="formState.errorDetail"
      v-model:errorMessageType="formState.errorMessageType"
    />
  </form>
</template>

<style scoped></style>
