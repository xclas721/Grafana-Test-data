<template>
  <!-- 交易識別（節錄核心欄位，其餘區塊將續移植） -->
  <div class="form-section">
    <h3>1.交易識別</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="issuerOid" class="bilingual-label">
          <span class="zh">發卡機構 OID</span>
          <span class="en">issuerOid</span>
        </label>
        <input type="text" id="issuerOid" value="06b4b203-da05-73f9-256f-454929df6076" required />
      </div>
      <div class="form-group">
        <label for="acsTransId" class="bilingual-label">
          <span class="zh">ACS 交易 ID</span>
          <span class="en">acsTransID</span>
        </label>
        <input
          type="text"
          id="acsTransId"
          value="17616cb5-96d5-42cb-990a-08b28ff72874"
          required
        />
        <small style="color: red">可隨機生成</small>
      </div>
      <div class="form-group">
        <label for="threeDSServerTransId" class="bilingual-label">
          <span class="zh">3DS Server 交易 ID</span>
          <span class="en">threeDSServerTransID</span>
        </label>
        <input
          type="text"
          id="threeDSServerTransId"
          value="79c42c48-b25a-49f1-a791-fb45123cd944"
          required
        />
        <small style="color: red">可隨機生成</small>
      </div>
    </div>
  </div>
</template>
