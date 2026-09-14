import { GEOIP_COUNTRY_CODE_MAP } from '@/shared/constants/countryCurrency'
import { GEOIP_CITIES } from '@/shared/constants/geoIpCities'

export type FingerprintMode = 'off' | 'mixed' | 'fp2-only' | 'diia-only'

export type DiiaCountryInfo = { name: string; alpha2: string }

export type ResolveFingerprintFieldsParams = {
  mode: FingerprintMode
  deviceChannel?: string
  threeDSCompInd?: string
  countryCodeForGeoIP: string
  countryInfo: DiiaCountryInfo
  methodExecutionRate?: number
  diiaRatio?: number
  udidPoolSize?: number
  random: () => number
}

export type FingerprintFieldsResult = {
  transRecordType?: string
  fingerprintMethod?: 'FP2' | 'DIIA'
  diiaDeviceInfo?: Record<string, unknown>
  suppressDeviceAdvertisingId?: boolean
}

const DEFAULT_METHOD_EXECUTION_RATE = 0.85
const DEFAULT_DIIA_RATIO = 0.35
const DEFAULT_UDID_POOL_SIZE = 200

const TRANS_RECORD_TYPE_WEIGHTS = [
  ['MASTER', 0.92],
  ['ABNORMAL', 0.05],
  ['NONE', 0.03]
] as const

function pickWeighted<T>(entries: ReadonlyArray<readonly [T, number]>, random: () => number): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = random() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll <= 0) return value
  }
  return entries[entries.length - 1]![0]
}

export function pickTransRecordType(random: () => number): string {
  return pickWeighted(TRANS_RECORD_TYPE_WEIGHTS, random)
}

/** 簡易 mulberry32 PRNG：同一 seed 永遠產生同一序列，用於由 pool index 反推穩定 udid。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function stableUdidFromIndex(index: number): string {
  const rnd = mulberry32(index + 1)
  let out = ''
  for (let i = 0; i < 32; i++) out += Math.floor(rnd() * 16).toString(16)
  return out
}

/** 用有限 pool index 反推 udid，避免每筆全新 udid 導致 cardinality = 交易數。 */
export function generateDiiaUdid(random: () => number, poolSize = DEFAULT_UDID_POOL_SIZE): string {
  const idx = Math.floor(random() * poolSize)
  return stableUdidFromIndex(idx)
}

function randomInt(max: number, random: () => number): number {
  return Math.floor(random() * (max + 1))
}

function randomIPv4(random: () => number): string {
  return `${randomInt(255, random)}.${randomInt(255, random)}.${randomInt(255, random)}.${randomInt(255, random)}`
}

const DEVICE_TYPE_WEIGHTS = [
  ['Desktop or Laptop', 0.55],
  ['Mobile', 0.35],
  ['Tablet', 0.06],
  ['Browser Emulator', 0.02],
  ['Application Emulator', 0.01],
  ['Virtual Machine', 0.01]
] as const

function pickOsAndBrowser(
  deviceType: string,
  random: () => number
): { osName: string; browserName: string } {
  switch (deviceType) {
    case 'Mobile': {
      const osName = pickWeighted(
        [
          ['iOS', 0.45],
          ['Android', 0.55]
        ] as const,
        random
      )
      const browserName =
        osName === 'iOS'
          ? pickWeighted(
              [
                ['Safari', 0.85],
                ['Chrome', 0.15]
              ] as const,
              random
            )
          : pickWeighted(
              [
                ['Chrome', 0.8],
                ['Samsung Internet', 0.2]
              ] as const,
              random
            )
      return { osName, browserName }
    }
    case 'Tablet': {
      const osName = pickWeighted(
        [
          ['iPadOS', 0.6],
          ['Android', 0.4]
        ] as const,
        random
      )
      const browserName = osName === 'iPadOS' ? 'Safari' : 'Chrome'
      return { osName, browserName }
    }
    case 'Browser Emulator':
    case 'Application Emulator':
    case 'Virtual Machine': {
      const osName = pickWeighted(
        [
          ['Windows', 0.5],
          ['Linux', 0.5]
        ] as const,
        random
      )
      const browserName = pickWeighted(
        [
          ['Chrome', 0.5],
          ['Headless Chrome', 0.5]
        ] as const,
        random
      )
      return { osName, browserName }
    }
    default: {
      const osName = pickWeighted(
        [
          ['Windows', 0.6],
          ['macOS', 0.3],
          ['Linux', 0.1]
        ] as const,
        random
      )
      const browserName = pickWeighted(
        [
          ['Chrome', 0.55],
          ['Edge', 0.2],
          ['Safari', 0.15],
          ['Firefox', 0.1]
        ] as const,
        random
      )
      return { osName, browserName }
    }
  }
}

export type GenerateDiiaDeviceInfoParams = {
  countryCodeForGeoIP: string
  countryInfo: DiiaCountryInfo
  udidPoolSize?: number
  random: () => number
}

/** 對齊 DeviceIntelligenceParser 輸出形狀的 diiaDeviceInfo 假資料（布林為真 boolean）。 */
export function generateDiiaDeviceInfo(
  params: GenerateDiiaDeviceInfoParams
): Record<string, unknown> {
  const { countryCodeForGeoIP, countryInfo, random } = params
  const deviceType = pickWeighted(DEVICE_TYPE_WEIGHTS, random)
  const { osName, browserName } = pickOsAndBrowser(deviceType, random)

  const isTorIp = random() < 0.01
  const isTorBrowser = isTorIp ? random() < 0.6 : random() < 0.002
  const isWebdriver = random() < 0.02
  const robotWebdriver = isWebdriver ? random() < 0.7 : random() < 0.01
  const isTampered = random() < 0.015
  const evalScore = random() < 0.7 ? randomInt(30, random) : randomInt(100, random)

  const sourceCityList = GEOIP_CITIES[countryCodeForGeoIP] || [
    { name: 'Unknown', lat: 0, lon: 0, region: 'UN' }
  ]
  const sourceCity = sourceCityList[Math.floor(random() * sourceCityList.length)]!

  const jumpCountryCodes = Object.keys(GEOIP_COUNTRY_CODE_MAP).filter(
    (code) => code !== countryCodeForGeoIP
  )
  const isJump = jumpCountryCodes.length > 0 && random() < 0.08
  const destCode = isJump
    ? jumpCountryCodes[Math.floor(random() * jumpCountryCodes.length)]!
    : countryCodeForGeoIP
  const destCountryInfo = GEOIP_COUNTRY_CODE_MAP[destCode] || countryInfo

  const di: Record<string, unknown> = {
    udid: generateDiiaUdid(random, params.udidPoolSize),
    isVpn: random() < 0.08,
    isProxy: random() < 0.05,
    isTorIp,
    isTorBrowser,
    isWebdriver,
    isPrivateMode: random() < 0.03,
    deviceType,
    osName,
    browserName,
    ip: randomIPv4(random),
    ipCountry: countryInfo.alpha2,
    ipCity: sourceCity.name,
    ipGeo: {
      lat: sourceCity.lat + (random() - 0.5) * 0.1,
      lon: sourceCity.lon + (random() - 0.5) * 0.1
    },
    ipDestCountry: destCountryInfo.alpha2,
    robotWebdriver,
    isTampered,
    evalScore
  }

  if (random() < 0.6) {
    di.ext = {
      cpuCores: String(randomInt(15, random) + 1),
      memorySize: String((randomInt(28, random) + 4) * 1024),
      osVersion: `${randomInt(15, random) + 1}.0`,
      browserVersion: `${randomInt(40, random) + 90}.0`
    }
  }

  return di
}

/**
 * 決定 transRecordType／fingerprintMethod／diiaDeviceInfo，由 buildDocument 呼叫。
 * mode='off' 時完全不動既有欄位（相容舊行為）。
 */
export function resolveFingerprintFields(
  params: ResolveFingerprintFieldsParams
): FingerprintFieldsResult {
  const { mode, random } = params
  if (mode === 'off') return {}

  const transRecordType = pickTransRecordType(random)

  const isMethodEligible = params.deviceChannel === '02' && params.threeDSCompInd === 'Y'
  const methodExecutionRate = params.methodExecutionRate ?? DEFAULT_METHOD_EXECUTION_RATE
  const hasMethod = isMethodEligible && random() < methodExecutionRate
  if (!hasMethod) {
    return { transRecordType }
  }

  const diiaRatio = params.diiaRatio ?? DEFAULT_DIIA_RATIO
  const useDiia = mode === 'diia-only' ? true : mode === 'fp2-only' ? false : random() < diiaRatio

  if (!useDiia) {
    return { transRecordType, fingerprintMethod: 'FP2' }
  }

  const diiaDeviceInfo = generateDiiaDeviceInfo({
    countryCodeForGeoIP: params.countryCodeForGeoIP,
    countryInfo: params.countryInfo,
    udidPoolSize: params.udidPoolSize,
    random
  })

  return {
    transRecordType,
    fingerprintMethod: 'DIIA',
    diiaDeviceInfo,
    suppressDeviceAdvertisingId: random() < 0.7
  }
}
