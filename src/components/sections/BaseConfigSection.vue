<template>
  <!-- 基礎配置 -->
  <div class="form-section">
    <h3>基礎配置 <span id="modeIndicator" class="mode-indicator unified">統一</span></h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="baseUrl" class="bilingual-label">
          <span class="zh">Elasticsearch URL</span>
          <span class="en">base_url</span>
        </label>
        <input type="url" id="baseUrl" value="http://localhost:9200" required />
        <small>Elasticsearch 服務地址</small>
      </div>
      <div class="form-group">
        <label for="username" class="bilingual-label">
          <span class="zh">用戶名</span>
          <span class="en">username</span>
        </label>
        <input type="text" id="username" value="elastic" required />
      </div>
      <div class="form-group">
        <label for="password" class="bilingual-label">
          <span class="zh">密碼</span>
          <span class="en">password</span>
        </label>
        <input type="password" id="password" value="123456" required />
      </div>
      <div class="form-group">
        <label for="currentDate" class="bilingual-label">
          <span class="zh">當前日期</span>
          <span class="en">current_date</span>
        </label>
        <input type="date" id="currentDate" required />
        <small>交易日期 (YYYY-MM-DD-HH:MM:SS)</small>
        <small style="color: red"
          >HH:MM:SS將自動生成隨機時間，並依據時區轉換為 UTC 時間，根據UTC時間決定儲存的索引名稱</small
        >
      </div>
      <div class="form-group">
        <label for="timezone" class="bilingual-label">
          <span class="zh">時區</span>
          <span class="en">timezone</span>
        </label>
        <select id="timezone" required>
          <option value="browser">瀏覽器時區 (自動檢測)</option>
          <option value="Asia/Taipei">台灣 (UTC+8)</option>
          <option value="Asia/Shanghai">中國 (UTC+8)</option>
          <option value="Asia/Tokyo">日本 (UTC+9)</option>
          <option value="Asia/Seoul">韓國 (UTC+9)</option>
          <option value="Asia/Singapore">新加坡 (UTC+8)</option>
          <option value="Asia/Hong_Kong">香港 (UTC+8)</option>
          <option value="America/New_York">美國東部 (UTC-5/-4)</option>
          <option value="America/Los_Angeles">美國西部 (UTC-8/-7)</option>
          <option value="Europe/London">英國 (UTC+0/+1)</option>
          <option value="Europe/Paris">法國 (UTC+1/+2)</option>
          <option value="Australia/Sydney">澳洲東部 (UTC+10/+11)</option>
          <option value="UTC">UTC (UTC+0)</option>
        </select>
        <small>選擇時區用於時間轉換，預設使用瀏覽器時區</small>
      </div>
      <div class="form-group">
        <label class="bilingual-label">
          <span class="zh">UTC時間區間</span>
          <span class="en">Time Range</span>
        </label>
        <div id="timeRangeDisplay" style="padding: 8px; background: #f8f9fa; border-radius: 4px">
          <span id="timeRangeText" style="color: #7f8c8d">請選擇日期</span>
        </div>
      </div>
    </div>
  </div>
</template>
