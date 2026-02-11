<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import ApiConfigBar from './components/ApiConfigBar.vue'

const route = useRoute()

const menuItems = [
  {
    path: '/rate-limit-test/areq-card',
    label: 'AReq 卡號限流',
    hint: '每張卡前 5 次通過，第 6 次起限流'
  },
  {
    path: '/rate-limit-test/areq-merchant',
    label: 'AReq 商戶限流',
    hint: '前 360 次通過，第 361 次起限流'
  },
  {
    path: '/rate-limit-test/creq-checkpoint1',
    label: 'CReq 檢查點1',
    hint: '進入 blocked 後持續 blocked'
  },
  {
    path: '/rate-limit-test/creq-checkpoint2',
    label: 'CReq 檢查點2',
    hint: '觀察 PASS → BLOCKED 過渡'
  },
  {
    path: '/rate-limit-test/3dsmethod',
    label: '3DS Method 限流',
    hint: '前 5 次通過，第 6 次起限流'
  }
]
</script>

<template>
  <div class="drawer lg:drawer-open min-h-screen bg-base-200">
    <input id="ddos-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
      <div class="navbar bg-base-100 border-b border-base-300 px-6">
        <div class="flex-1 flex-col items-start">
          <div class="text-xl font-bold text-base-content">DDoS 限流測試</div>
          <div class="text-xs text-base-content/60">AReq / CReq / 3DS Method</div>
        </div>
        <div class="flex-none flex items-center gap-4">
          <label for="ddos-drawer" class="btn btn-square btn-ghost lg:hidden">
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
      <div class="bg-info/15 border-b border-base-300 flex items-stretch">
        <ApiConfigBar />
      </div>
      <main class="flex-1 p-6 bg-base-200/60 min-h-0">
        <div class="max-w-[1400px] mx-auto">
          <RouterView />
        </div>
      </main>
    </div>
    <div class="drawer-side z-40">
      <label for="ddos-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <aside class="w-64 h-screen bg-neutral text-neutral-content flex flex-col">
        <div class="px-4 py-6 border-b border-neutral-focus">
          <div class="text-2xl font-bold tracking-wider">測試工具</div>
          <div class="text-xs text-neutral-content/60 mt-1">DDoS 限流</div>
        </div>
        <nav class="flex-1 overflow-y-auto p-4 pr-2">
          <ul
            class="menu gap-1 [&_a.active]:bg-neutral-focus [&_a.active]:text-neutral-content"
          >
            <li>
              <RouterLink
                to="/"
                :class="{ active: route.path === '/' }"
                class="flex items-center gap-2 rounded-lg transition-all text-sm"
              >
                測試資料產生
              </RouterLink>
            </li>
            <li class="mt-2 pt-2 border-t border-neutral-focus/50">
              <span class="text-neutral-content/60 text-xs px-2">DDoS 限流測試</span>
            </li>
            <li v-for="item in menuItems" :key="item.path">
              <RouterLink
                :to="item.path"
                :class="{ active: route.path === item.path }"
                class="flex flex-col gap-0.5 rounded-lg transition-all text-sm py-2 px-3"
              >
                <span>{{ item.label }}</span>
                <span v-if="item.hint" class="text-xs text-neutral-content/60 font-normal">{{ item.hint }}</span>
              </RouterLink>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  </div>
</template>
