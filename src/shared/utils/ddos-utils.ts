/**
 * DDoS Rate Limit Test - Shared utilities (ported from PowerShell scripts)
 */

export function generateUUID(): string {
  return crypto.randomUUID()
}

export function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export interface AReqBodyParams {
  cardNumber: string
  merchantId: string
  merchantName?: string
  mcc?: string
  merchantCountryCode?: string
  acquirerBIN?: string
  purchaseAmount?: string
  purchaseCurrency?: string
  purchaseExponent?: string
}

export function buildAReqBody(params: AReqBodyParams): Record<string, unknown> {
  const uuid = generateUUID()
  const now = new Date()
  const purchaseDate = now
    .toISOString()
    .replace(/[-:T.]/g, '')
    .slice(0, 14)

  return {
    messageType: 'AReq',
    messageVersion: '2.2.0',
    threeDSCompInd: 'Y',
    threeDSRequestorAuthenticationInd: '01',
    /** 03 = Challenge requested；搭配正確有效卡／效期較易拿到 acsURL */
    threeDSRequestorChallengeInd: '03',
    threeDSRequestorID: '12128301823081230123',
    threeDSRequestorName: 'HiTRUST EMV 3DS Demo Site',
    threeDSRequestorURL: 'http://localhost:8040',
    threeDSServerRefNumber: '80039886353782387',
    threeDSServerOperatorID: '135273897351',
    threeDSServerTransID: uuid,
    threeDSServerURL: 'http://localhost:8020/api-proxy/challenge/2.3.1/001/rreq',
    acctType: '01',
    acquirerBIN: params.acquirerBIN ?? '1231234',
    acquirerMerchantID: params.merchantId,
    browserAcceptHeader: 'application/json, text/javascript, */*; q=0.01',
    browserIP: '0:0:0:0:0:0:0:1',
    browserJavaEnabled: false,
    browserLanguage: 'zh-TW',
    browserColorDepth: '24',
    browserScreenHeight: '1080',
    browserScreenWidth: '1920',
    browserTZ: '-480',
    browserUserAgent: 'Mozilla/5.0',
    /** 與 SIM EPS `app.auth.expiryDate=3112` 對齊；3012 會被判 INVALID_CARD(06) */
    cardExpiryDate: '3112',
    acctInfo: { chAccAgeInd: '01' },
    acctNumber: params.cardNumber,
    acctID: 'F123**6789',
    cardholderName: 'K*********',
    deviceChannel: '02',
    dsReferenceNumber: 'DsReferenceNumber12837129312',
    dsTransID: uuid,
    dsURL: 'http://localhost:8020/api-proxy/challenge/2.3.1/001/rreq',
    mcc: params.mcc ?? '5661',
    merchantCountryCode: params.merchantCountryCode ?? '156',
    merchantName: params.merchantName ?? 'HiTRUST EMV Demo Merchant',
    messageCategory: '01',
    notificationURL: 'http://localhost:8040/cres',
    purchaseAmount: params.purchaseAmount ?? '100',
    purchaseCurrency: params.purchaseCurrency ?? '156',
    purchaseExponent: params.purchaseExponent ?? '2',
    purchaseDate,
    transType: '01',
    browserJavascriptEnabled: false
  }
}

export function buildCReqFormBody(acsTransID: string): string {
  const creq = {
    messageType: 'CReq',
    messageVersion: '2.2.0',
    threeDSServerTransID: generateUUID(),
    acsTransID
  }
  const json = JSON.stringify(creq)
  const base64Url = base64UrlEncode(json)
  return `creq=${encodeURIComponent(base64Url)}`
}

export function build3DSMethodFormData(
  threeDSServerTransID: string,
  notificationURL = 'http://localhost:8040/3dsmethod/notify'
): string {
  const json = {
    threeDSServerTransID,
    threeDSMethodNotificationURL: notificationURL
  }
  const base64Url = base64UrlEncode(JSON.stringify(json))
  return `threeDSMethodData=${encodeURIComponent(base64Url)}`
}

export function resolveUrl(baseUrl: string, path: string): string {
  const base = baseUrl.trim().replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}

/**
 * 將後端回傳的 challenge／creq URL 改寫為同源 Vite proxy。
 * Local：localhost:8050；Remote：demo／sim 的 /acs-auth-web/... 絕對網址。
 */
export function rewriteUrlForProxy(url: string): string {
  if (typeof window === 'undefined') return url
  const origin = window.location.origin
  try {
    const parsed = new URL(url)
    if (parsed.pathname.includes('/acs-auth-web') || parsed.pathname.includes('/acs-auth/')) {
      return `${origin}${parsed.pathname}${parsed.search}`
    }
  } catch {
    /* ignore invalid URL */
  }
  if (url.includes('http://localhost:8050')) {
    return url.replace(/http:\/\/localhost:8050/, origin)
  }
  if (url.includes('http://127.0.0.1:8050')) {
    return url.replace(/http:\/\/127\.0\.0\.1:8050/, origin)
  }
  return url
}

export type ThreeDSMethodOutcome = 'pass' | 'blocked'

/**
 * 判定 3DS Method collect 回應。
 * 限流後若 Status=END 會回成功快取頁（response.html，無指紋腳本），不可當 PASS。
 */
export function classifyThreeDSMethodResponse(
  status: number,
  text: string
): { outcome: ThreeDSMethodOutcome; reason: string } {
  const body = text ?? ''
  if (!body.trim()) {
    return { outcome: 'blocked', reason: 'empty' }
  }
  if (status === 403) {
    return { outcome: 'blocked', reason: 'HTTP 403' }
  }
  if (status >= 400) {
    return { outcome: 'blocked', reason: `HTTP ${status}` }
  }
  if (/error_3dsmethod|DDoS|Invalid ACS|Transaction ID Not Recognized|error-msg/i.test(body)) {
    return { outcome: 'blocked', reason: 'error page' }
  }
  const looksLikeCollect =
    /fingerprint2|Fingerprint2|diiaJsUrl|deviceAdvertisingId|deviceFingrprintLog|collect_diia/i.test(
      body
    )
  if (looksLikeCollect) {
    return { outcome: 'pass', reason: 'collect page' }
  }
  // response.html：限流 END 快取或完成頁（無指紋腳本）
  if (/threeDSMethodData/i.test(body) && /form1/i.test(body)) {
    return { outcome: 'blocked', reason: 'cached/response page' }
  }
  return { outcome: 'pass', reason: 'ok' }
}
