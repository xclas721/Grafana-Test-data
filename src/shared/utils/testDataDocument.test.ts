import { describe, expect, it } from 'vitest'
import { NULL_VALUE } from '@/shared/constants/nullValue'
import { BATCH_INSERT_FORM_KEYS, buildDocument, type FormMap } from './testDataDocument'

const zeroRandom = () => 0

function minimalForm(overrides: Partial<FormMap> = {}): FormMap {
  return {
    currentDate: '2020-01-15',
    timezone: 'UTC',
    messageCategory: '01',
    messageVersion: '2.2.0',
    deviceChannel: '02',
    merchantName: 'Test Merchant',
    merchantCountryCode: '156',
    mcc: '5661',
    acquirerMerchantId: '8909191',
    acquirerBin: '1231234',
    purchaseAmount: '100',
    purchaseCurrency: '156',
    purchaseExponent: '2',
    usdAmount: '0.13',
    aresTransStatus: 'Y',
    transStatus: 'Y',
    rreqTransStatus: NULL_VALUE,
    transStatusReason: NULL_VALUE,
    stateMachineReason: '0000',
    cardScheme: 'V',
    requestorId: '12128301823081230123',
    acctNumberHashed: 'hash',
    acctNumberMask: '414352******0123',
    cardbin6: '414352',
    cardbin8: '41435200',
    performancePath: '/acs-auth/auth/V/2.2.0/test/001/areq',
    execTime: '1000',
    creqExecTime: '500',
    rreqExecTime: '400',
    rbaExecTime: '100',
    cavvExecTime: '20',
    otpExecTime: '50',
    browserIP: '::1',
    errorComponent: NULL_VALUE,
    errorDescription: NULL_VALUE,
    errorCode: NULL_VALUE,
    errorDetail: NULL_VALUE,
    errorMessageType: NULL_VALUE,
    challengeCancel: NULL_VALUE,
    issuerOid: '06b4b203-da05-73f9-256f-454929df6076',
    acsTransId: 'acs-id-1',
    threeDSServerTransId: '3dss-id-1',
    currencyMinorUnit: '2',
    currencyName: 'Yuan Renminbi',
    currencyAlphabeticCode: 'CNY',
    currencyNumericCode: '156',
    countryAlpha2: 'CN',
    countryNumeric: '156',
    countryAlpha3: 'CHN',
    countryName: 'China',
    threeDSRequestorChallengeInd: '01',
    exchangeRate: '7.2244',
    exchangeBase: 'USD',
    exchangeTarget: 'CNY',
    currencyCodeForRate: 'CNY',
    enableBrowserGeoIPRandom: 'off',
    enableDeviceGeoIPRandom: 'off',
    enableMastercardExtension: 'off',
    enableCustomTimeRange: 'off',
    ...overrides
  }
}

describe('testDataDocument', () => {
  it('BATCH_INSERT_FORM_KEYS 包含 buildDocument 必要欄位', () => {
    expect(BATCH_INSERT_FORM_KEYS).toContain('acsTransId')
    expect(BATCH_INSERT_FORM_KEYS).toContain('merchantCountryCode')
    expect(BATCH_INSERT_FORM_KEYS).toContain('timezone')
  })

  it('buildDocument 使用 sharedTimestamp 時寫入時間戳', () => {
    const { document } = buildDocument(
      minimalForm(),
      'acs-transaction-2020-01-15',
      '2020-01-15T08:00:00.000Z',
      zeroRandom
    )
    expect(document.last_update_timestamp).toBe('2020-01-15T08:00:00.000Z')
    expect(document.first_seen_timestamp).toBe('2020-01-15T08:00:00.000Z')
  })

  it('buildDocument ACS 索引包含 acsTransID', () => {
    const { document } = buildDocument(
      minimalForm(),
      'acs-transaction-2020-01-15',
      '2020-01-15T08:00:00.000Z',
      zeroRandom
    )
    expect(document.acsTransID).toBe('acs-id-1')
    expect(document.issuerOid).toBe('06b4b203-da05-73f9-256f-454929df6076')
    expect(document.threeDSServerTransID).toBeUndefined()
  })

  it('buildDocument 3DSS 索引包含 threeDSServerTransID 且省略 NULL stm', () => {
    const { document } = buildDocument(
      minimalForm({ stateMachineReason: NULL_VALUE }),
      '3dss-transaction-2020-01-15',
      '2020-01-15T08:00:00.000Z',
      zeroRandom
    )
    expect(document.threeDSServerTransID).toBe('3dss-id-1')
    expect(document.stateMachineReason).toBeUndefined()
    expect(document.acsTransID).toBeUndefined()
  })

  it('buildDocument 3DSS 索引含 _DS_URL 效能 metric', () => {
    const { document } = buildDocument(
      minimalForm({ cardScheme: 'M' }),
      '3dss-transaction-2020-01-15',
      '2020-01-15T08:00:00.000Z',
      zeroRandom
    )
    const dsMetric = document.performance_metrics?.find((m) => m.path === 'M_DS_URL')
    expect(dsMetric).toBeDefined()
    expect(dsMetric!.execTime).toBe(1000)
  })

  it('buildDocument challengeCancel 為 NULL_VALUE 時省略', () => {
    const { document } = buildDocument(
      minimalForm({ challengeCancel: NULL_VALUE }),
      'acs-transaction-2020-01-15',
      '2020-01-15T08:00:00.000Z',
      zeroRandom
    )
    expect(document.challengeCancel).toBeUndefined()
  })

  it('buildDocument 啟用 GeoIP 時寫入 browserGeoIP', () => {
    const { document } = buildDocument(
      minimalForm({ enableBrowserGeoIPRandom: 'on' }),
      'acs-transaction-2020-01-15',
      '2020-01-15T08:00:00.000Z',
      zeroRandom
    )
    expect(document.browserGeoIP).toBeDefined()
    expect((document.browserGeoIP as Record<string, unknown>).country_iso_code).toBe('CN')
  })
})
