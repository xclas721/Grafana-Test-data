/** Requestor ID 清單；預設不隨機，表單固定用第一筆。 */
export const REQUESTOR_ID_OPTIONS = [
  '12128301823081230123',
  '123123',
  '456456',
  '789789',
  '987987',
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999'
] as const

export const DEFAULT_REQUESTOR_ID = REQUESTOR_ID_OPTIONS[0]

/** 各 requestor 商店權重（3000 + 250×4 + 100×10 = 5000）。 */
export const REQUESTOR_MERCHANT_WEIGHTS = [
  3000, 250, 250, 250, 250, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100
] as const

export const REQUESTOR_WEIGHT_TOTAL = REQUESTOR_MERCHANT_WEIGHTS.reduce((sum, w) => sum + w, 0)

export function pickWeightedIndex(weights: readonly number[], random: () => number): number {
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total <= 0 || weights.length === 0) return 0
  let cursor = random() * total
  for (let i = 0; i < weights.length; i++) {
    const weight = weights[i] ?? 0
    if (cursor < weight) return i
    cursor -= weight
  }
  return weights.length - 1
}
