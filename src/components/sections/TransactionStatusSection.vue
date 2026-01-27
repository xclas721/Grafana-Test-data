<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import Select, { type SelectOption } from '@/shared/components/Select.vue'

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
  { value: 'NULL_VALUE', label: 'NULL_VALUE' },
  { value: '1001', label: '1001 - Device not support' },
  { value: '1002', label: '1002 - Exceeds amount limit' },
  { value: '1003', label: '1003 - Exceeds auth frequency limit' },
  { value: '1004', label: '1004 - User abandon' },
  { value: '1005', label: '1005 - Trans timeout' },
  { value: '1006', label: '1006 - Card scheme not supported' },
  { value: '1007', label: '1007 - Invalid trans status' },
  { value: '1008', label: '1008 - CReq not received' },
  { value: '1009', label: '1009 - User not responsed' },
  { value: '1010', label: '1010 - Dec auth not performed' },
  { value: '2001', label: '2001 - Invalid message' },
  { value: '2002', label: '2002 - Invalid message out of BIN range' },
  { value: '2101', label: '2101 - Invalid ISO currency code' },
  { value: '2102', label: '2102 - Invalid ISO currency exponent' },
  { value: '2103', label: '2103 - Invalid ISO country code' },
  { value: '3001', label: '3001 - Network connect timeout' },
  { value: '3002', label: '3002 - Network read timeout' },
  { value: '3101', label: '3101 - DS connect failed' },
  { value: '3102', label: '3102 - DS read timeout' },
  { value: '3199', label: '3199 - DS error' },
  { value: '3201', label: '3201 - Card system connect failed' },
  { value: '3202', label: '3202 - Card system read timeout' },
  { value: '3299', label: '3299 - Card system error' },
  { value: '3301', label: '3301 - HSM connect failed' },
  { value: '3302', label: '3302 - HSM read timeout' },
  { value: '3399', label: '3399 - HSM error' },
  { value: '3401', label: '3401 - OTP sender connect failed' },
  { value: '3402', label: '3402 - OTP sender read timeout' },
  { value: '3403', label: '3403 - OTP sender exceeds frequency limit' },
  { value: '3404', label: '3404 - OTP sender less than resend interval' },
  { value: '3499', label: '3499 - OTP sender error' },
  { value: '3501', label: '3501 - RReq connect failed' },
  { value: '3502', label: '3502 - RReq read timeout' },
  { value: '3503', label: '3503 - RRes response failed' },
  { value: '3504', label: '3504 - RRes response error' },
  { value: '3601', label: '3601 - OOB connect failed' },
  { value: '3602', label: '3602 - OOB read timeout' },
  { value: '3604', label: '3604 - OOBS response error' },
  { value: '4001', label: '4001 - High risk' },
  { value: '4101', label: '4101 - Black list' },
  { value: '4102', label: '4102 - Black list IP' },
  { value: '4103', label: '4103 - Black list email' },
  { value: '4104', label: '4104 - Black list MID' },
  { value: '4105', label: '4105 - Black list device ID' },
  { value: '4106', label: '4106 - Black list acct number' },
  { value: '4107', label: '4107 - Black list acct ID' },
  { value: '4108', label: '4108 - Black list phone' },
  { value: '4109', label: '4109 - Black list src country' },
  { value: '4110', label: '4110 - Black list mer URL' },
  { value: '4111', label: '4111 - Black list mer country' },
  { value: '4201', label: '4201 - High risk RBA' },
  { value: '4202', label: '4202 - 3RI challenge not support' },
  { value: '5101', label: '5101 - Invalid acct number' },
  { value: '5102', label: '5102 - Invalid expiry date' },
  { value: '5103', label: '5103 - Acct number locked' },
  { value: '5104', label: '5104 - Acct number not enrolled' },
  { value: '5105', label: '5105 - Acct number not effective' },
  { value: '5106', label: '5106 - Acct number expired' },
  { value: '5201', label: '5201 - Invalid acct ID' },
  { value: '5202', label: '5202 - Acct ID lock' },
  { value: '5203', label: '5203 - Acct ID not enrolled' },
  { value: '5204', label: '5204 - Acct ID not effective' },
  { value: '6101', label: '6101 - Passcode invalid' },
  { value: '6102', label: '6102 - Passcode expired' },
  { value: '6103', label: '6103 - Passcode used' },
  { value: '6201', label: '6201 - OOB not completed' },
  { value: '6301', label: '6301 - KBA answer invalid' },
  { value: '6401', label: '6401 - FIDO not completed' },
  { value: '6402', label: '6402 - FIDO connect failed' },
  { value: '6403', label: '6403 - FIDO read timeout' },
  { value: '7101', label: '7101 - 3RI not support' },
  { value: '7102', label: '7102 - 3RI invalid 3RI ind' },
  { value: '7103', label: '7103 - 3RI NPA frictionless' },
  { value: '7201', label: '7201 - 3RI recurring prior trans not found' },
  { value: '7202', label: '7202 - 3RI recurring prior trans not auth' },
  { value: '7203', label: '7203 - 3RI recurring prior trans expiried' },
  { value: '7204', label: '7204 - 3RI recurring currency different' },
  { value: '7205', label: '7205 - 3RI recurring amount over prior trans' },
  { value: '7206', label: '7206 - 3RI recurring acct number different' },
  { value: '7207', label: '7207 - 3RI instaldata over limit' },
  { value: '8101', label: '8101 - Recurring date expiried' },
  { value: '0000', label: '0000 - Completed' },
  { value: '9999', label: '9999 - Unexcepted error' }
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
</script>

<template>
  <!-- 交易狀態（節錄核心欄位，其餘區塊將續移植） -->
  <section id="transaction-status" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">2.交易狀態</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            id="aresTransStatus"
            label="ARes 交易狀態 (ares_transStatus)"
            :modelValue="'N'"
            :options="aresOptions"
            required
          />
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Input id="transStatus" label="交易狀態 (transStatus)" :modelValue="'N'" required />
          <p class="text-xs text-base-content/60 mt-1">通常等於 ARes 交易狀態</p>
        </div>
        <div>
          <Select
            id="rreqTransStatus"
            label="RReq 交易狀態 (rreq_transStatus)"
            :modelValue="'NULL_VALUE'"
            :options="rreqOptions"
            :disabled="true"
          />
          <p class="text-xs text-base-content/60 mt-1">只有當 ARes 狀態為 C/D 時才可選擇</p>
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Select
            id="transStatusReason"
            label="交易狀態原因 (transStatusReason)"
            :modelValue="'NULL_VALUE'"
            :options="transStatusReasonOptions"
            :disabled="true"
          />
          <p class="text-xs text-base-content/60 mt-1">只有當 ARes 狀態為 R 時才可選擇</p>
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Select
            id="stateMachineReason"
            label="狀態機原因 (stateMachineReason)"
            :modelValue="'NULL_VALUE'"
            :options="stateMachineReasonOptions"
            :disabled="true"
          />
          <p class="text-xs text-base-content/60 mt-1">只有當 ARes 狀態為 R 時才可選擇</p>
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Select
            id="challengeCancel"
            label="挑戰驗證取消指標 (challengeCancel)"
            :modelValue="'NULL_VALUE'"
            :options="challengeCancelOptions"
            :disabled="true"
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
    </Card>
  </section>
</template>
