<template>
  <!-- 8.3DS 參數 -->
  <div class="form-section">
    <h3>8.3DS 參數</h3>
    <div
      style="
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 5px;
      "
    >
      <input type="checkbox" id="enableAll3DSParamsRandom" style="margin: 0" />
      <label
        for="enableAll3DSParamsRandom"
        style="margin: 0; font-weight: bold; color: #333; font-size: 1em"
        >全選：隨機生成時包含所有 3DS 參數欄位</label
      >
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label for="messageCategory" class="bilingual-label">
          <span class="zh">訊息類別</span>
          <span class="en">messageCategory</span>
        </label>
        <select id="messageCategory" required>
          <option value="01" selected>01 - PA (Payment Authentication)</option>
          <option value="02">02 - NPA (Non-Payment Authentication)</option>
          <option value="80">80 - Mastercard Identity Check Insights</option>
          <option value="85">85 - Mastercard PVPA</option>
          <option value="86">86 - Mastercard PVNPA</option>
        </select>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableMessageCategory" style="margin: 0" />
          <label
            for="enableMessageCategory"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成，預設關閉</small>
      </div>
      <div class="form-group">
        <label for="deviceChannel" class="bilingual-label">
          <span class="zh">裝置通道</span>
          <span class="en">deviceChannel</span>
        </label>
        <select id="deviceChannel" required>
          <option value="02" selected>02 - Browser (BRW)</option>
          <option value="03">03 - 3DS Requestor Initiated (3RI)</option>
        </select>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableDeviceChannel" style="margin: 0" />
          <label
            for="enableDeviceChannel"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成，預設關閉</small>
      </div>
      <div class="form-group">
        <label for="threeDSRequestorChallengeInd" class="bilingual-label">
          <span class="zh">3DS 請求方挑戰指標</span>
          <span class="en">RequestorChlgInd</span>
        </label>
        <select id="threeDSRequestorChallengeInd" required>
          <option value="01" selected>01 = No preference</option>
          <option value="02">02 = No challenge requested</option>
          <option value="03">03 = Challenge requested: 3DS Requestor Preference</option>
          <option value="04">04 = Challenge requested: Mandate</option>
          <option value="05">
            05 = No challenge requested (transactional risk analysis is already performed)
          </option>
          <option value="06">06 = No challenge requested (Data share only)</option>
          <option value="07">
            07 = No challenge requested (strong consumer authentication is already performed)
          </option>
          <option value="08">
            08 = No challenge requested (utilise Trust List exemption if no challenge required)
          </option>
          <option value="09">
            09 = Challenge requested (Trust List prompt requested if challenge required)
          </option>
          <option value="10">10 = No challenge requested (utilise low value exemption)</option>
          <option value="11">
            11 = No challenge requested (Secure corporate payment exemption)
          </option>
          <option value="12">
            12 = Challenge requested (Device Binding prompt requested if challenge required)
          </option>
          <option value="13">13 = Challenge requested (Issuer requested)</option>
          <option value="14">14 = Challenge requested (Merchant initiated transactions)</option>
          <option value="80">
            80 = (Visa) Remove specified VMID+PAN from Trusted Listing database
          </option>
          <option value="82">
            82 = (Visa) NO CHALLENGE REQUESTED. Secure Corporate Exemption
          </option>
        </select>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableThreeDSRequestorChallengeInd" style="margin: 0" />
          <label
            for="enableThreeDSRequestorChallengeInd"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位（Visa 才會隨機到 80/82）</label
          >
        </div>
        <small style="color: red">可隨機生成，預設關閉</small>
      </div>
      <div class="form-group">
        <label for="authenticationMethod" class="bilingual-label">
          <span class="zh">認證方法</span>
          <span class="en">authenticationMethod</span>
        </label>
        <input type="text" id="authenticationMethod" value="02" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableAuthenticationMethodRandom" style="margin: 0" />
          <label
            for="enableAuthenticationMethodRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (01-05)</small>
      </div>
      <div class="form-group">
        <label for="authenticationType" class="bilingual-label">
          <span class="zh">認證類型</span>
          <span class="en">authenticationType</span>
        </label>
        <input type="text" id="authenticationType" value="02" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableAuthenticationTypeRandom" style="margin: 0" />
          <label
            for="enableAuthenticationTypeRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (01-05)</small>
      </div>
      <div class="form-group">
        <label for="deviceIpAddress" class="bilingual-label">
          <span class="zh">設備 IP 位址</span>
          <span class="en">deviceIpAddress</span>
        </label>
        <input type="text" id="deviceIpAddress" value="::1" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableDeviceIpAddressRandom" style="margin: 0" />
          <label
            for="enableDeviceIpAddressRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位（瀏覽器 IP 會跟隨）</label
          >
        </div>
        <small style="color: red">可隨機生成 IPv4/IPv6，瀏覽器 IP 會自動跟隨</small>
      </div>
      <div class="form-group">
        <label for="browserIP" class="bilingual-label">
          <span class="zh">瀏覽器 IP</span>
          <span class="en">browserIP</span>
        </label>
        <input type="text" id="browserIP" value="::1" />
        <small>自動跟隨設備 IP 位址</small>
      </div>
      <div class="form-group">
        <label for="devicePlatform" class="bilingual-label">
          <span class="zh">設備平台</span>
          <span class="en">devicePlatform</span>
        </label>
        <input type="text" id="devicePlatform" value="MacIntel" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableDevicePlatformRandom" style="margin: 0" />
          <label
            for="enableDevicePlatformRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (如: MacIntel, Win32, Linux x86_64)</small>
      </div>
      <div class="form-group">
        <label for="deviceLocale" class="bilingual-label">
          <span class="zh">設備語言設定</span>
          <span class="en">deviceLocale</span>
        </label>
        <input type="text" id="deviceLocale" value="zh-TW" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableDeviceLocaleRandom" style="margin: 0" />
          <label
            for="enableDeviceLocaleRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (如: zh-TW, zh-CN, en-US)</small>
      </div>
      <div class="form-group">
        <label for="deviceAdvertisingId" class="bilingual-label">
          <span class="zh">設備廣告 ID</span>
          <span class="en">deviceAdvertisingId</span>
        </label>
        <input type="text" id="deviceAdvertisingId" value="4d4427f20375a66287430edd54bd82d2" />
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableDeviceAdvertisingIdRandom" style="margin: 0" />
          <label
            for="enableDeviceAdvertisingIdRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 32 位十六進制字串</small>
      </div>
      <div class="form-group">
        <label for="threeDSCompInd" class="bilingual-label">
          <span class="zh">3DS 完成指示</span>
          <span class="en">threeDSCompInd</span>
        </label>
        <select id="threeDSCompInd">
          <option value="">留空</option>
          <option value="Y" selected>Y - Yes</option>
          <option value="N">N - No</option>
        </select>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableThreeDSCompIndRandom" style="margin: 0" />
          <label
            for="enableThreeDSCompIndRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成 (Y/N)</small>
      </div>
      <div class="form-group">
        <label for="merchantCountryCodeStr" class="bilingual-label">
          <span class="zh">商戶國家代碼 (字串)</span>
          <span class="en">merchantCountryCodeStr</span>
        </label>
        <select id="merchantCountryCodeStr">
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
        </select>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableMerchantCountryCodeStrRandom" style="margin: 0" />
          <label
            for="enableMerchantCountryCodeStrRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位</label
          >
        </div>
        <small style="color: red">可隨機生成，從選單中隨機選擇</small>
      </div>
      <div class="form-group">
        <label for="browserGeoIP" class="bilingual-label">
          <span class="zh">瀏覽器 IP 地理位置</span>
          <span class="en">browserGeoIP</span>
        </label>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableBrowserGeoIPRandom" style="margin: 0" checked />
          <label
            for="enableBrowserGeoIPRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位（預設開啟）</label
          >
        </div>
        <small style="color: red"
          >預設生成地理位置資訊（基於國家代碼），可隨機生成城市、座標等</small
        >
      </div>
      <div class="form-group">
        <label for="deviceGeoIP" class="bilingual-label">
          <span class="zh">設備 IP 地理位置</span>
          <span class="en">deviceGeoIP</span>
        </label>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px">
          <input type="checkbox" id="enableDeviceGeoIPRandom" style="margin: 0" checked />
          <label
            for="enableDeviceGeoIPRandom"
            style="margin: 0; font-weight: normal; color: #7f8c8d; font-size: 0.9em"
            >隨機生成時包含此欄位（預設開啟）</label
          >
        </div>
        <small style="color: red"
          >預設生成地理位置資訊（基於國家代碼），可隨機生成城市、座標等</small
        >
      </div>
    </div>
  </div>
</template>
