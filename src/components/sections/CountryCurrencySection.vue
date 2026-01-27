<template>
  <!-- 5.國家和貨幣信息 -->
  <div class="form-section">
    <h3>5.國家和貨幣信息</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="countryAlpha2" class="bilingual-label">
          <span class="zh">國家代碼 (Alpha-2)</span>
          <span class="en">countryAlpha2</span>
        </label>
        <input type="text" id="countryAlpha2" value="CN" maxlength="2" />
      </div>
      <div class="form-group">
        <label for="countryNumeric" class="bilingual-label">
          <span class="zh">國家代碼 (數字)</span>
          <span class="en">countryNumeric</span>
        </label>
        <input type="text" id="countryNumeric" value="156" />
      </div>
      <div class="form-group">
        <label for="countryAlpha3" class="bilingual-label">
          <span class="zh">國家代碼 (Alpha-3)</span>
          <span class="en">countryAlpha3</span>
        </label>
        <input type="text" id="countryAlpha3" value="CHN" maxlength="3" />
      </div>
      <div class="form-group">
        <label for="countryName" class="bilingual-label">
          <span class="zh">國家名稱 (英文)</span>
          <span class="en">countryName</span>
        </label>
        <input type="text" id="countryName" value="China" />
      </div>
      <div class="form-group">
        <label for="currencyMinorUnit" class="bilingual-label">
          <span class="zh">貨幣小數位數</span>
          <span class="en">currencyMinorUnit</span>
        </label>
        <input type="number" id="currencyMinorUnit" value="2" />
      </div>
      <div class="form-group">
        <label for="currencyName" class="bilingual-label">
          <span class="zh">貨幣名稱 (英文)</span>
          <span class="en">currencyName</span>
        </label>
        <input type="text" id="currencyName" value="Yuan Renminbi" />
      </div>
      <div class="form-group">
        <label for="currencyAlphabeticCode" class="bilingual-label">
          <span class="zh">貨幣代碼 (字母)</span>
          <span class="en">currencyAlphabeticCode</span>
        </label>
        <input type="text" id="currencyAlphabeticCode" value="CNY" maxlength="3" />
      </div>
      <div class="form-group">
        <label for="currencyNumericCode" class="bilingual-label">
          <span class="zh">貨幣代碼 (數字)</span>
          <span class="en">currencyNumericCode</span>
        </label>
        <input type="text" id="currencyNumericCode" value="156" />
      </div>
    </div>
  </div>
</template>
