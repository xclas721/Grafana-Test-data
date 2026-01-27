<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  activeMode: 'unified' | 'acs' | 'dss'
  batchCount?: number
  batchDays?: number
}>()

const emit = defineEmits<{
  (e: 'changeMode', mode: 'unified' | 'acs' | 'dss'): void
  (e: 'loadDefaults'): void
  (e: 'generateRandom'): void
  (e: 'insertData'): void
  (e: 'batchInsert'): void
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
          <div class="card bg-base-100 border border-base-300 shadow-sm">
            <div class="card-body p-4 md:p-5">
              <div class="flex flex-wrap items-center gap-2">
                <div class="join">
                  <button
                    id="unifiedMode"
                    class="btn btn-sm join-item"
                    :class="{ 'btn-primary': isUnified }"
                    @click="emit('changeMode', 'unified')"
                  >
                    統一模式
                  </button>
                  <button
                    id="acsMode"
                    class="btn btn-sm join-item"
                    :class="{ 'btn-primary': isAcs }"
                    @click="emit('changeMode', 'acs')"
                  >
                    ACS 模式
                  </button>
                  <button
                    id="dssMode"
                    class="btn btn-sm join-item"
                    :class="{ 'btn-primary': isDss }"
                    @click="emit('changeMode', 'dss')"
                  >
                    3DSS 模式
                  </button>
                </div>
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
                    min="1"
                    max="100000"
                    class="input input-bordered input-sm w-24"
                    placeholder="10"
                    @input="emit('changeMode', activeMode)"
                  />
                  <label for="batchDays" class="text-xs text-base-content/60">天數</label>
                  <input
                    type="number"
                    id="batchDays"
                    :value="props.batchDays ?? 1"
                    min="1"
                    max="30"
                    class="input input-bordered input-sm w-20"
                    placeholder="1"
                    title="生成多少天的數據"
                  />
                  <button class="btn btn-sm btn-success" @click="emit('batchInsert')">
                    批量生成並POST
                  </button>
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
          <div class="text-xs text-neutral-content/60">快速導覽</div>
          <ul class="menu gap-1 mt-2">
            <li>
              <a
                href="#base-config"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                基礎配置
              </a>
            </li>
            <li>
              <a
                href="#transaction-id"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                交易識別
              </a>
            </li>
            <li>
              <a
                href="#transaction-status"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                交易狀態
              </a>
            </li>
            <li>
              <a
                href="#merchant-info"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                商戶信息
              </a>
            </li>
            <li>
              <a
                href="#purchase-amount"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                交易金額
              </a>
            </li>
            <li>
              <a
                href="#country-currency"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                國家/貨幣
              </a>
            </li>
            <li>
              <a
                href="#exchange-rate"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                匯率信息
              </a>
            </li>
            <li>
              <a
                href="#card-info"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                卡片信息
              </a>
            </li>
            <li>
              <a
                href="#three-ds-params"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                3DS 參數
              </a>
            </li>
            <li>
              <a
                href="#performance"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                效能監控
              </a>
            </li>
            <li>
              <a
                href="#error-handling"
                class="quick-link text-neutral-content/80 hover:bg-neutral-focus/60 hover:text-neutral-content"
              >
                錯誤處理
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  </div>
</template>

<style scoped></style>
