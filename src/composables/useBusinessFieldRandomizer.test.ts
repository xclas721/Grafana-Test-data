import { describe, expect, it } from 'vitest'
import { randomizeBusinessFields } from './useBusinessFieldRandomizer'

const baseInput = {
  aresTransStatus: 'N',
  rreqTransStatus: 'NULL_VALUE',
  transStatusReasonMode: 'random' as const,
  transStatusReason: 'NULL_VALUE',
  challengeCancelRate: 0.08,
  cardScheme: 'V',
  enablePurchaseAmountRandom: false,
  enableCardSchemeRandom: false,
  enableAcctNumberRandom: false,
  enableAcquirerMerchantIdRandom: false,
  enableAcquirerBinRandom: false,
  enableMerchantRandom: false,
  enableVisaScoreRandom: false,
  enableMastercardExtension: false,
  enableMastercardExtensionRandom: false,
  acquirerBinOptions: ['1231234', '9999999'],
  merchantOptions: [{ name: 'Demo', mcc: '5661' }]
}

describe('useBusinessFieldRandomizer', () => {
  it('ARes=Y 時 transStatusReason 應為 NULL_VALUE', () => {
    const result = randomizeBusinessFields({ ...baseInput, aresTransStatus: 'Y' }, () => 0)
    expect(result.updates.transStatusReason).toBe('NULL_VALUE')
  })

  it('ARes=N／U／R 時會灌 transStatusReason（B-11 熱力）', () => {
    for (const ares of ['N', 'U', 'R'] as const) {
      const result = randomizeBusinessFields({ ...baseInput, aresTransStatus: ares }, () => 0)
      expect(result.updates.transStatusReason).not.toBe('NULL_VALUE')
      expect(result.updates.challengeCancel).toBe('NULL_VALUE')
    }
  })

  it('啟用卡號隨機時會依 cardScheme 產生帳號', () => {
    const result = randomizeBusinessFields(
      {
        ...baseInput,
        enableAcctNumberRandom: true,
        cardScheme: 'M'
      },
      () => 0
    )
    expect(result.updates.acctNumber?.startsWith('515352')).toBe(true)
  })

  it('卡組織隨機不會被擴展隨機覆寫', () => {
    const result = randomizeBusinessFields(
      {
        ...baseInput,
        cardScheme: 'V',
        enableCardSchemeRandom: true,
        enableVisaScoreRandom: true
      },
      () => 2 / 10
    )
    expect(result.updates.cardScheme).toBe('J')
    expect(result.updates.visaRiskBasedAuthenticationScore).toBeUndefined()
  })

  it('卡號依最終卡組織產生', () => {
    const result = randomizeBusinessFields(
      {
        ...baseInput,
        cardScheme: 'V',
        enableCardSchemeRandom: true,
        enableAcctNumberRandom: true,
        enableVisaScoreRandom: true
      },
      () => 2 / 10
    )
    expect(result.updates.cardScheme).toBe('J')
    expect(result.updates.acctNumber?.startsWith('313352')).toBe(true)
  })

  it('challengeCancel 觸發時會在候選值內', () => {
    const result = randomizeBusinessFields(
      {
        ...baseInput,
        aresTransStatus: 'C',
        rreqTransStatus: 'N',
        challengeCancelRate: 1
      },
      () => 0
    )

    expect(['01', '02', '03', '04', '05', '06', '07', '09', '10']).toContain(
      result.updates.challengeCancel
    )
  })

  it('C+N 且 challengeCancel 為 04／05 時 transStatusReason 固定為 14', () => {
    // random=0 → 一定觸發 cancel，且加權抽中第一桶 04
    const result = randomizeBusinessFields(
      {
        ...baseInput,
        aresTransStatus: 'C',
        rreqTransStatus: 'N',
        challengeCancelRate: 1
      },
      () => 0
    )
    expect(result.updates.challengeCancel).toBe('04')
    expect(result.updates.transStatusReason).toBe('14')
  })

  it('ACS 模式 cancel=04／05 會連動 stateMachineReason 1005／1004', () => {
    const cancel04 = randomizeBusinessFields(
      {
        ...baseInput,
        activeMode: 'acs',
        aresTransStatus: 'C',
        rreqTransStatus: 'N',
        challengeCancelRate: 1
      },
      () => 0
    )
    expect(cancel04.updates.challengeCancel).toBe('04')
    expect(cancel04.updates.stateMachineReason).toBe('1005')

    // call1 觸發 cancel；call2 落在 05 桶（0.4 <= r < 0.8）
    let call = 0
    const cancel05 = randomizeBusinessFields(
      {
        ...baseInput,
        activeMode: 'acs',
        aresTransStatus: 'C',
        rreqTransStatus: 'N',
        challengeCancelRate: 1
      },
      () => {
        call += 1
        return call === 1 ? 0 : 0.5
      }
    )
    expect(cancel05.updates.challengeCancel).toBe('05')
    expect(cancel05.updates.stateMachineReason).toBe('1004')
  })

  it('3DSS 模式 cancel=04／05 不改 stateMachineReason（拆桶看 cancel）', () => {
    const result = randomizeBusinessFields(
      {
        ...baseInput,
        activeMode: 'dss',
        aresTransStatus: 'C',
        rreqTransStatus: 'N',
        challengeCancelRate: 1
      },
      () => 0
    )
    expect(result.updates.challengeCancel).toBe('04')
    expect(result.updates.transStatusReason).toBe('14')
    expect(result.updates.stateMachineReason).toBeUndefined()
  })

  it('C+N 且 challengeCancel 為 NULL 時仍灌一般 reason（B-12），不灌 14', () => {
    // 0.99 >= rate 0.08 → cancel=NULL；B-12 仍需要非 NULL reason，但不可灌 14
    const result = randomizeBusinessFields(
      {
        ...baseInput,
        aresTransStatus: 'C',
        rreqTransStatus: 'N',
        challengeCancelRate: 0.08
      },
      () => 0.99
    )
    expect(result.updates.challengeCancel).toBe('NULL_VALUE')
    expect(result.updates.transStatusReason).not.toBe('NULL_VALUE')
    expect(result.updates.transStatusReason).not.toBe('14')
  })

  it('C+N 且其他 challengeCancel 時可灌 reason 14（D-02 其餘桶）', () => {
    // call1: 觸發 cancel；call2: 0.9 → 其他 cancel 桶；call3: pickRandom；call4: reason=14
    let call = 0
    const result = randomizeBusinessFields(
      {
        ...baseInput,
        aresTransStatus: 'C',
        rreqTransStatus: 'N',
        challengeCancelRate: 1
      },
      () => {
        call += 1
        if (call === 1) return 0
        if (call === 2) return 0.9
        if (call === 3) return 0
        return 0
      }
    )
    expect(['01', '02', '03', '06', '07', '09', '10']).toContain(result.updates.challengeCancel)
    expect(result.updates.transStatusReason).toBe('14')
  })
})
