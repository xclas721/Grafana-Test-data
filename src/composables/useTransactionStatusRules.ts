import {
  alignStatusesForSystemMonitorError,
  defaultStateMachineReason,
  isSystemMonitorExternalErrorCode,
  pickRandomStateMachineReasonAcsWeighted,
  pickRandomStateMachineReasonDssWeighted,
  stateMachineReasonForAresForcedPath,
  type ProductMode
} from '@/shared/constants/stateMachineReason'

export type AresWeightInput = {
  aresWeightY: string
  aresWeightN: string
  aresWeightR: string
  aresWeightC: string
  aresWeightD: string
  aresWeightA: string
  aresWeightI: string
  aresWeightS: string
  aresWeightU: string
}

export type RreqWeightInput = {
  rreqWeightNull: string
  rreqWeightY: string
  rreqWeightN: string
  rreqWeightU: string
  rreqWeightR: string
}

export const FORM_DEFAULT_ARES_WEIGHTS = {
  Y: 6,
  N: 10,
  R: 10,
  C: 64,
  D: 0,
  A: 0,
  I: 1,
  S: 0,
  U: 9
} as const

export const FORM_DEFAULT_RREQ_WEIGHTS = {
  NULL_VALUE: 5,
  Y: 74,
  N: 8,
  U: 7,
  R: 6
} as const

/** Challenge 失敗時寫入 challengeCancel 的機率（%）。 */
export const FORM_DEFAULT_CHALLENGE_CANCEL_RATE = 8

export const ARES_STATUS_MEANING: Record<string, string> = {
  Y: 'Authentication Successful（免密成功）',
  N: 'Not Authenticated',
  U: 'Authentication Could Not Be Performed',
  A: 'Attempts Processing Performed',
  C: 'Challenge Required',
  D: 'Challenge Required; Decoupled Authentication',
  R: 'Authentication Rejected',
  I: 'Informational Only（NPA）',
  S: 'Challenge Required; SPC'
}

export const RREQ_STATUS_MEANING: Record<string, string> = {
  NULL_VALUE: '無 RReq（Frictionless 或挑戰未完成）',
  Y: 'Challenge 最終成功',
  N: 'Challenge 最終未認證',
  U: 'Challenge 無法完成',
  R: 'Challenge 最終拒絕'
}

export const DEFAULT_ARES_STATUS_WEIGHTS = [
  { value: 'Y', weight: FORM_DEFAULT_ARES_WEIGHTS.Y },
  { value: 'N', weight: FORM_DEFAULT_ARES_WEIGHTS.N },
  { value: 'R', weight: FORM_DEFAULT_ARES_WEIGHTS.R },
  { value: 'C', weight: FORM_DEFAULT_ARES_WEIGHTS.C },
  { value: 'D', weight: FORM_DEFAULT_ARES_WEIGHTS.D },
  { value: 'A', weight: FORM_DEFAULT_ARES_WEIGHTS.A },
  { value: 'I', weight: FORM_DEFAULT_ARES_WEIGHTS.I },
  { value: 'S', weight: FORM_DEFAULT_ARES_WEIGHTS.S },
  { value: 'U', weight: FORM_DEFAULT_ARES_WEIGHTS.U }
]

/** RReq：含失敗 N／U／R，供 Insight 失敗原因熱力（B-11／B-12）有三欄資料。 */
export const DEFAULT_RREQ_WEIGHTS = [
  { value: 'NULL_VALUE', weight: FORM_DEFAULT_RREQ_WEIGHTS.NULL_VALUE },
  { value: 'Y', weight: FORM_DEFAULT_RREQ_WEIGHTS.Y },
  { value: 'N', weight: FORM_DEFAULT_RREQ_WEIGHTS.N },
  { value: 'U', weight: FORM_DEFAULT_RREQ_WEIGHTS.U },
  { value: 'R', weight: FORM_DEFAULT_RREQ_WEIGHTS.R }
] as const

export function isAresFailureStatus(ares: string): boolean {
  return ares === 'N' || ares === 'U' || ares === 'R'
}

export function isRreqFailureStatus(rreq: string): boolean {
  return rreq === 'N' || rreq === 'U' || rreq === 'R'
}

/**
 * ACS 逾時連動（對齊 CReqTransTimeoutService／ACS D-02）：
 * challengeCancel 05（首 CReq 未收到）→ stateMachineReason 1004 → 熱力 14_1004；
 * challengeCancel 04（其餘 ACS 逾時）→ stateMachineReason 1005 → 熱力 14_1005。
 * 3DSS D-02／B-12 拆桶看 challengeCancel，不經此函式改 stm。
 */
export function acsStateMachineReasonForChallengeCancel(
  challengeCancel: string
): '1004' | '1005' | undefined {
  if (challengeCancel === '05') return '1004'
  if (challengeCancel === '04') return '1005'
  return undefined
}

export function parsePercent(value: string, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  if (parsed < 0) return 0
  if (parsed > 100) return 100
  return Math.round(parsed)
}

export function buildAresWeights(input: AresWeightInput): Array<{ value: string; weight: number }> {
  const items = [
    { value: 'Y', weight: parsePercent(input.aresWeightY, FORM_DEFAULT_ARES_WEIGHTS.Y) },
    { value: 'N', weight: parsePercent(input.aresWeightN, FORM_DEFAULT_ARES_WEIGHTS.N) },
    { value: 'R', weight: parsePercent(input.aresWeightR, FORM_DEFAULT_ARES_WEIGHTS.R) },
    { value: 'C', weight: parsePercent(input.aresWeightC, FORM_DEFAULT_ARES_WEIGHTS.C) },
    { value: 'D', weight: parsePercent(input.aresWeightD, FORM_DEFAULT_ARES_WEIGHTS.D) },
    { value: 'A', weight: parsePercent(input.aresWeightA, FORM_DEFAULT_ARES_WEIGHTS.A) },
    { value: 'I', weight: parsePercent(input.aresWeightI, FORM_DEFAULT_ARES_WEIGHTS.I) },
    { value: 'S', weight: parsePercent(input.aresWeightS, FORM_DEFAULT_ARES_WEIGHTS.S) },
    { value: 'U', weight: parsePercent(input.aresWeightU, FORM_DEFAULT_ARES_WEIGHTS.U) }
  ]
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  if (total <= 0) return DEFAULT_ARES_STATUS_WEIGHTS
  return items
}

export function computeAresWeightTotal(input: AresWeightInput): number {
  return (
    parsePercent(input.aresWeightY, 0) +
    parsePercent(input.aresWeightN, 0) +
    parsePercent(input.aresWeightR, 0) +
    parsePercent(input.aresWeightC, 0) +
    parsePercent(input.aresWeightD, 0) +
    parsePercent(input.aresWeightA, 0) +
    parsePercent(input.aresWeightI, 0) +
    parsePercent(input.aresWeightS, 0) +
    parsePercent(input.aresWeightU, 0)
  )
}

export function buildRreqWeights(input: RreqWeightInput): Array<{ value: string; weight: number }> {
  const items = [
    {
      value: 'NULL_VALUE',
      weight: parsePercent(input.rreqWeightNull, FORM_DEFAULT_RREQ_WEIGHTS.NULL_VALUE)
    },
    { value: 'Y', weight: parsePercent(input.rreqWeightY, FORM_DEFAULT_RREQ_WEIGHTS.Y) },
    { value: 'N', weight: parsePercent(input.rreqWeightN, FORM_DEFAULT_RREQ_WEIGHTS.N) },
    { value: 'U', weight: parsePercent(input.rreqWeightU, FORM_DEFAULT_RREQ_WEIGHTS.U) },
    { value: 'R', weight: parsePercent(input.rreqWeightR, FORM_DEFAULT_RREQ_WEIGHTS.R) }
  ]
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  if (total <= 0) return [...DEFAULT_RREQ_WEIGHTS]
  return items
}

export function computeRreqWeightTotal(input: RreqWeightInput): number {
  return (
    parsePercent(input.rreqWeightNull, 0) +
    parsePercent(input.rreqWeightY, 0) +
    parsePercent(input.rreqWeightN, 0) +
    parsePercent(input.rreqWeightU, 0) +
    parsePercent(input.rreqWeightR, 0)
  )
}

export function computeExpectedRates(input: AresWeightInput & RreqWeightInput): {
  expectedFrictionlessRate: number
  expectedChallengeSuccessRate: number
  expectedTransactionSuccessRate: number
} {
  const aresTotal = computeAresWeightTotal(input) || 100
  const rreqTotal = computeRreqWeightTotal(input) || 100
  const y = parsePercent(input.aresWeightY, 0)
  const a = parsePercent(input.aresWeightA, 0)
  const i = parsePercent(input.aresWeightI, 0)
  const c = parsePercent(input.aresWeightC, 0)
  const d = parsePercent(input.aresWeightD, 0)
  const rreqY = parsePercent(input.rreqWeightY, 0)
  const rreqSuccessRate = rreqY / rreqTotal

  return {
    expectedFrictionlessRate: ((y + a + i) / aresTotal) * 100,
    expectedChallengeSuccessRate: (rreqY / rreqTotal) * 100,
    expectedTransactionSuccessRate: ((y + a + i + (c + d) * rreqSuccessRate) / aresTotal) * 100
  }
}

export function getTransStatusReasonCandidates(cardScheme: string): string[] {
  const reasons: string[] = []
  for (let i = 1; i <= 26; i++) reasons.push(String(i).padStart(2, '0'))

  if (cardScheme === 'A') {
    reasons.push('80', '81', '82')
  } else if (cardScheme === 'V') {
    for (let i = 80; i <= 92; i++) reasons.push(String(i))
  } else if (cardScheme === 'M') {
    reasons.push('80', '81', '82', '83', '84', '87', '88', '98')
  }

  return reasons
}

function pickWeightedValue(items: Array<{ value: string; weight: number }>): string {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  const r = Math.random() * total
  let acc = 0
  for (const item of items) {
    acc += item.weight
    if (r <= acc) return item.value
  }
  return items[items.length - 1]?.value ?? ''
}

type RollRandomStatusesInput = AresWeightInput &
  RreqWeightInput & {
    activeMode?: ProductMode
    stateMachineReasonMode: 'random' | 'fixed'
    stateMachineReason: string
  }

type RollRandomStatusesOutput = {
  aresTransStatus: string
  rreqTransStatus: string
  transStatus: string
  stateMachineReason: string
}

export function rollRandomStatuses(input: RollRandomStatusesInput): RollRandomStatusesOutput {
  const aresTransStatus = pickWeightedValue(buildAresWeights(input))

  let rreqTransStatus = 'NULL_VALUE'
  let transStatus = aresTransStatus
  if (aresTransStatus === 'C' || aresTransStatus === 'D') {
    const rreqItems = buildRreqWeights(input)
    const rreqTotal = rreqItems.reduce((sum, item) => sum + item.weight, 0)
    rreqTransStatus =
      rreqTotal > 0 ? pickWeightedValue(rreqItems) : pickWeightedValue([...DEFAULT_RREQ_WEIGHTS])
    transStatus = rreqTransStatus === 'NULL_VALUE' ? aresTransStatus : rreqTransStatus
  }

  const fixedReason = String(input.stateMachineReason || '').trim()
  let stateMachineReason: string
  if (input.stateMachineReasonMode === 'random') {
    if (input.activeMode === 'dss') {
      stateMachineReason = pickRandomStateMachineReasonDssWeighted()
    } else if (aresTransStatus === 'Y') {
      stateMachineReason = stateMachineReasonForAresForcedPath(input.activeMode, 'y')
    } else if (aresTransStatus === 'C' || aresTransStatus === 'D') {
      if (rreqTransStatus === 'Y') {
        stateMachineReason = stateMachineReasonForAresForcedPath(input.activeMode, 'rreqY')
      } else if (rreqTransStatus === 'NULL_VALUE') {
        stateMachineReason = stateMachineReasonForAresForcedPath(input.activeMode, 'rreqNull')
      } else {
        stateMachineReason = pickRandomStateMachineReasonAcsWeighted()
      }
    } else {
      stateMachineReason = pickRandomStateMachineReasonAcsWeighted()
    }
  } else {
    stateMachineReason =
      fixedReason && fixedReason !== 'NULL_VALUE'
        ? fixedReason
        : defaultStateMachineReason(input.activeMode)
  }

  const aligned = alignStatusesForSystemMonitorError(stateMachineReason, {
    aresTransStatus,
    rreqTransStatus,
    transStatus
  })

  return {
    aresTransStatus: aligned.aresTransStatus,
    rreqTransStatus: aligned.rreqTransStatus,
    transStatus: aligned.transStatus,
    stateMachineReason
  }
}

type DependencyInput = {
  activeMode?: ProductMode
  aresTransStatus: string
  rreqTransStatus: string
  transStatusReason: string
  stateMachineReason: string
  /** 供 ACS 逾時連動：cancel 04／05 → stm 1005／1004 + reason 14 */
  challengeCancel?: string
}

export type DependencyOutput = {
  transStatus: string
  rreqTransStatus: string
  transStatusReason: string
  stateMachineReason: string
  stateMachineReasonMode?: 'fixed'
  aresTransStatus?: string
  disableRreqTransStatus: boolean
  disableTransStatusReason: boolean
  disableStateMachineReason: boolean
  disableChallengeCancel: boolean
}

export function resolveStatusDependencies(input: DependencyInput): DependencyOutput {
  const ares = input.aresTransStatus
  let rreqTransStatus = input.rreqTransStatus
  let transStatus = input.aresTransStatus
  let transStatusReason = input.transStatusReason
  let stateMachineReason = input.stateMachineReason
  let stateMachineReasonMode: 'fixed' | undefined

  const fixedSystemMonitorError =
    input.activeMode !== 'dss' && isSystemMonitorExternalErrorCode(input.stateMachineReason)

  let disableRreqTransStatus = true
  let disableTransStatusReason = true
  let disableStateMachineReason = false
  let disableChallengeCancel = true

  if (ares === 'C' || ares === 'D') {
    disableRreqTransStatus = false
    transStatus = rreqTransStatus
  } else {
    rreqTransStatus = 'NULL_VALUE'
    transStatus = ares
  }

  // ARes N/U/R：免密失敗，需 reason（Insight B-11 熱力 X=N/U/R）
  // C/D + RReq N/U/R：挑戰失敗，可帶 reason 14 + challengeCancel
  if (isAresFailureStatus(ares)) {
    disableTransStatusReason = false
    if (transStatusReason === 'NULL_VALUE') transStatusReason = '01'
  } else if ((ares === 'C' || ares === 'D') && isRreqFailureStatus(rreqTransStatus)) {
    disableTransStatusReason = false
  } else {
    transStatusReason = 'NULL_VALUE'
  }

  if (fixedSystemMonitorError) {
    stateMachineReason = input.stateMachineReason
    stateMachineReasonMode = 'fixed'
    disableStateMachineReason = false
  } else if (input.activeMode === 'dss') {
    disableStateMachineReason = false
  } else if (ares === 'Y') {
    disableStateMachineReason = true
    stateMachineReasonMode = 'fixed'
    stateMachineReason = stateMachineReasonForAresForcedPath(input.activeMode, 'y')
  } else if (ares === 'C' || ares === 'D') {
    if (rreqTransStatus === 'Y') {
      disableStateMachineReason = true
      stateMachineReasonMode = 'fixed'
      stateMachineReason = stateMachineReasonForAresForcedPath(input.activeMode, 'rreqY')
    } else if (rreqTransStatus === 'NULL_VALUE') {
      disableStateMachineReason = true
      stateMachineReasonMode = 'fixed'
      stateMachineReason = stateMachineReasonForAresForcedPath(input.activeMode, 'rreqNull')
    } else if (stateMachineReason === 'NULL_VALUE') {
      stateMachineReason = defaultStateMachineReason(input.activeMode)
    }
  } else if (stateMachineReason === 'NULL_VALUE') {
    stateMachineReason = defaultStateMachineReason(input.activeMode)
  }

  if ((ares === 'C' || ares === 'D') && isRreqFailureStatus(rreqTransStatus)) {
    disableChallengeCancel = false
  }

  // ACS：cancel 04／05 強制對齊逾時 stm／reason（3DSS 拆桶不依賴 stm）
  if (input.activeMode !== 'dss' && !disableChallengeCancel && !fixedSystemMonitorError) {
    const linkedStm = acsStateMachineReasonForChallengeCancel(input.challengeCancel ?? '')
    if (linkedStm) {
      stateMachineReason = linkedStm
      stateMachineReasonMode = 'fixed'
      transStatusReason = '14'
      disableTransStatusReason = false
      disableStateMachineReason = false
    }
  }

  let aresTransStatusOut: string | undefined
  if (input.activeMode !== 'dss' && isSystemMonitorExternalErrorCode(stateMachineReason)) {
    const aligned = alignStatusesForSystemMonitorError(stateMachineReason, {
      aresTransStatus: ares,
      rreqTransStatus,
      transStatus
    })
    if (aligned.aresTransStatus !== ares) aresTransStatusOut = aligned.aresTransStatus
    rreqTransStatus = aligned.rreqTransStatus
    transStatus = aligned.transStatus
    if (aligned.aresTransStatus === 'C' && isRreqFailureStatus(aligned.rreqTransStatus)) {
      disableChallengeCancel = false
      disableRreqTransStatus = false
    }
  }

  return {
    transStatus,
    rreqTransStatus,
    transStatusReason,
    stateMachineReason,
    stateMachineReasonMode,
    aresTransStatus: aresTransStatusOut,
    disableRreqTransStatus,
    disableTransStatusReason,
    disableStateMachineReason,
    disableChallengeCancel
  }
}
