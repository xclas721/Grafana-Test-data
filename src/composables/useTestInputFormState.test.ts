import { describe, expect, it } from 'vitest'
import { NULL_VALUE } from '@/shared/constants/nullValue'
import { createInitialFormState, useTestInputFormState } from './useTestInputFormState'

describe('useTestInputFormState', () => {
  it('createInitialFormState 預設值與原 formState 一致', () => {
    const state = createInitialFormState()
    expect(state.baseUrl).toBe('http://localhost:9200')
    expect(state.rreqTransStatus).toBe(NULL_VALUE)
    expect(state.transStatusReasonMode).toBe('random')
    expect(state.enableBatchErrorMix).toBe(true)
    expect(state.disableRreqTransStatus).toBe(true)
    expect(state.enableMerchantRandom).toBe(true)
    expect(state.enableRequestorRandom).toBe(false)
    expect(state.requestorId).toBe('12128301823081230123')
  })

  it('setField 可直接寫入字串欄位', () => {
    const { formState, setField } = useTestInputFormState()
    setField('merchantName', 'Test Shop')
    expect(formState.merchantName).toBe('Test Shop')
  })

  it('setField 支援 stateMachineReasonMode（不再依賴 stateBindings）', () => {
    const { formState, setField } = useTestInputFormState()
    setField('stateMachineReasonMode', 'fixed')
    expect(formState.stateMachineReasonMode).toBe('fixed')
  })

  it('setFields 批量更新字串欄位', () => {
    const { formState, setFields } = useTestInputFormState()
    setFields({ purchaseAmount: '200', purchaseCurrency: '840' })
    expect(formState.purchaseAmount).toBe('200')
    expect(formState.purchaseCurrency).toBe('840')
  })

  it('getFormData 將 boolean 轉為 on/off', () => {
    const { formState, getFormData } = useTestInputFormState()
    formState.enableBatchErrorMix = true
    formState.enableVisaScoreRandom = false
    const data = getFormData()
    expect(data.enableBatchErrorMix).toBe('on')
    expect(data.enableVisaScoreRandom).toBe('off')
    expect(data.disableRreqTransStatus).toBeUndefined()
  })

  it('getFormDataForBatchInsert 只輸出批次必要欄位', () => {
    const { getFormDataForBatchInsert } = useTestInputFormState()
    const data = getFormDataForBatchInsert()
    expect(data.acsTransId).toBe('')
    expect(data.timezone).toBe('browser')
    expect(data.cardPoolRatio).toBeUndefined()
  })
})
