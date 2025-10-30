<script setup lang="ts">
type LogType = 'success' | 'error' | 'info' | 'warning'

function qs<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null
}

function setText(id: string, text: string) {
  const el = qs<HTMLElement>(id)
  if (el) el.textContent = text
}

function setProgress(current: number, total: number, success: number, error: number, startTime?: number) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const bar = qs<HTMLDivElement>('progressBar')
  if (bar) {
    bar.style.width = `${pct}%`
    bar.textContent = `${pct}%`
  }
  setText('progressCount', `${current} / ${total}`)
  setText('successCount', String(success))
  setText('errorCount', String(error))
  setText('totalCount', String(total))
  if (startTime) {
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    setText('elapsedTime', `${elapsed}s`)
  }
  // 更新最小化徽章
  const mini = qs<HTMLDivElement>('minimizedNotification')
  const badge = qs<HTMLDivElement>('minimizedBadge')
  if (mini && badge) {
    if (error > 0) {
      badge.textContent = String(error)
      badge.style.display = 'flex'
    } else {
      badge.style.display = 'none'
    }
  }
}

function addLog(type: LogType, message: string) {
  const logs = qs<HTMLDivElement>('logEntries')
  if (!logs) return
  const entry = document.createElement('div')
  entry.className = `log-entry ${type}`
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
  logs.appendChild(entry)
  logs.scrollTop = logs.scrollHeight
}

function setErrors(errors: string[]) {
  const container = qs<HTMLDivElement>('errorDetails')
  const list = qs<HTMLDivElement>('errorList')
  if (!container || !list) return
  if (!errors.length) {
    container.style.display = 'none'
    return
  }
  list.innerHTML = ''
  for (const e of errors) {
    const item = document.createElement('div')
    item.className = 'error-item'
    item.textContent = e
    list.appendChild(item)
  }
  container.style.display = 'block'
}

function show(statusText: string, total: number) {
  const panel = qs<HTMLDivElement>('notificationPanel')
  const mini = qs<HTMLDivElement>('minimizedNotification')
  if (panel && mini) {
    panel.style.display = 'block'
    mini.style.display = 'none'
  }
  setText('progressStatus', statusText)
  setProgress(0, total, 0, 0, Date.now())
}

function close() {
  const panel = qs<HTMLDivElement>('notificationPanel')
  const mini = qs<HTMLDivElement>('minimizedNotification')
  if (panel && mini) {
    panel.style.display = 'none'
    mini.style.display = 'none'
  }
}

function minimize() {
  const panel = qs<HTMLDivElement>('notificationPanel')
  const mini = qs<HTMLDivElement>('minimizedNotification')
  if (panel && mini) {
    panel.style.display = 'none'
    mini.style.display = 'flex'
  }
}

function restore() {
  const panel = qs<HTMLDivElement>('notificationPanel')
  const mini = qs<HTMLDivElement>('minimizedNotification')
  if (panel && mini) {
    panel.style.display = 'block'
    mini.style.display = 'none'
  }
}

defineExpose({ setProgress, addLog, setErrors, show, close, minimize, restore, setText })
</script>

<template>
  <div>
    <!-- 增強的通知面板 -->
    <div id="notificationPanel" class="notification-panel">
      <div class="notification-header">
        <div class="notification-title">批量操作進度</div>
        <button class="notification-minimize" title="最小化" @click="minimize">−</button>
        <button class="notification-close" title="關閉" @click="close">×</button>
      </div>
      <div class="notification-content">
        <div class="progress-section">
          <div class="progress-text">
            <span id="progressStatus">準備中...</span>
            <span id="progressCount">0 / 0</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" id="progressBar" style="width: 0%">0%</div>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number" id="successCount">0</div>
              <div class="stat-label">成功</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="errorCount">0</div>
              <div class="stat-label">失敗</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="totalCount">0</div>
              <div class="stat-label">總計</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="elapsedTime">0s</div>
              <div class="stat-label">耗時</div>
            </div>
          </div>
        </div>
        <div class="log-section">
          <div class="log-header">
            <span>操作日誌</span>
            <button class="log-toggle" @click="() => { const lc = qs<HTMLDivElement>('logContent'); if (!lc) return; lc.style.display = lc.style.display === 'none' ? 'block' : 'none' }">展開/收起</button>
          </div>
          <div class="log-content" id="logContent" style="display: none">
            <div id="logEntries"></div>
          </div>
        </div>
        <div id="errorDetails" class="error-details" style="display: none">
          <div class="error-summary">錯誤詳情</div>
          <div class="error-list" id="errorList"></div>
        </div>
      </div>
    </div>

    <!-- 最小化的通知 -->
    <div id="minimizedNotification" class="notification-minimized" style="display: none" @click="restore">
      <span id="minimizedText">!</span>
      <div class="badge" id="minimizedBadge">0</div>
    </div>
  </div>
</template>

<style scoped></style>


