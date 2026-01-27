<template>
  <!-- 6.匯率信息 -->
  <div class="form-section">
    <h3>6.匯率信息</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="exchangeRate" class="bilingual-label">
          <span class="zh">匯率</span>
          <span class="en">exchangeRate</span>
        </label>
        <input type="number" id="exchangeRate" value="7.2244" step="0.0001" />
      </div>
      <div class="form-group">
        <label for="exchangeBase" class="bilingual-label">
          <span class="zh">基礎貨幣</span>
          <span class="en">exchangeBase</span>
        </label>
        <input type="text" id="exchangeBase" value="USD" />
      </div>
      <div class="form-group">
        <label for="exchangeTarget" class="bilingual-label">
          <span class="zh">目標貨幣</span>
          <span class="en">exchangeTarget</span>
        </label>
        <input type="text" id="exchangeTarget" value="CNY" />
      </div>
      <div class="form-group">
        <label for="currencyCodeForRate" class="bilingual-label">
          <span class="zh">匯率貨幣代碼</span>
          <span class="en">currencyCodeForRate</span>
        </label>
        <input type="text" id="currencyCodeForRate" value="CNY" />
      </div>
    </div>
  </div>
</template>
