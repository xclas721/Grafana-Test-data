<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import Select from '@/shared/components/Select.vue'
import Button from '@/shared/components/Button.vue'

const route = useRoute()

// 判斷 DDoS 限流測試區塊是否應該展開
const isDDoSActive = () => {
  return route.path === '/rate-limit-test'
}

// 判斷 Grafana Test Data 區塊是否應該展開
const isGrafanaActive = () => {
  return route.path === '/'
}

// ========================================
// 配置參數（對應 PowerShell 腳本的配置區塊）
// ========================================
const config = reactive({
  baseUrl: '',
  cardScheme: 'V',
  version: '2.3.1',
  issuerOids: ['06b4b203-da05-73f9-256f-454929df6076'], // Issuer OID 列表
  projectId: '001',
  cardPrefix: '4143520000000',
  cardCount: 100,
  requestCount: 1,
  merchantName: 'HiTRUST EMV Demo Merchant',
  merchantID: '8909191',
  mcc: '5661',
  merchantCountryCode: '156',
  noDuplicateCards: false // 卡號不重複選項
})

// Card Scheme 選項
const cardSchemeOptions = [
  { value: 'V', label: 'Visa (V)' },
  { value: 'M', label: 'Mastercard (M)' },
  { value: 'J', label: 'JCB (J)' },
  { value: 'A', label: 'American Express (A)' },
  { value: 'U', label: 'UnionPay (U)' },
  { value: 'C', label: 'Discover (C)' },
  { value: 'D', label: 'Diners Club (D)' },
  { value: 'P', label: 'PayPal (P)' },
  { value: 'N', label: 'Networks (N)' },
  { value: 'E', label: 'Elo (E)' },
  { value: 'T', label: 'Troy (T)' }
]

// ========================================
// 測試狀態
// ========================================
const isTesting = ref(false)
const shouldStop = ref(false) // 停止標誌
const testResults = reactive({
  successCount: 0,
  rateLimitCount: 0,
  invalidEndpointCount: 0,
  otherErrorCount: 0
})

// 日誌條目
interface LogEntry {
  id: string
  time: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
}

const logs = ref<LogEntry[]>([])

// ========================================
// 工具函數
// ========================================

/**
 * 生成 UUID（對應 PowerShell 的 [System.Guid]::NewGuid()）
 */
function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * 生成隨機 Issuer OID（對應 PowerShell 的 [System.Guid]::NewGuid().ToString()）
 */
function generateRandomIssuerOid(): string {
  return generateUUID()
}

/**
 * 添加新的 Issuer OID
 */
function addIssuerOid() {
  config.issuerOids.push('')
}

/**
 * 移除 Issuer OID
 */
function removeIssuerOid(index: number) {
  if (config.issuerOids.length > 1) {
    config.issuerOids.splice(index, 1)
  }
}

/**
 * 生成隨機 Issuer OID 並添加到列表
 */
function generateAndAddRandomIssuerOid() {
  config.issuerOids.push(generateRandomIssuerOid())
}

/**
 * 獲取有效的 Issuer OID 列表（過濾空值）
 */
function getValidIssuerOids(): string[] {
  return config.issuerOids.filter((oid) => oid.trim() !== '')
}

/**
 * 添加日誌
 */
function addLog(type: LogEntry['type'], message: string, details?: string) {
  logs.value.push({
    id: generateUUID(),
    time: new Date().toLocaleTimeString('zh-TW'),
    type,
    message,
    details
  })
  // 自動滾動到底部
  setTimeout(() => {
    const logContainer = document.getElementById('log-container')
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight
    }
  }, 10)
}

/**
 * 載入預設值（對應 PowerShell 腳本的預設配置）
 */
function loadDefaults() {
  config.baseUrl = ''
  config.cardScheme = 'V'
  config.version = '2.2.0'
  config.issuerOids = ['06b4b203-da05-73f9-256f-454929df6076']
  config.projectId = '001'
  config.cardPrefix = '4143520000000'
  config.cardCount = 15
  config.requestCount = 7
  config.merchantName = 'HiTRUST EMV Demo Merchant'
  config.merchantID = '8909191'
  config.noDuplicateCards = false
  addLog('info', '預設值已載入')
}

/**
 * 延遲函數（對應 PowerShell 的 Start-Sleep）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 發送單個請求（對應 PowerShell 的 Invoke-RestMethod）
 */
async function sendRequest(
  cardNumber: string,
  issuerOid: string
): Promise<{
  success: boolean
  type: 'success' | 'rateLimit' | 'invalidEndpoint' | 'otherError'
  duration: number
  message: string
  details?: string
}> {
  const startTime = Date.now()

  type AreqResponse = {
    messageType?: string
    errorCode?: string
    errorDescription?: string
    errorDetail?: string
    acsTransID?: string
  }

  // 生成交易 ID
  const dsTransID = generateUUID().toUpperCase()
  const threeDSServerTransID = generateUUID()

  // 構建請求 URL
  const endpoint = `/acs-auth/auth/${config.cardScheme}/${config.version}/${issuerOid}/${config.projectId}/areq`
  const resolvedBaseUrl = config.baseUrl.trim().replace(/\/+$/, '')
  const url = `${resolvedBaseUrl}${endpoint}`

  // 構建請求 Body（對應 PowerShell 腳本第 63-109 行）
  const requestBody = {
    messageType: 'AReq',
    messageVersion: '2.2.0',
    threeDSCompInd: 'Y',
    threeDSRequestorAuthenticationInd: '01',
    threeDSRequestorID: '12128301823081230123',
    threeDSRequestorName: 'HiTRUST EMV 3DS Demo Site',
    threeDSRequestorURL: 'http://localhost:8040',
    threeDSServerRefNumber: '80039886353782387',
    threeDSServerOperatorID: '135273897351',
    threeDSServerTransID: threeDSServerTransID,
    threeDSServerURL: 'http://localhost:8020/api-proxy/challenge/2.3.1/001/rreq',
    acctType: '01',
    acquirerBIN: '1231234',
    acquirerMerchantID: config.merchantID,
    browserAcceptHeader: 'application/json, text/javascript, */*; q=0.01',
    browserIP: '0:0:0:0:0:0:0:1',
    browserJavaEnabled: false,
    browserLanguage: 'zh-TW',
    browserColorDepth: '24',
    browserScreenHeight: '1080',
    browserScreenWidth: '1920',
    browserTZ: '-480',
    browserUserAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    cardExpiryDate: '3012',
    acctInfo: {
      chAccAgeInd: '01'
    },
    acctNumber: cardNumber,
    acctID: 'F123**6789',
    cardholderName: 'K*********',
    deviceChannel: '02',
    dsReferenceNumber: 'DsReferenceNumber12837129312',
    dsTransID: dsTransID,
    dsURL: 'http://localhost:8020/api-proxy/challenge/2.3.1/001/rreq',
    mcc: config.mcc,
    merchantCountryCode: config.merchantCountryCode,
    merchantName: config.merchantName,
    messageCategory: '01',
    notificationURL: 'http://localhost:8040/cres',
    purchaseAmount: '100',
    purchaseCurrency: '156',
    purchaseExponent: '2',
    purchaseDate: new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14),
    transType: '01',
    browserJavascriptEnabled: false
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    // 嘗試解析回應 JSON
    let responseData: AreqResponse | null = null
    try {
      responseData = (await response.json()) as AreqResponse
    } catch {
      // 如果無法解析 JSON，可能是空回應或其他格式
      if (!response.ok) {
        // HTTP 錯誤狀態碼
        if (response.status === 403) {
          return {
            success: false,
            type: 'rateLimit',
            duration,
            message: `Rate Limited (${duration}ms) - HTTP 403 Forbidden`,
            details: undefined
          }
        } else if (response.status === 303) {
          return {
            success: false,
            type: 'invalidEndpoint',
            duration,
            message: `Invalid Endpoint (${duration}ms) - HTTP 303`,
            details: undefined
          }
        } else {
          return {
            success: false,
            type: 'otherError',
            duration,
            message: `HTTP Error ${response.status} (${duration}ms)`,
            details: undefined
          }
        }
      }
      // 空回應但狀態碼 OK
      return {
        success: false,
        type: 'otherError',
        duration,
        message: `Empty Response (${duration}ms)`,
        details: undefined
      }
    }

    // 檢查回應（對應 PowerShell 腳本第 173-191 行）
    if (responseData.messageType === 'ARes') {
      return {
        success: true,
        type: 'success',
        duration,
        message: `Success (${duration}ms) - ARes, acsTransID: ${responseData.acsTransID || 'N/A'}`,
        details: `acsTransID: ${responseData.acsTransID || 'N/A'}`
      }
    } else if (responseData.messageType === 'Erro') {
      if (responseData.errorCode === '403') {
        return {
          success: false,
          type: 'rateLimit',
          duration,
          message: `Rate Limited (${duration}ms) - Error 403: ${responseData.errorDescription || 'N/A'}`,
          details: responseData.errorDetail || undefined
        }
      } else if (responseData.errorCode === '303') {
        return {
          success: false,
          type: 'invalidEndpoint',
          duration,
          message: `Invalid Endpoint (${duration}ms) - Error 303: ${responseData.errorDescription || 'N/A'}`,
          details: undefined
        }
      } else {
        return {
          success: false,
          type: 'otherError',
          duration,
          message: `Error (${duration}ms) - Error ${responseData.errorCode || 'N/A'}: ${responseData.errorDescription || 'N/A'}`,
          details: undefined
        }
      }
    } else {
      return {
        success: false,
        type: 'otherError',
        duration,
        message: `Unknown Response Type: ${responseData.messageType || 'N/A'}`,
        details: undefined
      }
    }
  } catch (error: unknown) {
    const endTime = Date.now()
    const duration = endTime - startTime

    // 網路錯誤或其他異常（對應 PowerShell 腳本第 193-235 行）
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      type: 'otherError',
      duration,
      message: `Request Failed (${duration}ms): ${errorMessage}`,
      details: undefined
    }
  }
}

/**
 * 停止測試
 */
function stopTest() {
  shouldStop.value = true
  addLog('warning', '正在停止測試...')
}

/**
 * 執行測試（對應 PowerShell 腳本的主要迴圈邏輯）
 */
async function runTest() {
  if (isTesting.value) return

  // 重置統計和停止標誌
  testResults.successCount = 0
  testResults.rateLimitCount = 0
  testResults.invalidEndpointCount = 0
  testResults.otherErrorCount = 0
  logs.value = []
  shouldStop.value = false

  isTesting.value = true

  // 獲取有效的 Issuer OID 列表
  const issuerOids = getValidIssuerOids()

  if (issuerOids.length === 0) {
    addLog('error', '錯誤：至少需要一個 Issuer OID')
    isTesting.value = false
    shouldStop.value = false
    return
  }

  // 顯示測試資訊（對應 PowerShell 腳本第 36-59 行）
  addLog('info', '========================================')
  addLog('info', 'DDoS AReq Card Number Rate Limit Test')
  addLog('info', '========================================')
  const resolvedBaseUrl = config.baseUrl.trim().replace(/\/+$/, '')
  addLog('info', `Base URL: ${resolvedBaseUrl || '(同源代理)'}`)
  addLog('info', `Card Scheme: ${config.cardScheme}`)
  addLog('info', `Version: ${config.version}`)
  addLog('info', `Total Issuer OIDs: ${issuerOids.length}`)
  issuerOids.forEach((oid, index) => {
    addLog('info', `  [${index + 1}] ${oid}`)
  })
  addLog('info', `Project ID: ${config.projectId}`)
  addLog('info', `Card Prefix: ${config.cardPrefix}`)
  addLog('info', `Card Count: ${config.cardCount}`)
  addLog('info', `Requests per Card: ${config.requestCount}`)
  addLog('info', `Total Requests: ${config.cardCount * config.requestCount}`)
  addLog('info', `Merchant ID: ${config.merchantID}`)
  addLog('info', 'Expected: First 5 pass per card, 6th+ trigger rate limit')
  addLog('info', 'Rate Limit: 5 tokens per minute per card number')
  addLog('info', 'Note: Each request will randomly select an issuerOid')
  addLog('info', '========================================')
  addLog('info', '')

  const totalRequestCount = config.cardCount * config.requestCount
  let currentRequestIndex = 0

  // 如果啟用不重複選項，使用 Set 追蹤已使用的卡號
  const usedCardNumbers = new Set<string>()

  // 生成不重複卡號的函數
  const generateUniqueCardNumber = (): string => {
    if (!config.noDuplicateCards) {
      // 不啟用不重複選項時，使用原本的順序生成方式
      return ''
    }

    let attempts = 0
    const maxAttempts = 10000 // 防止無限迴圈

    while (attempts < maxAttempts) {
      // 生成隨機後綴（3位數，範圍 000-999）
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
      const cardNumber = `${config.cardPrefix}${randomSuffix}`

      if (!usedCardNumbers.has(cardNumber)) {
        usedCardNumbers.add(cardNumber)
        return cardNumber
      }

      attempts++
    }

    // 如果無法生成不重複的卡號，回退到順序生成
    addLog('warning', '無法生成足夠的不重複卡號，將使用順序生成方式')
    return ''
  }

  // 外層迴圈：每張卡號（對應 PowerShell 腳本第 130-248 行）
  for (let cardIndex = 1; cardIndex <= config.cardCount; cardIndex++) {
    // 檢查是否應該停止
    if (shouldStop.value) {
      addLog('warning', '測試已停止')
      break
    }

    // 生成卡號
    let testCardNumber: string
    if (config.noDuplicateCards) {
      testCardNumber = generateUniqueCardNumber()
      if (!testCardNumber) {
        // 回退到順序生成
        const cardSuffix = (122 + cardIndex).toString()
        testCardNumber = `${config.cardPrefix}${cardSuffix}`
      }
    } else {
      // 原本的順序生成方式：4143520000000 + 後綴（123, 124, 125...）
      const cardSuffix = (122 + cardIndex).toString()
      testCardNumber = `${config.cardPrefix}${cardSuffix}`
    }

    addLog('info', `--- Card ${cardIndex}/${config.cardCount} : ${testCardNumber} ---`)

    // 內層迴圈：每張卡號的請求次數
    for (let i = 1; i <= config.requestCount; i++) {
      // 檢查是否應該停止
      if (shouldStop.value) {
        addLog('warning', '測試已停止')
        break
      }
      currentRequestIndex++

      // 隨機選擇一個 issuerOid
      const selectedIssuerOid =
        issuerOids[Math.floor(Math.random() * issuerOids.length)] ?? issuerOids[0]
      if (!selectedIssuerOid) {
        addLog('error', 'Issuer OID 清單為空，無法繼續測試')
        shouldStop.value = true
        break
      }
      const selectedIssuerOidIndex = issuerOids.indexOf(selectedIssuerOid)

      // 顯示請求資訊
      const logPrefix = `[Request ${currentRequestIndex}/${totalRequestCount}] Card: ${testCardNumber} (${i}/${config.requestCount}) IssuerOid: ${selectedIssuerOid.substring(0, 8)}... [${selectedIssuerOidIndex + 1}]`

      // 發送請求
      const result = await sendRequest(testCardNumber, selectedIssuerOid)

      // 更新統計
      if (result.type === 'success') {
        testResults.successCount++
        addLog('success', `${logPrefix} ${result.message}`, result.details)
      } else if (result.type === 'rateLimit') {
        testResults.rateLimitCount++
        addLog('error', `${logPrefix} ${result.message}`, result.details)
        if (result.details) {
          addLog('warning', `  Error Detail: ${result.details}`)
        }
      } else if (result.type === 'invalidEndpoint') {
        testResults.invalidEndpointCount++
        addLog('warning', `${logPrefix} ${result.message}`)
      } else {
        testResults.otherErrorCount++
        addLog('error', `${logPrefix} ${result.message}`, result.details)
      }

      // 短暫延遲，避免請求過快（對應 PowerShell 腳本第 238-240 行）
      if (i < config.requestCount || cardIndex < config.cardCount) {
        await sleep(200)
      }
    }

    // 檢查是否應該停止（在卡號之間也檢查）
    if (shouldStop.value) {
      break
    }

    // 每張卡號之間稍長延遲（對應 PowerShell 腳本第 244-247 行）
    if (cardIndex < config.cardCount) {
      addLog('info', '')
      await sleep(500)
    }
  }

  // 如果被停止，顯示停止訊息
  if (shouldStop.value) {
    addLog('warning', '')
    addLog('warning', '測試已由用戶停止')
  }

  // 顯示統計結果（對應 PowerShell 腳本第 251-269 行）
  addLog('info', '')
  addLog('info', '========================================')
  addLog('info', 'Test Results Summary')
  addLog('info', '========================================')
  addLog('info', `Total Issuer OIDs Used: ${issuerOids.length}`)
  addLog('info', `Card Count: ${config.cardCount}`)
  addLog('info', `Requests per Card: ${config.requestCount}`)
  addLog('info', `Total Requests: ${totalRequestCount}`)
  addLog('info', `Success: ${testResults.successCount} (Expected: ${config.cardCount * 5})`)
  addLog(
    'info',
    `Rate Limited (403): ${testResults.rateLimitCount} (Expected: ${config.cardCount * (config.requestCount - 5)})`
  )
  addLog('info', '  → 被 DDoS 檢測擋住')
  addLog('info', `Invalid Endpoint (303): ${testResults.invalidEndpointCount} → issuerOid 驗證失敗`)
  addLog('info', `Other Errors: ${testResults.otherErrorCount}`)
  addLog('info', '========================================')

  // 驗證結果（對應 PowerShell 腳本第 272-311 行）
  const expectedSuccess = config.cardCount * 5
  const expectedRateLimit = config.cardCount * (config.requestCount - 5)

  if (
    testResults.successCount === expectedSuccess &&
    testResults.rateLimitCount >= expectedRateLimit
  ) {
    addLog('success', '')
    addLog('success', 'Test PASSED! Card number rate limiting is working correctly')
    addLog('success', '  Each card: First 5 requests passed, 6th+ requests triggered rate limit')
    addLog('success', `  Total ${config.cardCount} card(s) tested, all rate limited correctly`)
  } else if (testResults.successCount < expectedSuccess) {
    addLog('warning', '')
    addLog(
      'warning',
      `WARNING: Success count less than expected (${testResults.successCount} < ${expectedSuccess})`
    )
    addLog('warning', '  Possible reasons:')
    addLog('warning', '  1. Rate limit switch not enabled (acs.rate.limit.switch)')
    addLog('warning', '  2. Previous requests consumed tokens')
    addLog('warning', '  3. Request interval > 1 minute, tokens refilled')
    if (testResults.invalidEndpointCount > 0) {
      addLog('warning', '  4. Some requests failed due to invalid issuerOid (303 errors)')
    }
  } else if (testResults.rateLimitCount === 0) {
    addLog('warning', '')
    addLog('warning', 'WARNING: Rate limit not triggered')
    addLog('warning', '  Possible reasons:')
    addLog('warning', '  1. Rate limit switch not enabled')
    addLog('warning', '  2. Token capacity too large')
    addLog('warning', '  3. Request interval > 1 minute, tokens refilled')
  }

  // 顯示錯誤分類說明
  if (testResults.invalidEndpointCount > 0) {
    addLog('info', '')
    addLog('info', 'Error Breakdown:')
    addLog('warning', `  - Invalid Endpoint (303): ${testResults.invalidEndpointCount} requests`)
    addLog('warning', '    → These requests passed DDoS check but failed issuerOid validation')
    addLog('warning', '    → PathVariable issuerOid ≠ CardBin lookup issuerOid')
  }
  if (testResults.otherErrorCount > 0) {
    addLog('info', '')
    addLog('warning', `  - Other Errors: ${testResults.otherErrorCount} requests`)
    addLog('warning', '    → Check logs for details')
  }

  addLog('info', '')
  addLog('info', 'Tips:')
  addLog('info', '1. Wait 60 seconds, then check Elasticsearch for stats records')
  addLog('info', '2. Query: GET http://localhost:9200/.ds-logs-acs-ddos-attack-stats-*/_search')
  addLog('info', '3. Check logs for "DDoS stats summary sent" message')
  addLog('info', '4. Expected ES records: acctNumberData should contain stats grouped by issuerOid')
  addLog('info', '   Format: "AReq-414352******XXXX-YYYYMMdd-HHmm" (one per card)')
  addLog('info', '5. Each issuerOid should have independent statistics (up to 100 issuerOids)')
  addLog('info', '')

  isTesting.value = false
  shouldStop.value = false // 重置停止標誌
}

// 計算預期值
const expectedSuccess = computed(() => config.cardCount * 5)
const expectedRateLimit = computed(() => config.cardCount * (config.requestCount - 5))
const totalRequests = computed(() => config.cardCount * config.requestCount)

// 日誌類型對應的 CSS 類別
const getLogClass = (type: LogEntry['type']) => {
  switch (type) {
    case 'success':
      return 'text-success'
    case 'error':
      return 'text-error'
    case 'warning':
      return 'text-warning'
    default:
      return 'text-info'
  }
}
</script>

<template>
  <div class="drawer lg:drawer-open min-h-screen bg-base-200">
    <input id="app-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
      <div class="navbar bg-base-100 border-b border-base-300 px-6">
        <div class="flex-1 flex-col items-start">
          <div class="text-xl font-bold text-base-content">Grafana Test Data</div>
          <div class="text-xs text-base-content/60">AReq 卡號限流測試工具</div>
        </div>
        <div class="flex-none">
          <label for="app-drawer" class="btn btn-square btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="inline-block w-5 h-5 stroke-current"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>
        </div>
      </div>
      <main class="p-6 bg-base-200/60 min-h-[calc(100vh-64px)]">
        <div class="max-w-[1400px] mx-auto space-y-6">
          <!-- 頁面標題 -->
          <div class="text-xs breadcrumbs text-base-content/60 mb-4">
            <ul>
              <li>工具</li>
              <li>DDoS 限流測試</li>
            </ul>
          </div>

          <!-- 配置區塊 -->
          <Card title="測試配置" subtitle="DDoS AReq 卡號限流測試配置">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="col-span-full">
                <Input
                  v-model="config.baseUrl"
                  label="Base URL (基礎 URL)"
                  placeholder="留空使用同源代理 (http://localhost:6600)"
                  :disabled="isTesting"
                />
                <div class="mt-1 text-xs text-base-content/60">
                  留空時走同源代理，會轉送到 http://localhost:30100
                </div>
                <div class="mt-1 text-xs text-warning">
                  若填入外部網域，後端需開 CORS，否則瀏覽器會被擋下。
                </div>
              </div>
              <Select
                v-model="config.cardScheme"
                label="Card Scheme (卡組織)"
                :options="cardSchemeOptions"
                :disabled="isTesting"
              />
              <Input
                v-model="config.version"
                label="Version (版本號)"
                placeholder="2.2.0"
                :disabled="isTesting"
              />
              <!-- Issuer OID 列表 -->
              <div class="form-control col-span-full">
                <label class="label">
                  <span class="label-text">Issuer OID List (Issuer OID 列表)</span>
                  <span class="label-text-alt text-base-content/60">
                    每次請求會從列表中隨機選擇一個使用
                  </span>
                </label>
                <div class="space-y-2">
                  <div
                    v-for="(oid, index) in config.issuerOids"
                    :key="index"
                    class="flex items-center gap-2"
                  >
                    <Input
                      v-model="config.issuerOids[index]"
                      :placeholder="`Issuer OID ${index + 1} (UUID 格式)`"
                      :disabled="isTesting"
                      class="flex-1"
                    />
                    <Button
                      v-if="config.issuerOids.length > 1"
                      variant="ghost"
                      size="sm"
                      @click="removeIssuerOid(index)"
                      :disabled="isTesting"
                      title="移除"
                    >
                      ×
                    </Button>
                  </div>
                  <div class="flex gap-2">
                    <Button variant="outline" size="sm" @click="addIssuerOid" :disabled="isTesting">
                      + 新增 Issuer OID
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      @click="generateAndAddRandomIssuerOid"
                      :disabled="isTesting"
                    >
                      + 生成隨機 Issuer OID
                    </Button>
                  </div>
                </div>
              </div>
              <Input
                v-model="config.projectId"
                label="Project ID (專案 ID)"
                placeholder="001"
                :disabled="isTesting"
              />
              <Input
                v-model="config.cardPrefix"
                label="Card Prefix (卡號前綴)"
                placeholder="4143520000000"
                :disabled="isTesting"
              />
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Card Count (卡號數量)</span>
                </label>
                <div class="join w-full">
                  <input
                    v-model.number="config.cardCount"
                    type="number"
                    min="1"
                    max="100"
                    class="input input-bordered input-sm join-item flex-1"
                    :disabled="isTesting"
                  />
                </div>
                <label class="label cursor-pointer justify-start gap-2 mt-2">
                  <input
                    v-model="config.noDuplicateCards"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :disabled="isTesting"
                  />
                  <span class="label-text text-xs">No Duplicate Cards (卡號不重複)</span>
                </label>
              </div>
              <Input
                v-model.number="config.requestCount"
                label="Requests per Card (每張卡請求次數)"
                type="number"
                min="1"
                max="100"
                :disabled="isTesting"
              />
              <Input
                v-model="config.merchantID"
                label="Merchant ID (商戶 ID)"
                placeholder="8909191"
                :disabled="isTesting"
              />
              <Input
                v-model="config.merchantName"
                label="Merchant Name (商戶名稱)"
                placeholder="HiTRUST EMV Demo Merchant"
                :disabled="isTesting"
              />
              <Input
                v-model="config.mcc"
                label="MCC (商店類別碼)"
                placeholder="5661"
                :disabled="isTesting"
              />
              <Input
                v-model="config.merchantCountryCode"
                label="Merchant Country Code (商店國別碼)"
                placeholder="156"
                :disabled="isTesting"
              />
            </div>

            <div class="flex gap-2 mt-6">
              <Button variant="outline" @click="loadDefaults" :disabled="isTesting"
                >載入預設值</Button
              >
              <Button
                v-if="!isTesting"
                variant="success"
                @click="runTest"
                :disabled="isTesting"
                :loading="isTesting"
              >
                開始測試
              </Button>
              <Button v-else variant="danger" @click="stopTest" :disabled="!isTesting">
                停止測試
              </Button>
            </div>
          </Card>

          <!-- 統計摘要 -->
          <Card title="測試結果摘要">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="stat bg-base-200 rounded-lg p-4">
                <div class="stat-title text-xs">總請求數</div>
                <div class="stat-value text-2xl">{{ totalRequests }}</div>
              </div>
              <div class="stat bg-success/10 rounded-lg p-4">
                <div class="stat-title text-xs">成功</div>
                <div class="stat-value text-2xl text-success">
                  {{ testResults.successCount }}
                </div>
                <div class="stat-desc text-xs">預期: {{ expectedSuccess }}</div>
              </div>
              <div class="stat bg-error/10 rounded-lg p-4">
                <div class="stat-title text-xs">限流 (403)</div>
                <div class="stat-value text-2xl text-error">
                  {{ testResults.rateLimitCount }}
                </div>
                <div class="stat-desc text-xs">預期: {{ expectedRateLimit }}</div>
              </div>
              <div class="stat bg-warning/10 rounded-lg p-4">
                <div class="stat-title text-xs">其他錯誤</div>
                <div class="stat-value text-2xl text-warning">
                  {{ testResults.invalidEndpointCount + testResults.otherErrorCount }}
                </div>
                <div class="stat-desc text-xs">
                  Invalid: {{ testResults.invalidEndpointCount }}, Other:
                  {{ testResults.otherErrorCount }}
                </div>
              </div>
            </div>
          </Card>

          <!-- 日誌顯示區塊 -->
          <Card title="測試日誌" subtitle="即時顯示測試過程和結果">
            <div
              id="log-container"
              class="bg-base-300 rounded-lg p-4 max-h-[600px] overflow-y-auto font-mono text-xs space-y-1"
            >
              <div
                v-for="log in logs"
                :key="log.id"
                :class="['whitespace-pre-wrap', getLogClass(log.type)]"
              >
                <span class="text-base-content/60">[{{ log.time }}]</span>
                {{ log.message }}
                <div v-if="log.details" class="ml-8 text-base-content/80 text-[10px]">
                  {{ log.details }}
                </div>
              </div>
              <div v-if="logs.length === 0" class="text-base-content/40 text-center py-8">
                尚未開始測試，請點擊「開始測試」按鈕
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
    <div class="drawer-side z-40">
      <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <aside class="w-64 h-screen bg-neutral text-neutral-content flex flex-col">
        <div class="px-4 py-6 border-b border-neutral-focus">
          <div class="text-2xl font-bold tracking-wider">測試工具</div>
          <div class="text-xs text-neutral-content/60 mt-1">Grafana Test Data</div>
        </div>
        <nav class="flex-1 overflow-y-auto p-4 pr-2 max-h-[calc(100vh-120px)]">
          <ul
            class="menu gap-1 flex-1 [&_a.active]:bg-neutral-focus [&_a.active]:text-neutral-content [&_summary.active]:bg-neutral-focus [&_summary.active]:text-neutral-content"
          >
            <!-- Grafana Test Data 區塊 -->
            <li>
              <details :open="isGrafanaActive()" class="group">
                <summary
                  :class="{ active: isGrafanaActive() }"
                  class="flex items-center gap-3 rounded-lg transition-all cursor-pointer"
                >
                  <span class="flex-1">Grafana Test Data</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="w-4 h-4 transition-transform group-open:rotate-90"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6" />
                  </svg>
                </summary>
                <ul class="mt-1 space-y-1 pl-8 transition-all duration-200">
                  <li>
                    <RouterLink
                      to="/"
                      :class="{ active: route.path === '/' }"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>測試資料產生</span>
                    </RouterLink>
                  </li>
                </ul>
              </details>
            </li>

            <!-- DDoS 限流測試區塊 -->
            <li>
              <details :open="isDDoSActive()" class="group">
                <summary
                  :class="{ active: isDDoSActive() }"
                  class="flex items-center gap-3 rounded-lg transition-all cursor-pointer"
                >
                  <span class="flex-1">DDoS 限流測試</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="w-4 h-4 transition-transform group-open:rotate-90"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6" />
                  </svg>
                </summary>
                <ul class="mt-1 space-y-1 pl-8 transition-all duration-200">
                  <li>
                    <RouterLink
                      to="/rate-limit-test"
                      :class="{ active: route.path === '/rate-limit-test' }"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>卡BIN攻擊</span>
                    </RouterLink>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  </div>
</template>

<style scoped></style>
