import { GEOIP_COUNTRY_CODE_MAP } from '@/shared/constants/countryCurrency'
import { GEOIP_CITIES, continentNameForCountryCode } from '@/shared/constants/geoIpCities'
import { NULL_VALUE } from '@/shared/constants/nullValue'
import { convertToUTC } from '@/shared/utils/timeRange'

export type FormMap = Record<string, string>

/**
 * 批量插入時每筆只需此子集（buildDocument／generateSharedTimestamp／批次錯誤混入）。
 * 若 buildDocument 新增對 form 的讀取欄位，請一併加入此列表。
 */
export const BATCH_INSERT_FORM_KEYS = [
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

function generateGeoIP(
  countryCode: string,
  countryName: string,
  countryAlpha2: string,
  random: () => number
): Record<string, unknown> {
  const cityList = GEOIP_CITIES[countryCode] || [{ name: 'Unknown', lat: 0, lon: 0, region: 'UN' }]
  const city = cityList[Math.floor(random() * cityList.length)]!
  const continentName = continentNameForCountryCode(countryCode)
  return {
    region_iso_code: city.region,
    continent_name: continentName,
    city_name: city.name,
    country_iso_code: countryAlpha2,
    country_name: countryName,
    location: {
      lat: city.lat + (random() - 0.5) * 0.1,
      lon: city.lon + (random() - 0.5) * 0.1
    },
    region_name: city.name
  }
}

export function buildDocument(
  form: FormMap,
  indexName: string,
  sharedTimestamp?: string,
  random: () => number = Math.random
): { document: BuiltDoc; utcDateStr: string | undefined } {
  const currentDate = form.currentDate
  const tz = form.timezone || 'browser'
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
  let hh: number, mm: number, ss: number
  if (!sharedTimestamp && currentDate === today) {
    hh = Math.floor(random() * (now.getHours() + 1))
    mm =
      hh === now.getHours()
        ? Math.floor(random() * (now.getMinutes() + 1))
        : Math.floor(random() * 60)
    ss =
      hh === now.getHours() && mm === now.getMinutes()
        ? Math.floor(random() * (now.getSeconds() + 1))
        : Math.floor(random() * 60)
  } else if (!sharedTimestamp) {
    hh = Math.floor(random() * 24)
    mm = Math.floor(random() * 60)
    ss = Math.floor(random() * 60)
  }
  const currentDateTime = sharedTimestamp
    ? sharedTimestamp
    : convertToUTC(
        new Date(
          `${currentDate}T${String(hh!).padStart(2, '0')}:${String(mm!).padStart(2, '0')}:${String(ss!).padStart(2, '0')}`
        ),
        tz
      ).toISOString()
  const randomDaysAgo = Math.floor(random() * 365)
  const historicalDate = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000)
  const historicalDateStr = historicalDate.toISOString().split('T')[0]
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
      (!form.stateMachineReason || String(form.stateMachineReason).trim() === NULL_VALUE)
        ? undefined
        : form.stateMachineReason,
    cardScheme: form.cardScheme,
    requestorId: form.requestorId,
    acctNumberHashed: form.acctNumberHashed,
    acctNumberMask: form.acctNumberMask,
    cardbin6: form.cardbin6,
    cardbin8: form.cardbin8,
    performance_metrics: (() => {
      const sharedAreqMs = Number(form.execTime || Math.floor(random() * 701 + 800))
      const cardSchemeKey = String(form.cardScheme || 'V').trim() || 'V'
      const metrics: Array<{ path?: string; execTime?: number }> = []
      if (indexName.includes('3dss-transaction')) {
        metrics.push({ path: `${cardSchemeKey}_DS_URL`, execTime: sharedAreqMs })
      }
      metrics.push(
        { path: form.performancePath, execTime: Number(form.execTime || 0) },
        {
          path: 'CardSchemeService.caculateCavv',
          execTime: Number(form.cavvExecTime || Math.floor(random() * 21 + 10))
        },
        {
          path: 'VerificationCodeService.sendVerificationCode',
          execTime: Number(form.otpExecTime || Math.floor(random() * 61 + 20))
        },
        {
          path: `/challenge/brw/${form.cardScheme}/${form.messageVersion}/${form.issuerOid}/1/${form.acsTransId}/creq`,
          execTime: Number(form.creqExecTime || Math.floor(random() * 501 + 300))
        },
        {
          path: `/acs-auth/auth/${form.cardScheme}/${form.messageVersion}/${form.issuerOid}/001/areq`,
          execTime: sharedAreqMs
        },
        {
          path: `/acs-auth/auth/${form.cardScheme}/${form.messageVersion}/${form.issuerOid}/001/rreq`,
          execTime: Number(form.rreqExecTime || Math.floor(random() * 401 + 200))
        },
        {
          path: 'RiskEvaluationService.evaluate',
          execTime: Number(form.rbaExecTime || Math.floor(random() * 151 + 50))
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
      form.challengeCancel && form.challengeCancel !== NULL_VALUE ? form.challengeCancel : undefined
  }
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
  if (form.authenticationMethod && form.authenticationMethod !== NULL_VALUE) {
    doc.authenticationMethod = form.authenticationMethod
  }
  if (form.otpFailedCount !== undefined && form.otpFailedCount !== '') {
    doc.otpFailedCount = form.otpFailedCount
  }
  if (form.resendCounter !== undefined && form.resendCounter !== '') {
    doc.resendCounter = form.resendCounter
  }
  if (form.authenticationType && form.authenticationType !== NULL_VALUE) {
    doc.authenticationType = form.authenticationType
  }
  const countryCodeForGeoIP = form.merchantCountryCode || form.merchantCountryCodeStr || '156'
  const countryInfo = GEOIP_COUNTRY_CODE_MAP[countryCodeForGeoIP] || GEOIP_COUNTRY_CODE_MAP['156']!
  if (form.enableBrowserGeoIPRandom !== 'off') {
    ;(doc as unknown as Record<string, unknown>).browserGeoIP = generateGeoIP(
      countryCodeForGeoIP,
      countryInfo.name,
      countryInfo.alpha2,
      random
    )
  }
  if (form.enableDeviceGeoIPRandom !== 'off') {
    ;(doc as unknown as Record<string, unknown>).deviceGeoIP = generateGeoIP(
      countryCodeForGeoIP,
      countryInfo.name,
      countryInfo.alpha2,
      random
    )
  }
  ;(doc as unknown as Record<string, unknown>).visaDafMessageExtension = null
  ;(doc as unknown as Record<string, unknown>)['purchaseCurrency-country_info'] = {
    'ISO4217-currency_minor_unit': form.currencyMinorUnit,
    'ISO4217-currency_name': form.currencyName,
    'ISO4217-currency_alphabetic_code': form.currencyAlphabeticCode,
    'ISO4217-currency_numeric_code': form.currencyNumericCode
  }
  ;(doc as unknown as Record<string, unknown>).threedsRequestorChlgInd =
    form.threeDSRequestorChallengeInd
  ;(doc as unknown as Record<string, unknown>).merchantCountryCode_country_info = {
    'ISO3166-1-Alpha-2': form.countryAlpha2,
    'ISO3166-1-numeric': form.countryNumeric,
    'ISO3166-1-Alpha-3': form.countryAlpha3,
    official_name_en: form.countryName
  }
  ;(doc as unknown as Record<string, unknown>).purchaseCurrencyStr = form.purchaseCurrency
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
