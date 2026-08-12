import { reactive, ref } from 'vue'
import { generateUUID } from '@/shared/utils/ddos-utils'

export type DDoSLogType = 'success' | 'error' | 'warning' | 'info'

export type DDoSLogEntry = {
  id: string
  time: string
  type: DDoSLogType
  message: string
  details?: string
}

export type DDoSStats = {
  successCount: number
  rateLimitCount: number
  otherErrorCount: number
}

const LOG_CLASS: Record<DDoSLogType, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info'
}

/**
 * DDoS 限流頁共用：stats／logs／isTesting／shouldStop。
 * 各場景頁只保留 config 與請求迴圈。
 */
export function useDDoSTestRunner() {
  const isTesting = ref(false)
  const shouldStop = ref(false)
  const stats = reactive<DDoSStats>({
    successCount: 0,
    rateLimitCount: 0,
    otherErrorCount: 0
  })
  const logs = ref<DDoSLogEntry[]>([])

  function addLog(type: DDoSLogType, message: string, details?: string) {
    logs.value.push({
      id: generateUUID(),
      time: new Date().toLocaleTimeString('zh-TW'),
      type,
      message,
      details
    })
    setTimeout(() => {
      if (typeof document === 'undefined') return
      document.getElementById('log-container')?.scrollTo({ top: 1e9 })
    }, 10)
  }

  function getLogClass(type: DDoSLogType): string {
    return LOG_CLASS[type]
  }

  /** 開始測試前重置計數與日誌 */
  function beginTest() {
    stats.successCount = 0
    stats.rateLimitCount = 0
    stats.otherErrorCount = 0
    logs.value = []
    shouldStop.value = false
    isTesting.value = true
  }

  function endTest() {
    isTesting.value = false
    shouldStop.value = false
  }

  function stopTest() {
    shouldStop.value = true
  }

  /** 僅清日誌並寫入一則訊息（例如參數驗證失敗、尚未開始測試） */
  function clearLogsAndAdd(type: DDoSLogType, message: string) {
    logs.value = []
    addLog(type, message)
  }

  return {
    isTesting,
    shouldStop,
    stats,
    logs,
    addLog,
    getLogClass,
    beginTest,
    endTest,
    stopTest,
    clearLogsAndAdd
  }
}
