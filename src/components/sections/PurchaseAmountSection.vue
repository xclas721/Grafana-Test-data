<template>
  <!-- 4.交易金額 -->
  <div class="form-section">
    <h3>4.交易金額</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="purchaseAmount" class="bilingual-label">
          <span class="zh">購買金額</span>
          <span class="en">purchaseAmount</span>
        </label>
        <input type="number" id="purchaseAmount" value="100" step="0.01" required />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enablePurchaseAmountRandom" style="margin: 0" checked />
          <label
            for="enablePurchaseAmountRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (10-1000)，預設開啟</small>
      </div>
      <div class="form-group">
        <label for="purchaseCurrency" class="bilingual-label">
          <span class="zh">購買貨幣代碼</span>
          <span class="en">purchaseCurrency</span>
        </label>
        <select id="purchaseCurrency" required>
          <option value="156" selected>156 - 中國人民幣 (CNY)</option>
          <option value="901">901 - 台灣新台幣 (TWD)</option>
          <option value="840">840 - 美國美元 (USD)</option>
          <option value="392">392 - 日本日圓 (JPY)</option>
          <option value="344">344 - 香港港幣 (HKD)</option>
          <option value="410">410 - 韓國韓元 (KRW)</option>
          <option value="702">702 - 新加坡新加坡元 (SGD)</option>
          <option value="036">036 - 澳洲澳幣（澳元） (AUD)</option>
          <option value="124">124 - 加拿大加幣（加元） (CAD)</option>
          <option value="978">978 - 歐元區歐元 (EUR)</option>
          <option value="826">826 - 英國英鎊 (GBP)</option>
          <option value="764">764 - 泰國泰銖 (THB)</option>
          <option value="704">704 - 越南越南盾 (VND)</option>
          <option value="458">458 - 馬來西亞馬幣（令吉） (MYR)</option>
          <option value="360">360 - 印尼印尼盾（盧比） (IDR)</option>
          <option value="608">608 - 菲律賓菲律賓比索 (PHP)</option>
        </select>
        <small>選擇貨幣類型</small>
      </div>
      <div class="form-group">
        <label for="purchaseExponent" class="bilingual-label">
          <span class="zh">購買金額指數</span>
          <span class="en">purchaseExponent</span>
        </label>
        <input type="number" id="purchaseExponent" value="2" required />
      </div>
      <div class="form-group">
        <label for="usdAmount" class="bilingual-label">
          <span class="zh">美元金額</span>
          <span class="en">usdAmount</span>
        </label>
        <input
          type="number"
          id="usdAmount"
          value="0.13841979956813022"
          step="0.000000000000000001"
        />
      </div>
    </div>
  </div>
</template>
