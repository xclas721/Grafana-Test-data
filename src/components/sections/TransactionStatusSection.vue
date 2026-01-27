<template>
  <!-- 交易狀態（節錄核心欄位，其餘區塊將續移植） -->
  <div class="form-section">
    <h3>2.交易狀態</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="aresTransStatus" class="bilingual-label">
          <span class="zh">ARes 交易狀態</span>
          <span class="en">ares_transStatus</span>
        </label>
        <select id="aresTransStatus" required>
          <option value="Y">Y</option>
          <option value="N" selected>N</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="R">R</option>
          <option value="A">A</option>
          <option value="I">I</option>
          <option value="S">S</option>
          <option value="U">U</option>
        </select>
        <small style="color: red">可隨機生成</small>
      </div>
      <div class="form-group">
        <label for="transStatus" class="bilingual-label">
          <span class="zh">交易狀態</span>
          <span class="en">transStatus</span>
        </label>
        <input type="text" id="transStatus" value="N" required />
        <small>通常等於 ARes 交易狀態</small>
      </div>
      <div class="form-group">
        <label for="rreqTransStatus" class="bilingual-label">
          <span class="zh">RReq 交易狀態</span>
          <span class="en">rreq_transStatus</span>
        </label>
        <select id="rreqTransStatus" disabled>
          <option value="NULL_VALUE" selected>NULL_VALUE</option>
          <option value="Y">Y - 認證成功</option>
          <option value="N">N - 認證失敗</option>
        </select>
        <small>只有當 ARes 狀態為 C/D 時才可選擇</small>
        <small style="color: red">可隨機生成</small>
      </div>
      <div class="form-group">
        <label for="transStatusReason" class="bilingual-label">
          <span class="zh">交易狀態原因</span>
          <span class="en">transStatusReason</span>
        </label>
        <select id="transStatusReason" disabled>
          <option value="NULL_VALUE" selected>NULL_VALUE</option>
          <option value="01">01 - Card authentication failed</option>
          <option value="02">02 - Unknown device</option>
          <option value="03">03 - Unsupported device</option>
          <option value="04">04 - Exceeds authentication frequency limit</option>
          <option value="05">05 - Expired card</option>
          <option value="06">06 - Invalid card number</option>
          <option value="07">07 - Invalid transaction</option>
          <option value="08">08 - No card record</option>
          <option value="09">09 - Security failure</option>
          <option value="10">10 - Stolen card</option>
          <option value="11">11 - Suspected fraud</option>
          <option value="12">12 - Transaction not permitted to Cardholder</option>
          <option value="13">13 - Cardholder not enrolled in service</option>
          <option value="14">14 - Transaction timed out at the ACS</option>
          <option value="15">15 - Low confidence</option>
          <option value="16">16 - Medium confidence</option>
          <option value="17">17 - High confidence</option>
          <option value="18">18 - Very high confidence</option>
          <option value="19">19 - Exceeds ACS maximum challenges</option>
          <option value="20">20 - Non-Payment transaction not supported</option>
          <option value="21">21 - 3RI transaction not supported</option>
          <option value="22">22 - ACS technical issue</option>
          <option value="23">
            23 - Decoupled Authentication required by ACS but not requested by 3DS Requestor
          </option>
          <option value="24">24 - 3DS Requestor Decoupled Max Expiry Time exceeded</option>
          <option value="25">
            25 - Decoupled Authentication was provided insufficient time to authenticate Cardholder.
            ACS will not make attempt
          </option>
          <option value="26">
            26 - Authentication attempted but not performed by the Cardholder
          </option>
          <option value="27">27 - Preferred Authentication Method not supported</option>
          <option value="28">28 - Validation of content security policy failed</option>
          <option value="29">
            29 - Authentication attempted but not completed by the Cardholder. Fall back to
            Decoupled Authentication
          </option>
          <option value="30">
            30 - Authentication completed successfully but additional authentication of the
            Cardholder required. Reinitiate as Decoupled Authentication
          </option>
          <option value="81">81 - Mastercard SCA Exemption</option>
          <option value="89">89 - Visa SCP Exemption</option>
          <option value="90">90 - Visa Issuer SCA Required</option>
        </select>
        <small>只有當 ARes 狀態為 R 時才可選擇</small>
        <small style="color: red">可隨機生成</small>
      </div>
      <div class="form-group">
        <label for="stateMachineReason" class="bilingual-label">
          <span class="zh">狀態機原因</span>
          <span class="en">stateMachineReason</span>
        </label>
        <select id="stateMachineReason" disabled>
          <option value="NULL_VALUE" selected>NULL_VALUE</option>
          <option value="1001">1001 - Device not support</option>
          <option value="1002">1002 - Exceeds amount limit</option>
          <option value="1003">1003 - Exceeds auth frequency limit</option>
          <option value="1004">1004 - User abandon</option>
          <option value="1005">1005 - Trans timeout</option>
          <option value="1006">1006 - Card scheme not supported</option>
          <option value="1007">1007 - Invalid trans status</option>
          <option value="1008">1008 - CReq not received</option>
          <option value="1009">1009 - User not responsed</option>
          <option value="1010">1010 - Dec auth not performed</option>
          <option value="2001">2001 - Invalid message</option>
          <option value="2002">2002 - Invalid message out of BIN range</option>
          <option value="2101">2101 - Invalid ISO currency code</option>
          <option value="2102">2102 - Invalid ISO currency exponent</option>
          <option value="2103">2103 - Invalid ISO country code</option>
          <option value="3001">3001 - Network connect timeout</option>
          <option value="3002">3002 - Network read timeout</option>
          <option value="3101">3101 - DS connect failed</option>
          <option value="3102">3102 - DS read timeout</option>
          <option value="3199">3199 - DS error</option>
          <option value="3201">3201 - Card system connect failed</option>
          <option value="3202">3202 - Card system read timeout</option>
          <option value="3299">3299 - Card system error</option>
          <option value="3301">3301 - HSM connect failed</option>
          <option value="3302">3302 - HSM read timeout</option>
          <option value="3399">3399 - HSM error</option>
          <option value="3401">3401 - OTP sender connect failed</option>
          <option value="3402">3402 - OTP sender read timeout</option>
          <option value="3403">3403 - OTP sender exceeds frequency limit</option>
          <option value="3404">3404 - OTP sender less than resend interval</option>
          <option value="3499">3499 - OTP sender error</option>
          <option value="3501">3501 - RReq connect failed</option>
          <option value="3502">3502 - RReq read timeout</option>
          <option value="3503">3503 - RRes response failed</option>
          <option value="3504">3504 - RRes response error</option>
          <option value="3601">3601 - OOB connect failed</option>
          <option value="3602">3602 - OOB read timeout</option>
          <option value="3604">3604 - OOBS response error</option>
          <option value="4001">4001 - High risk</option>
          <option value="4101">4101 - Black list</option>
          <option value="4102">4102 - Black list IP</option>
          <option value="4103">4103 - Black list email</option>
          <option value="4104">4104 - Black list MID</option>
          <option value="4105">4105 - Black list device ID</option>
          <option value="4106">4106 - Black list acct number</option>
          <option value="4107">4107 - Black list acct ID</option>
          <option value="4108">4108 - Black list phone</option>
          <option value="4109">4109 - Black list src country</option>
          <option value="4110">4110 - Black list mer URL</option>
          <option value="4111">4111 - Black list mer country</option>
          <option value="4201">4201 - High risk RBA</option>
          <option value="4202">4202 - 3RI challenge not support</option>
          <option value="5101">5101 - Invalid acct number</option>
          <option value="5102">5102 - Invalid expiry date</option>
          <option value="5103">5103 - Acct number locked</option>
          <option value="5104">5104 - Acct number not enrolled</option>
          <option value="5105">5105 - Acct number not effective</option>
          <option value="5106">5106 - Acct number expired</option>
          <option value="5201">5201 - Invalid acct ID</option>
          <option value="5202">5202 - Acct ID lock</option>
          <option value="5203">5203 - Acct ID not enrolled</option>
          <option value="5204">5204 - Acct ID not effective</option>
          <option value="6101">6101 - Passcode invalid</option>
          <option value="6102">6102 - Passcode expired</option>
          <option value="6103">6103 - Passcode used</option>
          <option value="6201">6201 - OOB not completed</option>
          <option value="6301">6301 - KBA answer invalid</option>
          <option value="6401">6401 - FIDO not completed</option>
          <option value="6402">6402 - FIDO connect failed</option>
          <option value="6403">6403 - FIDO read timeout</option>
          <option value="7101">7101 - 3RI not support</option>
          <option value="7102">7102 - 3RI invalid 3RI ind</option>
          <option value="7103">7103 - 3RI NPA frictionless</option>
          <option value="7201">7201 - 3RI recurring prior trans not found</option>
          <option value="7202">7202 - 3RI recurring prior trans not auth</option>
          <option value="7203">7203 - 3RI recurring prior trans expiried</option>
          <option value="7204">7204 - 3RI recurring currency different</option>
          <option value="7205">7205 - 3RI recurring amount over prior trans</option>
          <option value="7206">7206 - 3RI recurring acct number different</option>
          <option value="7207">7207 - 3RI instaldata over limit</option>
          <option value="8101">8101 - Recurring date expiried</option>
          <option value="0000">0000 - Completed</option>
          <option value="9999">9999 - Unexcepted error</option>
        </select>
        <small>只有當 ARes 狀態為 R 時才可選擇</small>
        <small style="color: red">可隨機生成</small>
      </div>
      <div class="form-group">
        <label for="challengeCancel" class="bilingual-label">
          <span class="zh">挑戰驗證取消指標</span>
          <span class="en">challengeCancel</span>
        </label>
        <select id="challengeCancel" disabled>
          <option value="NULL_VALUE" selected>NULL_VALUE (留空)</option>
          <option value="01">01 - 持卡人選擇「取消」</option>
          <option value="02">02 - 3DS 請求者取消了身份驗證</option>
          <option value="03">03 - 交易被放棄 (Decoupled Authentication timeout)</option>
          <option value="04">04 - ACS 其他超時的交易超時</option>
          <option value="05">05 - ACS 未收到 ACS-First CReq 的事務超時</option>
          <option value="06">06 - 交易錯誤</option>
          <option value="07">07 - 未知</option>
          <option value="09">09 - Error Message in response to the CRes message</option>
          <option value="10">10 - Error Message in response to the CReq message</option>
        </select>
        <small>只有當 ARes 狀態為 C 且 RReq 狀態為 N 時才可選擇</small>
        <small style="color: red">可隨機生成</small>
        <small style="color: red"
          >Edit 8 監控指標：challengeCancel ≠ null / ARes=C 的放棄率需 ≤ 10%</small
        >
      </div>
    </div>
  </div>
</template>
