<template>
  <!-- 9.效能監控 -->
  <div class="form-section">
    <h3>9.效能監控</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="performancePath" class="bilingual-label">
          <span class="zh">Areq URL</span>
          <span class="en">performancePath</span>
        </label>
        <input
          type="text"
          id="performancePath"
          value="/acs-auth/auth/V/2.2.0/ed8544c4-fc50-289d-ee05-ee41c86bb6f5/001/areq"
        />
      </div>
      <div class="form-group">
        <label for="execTime" class="bilingual-label">
          <span class="zh">AReq 執行時間 (毫秒)</span>
          <span class="en">AReq execTime</span>
        </label>
        <input type="number" id="execTime" value="5437" required />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableExecTimeRandom" style="margin: 0" checked />
          <label
            for="enableExecTimeRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (1000-6000ms)，預設開啟</small>
      </div>
      <div class="form-group">
        <label for="creqExecTime" class="bilingual-label">
          <span class="zh">CReq 執行時間 (毫秒)</span>
          <span class="en">CReq execTime</span>
        </label>
        <input type="number" id="creqExecTime" value="500" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableCreqExecTimeRandom" style="margin: 0" checked />
          <label
            for="enableCreqExecTimeRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (300-800ms)，預設開啟</small>
      </div>
      <div class="form-group">
        <label for="rreqExecTime" class="bilingual-label">
          <span class="zh">RReq 執行時間 (毫秒)</span>
          <span class="en">RReq execTime</span>
        </label>
        <input type="number" id="rreqExecTime" value="400" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableRreqExecTimeRandom" style="margin: 0" checked />
          <label
            for="enableRreqExecTimeRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (200-600ms)，預設開啟</small>
      </div>
      <div class="form-group">
        <label for="rbaExecTime" class="bilingual-label">
          <span class="zh">RBA 執行時間 (毫秒)</span>
          <span class="en">RBA execTime</span>
        </label>
        <input type="number" id="rbaExecTime" value="100" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableRbaExecTimeRandom" style="margin: 0" checked />
          <label
            for="enableRbaExecTimeRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (50-200ms)，預設開啟</small>
      </div>
      <div class="form-group">
        <label for="cavvExecTime" class="bilingual-label">
          <span class="zh">CAVV 響應時間 (毫秒)</span>
          <span class="en">CAVV execTime</span>
        </label>
        <input type="number" id="cavvExecTime" value="20" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableCavvExecTimeRandom" style="margin: 0" checked />
          <label
            for="enableCavvExecTimeRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (10-30ms)，預設開啟</small>
      </div>
      <div class="form-group">
        <label for="otpExecTime" class="bilingual-label">
          <span class="zh">簡訊OTP響應時間 (毫秒)</span>
          <span class="en">OTP execTime</span>
        </label>
        <input type="number" id="otpExecTime" value="50" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableOtpExecTimeRandom" style="margin: 0" checked />
          <label
            for="enableOtpExecTimeRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (20-80ms)，預設開啟</small>
      </div>
    </div>
  </div>
</template>
