import {
  MERCHANT_KINDS,
  MERCHANT_NAME_CORES,
  MERCHANT_NAME_PREFIXES
} from '@/shared/constants/merchantNameLexicon'
import {
  REQUESTOR_ID_OPTIONS,
  REQUESTOR_MERCHANT_WEIGHTS
} from '@/shared/constants/requestorIds'

export type MerchantOption = { name: string; mcc: string }

/** 已知品牌；其餘用獨立店名補到 MERCHANT_POOL_SIZE。 */
export const MERCHANT_MCC_BASE: readonly MerchantOption[] = [
  { name: 'HiTRUST EMV Demo Merchant', mcc: '5999' },
  { name: "McDonald's", mcc: '5814' },
  { name: 'Burger King', mcc: '5814' },
  { name: 'KFC', mcc: '5814' },
  { name: 'Starbucks', mcc: '5814' },
  { name: 'Subway', mcc: '5814' },
  { name: 'Pizza Hut', mcc: '5814' },
  { name: "Domino's Pizza", mcc: '5814' },
  { name: 'Walmart Supercenter', mcc: '5411' },
  { name: 'Costco Wholesale', mcc: '5300' },
  { name: 'Amazon Marketplace', mcc: '5399' },
  { name: 'Apple Store', mcc: '5732' },
  { name: 'Microsoft Store', mcc: '5732' },
  { name: 'IKEA', mcc: '5712' },
  { name: 'H&M', mcc: '5651' },
  { name: 'Zara', mcc: '5691' },
  { name: 'Nike Retail Store', mcc: '5941' },
  { name: 'Adidas Retail Store', mcc: '5941' },
  { name: 'Hilton Hotels', mcc: '7011' },
  { name: 'Marriott Hotels', mcc: '7011' },
  { name: 'Uber Rides', mcc: '4121' },
  { name: 'Global Leisure Rewards', mcc: '5816' }
]

export const MERCHANT_POOL_SIZE = 5000

function independentMerchantAt(index: number): MerchantOption {
  const prefixCount = MERCHANT_NAME_PREFIXES.length
  const coreCount = MERCHANT_NAME_CORES.length
  const kindCount = MERCHANT_KINDS.length
  const prefix = MERCHANT_NAME_PREFIXES[index % prefixCount] as string
  const core = MERCHANT_NAME_CORES[Math.floor(index / prefixCount) % coreCount] as string
  const kind = MERCHANT_KINDS[Math.floor(index / (prefixCount * coreCount)) % kindCount] as {
    suffix: string
    mcc: string
  }
  return { name: `${prefix} ${core} ${kind.suffix}`, mcc: kind.mcc }
}

export function buildMerchantPool(
  size: number = MERCHANT_POOL_SIZE,
  base: readonly MerchantOption[] = MERCHANT_MCC_BASE
): MerchantOption[] {
  const source = base.length > 0 ? base : [{ name: 'Merchant', mcc: '5999' }]
  const count = Math.max(1, Math.floor(size))
  const used = new Set<string>()
  const result: MerchantOption[] = []
  for (const seed of source) {
    if (result.length >= count) break
    if (used.has(seed.name)) continue
    used.add(seed.name)
    result.push({ name: seed.name, mcc: seed.mcc })
  }
  let cursor = 0
  while (result.length < count) {
    const next = independentMerchantAt(cursor)
    cursor += 1
    if (used.has(next.name)) continue
    used.add(next.name)
    result.push(next)
  }
  return result
}

/** 測資商戶隨機池（預設開啟）。 */
export const MERCHANT_MCC_OPTIONS: readonly MerchantOption[] = buildMerchantPool()

/**
 * 各 requestor 商店池。主 requestor 用前 3000；4 個 250 從這 3000 切片（會重複）；
 * 其餘 10 個各 100，用後 2000 的前 1000。
 */
export function buildRequestorMerchantPools(
  merchants: readonly MerchantOption[] = MERCHANT_MCC_OPTIONS,
  requestorIds: readonly string[] = REQUESTOR_ID_OPTIONS,
  weights: readonly number[] = REQUESTOR_MERCHANT_WEIGHTS
): Readonly<Record<string, readonly MerchantOption[]>> {
  const primarySize = weights[0] ?? 0
  const primary = merchants.slice(0, primarySize)
  const tail = merchants.slice(primarySize)
  const pools: Record<string, readonly MerchantOption[]> = {}
  let midOffset = 0
  let tailOffset = 0

  for (let i = 0; i < requestorIds.length; i++) {
    const id = requestorIds[i]
    const weight = weights[i] ?? 0
    if (!id) continue
    if (i === 0) {
      pools[id] = primary
      continue
    }
    if (i <= 4) {
      pools[id] = primary.slice(midOffset, midOffset + weight)
      midOffset += weight
      continue
    }
    pools[id] = tail.slice(tailOffset, tailOffset + weight)
    tailOffset += weight
  }
  return pools
}

export const REQUESTOR_MERCHANT_POOL_MAP = buildRequestorMerchantPools()

/** 池內順位權重：前面的店交易較多（Zipf）。 */
export const MERCHANT_ZIPF_EXPONENT = 0.9

export function merchantRankWeight(rank: number, exponent: number = MERCHANT_ZIPF_EXPONENT): number {
  return 1 / (rank + 1) ** exponent
}

export function pickZipfIndex(
  length: number,
  random: () => number,
  exponent: number = MERCHANT_ZIPF_EXPONENT
): number {
  if (length <= 1) return 0
  let total = 0
  for (let i = 0; i < length; i++) total += merchantRankWeight(i, exponent)
  let cursor = random() * total
  for (let i = 0; i < length; i++) {
    const weight = merchantRankWeight(i, exponent)
    if (cursor < weight) return i
    cursor -= weight
  }
  return length - 1
}
