<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import Select, { type SelectOption } from '@/shared/components/Select.vue'

const props = defineProps<{
  aresTransStatus: string
  transStatus: string
  rreqTransStatus: string
  transStatusReason: string
  stateMachineReason: string
  challengeCancel: string
  transStatusReasonMode: 'random' | 'fixed'
  stateMachineReasonMode: 'random' | 'fixed'
  disableRreqTransStatus: boolean
  disableTransStatusReason: boolean
  disableStateMachineReason: boolean
  disableChallengeCancel: boolean
  aresWeightY: string
  aresWeightN: string
  aresWeightR: string
  aresWeightC: string
  aresWeightD: string
  aresWeightA: string
  aresWeightI: string
  aresWeightS: string
  aresWeightU: string
  rreqWeightNull: string
  rreqWeightY: string
  rreqWeightN: string
  challengeCancelRate: string
  aresWeightTotal: number
  aresWeightUnallocated: number
  rreqWeightTotal: number
  rreqWeightUnallocated: number
  expectedTransactionSuccessRate: number
  expectedFrictionlessRate: number
  expectedChallengeSuccessRate: number
}>()

const emit = defineEmits<{
  'update:aresTransStatus': [value: string]
  'update:transStatus': [value: string]
  'update:rreqTransStatus': [value: string]
  'update:transStatusReason': [value: string]
  'update:stateMachineReason': [value: string]
  'update:transStatusReasonMode': [value: 'random' | 'fixed']
  'update:stateMachineReasonMode': [value: 'random' | 'fixed']
  'update:challengeCancel': [value: string]
  'update:aresWeightY': [value: string]
  'update:aresWeightN': [value: string]
  'update:aresWeightR': [value: string]
  'update:aresWeightC': [value: string]
  'update:aresWeightD': [value: string]
  'update:aresWeightA': [value: string]
  'update:aresWeightI': [value: string]
  'update:aresWeightS': [value: string]
  'update:aresWeightU': [value: string]
  'update:rreqWeightNull': [value: string]
  'update:rreqWeightY': [value: string]
  'update:rreqWeightN': [value: string]
  'update:challengeCancelRate': [value: string]
}>()

const getAresWeight = (key: string): number => {
  switch (key) {
    case 'aresWeightY':
      return Number(props.aresWeightY) || 0
    case 'aresWeightN':
      return Number(props.aresWeightN) || 0
    case 'aresWeightR':
      return Number(props.aresWeightR) || 0
    case 'aresWeightC':
      return Number(props.aresWeightC) || 0
    case 'aresWeightD':
      return Number(props.aresWeightD) || 0
    case 'aresWeightA':
      return Number(props.aresWeightA) || 0
    case 'aresWeightI':
      return Number(props.aresWeightI) || 0
    case 'aresWeightS':
      return Number(props.aresWeightS) || 0
    case 'aresWeightU':
      return Number(props.aresWeightU) || 0
    default:
      return 0
  }
}

const onAresWeightInput = (key: string, event: Event) => {
  const target = event.target as HTMLInputElement
  let nextValue = Number(target.value) || 0
  if (nextValue < 0) nextValue = 0
  if (nextValue > 100) nextValue = 100
  const currentValue = getAresWeight(key)
  const baseTotal = props.aresWeightTotal - currentValue
  if (baseTotal + nextValue > 100) {
    nextValue = Math.max(0, 100 - baseTotal)
  }
  if (target.value !== String(nextValue)) {
    target.value = String(nextValue)
  }
  switch (key) {
    case 'aresWeightY':
      emit('update:aresWeightY', String(nextValue))
      break
    case 'aresWeightN':
      emit('update:aresWeightN', String(nextValue))
      break
    case 'aresWeightR':
      emit('update:aresWeightR', String(nextValue))
      break
    case 'aresWeightC':
      emit('update:aresWeightC', String(nextValue))
      break
    case 'aresWeightD':
      emit('update:aresWeightD', String(nextValue))
      break
    case 'aresWeightA':
      emit('update:aresWeightA', String(nextValue))
      break
    case 'aresWeightI':
      emit('update:aresWeightI', String(nextValue))
      break
    case 'aresWeightS':
      emit('update:aresWeightS', String(nextValue))
      break
    case 'aresWeightU':
      emit('update:aresWeightU', String(nextValue))
      break
  }
}

const getRreqWeight = (key: string): number => {
  switch (key) {
    case 'rreqWeightNull':
      return Number(props.rreqWeightNull) || 0
    case 'rreqWeightY':
      return Number(props.rreqWeightY) || 0
    case 'rreqWeightN':
      return Number(props.rreqWeightN) || 0
    default:
      return 0
  }
}

const onRreqWeightInput = (key: string, event: Event) => {
  const target = event.target as HTMLInputElement
  let nextValue = Number(target.value) || 0
  if (nextValue < 0) nextValue = 0
  if (nextValue > 100) nextValue = 100
  const currentValue = getRreqWeight(key)
  const baseTotal = props.rreqWeightTotal - currentValue
  if (baseTotal + nextValue > 100) {
    nextValue = Math.max(0, 100 - baseTotal)
  }
  if (target.value !== String(nextValue)) {
    target.value = String(nextValue)
  }
  switch (key) {
    case 'rreqWeightNull':
      emit('update:rreqWeightNull', String(nextValue))
      break
    case 'rreqWeightY':
      emit('update:rreqWeightY', String(nextValue))
      break
    case 'rreqWeightN':
      emit('update:rreqWeightN', String(nextValue))
      break
  }
}

const onReasonModeChange = (
  key: 'transStatusReasonMode' | 'stateMachineReasonMode',
  value: string
) => {
  const mode = value === 'fixed' ? 'fixed' : 'random'
  if (key === 'transStatusReasonMode') {
    emit('update:transStatusReasonMode', mode)
    if (mode === 'random') emit('update:transStatusReason', 'NULL_VALUE')
  } else {
    emit('update:stateMachineReasonMode', mode)
    if (mode === 'random') emit('update:stateMachineReason', 'NULL_VALUE')
  }
}

const onReasonValueChange = (key: 'transStatusReason' | 'stateMachineReason', value: string) => {
  if (key === 'transStatusReason') {
    emit('update:transStatusReason', value || 'NULL_VALUE')
    emit('update:transStatusReasonMode', 'fixed')
  } else {
    emit('update:stateMachineReason', value || '0000')
    emit('update:stateMachineReasonMode', 'fixed')
  }
}

const aresOptions: SelectOption[] = [
  { value: 'Y', label: 'Y' },
  { value: 'N', label: 'N' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'R', label: 'R' },
  { value: 'A', label: 'A' },
  { value: 'I', label: 'I' },
  { value: 'S', label: 'S' },
  { value: 'U', label: 'U' }
]

const rreqOptions: SelectOption[] = [
  { value: 'NULL_VALUE', label: 'NULL_VALUE' },
  { value: 'Y', label: 'Y - 認證成功' },
  { value: 'N', label: 'N - 認證失敗' }
]

const transStatusReasonOptions: SelectOption[] = [
  { value: 'NULL_VALUE', label: 'NULL_VALUE' },
  { value: '01', label: '01 - Card authentication failed' },
  { value: '02', label: '02 - Unknown device' },
  { value: '03', label: '03 - Unsupported device' },
  { value: '04', label: '04 - Exceeds authentication frequency limit' },
  { value: '05', label: '05 - Expired card' },
  { value: '06', label: '06 - Invalid card number' },
  { value: '07', label: '07 - Invalid transaction' },
  { value: '08', label: '08 - No card record' },
  { value: '09', label: '09 - Security failure' },
  { value: '10', label: '10 - Stolen card' },
  { value: '11', label: '11 - Suspected fraud' },
  { value: '12', label: '12 - Transaction not permitted to Cardholder' },
  { value: '13', label: '13 - Cardholder not enrolled in service' },
  { value: '14', label: '14 - Transaction timed out at the ACS' },
  { value: '15', label: '15 - Low confidence' },
  { value: '16', label: '16 - Medium confidence' },
  { value: '17', label: '17 - High confidence' },
  { value: '18', label: '18 - Very high confidence' },
  { value: '19', label: '19 - Exceeds ACS maximum challenges' },
  { value: '20', label: '20 - Non-Payment transaction not supported' },
  { value: '21', label: '21 - 3RI transaction not supported' },
  { value: '22', label: '22 - ACS technical issue' },
  {
    value: '23',
    label: '23 - Decoupled Authentication required by ACS but not requested by 3DS Requestor'
  },
  { value: '24', label: '24 - 3DS Requestor Decoupled Max Expiry Time exceeded' },
  {
    value: '25',
    label:
      '25 - Decoupled Authentication was provided insufficient time to authenticate Cardholder. ACS will not make attempt'
  },
  { value: '26', label: '26 - Authentication attempted but not performed by the Cardholder' },
  { value: '27', label: '27 - Preferred Authentication Method not supported' },
  { value: '28', label: '28 - Validation of content security policy failed' },
  {
    value: '29',
    label:
      '29 - Authentication attempted but not completed by the Cardholder. Fall back to Decoupled Authentication'
  },
  {
    value: '30',
    label:
      '30 - Authentication completed successfully but additional authentication of the Cardholder required. Reinitiate as Decoupled Authentication'
  },
  { value: '81', label: '81 - Mastercard SCA Exemption' },
  { value: '89', label: '89 - Visa SCP Exemption' },
  { value: '90', label: '90 - Visa Issuer SCA Required' }
]

const stateMachineReasonOptions: SelectOption[] = [
  { value: '0000', label: '0000 - 驗證成功' },
  { value: '0001', label: '0001 - 挑戰驗證成功' },
  { value: '0002', label: '0002 - 報文已受理' },
  { value: '1001', label: '1001 - 設備裝置不支援' },
  { value: '1002', label: '1002 - 不支援該卡別' },
  { value: '1003', label: '1003 - 交易逾時' },
  { value: '1004', label: '1004 - 交易逾時(首CReq未收到)' },
  { value: '1005', label: '1005 - 交易逾時(非首CReq未收到)' },
  { value: '2001', label: '2001 - 請求訊息錯誤(AReq)' },
  { value: '2002', label: '2002 - 請求訊息錯誤 CReq' },
  { value: '2003', label: '2003 - 不在BIN範圍內' },
  { value: '2004', label: '2004 - 請求端點錯誤 issuerOid' },
  { value: '2005', label: '2005 - 幣別代碼錯誤' },
  { value: '2006', label: '2006 - 幣別小數位錯誤' },
  { value: '2007', label: '2007 - 國別代碼錯誤' },
  { value: '2101', label: '2101 - 卡號錯誤' },
  { value: '2102', label: '2102 - 卡號有效期錯誤' },
  { value: '2103', label: '2103 - 卡號已鎖卡' },
  { value: '2104', label: '2104 - 卡號未開通 3DS' },
  { value: '2105', label: '2105 - 卡號異常' },
  { value: '2106', label: '2106 - 卡號有效期已過期' },
  { value: '2107', label: '2107 - 證件號碼錯誤' },
  { value: '2108', label: '2108 - 持卡人鎖卡' },
  { value: '2109', label: '2109 - 持卡人未開通 3DS' },
  { value: '2110', label: '2110 - 持卡人異常' },
  { value: '2201', label: '2201 - 指定的 3RI 場景不支援 PA 交易' },
  { value: '2202', label: '2202 - 指定的 3RI 場景不支援 NPA 交易' },
  { value: '2203', label: '2203 - 3RI 後續交易-查無原始交易' },
  { value: '2204', label: '2204 - 3RI 後續交易-原始交易驗證未成功' },
  { value: '2205', label: '2205 - 3RI 後續交易-已超過期限' },
  { value: '2206', label: '2206 - 3RI 後續交易-交易幣別不同' },
  { value: '2207', label: '2207 - 3RI 後續交易-交易金額超過原始金額' },
  { value: '2208', label: '2208 - 3RI 後續交易-卡號不同' },
  { value: '2209', label: '2209 - 3RI 後續交易-超過分期次數限制' },
  { value: '2210', label: '2210 - 3RI 後續交易-循環效期錯誤' },
  { value: '2211', label: '2211 - 3RI Agent Payment-後續金額總額超過首筆金額' },
  { value: '3101', label: '3101 - 卡核心系統連線失敗' },
  { value: '3102', label: '3102 - 卡核心系統讀取超時' },
  { value: '3199', label: '3199 - 卡核心系統響應異常' },
  { value: '3201', label: '3201 - 加密機接口連線失敗' },
  { value: '3202', label: '3202 - 加密機接口讀取超時' },
  { value: '3299', label: '3299 - 加密機接口響應異常' },
  { value: '3301', label: '3301 - OTP 系統連線失敗' },
  { value: '3302', label: '3302 - OTP 系統讀取超時' },
  { value: '3399', label: '3399 - OTP 系統響應異常' },
  { value: '3401', label: '3401 - RReq 連線失敗' },
  { value: '3402', label: '3402 - RReq 讀取超時' },
  { value: '3403', label: '3403 - RRes 校驗失敗' },
  { value: '3499', label: '3499 - RRes 返回錯誤' },
  { value: '3501', label: '3501 - OOB 接口連線超時' },
  { value: '3502', label: '3502 - OOB 接口讀取超時' },
  { value: '3599', label: '3599 - OOB 接口響應異常' },
  { value: '3601', label: '3601 - 離線驗證系統連線超時' },
  { value: '3602', label: '3602 - 離線驗證系統讀取超時' },
  { value: '3699', label: '3699 - 離線驗證系統響應異常' },
  { value: '4001', label: '4001 - 高風險' },
  { value: '4002', label: '4002 - 3RI 場景無法執行挑戰驗證' },
  { value: '4101', label: '4101 - 黑名單-IP' },
  { value: '4102', label: '4102 - 黑名單-Email' },
  { value: '4103', label: '4103 - 黑名單-商店代號' },
  { value: '4104', label: '4104 - 黑名單-設備識別碼' },
  { value: '4105', label: '4105 - 黑名單-卡號' },
  { value: '4106', label: '4106 - 黑名單-證件號碼' },
  { value: '4107', label: '4107 - 黑名單-電話號碼' },
  { value: '4108', label: '4108 - 黑名單-來源國別' },
  { value: '4109', label: '4109 - 黑名單-商店網址' },
  { value: '4110', label: '4110 - 黑名單-商店國別' },
  { value: '5001', label: '5001 - 等待持卡人選擇驗證方式' },
  { value: '5002', label: '5002 - 持卡人取消' },
  { value: '5003', label: '5003 - 超過驗證次數限制' },
  { value: '5004', label: '5004 - 尚未收到 CReq' },
  { value: '5101', label: '5101 - 已發送 OTP' },
  { value: '5102', label: '5102 - 已重送 OTP' },
  { value: '5103', label: '5103 - 請求重送超過次數限制' },
  { value: '5104', label: '5104 - 請求重送時間間隔過短' },
  { value: '5105', label: '5105 - 驗證碼錯誤' },
  { value: '5106', label: '5106 - 驗證碼已過期' },
  { value: '5107', label: '5107 - 驗證碼已使用' },
  { value: '5201', label: '5201 - OOB 初始化' },
  { value: '5202', label: '5202 - OOB 驗證失敗' },
  { value: '5301', label: '5301 - KBA 答覆錯誤' },
  { value: '5302', label: '5302 - 無法取得 KBA 題目' },
  { value: '5303', label: '5303 - 已完成 OTP，進入第二階段 KBA 提問' },
  { value: '5401', label: '5401 - FIDO 註冊' },
  { value: '5402', label: '5402 - FIDO 驗證失敗，返回驗證方式選擇' },
  { value: '5501', label: '5501 - 尚未收到離線驗證結果' },
  { value: '5502', label: '5502 - 離線驗證失敗' },
  { value: '9999', label: '9999 - 系統錯誤' },
  { value: '9001', label: '9001 - 收到 Error' },
  { value: '9002', label: '9002 - 偵測到 DDOS 攻擊' }
]

const challengeCancelOptions: SelectOption[] = [
  { value: 'NULL_VALUE', label: 'NULL_VALUE (留空)' },
  { value: '01', label: '01 - 持卡人選擇「取消」' },
  { value: '02', label: '02 - 3DS 請求者取消了身份驗證' },
  { value: '03', label: '03 - 交易被放棄 (Decoupled Authentication timeout)' },
  { value: '04', label: '04 - ACS 其他超時的交易超時' },
  { value: '05', label: '05 - ACS 未收到 ACS-First CReq 的事務超時' },
  { value: '06', label: '06 - 交易錯誤' },
  { value: '07', label: '07 - 未知' },
  { value: '09', label: '09 - Error Message in response to the CRes message' },
  { value: '10', label: '10 - Error Message in response to the CReq message' }
]

const reasonModeOptions: SelectOption[] = [
  { value: 'random', label: '全隨機' },
  { value: 'fixed', label: '固定代碼' }
]
</script>

<template>
  <!-- 交易狀態（節錄核心欄位，其餘區塊將續移植） -->
  <section id="transaction-status" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">2.交易狀態</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Select
            id="aresTransStatus"
            label="ARes 交易狀態 (ares_transStatus)"
            :modelValue="props.aresTransStatus"
            :options="aresOptions"
            required
            @update:modelValue="(value) => emit('update:aresTransStatus', String(value))"
          />
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Input
            id="transStatus"
            label="交易狀態 (transStatus)"
            :modelValue="props.transStatus"
            required
            @update:modelValue="(value) => emit('update:transStatus', String(value))"
          />
          <p class="text-xs text-base-content/60 mt-1">通常等於 ARes 交易狀態</p>
        </div>
        <div>
          <Select
            id="rreqTransStatus"
            label="RReq 交易狀態 (rreq_transStatus)"
            :modelValue="props.rreqTransStatus"
            :options="rreqOptions"
            :disabled="props.disableRreqTransStatus"
            @update:modelValue="(value) => emit('update:rreqTransStatus', String(value))"
          />
          <p class="text-xs text-base-content/60 mt-1">只有當 ARes 狀態為 C/D 時才可選擇</p>
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Select
            id="transStatusReason"
            label="交易狀態原因 (transStatusReason)"
            :modelValue="props.transStatusReason"
            :options="transStatusReasonOptions"
            :disabled="props.disableTransStatusReason || props.transStatusReasonMode === 'random'"
            @update:modelValue="(value) => onReasonValueChange('transStatusReason', String(value))"
          />
          <p class="text-xs text-base-content/60 mt-1">只有當 ARes 狀態為 R 時才可選擇</p>
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Select
            id="stateMachineReason"
            label="狀態機原因 (stateMachineReason)"
            :modelValue="props.stateMachineReason"
            :options="stateMachineReasonOptions"
            :disabled="props.disableStateMachineReason || props.stateMachineReasonMode === 'random'"
            @update:modelValue="(value) => onReasonValueChange('stateMachineReason', String(value))"
          />
          <p class="text-xs text-base-content/60 mt-1">只有當 ARes 狀態為 R 時才可選擇</p>
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Select
            id="challengeCancel"
            label="挑戰驗證取消指標 (challengeCancel)"
            :modelValue="props.challengeCancel"
            :options="challengeCancelOptions"
            :disabled="props.disableChallengeCancel"
            @update:modelValue="(value) => emit('update:challengeCancel', String(value))"
          />
          <p class="text-xs text-base-content/60 mt-1">
            只有當 ARes 狀態為 C 且 RReq 狀態為 N 時才可選擇
          </p>
          <p class="text-xs text-error mt-1">可隨機生成</p>
          <p class="text-xs text-error mt-1">
            Edit 8 監控指標：challengeCancel ≠ null / ARes=C 的放棄率需 ≤ 10%
          </p>
        </div>
      </div>

      <div class="mt-4 rounded-md bg-base-200 p-4">
        <div class="text-sm font-semibold text-base-content/80 mb-3">隨機機率設定</div>
        <div
          class="mt-4 mb-2 rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm font-semibold text-base-content shadow-sm"
        >
          交易成功率：{{ props.expectedTransactionSuccessRate.toFixed(2) }}% ・免密驗證率：{{
            props.expectedFrictionlessRate.toFixed(2)
          }}% ・挑戰驗證成功率：{{ props.expectedChallengeSuccessRate.toFixed(2) }}%
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="label">
              <span class="label-text">
                ARes Y 權重% (ares_transStatus=Y)
                <span class="text-xs text-base-content/60 ml-2">{{ props.aresWeightY }}%</span>
              </span>
            </label>
            <input
              id="aresWeightY"
              type="range"
              class="range range-sm"
              min="0"
              max="100"
              step="1"
              :value="props.aresWeightY"
              @input="(event) => onAresWeightInput('aresWeightY', event)"
            />
          </div>
          <div>
            <label class="label">
              <span class="label-text">
                ARes A 權重% (ares_transStatus=A)
                <span class="text-xs text-base-content/60 ml-2">{{ props.aresWeightA }}%</span>
              </span>
            </label>
            <input
              id="aresWeightA"
              type="range"
              class="range range-sm"
              min="0"
              max="100"
              step="1"
              :value="props.aresWeightA"
              @input="(event) => onAresWeightInput('aresWeightA', event)"
            />
          </div>
          <div>
            <label class="label">
              <span class="label-text">
                ARes I 權重% (ares_transStatus=I)
                <span class="text-xs text-base-content/60 ml-2">{{ props.aresWeightI }}%</span>
              </span>
            </label>
            <input
              id="aresWeightI"
              type="range"
              class="range range-sm"
              min="0"
              max="100"
              step="1"
              :value="props.aresWeightI"
              @input="(event) => onAresWeightInput('aresWeightI', event)"
            />
          </div>
          <div>
            <label class="label">
              <span class="label-text">
                ARes C 權重% (ares_transStatus=C)
                <span class="text-xs text-base-content/60 ml-2">{{ props.aresWeightC }}%</span>
              </span>
            </label>
            <input
              id="aresWeightC"
              type="range"
              class="range range-sm"
              min="0"
              max="100"
              step="1"
              :value="props.aresWeightC"
              @input="(event) => onAresWeightInput('aresWeightC', event)"
            />
          </div>
          <div>
            <label class="label">
              <span class="label-text">
                ARes D 權重% (ares_transStatus=D)
                <span class="text-xs text-base-content/60 ml-2">{{ props.aresWeightD }}%</span>
              </span>
            </label>
            <input
              id="aresWeightD"
              type="range"
              class="range range-sm"
              min="0"
              max="100"
              step="1"
              :value="props.aresWeightD"
              @input="(event) => onAresWeightInput('aresWeightD', event)"
            />
          </div>
          <div>
            <label class="label">
              <span class="label-text">
                ARes S 權重% (ares_transStatus=S)
                <span class="text-xs text-base-content/60 ml-2">{{ props.aresWeightS }}%</span>
              </span>
            </label>
            <input
              id="aresWeightS"
              type="range"
              class="range range-sm"
              min="0"
              max="100"
              step="1"
              :value="props.aresWeightS"
              @input="(event) => onAresWeightInput('aresWeightS', event)"
            />
          </div>
          <div>
            <label class="label">
              <span class="label-text">
                ARes N 權重% (ares_transStatus=N)
                <span class="text-xs text-base-content/60 ml-2">{{ props.aresWeightN }}%</span>
              </span>
            </label>
            <input
              id="aresWeightN"
              type="range"
              class="range range-sm"
              min="0"
              max="100"
              step="1"
              :value="props.aresWeightN"
              @input="(event) => onAresWeightInput('aresWeightN', event)"
            />
          </div>
          <div>
            <label class="label">
              <span class="label-text">
                ARes R 權重% (ares_transStatus=R)
                <span class="text-xs text-base-content/60 ml-2">{{ props.aresWeightR }}%</span>
              </span>
            </label>
            <input
              id="aresWeightR"
              type="range"
              class="range range-sm"
              min="0"
              max="100"
              step="1"
              :value="props.aresWeightR"
              @input="(event) => onAresWeightInput('aresWeightR', event)"
            />
          </div>
          <div>
            <label class="label">
              <span class="label-text">
                ARes U 權重% (ares_transStatus=U)
                <span class="text-xs text-base-content/60 ml-2">{{ props.aresWeightU }}%</span>
              </span>
            </label>
            <input
              id="aresWeightU"
              type="range"
              class="range range-sm"
              min="0"
              max="100"
              step="1"
              :value="props.aresWeightU"
              @input="(event) => onAresWeightInput('aresWeightU', event)"
            />
          </div>
        </div>
        <p class="text-xs text-base-content/60 mt-2">
          ARes 權重合計：{{ props.aresWeightTotal }}%，未分配：{{ props.aresWeightUnallocated }}%。
        </p>
        <div class="mt-4 border-t border-base-300 pt-4">
          <div class="text-sm font-semibold text-base-content/80 mb-3">
            RReq 比率隨機分配（當 ARes 狀態為 C 或 D 時）
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:row-start-1 md:col-start-1">
              <label class="label">
                <span class="label-text">
                  RReq Y 權重% (rreq_transStatus=Y)
                  <span class="text-xs text-base-content/60 ml-2"> {{ props.rreqWeightY }}% </span>
                </span>
              </label>
              <input
                id="rreqWeightY"
                type="range"
                class="range range-sm"
                min="0"
                max="100"
                step="1"
                :value="props.rreqWeightY"
                @input="(event) => onRreqWeightInput('rreqWeightY', event)"
              />
            </div>
            <div class="md:row-start-2 md:col-start-1">
              <label class="label">
                <span class="label-text">
                  RReq N 權重% (rreq_transStatus=N)
                  <span class="text-xs text-base-content/60 ml-2"> {{ props.rreqWeightN }}% </span>
                </span>
              </label>
              <input
                id="rreqWeightN"
                type="range"
                class="range range-sm"
                min="0"
                max="100"
                step="1"
                :value="props.rreqWeightN"
                @input="(event) => onRreqWeightInput('rreqWeightN', event)"
              />
            </div>
            <div class="md:row-start-3 md:col-start-1">
              <label class="label">
                <span class="label-text">
                  RReq NULL_VALUE 權重% (rreq_transStatus=NULL_VALUE)
                  <span class="text-xs text-base-content/60 ml-2">
                    {{ props.rreqWeightNull }}%
                  </span>
                </span>
              </label>
              <input
                id="rreqWeightNull"
                type="range"
                class="range range-sm"
                min="0"
                max="100"
                step="1"
                :value="props.rreqWeightNull"
                @input="(event) => onRreqWeightInput('rreqWeightNull', event)"
              />
            </div>
            <div class="md:row-start-2 md:col-start-2">
              <label class="label">
                <span class="label-text">
                  ChallengeCancel 觸發率 (0~100%) (challengeCancelRate)
                  <span class="text-xs text-base-content/60 ml-2">
                    {{ props.challengeCancelRate }}%
                  </span>
                </span>
              </label>
              <input
                id="challengeCancelRate"
                type="range"
                class="range range-sm"
                min="0"
                max="100"
                step="1"
                :value="props.challengeCancelRate"
                @input="
                  (event) =>
                    emit('update:challengeCancelRate', (event.target as HTMLInputElement).value)
                "
              />
            </div>
          </div>
        </div>
        <p class="text-xs text-base-content/60 mt-2">
          RReq 權重合計：{{ props.rreqWeightTotal }}%，未分配：{{ props.rreqWeightUnallocated }}%。
        </p>
        <div class="mt-4 border-t border-base-300 pt-4">
          <div class="text-sm font-semibold text-base-content/80 mb-3">
            stateMachineReason / transStatusReason 隨機分配（當 ARes 狀態為 R 時）
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-md border border-base-300 bg-base-100 p-3">
              <div class="text-sm font-semibold text-base-content/80 mb-2">transStatusReason</div>
              <Select
                id="transStatusReasonMode"
                label="模式"
                :modelValue="props.transStatusReasonMode"
                :options="reasonModeOptions"
                @update:modelValue="
                  (value) => onReasonModeChange('transStatusReasonMode', String(value))
                "
              />
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Input
                  id="transStatusReasonInput"
                  label="輸入代碼"
                  :modelValue="props.transStatusReason"
                  :disabled="props.transStatusReasonMode === 'random'"
                  @update:modelValue="
                    (value) => onReasonValueChange('transStatusReason', String(value))
                  "
                />
                <Select
                  id="transStatusReasonSelect"
                  label="下拉選單"
                  :modelValue="props.transStatusReason"
                  :options="transStatusReasonOptions"
                  :disabled="props.transStatusReasonMode === 'random'"
                  @update:modelValue="
                    (value) => onReasonValueChange('transStatusReason', String(value))
                  "
                />
              </div>
            </div>
            <div class="rounded-md border border-base-300 bg-base-100 p-3">
              <div class="text-sm font-semibold text-base-content/80 mb-2">stateMachineReason</div>
              <Select
                id="stateMachineReasonMode"
                label="模式"
                :modelValue="props.stateMachineReasonMode"
                :options="reasonModeOptions"
                @update:modelValue="
                  (value) => onReasonModeChange('stateMachineReasonMode', String(value))
                "
              />
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Input
                  id="stateMachineReasonInput"
                  label="輸入代碼"
                  :modelValue="props.stateMachineReason"
                  :disabled="props.stateMachineReasonMode === 'random'"
                  @update:modelValue="
                    (value) => onReasonValueChange('stateMachineReason', String(value))
                  "
                />
                <Select
                  id="stateMachineReasonSelect"
                  label="下拉選單"
                  :modelValue="props.stateMachineReason"
                  :options="stateMachineReasonOptions"
                  :disabled="props.stateMachineReasonMode === 'random'"
                  @update:modelValue="
                    (value) => onReasonValueChange('stateMachineReason', String(value))
                  "
                />
              </div>
            </div>
          </div>
          <p class="text-xs text-base-content/60 mt-2">
            選「全隨機」才會隨機；選「固定代碼」可輸入或下拉選取，並同步到上方欄位。
          </p>
        </div>
      </div>
    </Card>
  </section>
</template>
