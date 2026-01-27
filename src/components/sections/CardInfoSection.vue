<template>
  <!-- 7.卡片信息 -->
  <div class="form-section">
    <h3>7.卡片信息</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="cardScheme" class="bilingual-label">
          <span class="zh">卡片組織</span>
          <span class="en">cardScheme</span>
        </label>
        <select id="cardScheme" required>
          <option value="V" selected>V - Visa</option>
          <option value="M">M - Mastercard</option>
          <option value="J">J - JCB</option>
          <option value="A">A - American Express</option>
          <option value="C">C - UnionPay</option>
          <option value="P">P - PayNet</option>
          <option value="S">S - Saudi MADA</option>
          <option value="E">E - EftPos</option>
          <option value="U">U - EMVLab</option>
        </select>
      </div>
      <div class="form-group">
        <label for="acctNumber" class="bilingual-label">
          <span class="zh">帳號原始值</span>
          <span class="en">acctNumber</span>
        </label>
        <input type="text" id="acctNumber" value="4143520000000123" maxlength="19" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableAcctNumberRandom" style="margin: 0" checked />
          <label
            for="enableAcctNumberRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">此欄位不會 POST 出去，僅用於自動生成其他欄位</small>
        <small style="color: red">Visa: 4143520000000000~4143529999999999</small>
        <small style="color: red">MasterCard: 5153520000000000~5153529999999999</small>
      </div>
      <div class="form-group">
        <label for="cardbin6" class="bilingual-label">
          <span class="zh">卡片 BIN (6位)</span>
          <span class="en">cardbin6</span>
        </label>
        <input type="text" id="cardbin6" value="414352" maxlength="6" required disabled />
        <small>自動從帳號原始值前6碼生成</small>
      </div>
      <div class="form-group">
        <label for="acctNumberHashed" class="bilingual-label">
          <span class="zh">帳號雜湊值</span>
          <span class="en">acctNumberHashed</span>
        </label>
        <input
          type="text"
          id="acctNumberHashed"
          value="2hpBkDB7ELbcpebGl5RM+HWTQGx3qciOwskcbsEVKC4="
          disabled
        />
        <small>自動從帳號原始值計算 (HMAC-SHA256 + Base64)</small>
      </div>
      <div class="form-group">
        <label for="acctNumberMask" class="bilingual-label">
          <span class="zh">帳號遮罩</span>
          <span class="en">acctNumberMask</span>
        </label>
        <input type="text" id="acctNumberMask" value="414352******0123" disabled />
        <small>自動從帳號原始值生成（前6碼+******+後4碼）</small>
      </div>
      <div class="form-group">
        <label for="cardbin8" class="bilingual-label">
          <span class="zh">卡片 BIN (8位)</span>
          <span class="en">cardbin8</span>
        </label>
        <input type="text" id="cardbin8" value="41435200" maxlength="8" required disabled />
        <small>自動從帳號原始值前8碼生成</small>
      </div>

      <!-- 卡片組織擴展內容（Visa / Mastercard）-->
      <div class="form-group">
        <label for="visaDafMessageExtension" class="bilingual-label">
          <span class="zh">Visa DAF 訊息擴展</span>
          <span class="en">visaDafMessageExtension</span>
        </label>
        <input type="text" id="visaDafMessageExtension" value="null" />
      </div>
      <div class="form-group">
        <label for="mastercardMessageExtension" class="bilingual-label">
          <span class="zh">Mastercard 訊息擴展</span>
          <span class="en">mastercardMessageExtension</span>
        </label>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px">
          <input type="checkbox" id="enableMastercardExtension" style="margin: 0" />
          <label
            for="enableMastercardExtension"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >啟用 Mastercard 訊息擴展</label
          >
        </div>
        <div
          id="mastercardExtensionContainer"
          style="border: 1px solid #ddd; border-radius: 5px; padding: 10px; background: #f9f9f9"
        >
          <div
            style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px"
          >
            <div>
              <label for="mastercardScore" style="font-size: 0.8em; color: #666"
                >Score (0-650)</label
              >
              <input
                type="number"
                id="mastercardScore"
                value="600"
                min="0"
                max="650"
                style="width: 100%; padding: 5px"
              />
            </div>
            <div>
              <label for="mastercardDecision" style="font-size: 0.8em; color: #666"
                >Decision</label
              >
              <select id="mastercardDecision" style="width: 100%; padding: 5px">
                <option value="Not Low Risk" selected>Not Low Risk</option>
                <option value="Low Risk">Low Risk</option>
              </select>
            </div>
          </div>
          <div
            style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px"
          >
            <div>
              <label for="mastercardReasonCode1" style="font-size: 0.8em; color: #666"
                >Reason Code 1</label
              >
              <input
                type="text"
                id="mastercardReasonCode1"
                value="A"
                maxlength="1"
                style="width: 100%; padding: 5px"
              />
            </div>
            <div>
              <label for="mastercardReasonCode2" style="font-size: 0.8em; color: #666"
                >Reason Code 2</label
              >
              <input
                type="text"
                id="mastercardReasonCode2"
                value=""
                maxlength="1"
                style="width: 100%; padding: 5px"
              />
            </div>
          </div>
          <div>
            <label for="mastercardStatus" style="font-size: 0.8em; color: #666">Status</label>
            <input
              type="text"
              id="mastercardStatus"
              value="success"
              style="width: 100%; padding: 5px"
            />
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px">
            <input type="checkbox" id="enableMastercardExtensionRandom" style="margin: 0" />
            <label
              for="enableMastercardExtensionRandom"
              style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
              >隨機生成時包含此欄位</label
            >
          </div>
          <small style="color: red">可隨機生成：Score、Decision，其他欄位保持預設值</small>
        </div>
      </div>
      <div class="form-group">
        <label for="visaRiskBasedAuthenticationScore" class="bilingual-label">
          <span class="zh">Visa 風險基礎認證分數</span>
          <span class="en">visaRiskBasedAuthenticationScore</span>
        </label>
        <input
          type="number"
          id="visaRiskBasedAuthenticationScore"
          value=""
          min="0"
          max="99"
          placeholder="留空為 NULL"
        />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableVisaScoreRandom" style="margin: 0" />
          <label
            for="enableVisaScoreRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (0-99)，留空為 NULL</small>
      </div>
    </div>
  </div>
</template>
