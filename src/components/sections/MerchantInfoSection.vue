<template>
  <!-- 3.商戶信息 -->
  <div class="form-section">
    <h3>3.商戶信息</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="merchantName" class="bilingual-label">
          <span class="zh">商戶名稱</span>
          <span class="en">merchantName</span>
        </label>
        <input type="text" id="merchantName" value="HiTRUST EMV Demo Merchant" required />
      </div>
      <div class="form-group">
        <label for="merchantCountryCode" class="bilingual-label">
          <span class="zh">商戶國家代碼</span>
          <span class="en">merchantCountryCode</span>
        </label>
        <select id="merchantCountryCode" required>
          <option value="156" selected>156 - 中國 (CN)</option>
          <option value="158">158 - 台灣 (TW)</option>
          <option value="840">840 - 美國 (US)</option>
          <option value="392">392 - 日本 (JP)</option>
          <option value="344">344 - 香港 (HK)</option>
          <option value="410">410 - 韓國 (KR)</option>
          <option value="702">702 - 新加坡 (SG)</option>
          <option value="036">036 - 澳洲 (AU)</option>
          <option value="124">124 - 加拿大 (CA)</option>
          <option value="978">978 - 歐元區 (EU)</option>
          <option value="826">826 - 英國 (GB)</option>
          <option value="764">764 - 泰國 (TH)</option>
          <option value="704">704 - 越南 (VN)</option>
          <option value="458">458 - 馬來西亞 (MY)</option>
          <option value="360">360 - 印尼 (ID)</option>
          <option value="608">608 - 菲律賓 (PH)</option>
        </select>
        <small>選擇商戶所在國家/地區</small>
      </div>
      <div class="form-group">
        <label for="acquirerMerchantId" class="bilingual-label">
          <span class="zh">收單機構商戶 ID</span>
          <span class="en">acquirerMerchantID</span>
        </label>
        <input type="text" id="acquirerMerchantId" value="8909191" required />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableAcquirerMerchantIdRandom" style="margin: 0" checked />
          <label
            for="enableAcquirerMerchantIdRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (1-9999999)，預設關閉</small>
      </div>
      <div class="form-group">
        <label for="acquirerBin" class="bilingual-label">
          <span class="zh">收單機構 BIN</span>
          <span class="en">acquirerBIN</span>
        </label>
        <input type="text" id="acquirerBin" value="1231234" required />
      </div>
      <div class="form-group">
        <label for="mcc" class="bilingual-label">
          <span class="zh">商戶類別代碼</span>
          <span class="en">mcc</span>
        </label>
        <input type="text" id="mcc" value="5661" required />
      </div>
    </div>
  </div>
</template>
