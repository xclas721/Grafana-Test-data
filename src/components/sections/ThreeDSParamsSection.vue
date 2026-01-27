<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import Select, { type SelectOption } from '@/shared/components/Select.vue'

const messageCategoryOptions: SelectOption[] = [
  { value: '01', label: '01 - PA (Payment Authentication)' },
  { value: '02', label: '02 - NPA (Non-Payment Authentication)' },
  { value: '80', label: '80 - Mastercard Identity Check Insights' },
  { value: '85', label: '85 - Mastercard PVPA' },
  { value: '86', label: '86 - Mastercard PVNPA' }
]

const deviceChannelOptions: SelectOption[] = [
  { value: '02', label: '02 - Browser (BRW)' },
  { value: '03', label: '03 - 3DS Requestor Initiated (3RI)' }
]

const requestorChallengeOptions: SelectOption[] = [
  { value: '01', label: '01 = No preference' },
  { value: '02', label: '02 = No challenge requested' },
  { value: '03', label: '03 = Challenge requested: 3DS Requestor Preference' },
  { value: '04', label: '04 = Challenge requested: Mandate' },
  {
    value: '05',
    label: '05 = No challenge requested (transactional risk analysis is already performed)'
  },
  { value: '06', label: '06 = No challenge requested (Data share only)' },
  {
    value: '07',
    label: '07 = No challenge requested (strong consumer authentication is already performed)'
  },
  {
    value: '08',
    label: '08 = No challenge requested (utilise Trust List exemption if no challenge required)'
  },
  {
    value: '09',
    label: '09 = Challenge requested (Trust List prompt requested if challenge required)'
  },
  { value: '10', label: '10 = No challenge requested (utilise low value exemption)' },
  { value: '11', label: '11 = No challenge requested (Secure corporate payment exemption)' },
  {
    value: '12',
    label: '12 = Challenge requested (Device Binding prompt requested if challenge required)'
  },
  { value: '13', label: '13 = Challenge requested (Issuer requested)' },
  { value: '14', label: '14 = Challenge requested (Merchant initiated transactions)' },
  {
    value: '80',
    label: '80 = (Visa) Remove specified VMID+PAN from Trusted Listing database'
  },
  { value: '82', label: '82 = (Visa) NO CHALLENGE REQUESTED. Secure Corporate Exemption' }
]

const threeDSCompIndOptions: SelectOption[] = [
  { value: '', label: '留空' },
  { value: 'Y', label: 'Y - Yes' },
  { value: 'N', label: 'N - No' }
]

const merchantCountryCodeStrOptions: SelectOption[] = [
  { value: '156', label: '156 - 中國 (CN)' },
  { value: '158', label: '158 - 台灣 (TW)' },
  { value: '840', label: '840 - 美國 (US)' },
  { value: '392', label: '392 - 日本 (JP)' },
  { value: '344', label: '344 - 香港 (HK)' },
  { value: '410', label: '410 - 韓國 (KR)' },
  { value: '702', label: '702 - 新加坡 (SG)' },
  { value: '036', label: '036 - 澳洲 (AU)' },
  { value: '124', label: '124 - 加拿大 (CA)' },
  { value: '978', label: '978 - 歐元區 (EU)' },
  { value: '826', label: '826 - 英國 (GB)' }
]
</script>

<template>
  <!-- 8.3DS 參數 -->
  <section id="three-ds-params" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">8.3DS 參數</h3>
      <div class="flex items-center gap-2 mb-4 rounded-md bg-base-200 px-3 py-2">
        <input type="checkbox" id="enableAll3DSParamsRandom" class="checkbox checkbox-sm" />
        <label for="enableAll3DSParamsRandom" class="text-sm font-semibold">
          全選：隨機生成時包含所有 3DS 參數欄位
        </label>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            id="messageCategory"
            label="訊息類別 (messageCategory)"
            :modelValue="'01'"
            :options="messageCategoryOptions"
            required
          />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="enableMessageCategory" class="checkbox checkbox-sm" />
            <label for="enableMessageCategory" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成，預設關閉</p>
        </div>
        <div>
          <Select
            id="deviceChannel"
            label="裝置通道 (deviceChannel)"
            :modelValue="'02'"
            :options="deviceChannelOptions"
            required
          />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="enableDeviceChannel" class="checkbox checkbox-sm" />
            <label for="enableDeviceChannel" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成，預設關閉</p>
        </div>
        <div>
          <Select
            id="threeDSRequestorChallengeInd"
            label="3DS 請求方挑戰指標 (RequestorChlgInd)"
            :modelValue="'01'"
            :options="requestorChallengeOptions"
            required
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableThreeDSRequestorChallengeInd"
              class="checkbox checkbox-sm"
            />
            <label for="enableThreeDSRequestorChallengeInd" class="text-sm text-base-content/60">
              隨機生成時包含此欄位（Visa 才會隨機到 80/82）
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成，預設關閉</p>
        </div>
        <div>
          <Input
            id="authenticationMethod"
            label="認證方法 (authenticationMethod)"
            :modelValue="'02'"
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableAuthenticationMethodRandom"
              class="checkbox checkbox-sm"
            />
            <label for="enableAuthenticationMethodRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (01-05)</p>
        </div>
        <div>
          <Input id="authenticationType" label="認證類型 (authenticationType)" :modelValue="'02'" />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableAuthenticationTypeRandom"
              class="checkbox checkbox-sm"
            />
            <label for="enableAuthenticationTypeRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (01-05)</p>
        </div>
        <div>
          <Input id="deviceIpAddress" label="設備 IP 位址 (deviceIpAddress)" :modelValue="'::1'" />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="enableDeviceIpAddressRandom" class="checkbox checkbox-sm" />
            <label for="enableDeviceIpAddressRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位（瀏覽器 IP 會跟隨）
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 IPv4/IPv6，瀏覽器 IP 會自動跟隨</p>
        </div>
        <div>
          <Input id="browserIP" label="瀏覽器 IP (browserIP)" :modelValue="'::1'" />
          <p class="text-xs text-base-content/60 mt-1">自動跟隨設備 IP 位址</p>
        </div>
        <div>
          <Input id="devicePlatform" label="設備平台 (devicePlatform)" :modelValue="'MacIntel'" />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="enableDevicePlatformRandom" class="checkbox checkbox-sm" />
            <label for="enableDevicePlatformRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (如: MacIntel, Win32, Linux x86_64)</p>
        </div>
        <div>
          <Input id="deviceLocale" label="設備語言設定 (deviceLocale)" :modelValue="'zh-TW'" />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="enableDeviceLocaleRandom" class="checkbox checkbox-sm" />
            <label for="enableDeviceLocaleRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (如: zh-TW, zh-CN, en-US)</p>
        </div>
        <div>
          <Input
            id="deviceAdvertisingId"
            label="設備廣告 ID (deviceAdvertisingId)"
            :modelValue="'4d4427f20375a66287430edd54bd82d2'"
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableDeviceAdvertisingIdRandom"
              class="checkbox checkbox-sm"
            />
            <label for="enableDeviceAdvertisingIdRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 32 位十六進制字串</p>
        </div>
        <div>
          <Select
            id="threeDSCompInd"
            label="3DS 完成指示 (threeDSCompInd)"
            :modelValue="'Y'"
            :options="threeDSCompIndOptions"
          />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="enableThreeDSCompIndRandom" class="checkbox checkbox-sm" />
            <label for="enableThreeDSCompIndRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (Y/N)</p>
        </div>
        <div>
          <Select
            id="merchantCountryCodeStr"
            label="商戶國家代碼 (字串) (merchantCountryCodeStr)"
            :modelValue="'156'"
            :options="merchantCountryCodeStrOptions"
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableMerchantCountryCodeStrRandom"
              class="checkbox checkbox-sm"
            />
            <label for="enableMerchantCountryCodeStrRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成，從選單中隨機選擇</p>
        </div>
        <div>
          <label class="label">
            <span class="label-text">瀏覽器 IP 地理位置 (browserGeoIP)</span>
          </label>
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableBrowserGeoIPRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enableBrowserGeoIPRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位（預設開啟）
            </label>
          </div>
          <p class="text-xs text-error mt-2">
            預設生成地理位置資訊（基於國家代碼），可隨機生成城市、座標等
          </p>
        </div>
        <div>
          <label class="label">
            <span class="label-text">設備 IP 地理位置 (deviceGeoIP)</span>
          </label>
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableDeviceGeoIPRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enableDeviceGeoIPRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位（預設開啟）
            </label>
          </div>
          <p class="text-xs text-error mt-2">
            預設生成地理位置資訊（基於國家代碼），可隨機生成城市、座標等
          </p>
        </div>
      </div>
    </Card>
  </section>
</template>
