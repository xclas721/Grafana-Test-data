import { reactive } from 'vue'
import { NULL_VALUE } from '@/shared/constants/nullValue'
import { BATCH_INSERT_FORM_KEYS, type FormMap } from '@/shared/utils/testDataDocument'

export type TestInputFormState = {
  baseUrl: string
  username: string
  password: string
  currentDate: string
  enableCustomTimeRange: boolean
  enableAutoTimeRange: boolean
  startDateTime: string
  endDateTime: string
  timezone: string
  issuerOid: string
  requestorId: string
  acsTransId: string
  threeDSServerTransId: string
  aresTransStatus: string
  transStatus: string
  rreqTransStatus: string
  transStatusReason: string
  stateMachineReason: string
  transStatusReasonMode: 'random' | 'fixed'
  stateMachineReasonMode: 'random' | 'fixed'
  challengeCancel: string
  aresWeightY: string
  aresWeightN: string
  aresWeightR: string
  aresWeightC: string
  aresWeightD: string
  aresWeightA: string
  aresWeightI: string
  aresWeightS: string
  aresWeightU: string
  rreqWeightNull: string
  rreqWeightY: string
  rreqWeightN: string
  rreqWeightU: string
  rreqWeightR: string
  challengeCancelRate: string
  merchantName: string
  merchantCountryCode: string
  acquirerMerchantId: string
  acquirerBin: string
  mcc: string
  purchaseAmount: string
  purchaseCurrency: string
  purchaseExponent: string
  usdAmount: string
  countryAlpha2: string
  countryNumeric: string
  countryAlpha3: string
  countryName: string
  currencyMinorUnit: string
  currencyName: string
  currencyAlphabeticCode: string
  currencyNumericCode: string
  exchangeRate: string
  exchangeBase: string
  exchangeTarget: string
  currencyCodeForRate: string
  cardScheme: string
  acctNumber: string
  cardPoolRatio: string
  cardbin6: string
  acctNumberHashed: string
  acctNumberMask: string
  cardbin8: string
  visaDafMessageExtension: string
  mastercardScore: string
  mastercardDecision: string
  mastercardReasonCode1: string
  mastercardReasonCode2: string
  mastercardStatus: string
  visaRiskBasedAuthenticationScore: string
  messageCategory: string
  messageVersion: string
  deviceChannel: string
  threeDSRequestorChallengeInd: string
  authenticationMethod: string
  authenticationType: string
  deviceIpAddress: string
  browserIP: string
  devicePlatform: string
  deviceLocale: string
  deviceAdvertisingId: string
  threeDSCompInd: string
  merchantCountryCodeStr: string
  performancePath: string
  execTime: string
  creqExecTime: string
  rreqExecTime: string
  rbaExecTime: string
  cavvExecTime: string
  otpExecTime: string
  errorComponent: string
  errorDescription: string
  errorCode: string
  errorDetail: string
  errorMessageType: string
  enableBatchErrorMix: boolean
  batchErrorMixPercent: string
  enablePurchaseAmountRandom: boolean
  enablePurchaseCurrencyRandom: boolean
  enableAcquirerMerchantIdRandom: boolean
  enableAcquirerBinRandom: boolean
  enableAcctNumberRandom: boolean
  enableMerchantCountryCodeRandom: boolean
  enableMerchantCountryAsiaOnly: boolean
  enableMerchantRandom: boolean
  enableCardSchemeRandom: boolean
  enableMastercardExtension: boolean
  enableMastercardExtensionRandom: boolean
  enableVisaScoreRandom: boolean
  enableExecTimeRandom: boolean
  enableCreqExecTimeRandom: boolean
  enableRreqExecTimeRandom: boolean
  enableRbaExecTimeRandom: boolean
  enableCavvExecTimeRandom: boolean
  enableOtpExecTimeRandom: boolean
  enableAll3DSParamsRandom: boolean
  enableMessageCategory: boolean
  enableDeviceChannel: boolean
  enableThreeDSRequestorChallengeInd: boolean
  enableAuthenticationMethodRandom: boolean
  enableAuthenticationTypeRandom: boolean
  enableDeviceIpAddressRandom: boolean
  enableDevicePlatformRandom: boolean
  enableDeviceLocaleRandom: boolean
  enableDeviceAdvertisingIdRandom: boolean
  enableThreeDSCompIndRandom: boolean
  enableMerchantCountryCodeStrRandom: boolean
  enableBrowserGeoIPRandom: boolean
  enableDeviceGeoIPRandom: boolean
  disableRreqTransStatus: boolean
  disableTransStatusReason: boolean
  disableStateMachineReason: boolean
  disableChallengeCancel: boolean
}

type StringFormFieldKey = {
  [K in keyof TestInputFormState]: TestInputFormState[K] extends string ? K : never
}[keyof TestInputFormState]

export function createInitialFormState(options?: {
  enableAutoTimeRange?: boolean
}): TestInputFormState {
  return {
    baseUrl: 'http://localhost:9200',
    username: 'elastic',
    password: '123456',
    currentDate: '',
    enableCustomTimeRange: true,
    enableAutoTimeRange: options?.enableAutoTimeRange ?? true,
    startDateTime: '',
    endDateTime: '',
    timezone: 'browser',
    issuerOid: '06b4b203-da05-73f9-256f-454929df6076',
    requestorId: '12128301823081230123',
    acsTransId: '',
    threeDSServerTransId: '',
    aresTransStatus: 'N',
    transStatus: 'N',
    rreqTransStatus: NULL_VALUE,
    transStatusReason: NULL_VALUE,
    stateMachineReason: '0000',
    transStatusReasonMode: 'random',
    stateMachineReasonMode: 'random',
    challengeCancel: NULL_VALUE,
    aresWeightY: '6',
    aresWeightN: '10',
    aresWeightR: '10',
    aresWeightC: '64',
    aresWeightD: '0',
    aresWeightA: '0',
    aresWeightI: '1',
    aresWeightS: '0',
    aresWeightU: '9',
    rreqWeightNull: '5',
    rreqWeightY: '74',
    rreqWeightN: '8',
    rreqWeightU: '7',
    rreqWeightR: '6',
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
    performancePath:
      '/acs-auth/auth/V/2.2.0/06b4b203-da05-73f9-256f-454929df6076/001/areq',
    execTime: '5437',
    creqExecTime: '500',
    rreqExecTime: '400',
    rbaExecTime: '100',
    cavvExecTime: '20',
    otpExecTime: '50',
    errorComponent: NULL_VALUE,
    errorDescription: NULL_VALUE,
    errorCode: NULL_VALUE,
    errorDetail: NULL_VALUE,
    errorMessageType: NULL_VALUE,
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
  }
}

export function useTestInputFormState(options?: { enableAutoTimeRange?: boolean }) {
  const formState = reactive(createInitialFormState(options))

  function setField(key: StringFormFieldKey, val: string) {
    formState[key] = val as TestInputFormState[typeof key]
  }

  function setFields(values: Record<string, string>) {
    for (const [key, val] of Object.entries(values)) {
      if (key in formState && typeof (formState as Record<string, unknown>)[key] === 'string') {
        setField(key as StringFormFieldKey, String(val))
      }
    }
  }

  function getFormData(): FormMap {
    const data: FormMap = {}
    for (const [key, value] of Object.entries(formState)) {
      if (key.startsWith('disable')) continue
      if (typeof value === 'boolean') {
        data[key] = value ? 'on' : 'off'
      } else {
        data[key] = String(value ?? '')
      }
    }
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

  return {
    formState,
    setField,
    setFields,
    getFormData,
    getFormDataForBatchInsert
  }
}
