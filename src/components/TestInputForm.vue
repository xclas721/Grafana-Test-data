<script setup lang="ts">
import { onMounted, watch, computed, reactive, ref } from 'vue'
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
  defaultStateMachineReason
} from '@/shared/constants/stateMachineReason'
import {
  computeAresWeightTotal,
  computeExpectedRates,
  computeRreqWeightTotal,
  parsePercent,
  rollRandomStatuses,
  resolveStatusDependencies
} from '@/composables/useTransactionStatusRules'
import { randomizeBusinessFields } from '@/composables/useBusinessFieldRandomizer'
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

const formState = reactive({
  baseUrl: 'http://localhost:9200',
  username: 'elastic',
  password: '123456',
  currentDate: '',
  enableCustomTimeRange: true,
  enableAutoTimeRange: props.enableAutoTimeRange ?? true,
  startDateTime: '',
  endDateTime: '',
  timezone: 'browser',
  issuerOid: '06b4b203-da05-73f9-256f-454929df6076',
  requestorId: '12128301823081230123',
  acsTransId: '',
  threeDSServerTransId: '',
  aresTransStatus: 'N',
  transStatus: 'N',
  rreqTransStatus: 'NULL_VALUE',
  transStatusReason: 'NULL_VALUE',
  stateMachineReason: '0000',
  transStatusReasonMode: 'random' as 'random' | 'fixed',
  stateMachineReasonMode: 'random' as 'random' | 'fixed',
  challengeCancel: 'NULL_VALUE',
  aresWeightY: '6',
  aresWeightN: '4',
  aresWeightR: '3',
  aresWeightC: '84',
  aresWeightD: '0',
  aresWeightA: '0',
  aresWeightI: '1',
  aresWeightS: '0',
  aresWeightU: '2',
  /** RReq=NULL 時 3DSS 會強制 S3402（讀取超時）；預設 0 會導致批量假資料幾乎沒有 S3402 */
  rreqWeightNull: '5',
  rreqWeightY: '86',
  rreqWeightN: '9',
  challengeCancelRate: '8',
  merchantName: 'HiTRUST EMV Demo Merchant',
  merchantCountryCode: '156',
  acquirerMerchantId: '8909191',
  acquirerBin: '1231234',
  mcc: '5661',
  purchaseAmount: '100',
  purchaseCurrency: '156',
  purchaseExponent: '2',
  usdAmount: '0.13841979956813022',
  countryAlpha2: 'CN',
  countryNumeric: '156',
  countryAlpha3: 'CHN',
  countryName: 'China',
  currencyMinorUnit: '2',
  currencyName: 'Yuan Renminbi',
  currencyAlphabeticCode: 'CNY',
  currencyNumericCode: '156',
  exchangeRate: '7.2244',
  exchangeBase: 'USD',
  exchangeTarget: 'CNY',
  currencyCodeForRate: 'CNY',
  cardScheme: 'V',
  acctNumber: '4143520000000123',
  // 批量灌資料的卡號重複倍率：卡號池大小 = ceil(本次總筆數 / 倍率)。
  // 10 → 每張卡平均刷 10 次（測去重效能）；1 → 全新不重複（等於現況）。
  cardPoolRatio: '10',
  cardbin6: '414352',
  acctNumberHashed: '2hpBkDB7ELbcpebGl5RM+HWTQGx3qciOwskcbsEVKC4=',
  acctNumberMask: '414352******0123',
  cardbin8: '41435200',
  visaDafMessageExtension: 'null',
  mastercardScore: '600',
  mastercardDecision: 'Not Low Risk',
  mastercardReasonCode1: 'A',
  mastercardReasonCode2: '',
  mastercardStatus: 'success',
  visaRiskBasedAuthenticationScore: '',
  messageCategory: '01',
  messageVersion: '2.2.0',
  deviceChannel: '02',
  threeDSRequestorChallengeInd: '01',
  authenticationMethod: '02',
  authenticationType: '02',
  deviceIpAddress: '::1',
  browserIP: '::1',
  devicePlatform: 'MacIntel',
  deviceLocale: 'zh-TW',
  deviceAdvertisingId: '4d4427f20375a66287430edd54bd82d2',
  threeDSCompInd: 'Y',
  merchantCountryCodeStr: '156',
  performancePath: '/acs-auth/auth/V/2.2.0/06b4b203-da05-73f9-256f-454929df6076/001/areq',
  execTime: '5437',
  creqExecTime: '500',
  rreqExecTime: '400',
  rbaExecTime: '100',
  cavvExecTime: '20',
  otpExecTime: '50',
  errorComponent: 'NULL_VALUE',
  errorDescription: 'NULL_VALUE',
  errorCode: 'NULL_VALUE',
  errorDetail: 'NULL_VALUE',
  errorMessageType: 'NULL_VALUE',
  /** 僅「批量生成並 POST」：每筆依比例隨機套用 EMV 錯誤或維持無錯誤 */
  enableBatchErrorMix: true,
  batchErrorMixPercent: '15',
  enablePurchaseAmountRandom: true,
  enablePurchaseCurrencyRandom: true,
  enableAcquirerMerchantIdRandom: true,
  enableAcquirerBinRandom: true,
  enableAcctNumberRandom: true,
  enableMerchantCountryCodeRandom: true,
  enableMerchantCountryAsiaOnly: true,
  enableMerchantRandom: true,
  enableCardSchemeRandom: true,
  enableMastercardExtension: false,
  enableMastercardExtensionRandom: false,
  enableVisaScoreRandom: false,
  enableExecTimeRandom: true,
  enableCreqExecTimeRandom: true,
  enableRreqExecTimeRandom: true,
  enableRbaExecTimeRandom: true,
  enableCavvExecTimeRandom: true,
  enableOtpExecTimeRandom: true,
  enableAll3DSParamsRandom: true,
  enableMessageCategory: true,
  enableDeviceChannel: true,
  enableThreeDSRequestorChallengeInd: true,
  enableAuthenticationMethodRandom: true,
  enableAuthenticationTypeRandom: true,
  enableDeviceIpAddressRandom: true,
  enableDevicePlatformRandom: true,
  enableDeviceLocaleRandom: true,
  enableDeviceAdvertisingIdRandom: true,
  enableThreeDSCompIndRandom: true,
  enableMerchantCountryCodeStrRandom: false,
  enableBrowserGeoIPRandom: true,
  enableDeviceGeoIPRandom: true,
  disableRreqTransStatus: true,
  disableTransStatusReason: true,
  disableStateMachineReason: true,
  disableChallengeCancel: true
})

const stateBindings = {
  baseUrl: 'baseUrl',
  username: 'username',
  password: 'password',
  currentDate: 'currentDate',
  startDateTime: 'startDateTime',
  endDateTime: 'endDateTime',
  timezone: 'timezone',
  issuerOid: 'issuerOid',
  requestorId: 'requestorId',
  acsTransId: 'acsTransId',
  threeDSServerTransId: 'threeDSServerTransId',
  aresTransStatus: 'aresTransStatus',
  transStatus: 'transStatus',
  rreqTransStatus: 'rreqTransStatus',
  transStatusReason: 'transStatusReason',
  stateMachineReason: 'stateMachineReason',
  challengeCancel: 'challengeCancel',
  aresWeightY: 'aresWeightY',
  aresWeightN: 'aresWeightN',
  aresWeightR: 'aresWeightR',
  aresWeightC: 'aresWeightC',
  aresWeightD: 'aresWeightD',
  aresWeightA: 'aresWeightA',
  aresWeightI: 'aresWeightI',
  aresWeightS: 'aresWeightS',
  aresWeightU: 'aresWeightU',
  rreqWeightNull: 'rreqWeightNull',
  rreqWeightY: 'rreqWeightY',
  rreqWeightN: 'rreqWeightN',
  challengeCancelRate: 'challengeCancelRate',
  merchantName: 'merchantName',
  merchantCountryCode: 'merchantCountryCode',
  acquirerMerchantId: 'acquirerMerchantId',
  acquirerBin: 'acquirerBin',
  mcc: 'mcc',
  purchaseAmount: 'purchaseAmount',
  purchaseCurrency: 'purchaseCurrency',
  purchaseExponent: 'purchaseExponent',
  usdAmount: 'usdAmount',
  countryAlpha2: 'countryAlpha2',
  countryNumeric: 'countryNumeric',
  countryAlpha3: 'countryAlpha3',
  countryName: 'countryName',
  currencyMinorUnit: 'currencyMinorUnit',
  currencyName: 'currencyName',
  currencyAlphabeticCode: 'currencyAlphabeticCode',
  currencyNumericCode: 'currencyNumericCode',
  exchangeRate: 'exchangeRate',
  exchangeBase: 'exchangeBase',
  exchangeTarget: 'exchangeTarget',
  currencyCodeForRate: 'currencyCodeForRate',
  cardScheme: 'cardScheme',
  acctNumber: 'acctNumber',
  cardbin6: 'cardbin6',
  acctNumberHashed: 'acctNumberHashed',
  acctNumberMask: 'acctNumberMask',
  cardbin8: 'cardbin8',
  visaDafMessageExtension: 'visaDafMessageExtension',
  mastercardScore: 'mastercardScore',
  mastercardDecision: 'mastercardDecision',
  mastercardReasonCode1: 'mastercardReasonCode1',
  mastercardReasonCode2: 'mastercardReasonCode2',
  mastercardStatus: 'mastercardStatus',
  visaRiskBasedAuthenticationScore: 'visaRiskBasedAuthenticationScore',
  messageCategory: 'messageCategory',
  messageVersion: 'messageVersion',
  deviceChannel: 'deviceChannel',
  threeDSRequestorChallengeInd: 'threeDSRequestorChallengeInd',
  authenticationMethod: 'authenticationMethod',
  authenticationType: 'authenticationType',
  deviceIpAddress: 'deviceIpAddress',
  browserIP: 'browserIP',
  devicePlatform: 'devicePlatform',
  deviceLocale: 'deviceLocale',
  deviceAdvertisingId: 'deviceAdvertisingId',
  threeDSCompInd: 'threeDSCompInd',
  merchantCountryCodeStr: 'merchantCountryCodeStr',
  performancePath: 'performancePath',
  execTime: 'execTime',
  creqExecTime: 'creqExecTime',
  rreqExecTime: 'rreqExecTime',
  rbaExecTime: 'rbaExecTime',
  cavvExecTime: 'cavvExecTime',
  otpExecTime: 'otpExecTime',
  errorComponent: 'errorComponent',
  errorDescription: 'errorDescription',
  errorCode: 'errorCode',
  errorDetail: 'errorDetail',
  errorMessageType: 'errorMessageType',
  batchErrorMixPercent: 'batchErrorMixPercent'
} as const

function setField(id: string, val: string) {
  const key = stateBindings[id as keyof typeof stateBindings]
  if (key) {
    formState[key] = val
  }
}

function setFields(values: Record<string, string>) {
  Object.entries(values).forEach(([id, val]) => {
    setField(id, String(val))
  })
}

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

const MERCHANT_COUNTRY_CODE_STR_VALUES = [
  '156',
  '840',
  '076',
  '392',
  '344',
  '410',
  '702',
  '036',
  '124',
  '978',
  '826',
  '116'
]

const MERCHANT_COUNTRY_CODE_ASIA_VALUES = [
  '156', // China
  '392', // Japan
  '344', // Hong Kong
  '410', // South Korea
  '702', // Singapore
  '116', // Cambodia
  '764', // Thailand
  '704', // Vietnam
  '458', // Malaysia
  '360', // Indonesia
  '608', // Philippines
  '076' // Brazil (treated as Asia for testing/random)
]

const MERCHANT_MCC_OPTIONS = [
  { name: 'HiTRUST EMV Demo Merchant', mcc: '5661' },
  { name: "McDonald's", mcc: '5814' },
  { name: 'Burger King', mcc: '5814' },
  { name: 'KFC', mcc: '5814' },
  { name: 'Starbucks', mcc: '5812' },
  { name: 'Subway', mcc: '5814' },
  { name: 'Pizza Hut', mcc: '5812' },
  { name: "Domino's Pizza", mcc: '5812' },
  { name: 'Walmart Supercenter', mcc: '5411' },
  { name: 'Costco Wholesale', mcc: '5300' },
  { name: 'Amazon Marketplace', mcc: '5262' },
  { name: 'Apple Store', mcc: '5732' },
  { name: 'Microsoft Store', mcc: '5732' },
  { name: 'IKEA', mcc: '5712' },
  { name: 'H&M', mcc: '5651' },
  { name: 'Zara', mcc: '5691' },
  { name: 'Nike Retail Store', mcc: '5651' },
  { name: 'Adidas Retail Store', mcc: '5651' },
  { name: 'Hilton Hotels', mcc: '7011' },
  { name: 'Marriott Hotels', mcc: '7011' },
  { name: 'Uber Rides', mcc: '4121' },
  { name: 'Global Leisure Rewards', mcc: '5816' }
] as const

const ACQUIRER_BIN_OPTIONS = ['1231234', '1239999', '9991234', '9999999'] as const

const COUNTRY_NUMERIC_MAP: Record<string, { alpha2: string; alpha3: string; name: string }> = {
  '156': { alpha2: 'CN', alpha3: 'CHN', name: 'China' },
  '158': { alpha2: 'TW', alpha3: 'TWN', name: 'Taiwan' },
  '840': { alpha2: 'US', alpha3: 'USA', name: 'United States' },
  '076': { alpha2: 'BR', alpha3: 'BRA', name: 'Brazil' },
  '392': { alpha2: 'JP', alpha3: 'JPN', name: 'Japan' },
  '344': { alpha2: 'HK', alpha3: 'HKG', name: 'Hong Kong' },
  '410': { alpha2: 'KR', alpha3: 'KOR', name: 'South Korea' },
  '702': { alpha2: 'SG', alpha3: 'SGP', name: 'Singapore' },
  '116': { alpha2: 'KH', alpha3: 'KHM', name: 'Cambodia' },
  '036': { alpha2: 'AU', alpha3: 'AUS', name: 'Australia' },
  '124': { alpha2: 'CA', alpha3: 'CAN', name: 'Canada' },
  '978': { alpha2: 'EU', alpha3: 'EUR', name: 'European Union' },
  '826': { alpha2: 'GB', alpha3: 'GBR', name: 'United Kingdom' },
  // 與 MERCHANT_COUNTRY_CODE_ASIA_VALUES 及 country-codes 參考表一致，避免隨機選到時代碼與名稱不符
  '764': { alpha2: 'TH', alpha3: 'THA', name: 'Thailand' },
  '704': { alpha2: 'VN', alpha3: 'VNM', name: 'Viet Nam' },
  '458': { alpha2: 'MY', alpha3: 'MYS', name: 'Malaysia' },
  '360': { alpha2: 'ID', alpha3: 'IDN', name: 'Indonesia' },
  '608': { alpha2: 'PH', alpha3: 'PHL', name: 'Philippines' }
}

const CURRENCY_NUMERIC_MAP: Record<
  string,
  { alphabetic: string; name: string; minorUnit: string }
> = {
  '156': { alphabetic: 'CNY', name: 'Yuan Renminbi', minorUnit: '2' },
  '901': { alphabetic: 'TWD', name: 'New Taiwan Dollar', minorUnit: '2' },
  '840': { alphabetic: 'USD', name: 'US Dollar', minorUnit: '2' },
  '392': { alphabetic: 'JPY', name: 'Yen', minorUnit: '0' },
  '344': { alphabetic: 'HKD', name: 'Hong Kong Dollar', minorUnit: '2' },
  '410': { alphabetic: 'KRW', name: 'Won', minorUnit: '0' },
  '702': { alphabetic: 'SGD', name: 'Singapore Dollar', minorUnit: '2' },
  '036': { alphabetic: 'AUD', name: 'Australian Dollar', minorUnit: '2' },
  '124': { alphabetic: 'CAD', name: 'Canadian Dollar', minorUnit: '2' },
  '978': { alphabetic: 'EUR', name: 'Euro', minorUnit: '2' },
  '826': { alphabetic: 'GBP', name: 'Pound Sterling', minorUnit: '2' },
  '116': { alphabetic: 'KHR', name: 'Riel', minorUnit: '2' },
  '764': { alphabetic: 'THB', name: 'Baht', minorUnit: '2' },
  '704': { alphabetic: 'VND', name: 'Dong', minorUnit: '0' },
  '458': { alphabetic: 'MYR', name: 'Malaysian Ringgit', minorUnit: '2' },
  '360': { alphabetic: 'IDR', name: 'Rupiah', minorUnit: '0' },
  '608': { alphabetic: 'PHP', name: 'Philippine Peso', minorUnit: '2' }
}

const aresWeightTotal = computed(() => computeAresWeightTotal(formState))
const aresWeightUnallocated = computed(() => 100 - aresWeightTotal.value)

const rreqWeightTotal = computed(() => computeRreqWeightTotal(formState))
const rreqWeightUnallocated = computed(() => 100 - rreqWeightTotal.value)

const expectedRates = computed(() => computeExpectedRates(formState))
const expectedFrictionlessRate = computed(() => expectedRates.value.expectedFrictionlessRate)
const expectedChallengeSuccessRate = computed(() => expectedRates.value.expectedChallengeSuccessRate)
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
    stateMachineReason: formState.stateMachineReason
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
    if (formState.challengeCancel !== 'NULL_VALUE') setField('challengeCancel', 'NULL_VALUE')
  } else if (formState.challengeCancel === 'NULL_VALUE') {
    setField('challengeCancel', '01')
  }
}

function updateTimeRangeDisplay() {
  const currentDate = formState.currentDate
  const timezone = (formState.timezone || 'browser') as string
  const batchDays = Math.max(0, Math.floor(props.batchDays ?? 0))
  const useCustomRange = formState.enableCustomTimeRange
  if (!currentDate && !useCustomRange) {
    timeRangeHtml.value = '請選擇日期'
    return
  }
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
  function getCustomRangeUtc() {
    const startLocal = parseDateTimeLocal(formState.startDateTime)
    const endLocal = parseDateTimeLocal(formState.endDateTime)
    if (!startLocal || !endLocal) return null
    let startUtc = convertToUTC(startLocal, timezone).getTime()
    let endUtc = convertToUTC(endLocal, timezone).getTime()
    if (endUtc < startUtc) {
      const temp = startUtc
      startUtc = endUtc
      endUtc = temp
    }
    const nowUtc = Date.now()
    const clampedEnd = Math.min(endUtc, nowUtc)
    if (startUtc > clampedEnd) startUtc = clampedEnd
    return { startUtc, endUtc, clampedEnd, clamped: clampedEnd !== endUtc }
  }
  const customRange = useCustomRange ? getCustomRangeUtc() : null
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
  if (useCustomRange) {
    if (!customRange) {
      timeRangeHtml.value = `<div style="font-size: 0.9em;">
        <div><strong>選擇時區：</strong>${tzName}</div>
        <div style="color:#666;margin-top:5px;">請選擇起訖時間</div>
      </div>`
      return
    }
    const utcStart = new Date(customRange.startUtc).toISOString()
    const utcEnd = new Date(customRange.clampedEnd).toISOString()
    const note = customRange.clamped
      ? '<small>注意：結束時間超過現在，已限制到目前時間</small>'
      : '<small>自訂時間區間</small>'
    timeRangeHtml.value = `<div style="font-size: 0.9em;">
      <div><strong>選擇時區：</strong>${tzName}</div>
      <div><strong>UTC 時間範圍：</strong>${utcStart} ~ ${utcEnd}</div>
      <div style="color:#666;margin-top:5px;">${note}</div>
    </div>`
  } else if (batchDays === 0) {
    const utcNow = convertToUTC(now, timezone).toISOString()
    timeRangeHtml.value = `<div style="font-size: 0.9em;">
      <div><strong>選擇時區：</strong>${tzName}</div>
      <div><strong>UTC 時間範圍：</strong>${utcNow} ~ ${utcNow}</div>
      <div style="color:#666;margin-top:5px;"><small>僅使用現在時間</small></div>
    </div>`
  } else if (batchDays === 1) {
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
    timeRangeHtml.value = `<div style="font-size: 0.9em;">
      <div><strong>選擇時區：</strong>${tzName}</div>
      <div><strong>UTC 時間範圍：</strong>${utcStart} ~ ${utcEnd}</div>
      <div style="color:#666;margin-top:5px;">${note}</div>
    </div>`
  } else {
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
    timeRangeHtml.value = `<div style="font-size: 0.9em;">
      <div><strong>選擇時區：</strong>${tzName}</div>
      <div><strong>生成天數：</strong>${batchDays} 天 (${dateRangeText})</div>
      <div><strong>UTC 時間範圍：</strong>${utcStart} ~ ${multiEndUTC}</div>
      <div style="color:#666;margin-top:5px;">${note}</div>
    </div>`
  }
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
  setField('requestorId', '12128301823081230123')
  setField('acsTransId', cryptoRandomUUID())
  setField('threeDSServerTransId', cryptoRandomUUID().toLowerCase())
  setField('aresTransStatus', 'N')
  setField('transStatus', 'N')
  setField('rreqTransStatus', 'NULL_VALUE')
  setField('transStatusReason', 'NULL_VALUE')
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
  setField('errorComponent', 'NULL_VALUE')
  setField('errorDescription', 'NULL_VALUE')
  setField('errorCode', 'NULL_VALUE')
  setField('errorDetail', 'NULL_VALUE')
  setField('errorMessageType', 'NULL_VALUE')
  formState.enableBatchErrorMix = true
  setField('batchErrorMixPercent', '15')
  setField('challengeCancel', 'NULL_VALUE')
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
  setField('aresWeightN', '4')
  setField('aresWeightR', '3')
  setField('aresWeightC', '84')
  setField('aresWeightD', '0')
  setField('aresWeightA', '0')
  setField('aresWeightI', '1')
  setField('aresWeightS', '0')
  setField('aresWeightU', '2')
  setField('rreqWeightNull', '5')
  setField('rreqWeightY', '86')
  setField('rreqWeightN', '9')
  setField('challengeCancelRate', '8')
  formState.enablePurchaseAmountRandom = true
  formState.enablePurchaseCurrencyRandom = true
  formState.enableAcquirerMerchantIdRandom = true
  formState.enableAcquirerBinRandom = true
  formState.enableAcctNumberRandom = true
  formState.enableMerchantCountryCodeRandom = true
  formState.enableMerchantCountryAsiaOnly = true
  formState.enableMerchantRandom = true
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
    rreqWeightN: formState.rreqWeightN
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
    enableVisaScoreRandom: formState.enableVisaScoreRandom,
    enableMastercardExtension: formState.enableMastercardExtension,
    enableMastercardExtensionRandom: formState.enableMastercardExtensionRandom,
    acquirerBinOptions: ACQUIRER_BIN_OPTIONS,
    merchantOptions: MERCHANT_MCC_OPTIONS,
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
  () => [formState.aresTransStatus, formState.rreqTransStatus],
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

type FormMap = Record<string, string>

/**
 * 批量插入時每筆只需此子集（buildDocument／generateSharedTimestamp／批次錯誤混入）。
 * 若 buildDocument 新增對 form 的讀取欄位，請一併加入此列表。
 */
const BATCH_INSERT_FORM_KEYS = [
  'acsTransId',
  'authenticationMethod',
  'authenticationType',
  'aresTransStatus',
  'batchErrorMixPercent',
  'browserIP',
  'cardScheme',
  'cardbin6',
  'cardbin8',
  'cavvExecTime',
  'challengeCancel',
  'countryAlpha2',
  'countryAlpha3',
  'countryName',
  'countryNumeric',
  'creqExecTime',
  'currencyAlphabeticCode',
  'currencyCodeForRate',
  'currencyMinorUnit',
  'currencyName',
  'currencyNumericCode',
  'currentDate',
  'deviceAdvertisingId',
  'deviceChannel',
  'deviceIpAddress',
  'deviceLocale',
  'devicePlatform',
  'enableBatchErrorMix',
  'enableBrowserGeoIPRandom',
  'enableCustomTimeRange',
  'enableDeviceGeoIPRandom',
  'enableAuthenticationMethodRandom',
  'enableMastercardExtension',
  'endDateTime',
  'errorCode',
  'errorComponent',
  'errorDescription',
  'errorDetail',
  'errorMessageType',
  'exchangeBase',
  'exchangeRate',
  'exchangeTarget',
  'execTime',
  'issuerOid',
  'mastercardDecision',
  'mastercardMessageExtension',
  'mastercardReasonCode1',
  'mastercardReasonCode2',
  'mastercardScore',
  'mastercardStatus',
  'mcc',
  'merchantCountryCode',
  'merchantCountryCodeStr',
  'merchantName',
  'messageCategory',
  'messageVersion',
  'otpExecTime',
  'performancePath',
  'purchaseAmount',
  'purchaseCurrency',
  'purchaseExponent',
  'requestorId',
  'rbaExecTime',
  'rreqExecTime',
  'rreqTransStatus',
  'startDateTime',
  'stateMachineReason',
  'threeDSRequestorChallengeInd',
  'threeDSCompInd',
  'threeDSServerTransId',
  'timezone',
  'transStatus',
  'transStatusReason',
  'usdAmount',
  'visaRiskBasedAuthenticationScore',
  'acctNumberHashed',
  'acctNumberMask',
  'acquirerBin',
  'acquirerMerchantId'
] as const

function getFormData(): FormMap {
  const data: FormMap = {}
  Object.entries(formState).forEach(([key, value]) => {
    if (key.startsWith('disable')) return
    if (typeof value === 'boolean') {
      data[key] = value ? 'on' : 'off'
    } else {
      data[key] = String(value ?? '')
    }
  })
  return data
}

function getFormDataForBatchInsert(): FormMap {
  const data: FormMap = {}
  for (const key of BATCH_INSERT_FORM_KEYS) {
    const raw = (formState as unknown as Record<string, unknown>)[key]
    if (raw === undefined || raw === null) {
      data[key] = ''
    } else if (typeof raw === 'boolean') {
      data[key] = raw ? 'on' : 'off'
    } else {
      data[key] = String(raw)
    }
  }
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

function formatZonedDateTime(date: Date, timezone: string): string {
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

function parseDateTimeLocal(value: string): Date | null {
  if (!value) return null
  const [datePart, timePartRaw] = value.trim().split('T')
  if (!datePart || !timePartRaw) return null
  const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10))
  const [hh, mm, ss] = timePartRaw.split(':').map((v) => parseInt(v, 10))
  if (!y || !m || !d) return null
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0)
}

function getCustomRangeUtcFromForm(form: FormMap) {
  if (form.enableCustomTimeRange !== 'on') return null
  const tz = form.timezone || 'browser'
  const startLocal = parseDateTimeLocal(form.startDateTime || '')
  const endLocal = parseDateTimeLocal(form.endDateTime || '')
  if (!startLocal || !endLocal) return null
  let startUtcMs = convertToUTC(startLocal, tz).getTime()
  let endUtcMs = convertToUTC(endLocal, tz).getTime()
  if (endUtcMs < startUtcMs) {
    const temp = startUtcMs
    startUtcMs = endUtcMs
    endUtcMs = temp
  }
  const nowUtc = Date.now()
  const clampedEndUtcMs = Math.min(endUtcMs, nowUtc)
  if (startUtcMs > clampedEndUtcMs) startUtcMs = clampedEndUtcMs
  return { startUtcMs, endUtcMs, clampedEndUtcMs }
}

function updateCustomTimeRangeFromNow() {
  if (!formState.enableCustomTimeRange || !formState.enableAutoTimeRange) return
  const tz = formState.timezone || 'browser'
  const days = Math.max(0, Math.floor(props.batchDays ?? 0))
  const now = new Date()
  const endStr = formatZonedDateTime(now, tz)
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const startStr = formatZonedDateTime(start, tz)
  setField('endDateTime', endStr)
  setField('startDateTime', startStr)
}

function generateSharedTimestamp(form: FormMap) {
  const useCustomRange = form.enableCustomTimeRange === 'on'
  if (useCustomRange) {
    const range = getCustomRangeUtcFromForm(form)
    if (range) {
      const span = Math.max(0, range.endUtcMs - range.startUtcMs)
      const pick = range.startUtcMs + Math.random() * (span || 1)
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

function buildDocument(form: FormMap, indexName: string, sharedTimestamp?: string) {
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
    messageVersion?: string
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
    requestorId?: string
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
    otpFailedCount?: string
    resendCounter?: string
    acsTransID?: string
    issuerOid?: string
    threeDSServerTransID?: string
    [key: string]: unknown
  }
  const doc: BuiltDoc = {
    last_update_timestamp: currentDateTime,
    first_seen_timestamp: currentDateTime,
    messageCategory: form.messageCategory,
    messageVersion: form.messageVersion,
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
    stateMachineReason:
      indexName.includes('3dss-transaction') &&
      (!form.stateMachineReason || String(form.stateMachineReason).trim() === 'NULL_VALUE')
        ? undefined
        : form.stateMachineReason,
    cardScheme: form.cardScheme,
    requestorId: form.requestorId,
    acctNumberHashed: form.acctNumberHashed,
    acctNumberMask: form.acctNumberMask,
    cardbin6: form.cardbin6,
    cardbin8: form.cardbin8,
    performance_metrics: (() => {
      // 與 3DSS MetricsCollectorAspect 一致：卡組織對 DS 的 AReq 耗時記在 path = "{cardScheme}_DS_URL"（Grafana「卡組織 AReq 回應時間趨勢」查 * _DS_URL）
      const sharedAreqMs = Number(form.execTime || Math.floor(Math.random() * 701 + 800))
      const cardSchemeKey = String(form.cardScheme || 'V').trim() || 'V'
      const metrics: Array<{ path?: string; execTime?: number }> = []
      if (indexName.includes('3dss-transaction')) {
        metrics.push({ path: `${cardSchemeKey}_DS_URL`, execTime: sharedAreqMs })
      }
      metrics.push(
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
          path: `/challenge/brw/${form.cardScheme}/${form.messageVersion}/${form.issuerOid}/1/${form.acsTransId}/creq`,
          execTime: Number(form.creqExecTime || Math.floor(Math.random() * 501 + 300))
        },
        {
          path: `/acs-auth/auth/${form.cardScheme}/${form.messageVersion}/${form.issuerOid}/001/areq`,
          execTime: sharedAreqMs
        },
        {
          path: `/acs-auth/auth/${form.cardScheme}/${form.messageVersion}/${form.issuerOid}/001/rreq`,
          execTime: Number(form.rreqExecTime || Math.floor(Math.random() * 401 + 200))
        },
        {
          path: 'RiskEvaluationService.evaluate',
          execTime: Number(form.rbaExecTime || Math.floor(Math.random() * 151 + 50))
        }
      )
      return metrics
    })(),
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
  if (form.otpFailedCount !== undefined && form.otpFailedCount !== '') {
    doc.otpFailedCount = form.otpFailedCount
  }
  if (form.resendCounter !== undefined && form.resendCounter !== '') {
    doc.resendCounter = form.resendCounter
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
    '116': { name: 'Cambodia', alpha2: 'KH' },
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
      '116': [
        { name: 'Phnom Penh', lat: 11.5564, lon: 104.9282, region: 'KH-12' },
        { name: 'Siem Reap', lat: 13.3671, lon: 103.8448, region: 'KH-17' },
        { name: 'Battambang', lat: 13.0957, lon: 103.2022, region: 'KH-2' },
        { name: 'Sihanoukville', lat: 10.6253, lon: 103.5234, region: 'KH-18' }
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
    if (['156', '158', '392', '344', '410', '702', '116'].includes(countryCode)) {
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
  // 使用 merchantCountryCode 來生成 GeoIP（如果有的話，否則使用 merchantCountryCodeStr）
  const countryCodeForGeoIP = form.merchantCountryCode || form.merchantCountryCodeStr || '156'
  const countryInfo = countryCodeMap[countryCodeForGeoIP] || countryCodeMap['156']!
  // browserGeoIP（預設生成，基於 merchantCountryCodeStr）
  // 預設生成，除非 checkbox 明確取消勾選
  if (form.enableBrowserGeoIPRandom !== 'off') {
    ;(doc as unknown as Record<string, unknown>).browserGeoIP = generateGeoIP(
      countryCodeForGeoIP,
      countryInfo.name,
      countryInfo.alpha2
    )
  }
  // deviceGeoIP（預設生成，基於 merchantCountryCodeStr）
  // 預設生成，除非 checkbox 明確取消勾選
  if (form.enableDeviceGeoIPRandom !== 'off') {
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
  // riskAssesmentResult：風險評估快照（等於 ares_transStatus，之後不再更新）
  // 只有有 Visa Score 或 Mastercard Score 的交易才寫入，對應 Grafana panel 的 filter 條件
  const hasVisaScore =
    form.visaRiskBasedAuthenticationScore &&
    String(form.visaRiskBasedAuthenticationScore).trim() !== ''
  const hasMastercardScore = form.enableMastercardExtension === 'on'
  if (hasVisaScore || hasMastercardScore) {
    ;(doc as unknown as Record<string, unknown>).riskAssesmentResult = form.aresTransStatus
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
