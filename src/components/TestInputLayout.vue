<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

// 判斷 DDoS 限流測試區塊是否應該展開
const isDDoSActive = () => {
  return route.path.startsWith('/rate-limit-test')
}

const ddosMenuItems = [
  { path: '/rate-limit-test/areq-card', label: 'AReq 卡號限流' },
  { path: '/rate-limit-test/areq-merchant', label: 'AReq 商戶限流' },
  { path: '/rate-limit-test/creq-checkpoint1', label: 'CReq 檢查點1' },
  { path: '/rate-limit-test/creq-checkpoint2', label: 'CReq 檢查點2' },
  { path: '/rate-limit-test/3dsmethod', label: '3DS Method 限流' }
]

// 判斷 Grafana Test Data 區塊是否應該展開
const isGrafanaActive = () => {
  return route.path === '/'
}

const props = defineProps<{
  activeMode: 'unified' | 'acs' | 'dss'
  batchCount?: number
  batchDays?: number
  disableBatchDays?: boolean
  scheduleEnabled?: boolean
  scheduleIntervalSeconds?: number
  nextRunInSeconds?: number
  scheduleRunning?: boolean
}>()

const emit = defineEmits<{
  (e: 'changeMode', mode: 'unified' | 'acs' | 'dss'): void
  (e: 'loadDefaults'): void
  (e: 'generateRandom'): void
  (e: 'insertData'): void
  (e: 'batchInsert'): void
  (e: 'update:batchCount', value: number): void
  (e: 'update:batchDays', value: number): void
  (e: 'update:scheduleEnabled', value: boolean): void
  (e: 'update:scheduleIntervalSeconds', value: number): void
  (e: 'startSchedule'): void
  (e: 'stopSchedule'): void
}>()

const isUnified = computed(() => props.activeMode === 'unified')
const isAcs = computed(() => props.activeMode === 'acs')
const isDss = computed(() => props.activeMode === 'dss')

const insertButtonText = computed(() => {
  if (isUnified.value) return '插入到 ACS & 3DSS'
  if (isAcs.value) return '插入到 ACS'
  return '插入到 3DSS'
})

const sectionIds = [
  'base-config',
  'transaction-id',
  'transaction-status',
  'merchant-info',
  'purchase-amount',
  'country-currency',
  'exchange-rate',
  'card-info',
  'three-ds-params',
  'performance',
  'error-handling'
]

let observer: IntersectionObserver | null = null

function setActiveLink(id: string) {
  const activeClasses = ['bg-neutral-focus', 'text-neutral-content']
  const inactiveClasses = ['text-neutral-content/80']
  for (const sid of sectionIds) {
    const link = document.querySelector(`a[href="#${sid}"]`) as HTMLAnchorElement | null
    if (!link) continue
    if (sid === id) {
      link.classList.add(...activeClasses)
      link.classList.remove(...inactiveClasses)
    } else {
      link.classList.remove(...activeClasses)
      link.classList.add(...inactiveClasses)
    }
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      const target = visible[0]?.target as HTMLElement | undefined
      if (target?.id) setActiveLink(target.id)
    },
    { rootMargin: '0px 0px -60% 0px', threshold: 0.1 }
  )
  for (const id of sectionIds) {
    const section = document.getElementById(id)
    if (section && observer) observer.observe(section)
  }
  const initial = window.location.hash?.replace('#', '')
  if (initial && sectionIds.includes(initial)) setActiveLink(initial)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div class="drawer lg:drawer-open min-h-screen bg-base-200">
    <input id="app-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
      <div class="navbar bg-base-100 border-b border-base-300 px-6">
        <div class="flex-1 flex-col items-start">
          <div class="text-xl font-bold text-base-content">Grafana Test Data</div>
          <div class="text-xs text-base-content/60">ACS / 3DSS 測試資料產生器</div>
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
        <div class="max-w-[1200px] mx-auto space-y-6">
          <div class="text-xs breadcrumbs text-base-content/60 mb-4">
            <ul>
              <li>工具</li>
              <li>測試資料產生</li>
            </ul>
          </div>
          <div class="sticky top-4 z-30">
            <div class="card bg-base-100 border border-base-300 shadow-sm">
              <div class="card-body p-4 md:p-5">
                <div class="flex flex-wrap items-center gap-2">
                  <label for="modeSelect" class="text-xs text-base-content/60">模式</label>
                  <select
                    id="modeSelect"
                    class="select select-bordered select-sm w-28"
                    :value="props.activeMode"
                    @change="
                      (event) =>
                        emit(
                          'changeMode',
                          (event.target as HTMLSelectElement).value as 'unified' | 'acs' | 'dss'
                        )
                    "
                  >
                    <option value="unified">統一模式</option>
                    <option value="acs">ACS 模式</option>
                    <option value="dss">3DSS 模式</option>
                  </select>
                  <button class="btn btn-sm" @click="emit('loadDefaults')">載入預設值</button>
                  <button class="btn btn-sm" @click="emit('generateRandom')">生成隨機數據</button>
                  <button class="btn btn-sm btn-primary" @click="emit('insertData')">
                    {{ insertButtonText }}
                  </button>
                  <div class="flex flex-wrap items-center gap-2 ml-auto">
                    <label for="batchCount" class="text-xs text-base-content/60">數量</label>
                    <input
                      type="number"
                      id="batchCount"
                      :value="props.batchCount ?? 10"
                      class="input input-bordered input-sm w-15"
                      placeholder="10"
                      @input="
                        (event) =>
                          emit(
                            'update:batchCount',
                            Math.max(1, Number((event.target as HTMLInputElement).value || 10))
                          )
                      "
                    />
                    <label for="batchDays" class="text-xs text-base-content/60">天數</label>
                    <input
                      type="number"
                      id="batchDays"
                      :value="props.batchDays ?? 1"
                      class="input input-bordered input-sm w-15"
                      placeholder="1"
                      :disabled="props.disableBatchDays"
                      :title="
                        props.disableBatchDays
                          ? '手動時間區間或自動POST時不使用天數'
                          : '生成多少天的數據'
                      "
                      @input="
                        (event) =>
                          emit(
                            'update:batchDays',
                            Math.max(0, Number((event.target as HTMLInputElement).value || 0))
                          )
                      "
                    />
                    <button class="btn btn-sm btn-success" @click="emit('batchInsert')">
                      批量生成並POST
                    </button>
                    <label class="text-xs text-base-content/60">自動POST</label>
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      :checked="props.scheduleEnabled"
                      @change="
                        (event) =>
                          emit('update:scheduleEnabled', (event.target as HTMLInputElement).checked)
                      "
                    />
                    <label for="scheduleIntervalSeconds" class="text-xs text-base-content/60"
                      >間隔(秒)</label
                    >
                    <input
                      type="number"
                      id="scheduleIntervalSeconds"
                      :value="props.scheduleIntervalSeconds ?? 60"
                      class="input input-bordered input-sm w-15"
                      min="1"
                      placeholder="60"
                      :disabled="!props.scheduleEnabled"
                      @input="
                        (event) =>
                          emit(
                            'update:scheduleIntervalSeconds',
                            Math.max(1, Number((event.target as HTMLInputElement).value || 1))
                          )
                      "
                    />
                    <button
                      class="btn btn-sm"
                      :class="props.scheduleRunning ? 'btn-error' : 'btn-accent'"
                      :disabled="!props.scheduleEnabled"
                      @click="props.scheduleRunning ? emit('stopSchedule') : emit('startSchedule')"
                    >
                      {{ props.scheduleRunning ? '停止自動' : '開始自動' }}
                    </button>
                    <span v-if="props.scheduleRunning" class="text-xs text-base-content/60">
                      下一次：{{ props.nextRunInSeconds ?? 0 }} 秒
                    </span>
                    <div class="mx-2 h-4 w-px bg-base-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <slot />
        </div>
      </main>
    </div>
    <div class="drawer-side z-40">
      <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <aside class="w-64 h-screen bg-neutral text-neutral-content flex flex-col">
        <div class="px-4 py-6 border-b border-neutral-focus">
          <div class="text-2xl font-bold tracking-wider">測試資料</div>
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
                    <a
                      href="#base-config"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>基礎配置</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#transaction-id"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>交易識別</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#transaction-status"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>交易狀態</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#merchant-info"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>商戶信息</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#purchase-amount"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>交易金額</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#country-currency"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>國家/貨幣</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#exchange-rate"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>匯率信息</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#card-info"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>卡片信息</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#three-ds-params"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>3DS 參數</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#performance"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>效能監控</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#error-handling"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>錯誤處理</span>
                    </a>
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
                  <li v-for="item in ddosMenuItems" :key="item.path">
                    <RouterLink
                      :to="item.path"
                      :class="{ active: route.path === item.path }"
                      class="flex items-center gap-2 rounded-lg transition-all text-sm"
                    >
                      <span>{{ item.label }}</span>
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
