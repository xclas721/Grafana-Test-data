import {
  REQUESTOR_ID_OPTIONS,
  REQUESTOR_MERCHANT_WEIGHTS
} from '@/shared/constants/requestorIds'

export type MerchantOption = { name: string; mcc: string }

/** 品牌種子；其餘筆數用編號變體補到 MERCHANT_POOL_SIZE。 */
export const MERCHANT_MCC_BASE: readonly MerchantOption[] = [
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
]

export const MERCHANT_POOL_SIZE = 5000

export function buildMerchantPool(
  size: number = MERCHANT_POOL_SIZE,
  base: readonly MerchantOption[] = MERCHANT_MCC_BASE
): MerchantOption[] {
  const source = base.length > 0 ? base : [{ name: 'Merchant', mcc: '5999' }]
  const count = Math.max(1, Math.floor(size))
  const result: MerchantOption[] = []
  for (let i = 0; i < count; i++) {
    const seed = source[i % source.length] as MerchantOption
    if (i < source.length) {
      result.push({ name: seed.name, mcc: seed.mcc })
      continue
    }
    result.push({
      name: `${seed.name} #${String(i + 1).padStart(4, '0')}`,
      mcc: seed.mcc
    })
  }
  return result
}

/** 測資商戶隨機池（預設開啟）。 */
export const MERCHANT_MCC_OPTIONS: readonly MerchantOption[] = buildMerchantPool()

/**
 * 各 requestor 商店池。主 requestor 用前 3000；4 個 250 從這 3000 切片（會重複）；
 * 其餘 10 個各 200，用後 2000。
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
