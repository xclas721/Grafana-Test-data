<script setup lang="ts">
type LogType = 'success' | 'error' | 'info' | 'warning'

function qs<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null
}

function setText(id: string, text: string) {
  const el = qs<HTMLElement>(id)
  if (el) el.textContent = text
}

function setProgress(
  current: number,
  total: number,
  success: number,
  error: number,
  startTime?: number
) {
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
      badge.classList.remove('hidden')
    } else {
      badge.classList.add('hidden')
    }
  }
}

function addLog(type: LogType, message: string) {
  const logs = qs<HTMLDivElement>('logEntries')
  if (!logs) return
  const entry = document.createElement('div')
  const color =
    type === 'success'
      ? 'text-success'
      : type === 'error'
        ? 'text-error'
        : type === 'warning'
          ? 'text-warning'
          : 'text-info'
  entry.className = `text-xs ${color}`
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
  logs.appendChild(entry)
  logs.scrollTop = logs.scrollHeight
}

function setErrors(errors: string[]) {
  const container = qs<HTMLDivElement>('errorDetails')
  const list = qs<HTMLDivElement>('errorList')
  if (!container || !list) return
  if (!errors.length) {
    container.classList.add('hidden')
    return
  }
  list.innerHTML = ''
  for (const e of errors) {
    const item = document.createElement('div')
    item.className = 'text-xs text-error'
    item.textContent = e
    list.appendChild(item)
  }
  container.classList.remove('hidden')
}

function show(statusText: string, total: number) {
  const panel = qs<HTMLDivElement>('notificationPanel')
  const mini = qs<HTMLDivElement>('minimizedNotification')
  if (panel && mini) {
    panel.classList.remove('hidden')
    mini.classList.add('hidden')
  }
  setText('progressStatus', statusText)
  setProgress(0, total, 0, 0, Date.now())
}

function close() {
  const panel = qs<HTMLDivElement>('notificationPanel')
  const mini = qs<HTMLDivElement>('minimizedNotification')
  if (panel && mini) {
    panel.classList.add('hidden')
    mini.classList.add('hidden')
  }
}

function minimize() {
  const panel = qs<HTMLDivElement>('notificationPanel')
  const mini = qs<HTMLDivElement>('minimizedNotification')
  if (panel && mini) {
    panel.classList.add('hidden')
    mini.classList.remove('hidden')
  }
}

function restore() {
  const panel = qs<HTMLDivElement>('notificationPanel')
  const mini = qs<HTMLDivElement>('minimizedNotification')
  if (panel && mini) {
    panel.classList.remove('hidden')
    mini.classList.add('hidden')
  }
}

defineExpose({ setProgress, addLog, setErrors, show, close, minimize, restore, setText })
</script>

<template>
  <div>
    <!-- 批量進度面板 -->
    <div id="notificationPanel" class="fixed bottom-4 right-4 z-50 w-[360px] max-w-[90vw] hidden">
      <div class="card bg-base-100 border border-base-300 shadow-lg">
        <div class="card-body p-4">
          <div class="flex items-center justify-between gap-2">
            <div class="text-sm font-semibold">批量操作進度</div>
            <div class="flex items-center gap-1">
              <button class="btn btn-ghost btn-xs" title="最小化" @click="minimize">−</button>
              <button class="btn btn-ghost btn-xs" title="關閉" @click="close">×</button>
            </div>
          </div>
          <div class="mt-3 space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span id="progressStatus" class="text-base-content/70">準備中...</span>
              <span id="progressCount" class="font-mono">0 / 0</span>
            </div>
            <div class="w-full rounded-full bg-base-300 h-3 overflow-hidden">
              <div
                id="progressBar"
                class="h-3 bg-primary text-[10px] text-primary-content text-center"
                style="width: 0%"
              >
                0%
              </div>
            </div>
            <div class="grid grid-cols-4 gap-2 text-center">
              <div class="rounded-md bg-base-200 py-2">
                <div class="text-sm font-semibold" id="successCount">0</div>
                <div class="text-[11px] text-base-content/60">成功</div>
              </div>
              <div class="rounded-md bg-base-200 py-2">
                <div class="text-sm font-semibold" id="errorCount">0</div>
                <div class="text-[11px] text-base-content/60">失敗</div>
              </div>
              <div class="rounded-md bg-base-200 py-2">
                <div class="text-sm font-semibold" id="totalCount">0</div>
                <div class="text-[11px] text-base-content/60">總計</div>
              </div>
              <div class="rounded-md bg-base-200 py-2">
                <div class="text-sm font-semibold" id="elapsedTime">0s</div>
                <div class="text-[11px] text-base-content/60">耗時</div>
              </div>
            </div>
            <div class="border-t border-base-300 pt-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold">操作日誌</span>
                <button
                  class="btn btn-ghost btn-xs"
                  @click="
                    () => {
                      const lc = qs<HTMLDivElement>('logContent')
                      if (!lc) return
                      lc.style.display = lc.style.display === 'none' ? 'block' : 'none'
                    }
                  "
                >
                  展開/收起
                </button>
              </div>
              <div id="logContent" class="mt-2 hidden">
                <div
                  id="logEntries"
                  class="max-h-40 overflow-y-auto space-y-1 text-xs text-base-content/70"
                ></div>
              </div>
            </div>
            <div id="errorDetails" class="hidden">
              <div class="text-xs font-semibold text-error">錯誤詳情</div>
              <div id="errorList" class="mt-2 space-y-1 text-xs text-error"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最小化通知 -->
    <div id="minimizedNotification" class="fixed bottom-4 right-4 z-50 hidden" @click="restore">
      <div class="btn btn-circle btn-sm btn-warning relative">
        !
        <div id="minimizedBadge" class="badge badge-error badge-xs absolute -top-1 -right-1 hidden">
          0
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
