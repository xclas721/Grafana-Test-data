import { describe, expect, it } from 'vitest'
import {
  acsStateMachineReasonForChallengeCancel,
  buildAresWeights,
  computeExpectedRates,
  parsePercent,
  rollRandomStatuses,
  resolveStatusDependencies
} from './useTransactionStatusRules'

describe('useTransactionStatusRules', () => {
  it('parsePercent 會限制在 0 到 100', () => {
    expect(parsePercent('-10', 50)).toBe(0)
    expect(parsePercent('150', 50)).toBe(100)
    expect(parsePercent('abc', 50)).toBe(50)
  })

  it('ARes 權重全部無效時會回退預設值', () => {
    const weights = buildAresWeights({
      aresWeightY: '-1',
      aresWeightN: '-2',
      aresWeightR: '-3',
      aresWeightC: '-4',
      aresWeightD: '-5',
      aresWeightA: '-6',
      aresWeightI: '-7',
      aresWeightS: '-8',
      aresWeightU: '-9'
    })

    expect(weights[0]?.value).toBe('Y')
    expect(weights[0]?.weight).toBe(40)
  })

  it('會正確計算交易成功率', () => {
    const rates = computeExpectedRates({
      aresWeightY: '40',
      aresWeightN: '10',
      aresWeightR: '10',
      aresWeightC: '20',
      aresWeightD: '20',
      aresWeightA: '0',
      aresWeightI: '0',
      aresWeightS: '0',
      aresWeightU: '0',
      rreqWeightNull: '0',
      rreqWeightY: '50',
      rreqWeightN: '50',
      rreqWeightU: '0',
      rreqWeightR: '0'
    })

    expect(rates.expectedTransactionSuccessRate).toBe(60)
    expect(rates.expectedChallengeSuccessRate).toBe(50)
    expect(rates.expectedFrictionlessRate).toBe(40)
  })

  it('ARes=N／U／R 都會啟用 transStatusReason 並補預設值', () => {
    for (const ares of ['N', 'U', 'R'] as const) {
      const next = resolveStatusDependencies({
        activeMode: 'acs',
        aresTransStatus: ares,
        rreqTransStatus: 'NULL_VALUE',
        transStatusReason: 'NULL_VALUE',
        stateMachineReason: 'NULL_VALUE'
      })

      expect(next.disableTransStatusReason).toBe(false)
      expect(next.transStatusReason).toBe('01')
    }
  })

  it('acsStateMachineReasonForChallengeCancel：05→1004、04→1005', () => {
    expect(acsStateMachineReasonForChallengeCancel('05')).toBe('1004')
    expect(acsStateMachineReasonForChallengeCancel('04')).toBe('1005')
    expect(acsStateMachineReasonForChallengeCancel('01')).toBeUndefined()
  })

  it('ACS 模式 cancel=05 會強制 stm=1004 且 reason=14', () => {
    const next = resolveStatusDependencies({
      activeMode: 'acs',
      aresTransStatus: 'C',
      rreqTransStatus: 'N',
      transStatusReason: '01',
      stateMachineReason: '5002',
      challengeCancel: '05'
    })

    expect(next.stateMachineReason).toBe('1004')
    expect(next.transStatusReason).toBe('14')
    expect(next.stateMachineReasonMode).toBe('fixed')
  })

  it('3DSS 模式 cancel=05 不改 stm（拆桶看 challengeCancel）', () => {
    const next = resolveStatusDependencies({
      activeMode: 'dss',
      aresTransStatus: 'C',
      rreqTransStatus: 'N',
      transStatusReason: '01',
      stateMachineReason: 'S3401',
      challengeCancel: '05'
    })

    expect(next.stateMachineReason).toBe('S3401')
    expect(next.transStatusReason).toBe('01')
  })

  it('ARes=C 且 RReq=U／R 會啟用 challengeCancel', () => {
    for (const rreq of ['U', 'R'] as const) {
      const next = resolveStatusDependencies({
        activeMode: 'dss',
        aresTransStatus: 'C',
        rreqTransStatus: rreq,
        transStatusReason: '01',
        stateMachineReason: 'NULL_VALUE'
      })

      expect(next.disableTransStatusReason).toBe(false)
      expect(next.disableChallengeCancel).toBe(false)
      expect(next.transStatus).toBe(rreq)
    }
  })

  it('ARes=C 且 RReq=N 會啟用 transStatusReason／challengeCancel，且不清掉既有 reason', () => {
    const next = resolveStatusDependencies({
      activeMode: 'dss',
      aresTransStatus: 'C',
      rreqTransStatus: 'N',
      transStatusReason: '14',
      stateMachineReason: 'NULL_VALUE'
    })

    expect(next.disableTransStatusReason).toBe(false)
    expect(next.disableChallengeCancel).toBe(false)
    expect(next.transStatusReason).toBe('14')
    expect(next.transStatus).toBe('N')
  })

  it('ARes=C 且 RReq=Y 時仍關閉 transStatusReason 並清成 NULL_VALUE', () => {
    const next = resolveStatusDependencies({
      activeMode: 'dss',
      aresTransStatus: 'C',
      rreqTransStatus: 'Y',
      transStatusReason: '14',
      stateMachineReason: 'NULL_VALUE'
    })

    expect(next.disableTransStatusReason).toBe(true)
    expect(next.transStatusReason).toBe('NULL_VALUE')
  })

  it('ACS 模式下 ARes=Y 會強制 stateMachineReason', () => {
    const next = resolveStatusDependencies({
      activeMode: 'acs',
      aresTransStatus: 'Y',
      rreqTransStatus: 'N',
      transStatusReason: '05',
      stateMachineReason: 'NULL_VALUE'
    })

    expect(next.disableStateMachineReason).toBe(true)
    expect(next.stateMachineReasonMode).toBe('fixed')
    expect(next.stateMachineReason).toBe('0000')
    expect(next.rreqTransStatus).toBe('NULL_VALUE')
  })

  it('固定模式下會保留指定 stateMachineReason', () => {
    const next = rollRandomStatuses({
      activeMode: 'acs',
      stateMachineReasonMode: 'fixed',
      stateMachineReason: 'S3401',
      aresWeightY: '100',
      aresWeightN: '0',
      aresWeightR: '0',
      aresWeightC: '0',
      aresWeightD: '0',
      aresWeightA: '0',
      aresWeightI: '0',
      aresWeightS: '0',
      aresWeightU: '0',
      rreqWeightNull: '0',
      rreqWeightY: '100',
      rreqWeightN: '0',
      rreqWeightU: '0',
      rreqWeightR: '0'
    })

    expect(next.aresTransStatus).toBe('Y')
    expect(next.rreqTransStatus).toBe('NULL_VALUE')
    expect(next.transStatus).toBe('Y')
    expect(next.stateMachineReason).toBe('S3401')
  })

  it('System Monitor RReq 錯誤會對齊 Challenge 失敗狀態', () => {
    const next = resolveStatusDependencies({
      activeMode: 'acs',
      aresTransStatus: 'Y',
      rreqTransStatus: 'NULL_VALUE',
      transStatusReason: 'NULL_VALUE',
      stateMachineReason: '3401'
    })
    expect(next.aresTransStatus).toBe('C')
    expect(next.rreqTransStatus).toBe('N')
    expect(next.transStatus).toBe('N')
  })

  it('System Monitor OTP 錯誤會對齊 Challenge 失敗狀態', () => {
    const next = resolveStatusDependencies({
      activeMode: 'acs',
      aresTransStatus: 'Y',
      rreqTransStatus: 'Y',
      transStatusReason: 'NULL_VALUE',
      stateMachineReason: '3399'
    })
    expect(next.transStatus).toBe('N')
    expect(next.rreqTransStatus).toBe('N')
  })
})
