import { describe, expect, it } from 'vitest'
import {
  generateDiiaDeviceInfo,
  generateDiiaUdid,
  pickTransRecordType,
  resolveFingerprintFields
} from './diiaDeviceInfoGenerator'

const zeroRandom = () => 0
const countryInfo = { name: 'China', alpha2: 'CN' }

describe('diiaDeviceInfoGenerator', () => {
  it('pickTransRecordType 依權重挑選，random=0 時為 MASTER（權重最高的第一項）', () => {
    expect(pickTransRecordType(zeroRandom)).toBe('MASTER')
  })

  it('pickTransRecordType random 接近 1 時落在最後一項', () => {
    expect(pickTransRecordType(() => 0.999999)).toBe('NONE')
  })

  it('generateDiiaUdid 同一 pool index 永遠回傳同一 udid（有限 cardinality）', () => {
    const udidA = generateDiiaUdid(() => 0.1, 10)
    const udidB = generateDiiaUdid(() => 0.1, 10)
    expect(udidA).toBe(udidB)
    expect(udidA).toMatch(/^[0-9a-f]{32}$/)
  })

  it('generateDiiaUdid 不同 pool index 通常回傳不同 udid', () => {
    const udidA = generateDiiaUdid(() => 0.01, 10)
    const udidB = generateDiiaUdid(() => 0.91, 10)
    expect(udidA).not.toBe(udidB)
  })

  it('generateDiiaDeviceInfo 輸出對齊 DeviceIntelligenceParser 形狀，布林為真 boolean', () => {
    const di = generateDiiaDeviceInfo({
      countryCodeForGeoIP: '156',
      countryInfo,
      random: zeroRandom
    })
    expect(typeof di.udid).toBe('string')
    expect(typeof di.isVpn).toBe('boolean')
    expect(typeof di.isProxy).toBe('boolean')
    expect(typeof di.isTorIp).toBe('boolean')
    expect(typeof di.deviceType).toBe('string')
    expect(di.ipGeo).toBeDefined()
    expect(typeof (di.ipGeo as Record<string, unknown>).lat).toBe('number')
    expect(typeof (di.ipGeo as Record<string, unknown>).lon).toBe('number')
    expect(di.ipCountry).toBe('CN')
  })

  it('resolveFingerprintFields mode=off 回傳空物件，不影響既有欄位', () => {
    const result = resolveFingerprintFields({
      mode: 'off',
      deviceChannel: '02',
      threeDSCompInd: 'Y',
      countryCodeForGeoIP: '156',
      countryInfo,
      random: zeroRandom
    })
    expect(result).toEqual({})
  })

  it('resolveFingerprintFields 非 browser 完成交易不產生 fingerprintMethod', () => {
    const result = resolveFingerprintFields({
      mode: 'mixed',
      deviceChannel: '03',
      threeDSCompInd: 'Y',
      countryCodeForGeoIP: '156',
      countryInfo,
      random: zeroRandom
    })
    expect(result.fingerprintMethod).toBeUndefined()
    expect(result.diiaDeviceInfo).toBeUndefined()
    expect(result.transRecordType).toBe('MASTER')
  })

  it('resolveFingerprintFields mode=diia-only 且符合條件時回傳 DIIA + diiaDeviceInfo', () => {
    const result = resolveFingerprintFields({
      mode: 'diia-only',
      deviceChannel: '02',
      threeDSCompInd: 'Y',
      countryCodeForGeoIP: '156',
      countryInfo,
      random: zeroRandom
    })
    expect(result.fingerprintMethod).toBe('DIIA')
    expect(result.diiaDeviceInfo).toBeDefined()
  })

  it('resolveFingerprintFields mode=fp2-only 且符合條件時回傳 FP2 且不帶 diiaDeviceInfo', () => {
    const result = resolveFingerprintFields({
      mode: 'fp2-only',
      deviceChannel: '02',
      threeDSCompInd: 'Y',
      countryCodeForGeoIP: '156',
      countryInfo,
      random: zeroRandom
    })
    expect(result.fingerprintMethod).toBe('FP2')
    expect(result.diiaDeviceInfo).toBeUndefined()
  })
})
