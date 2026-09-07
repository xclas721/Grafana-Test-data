<script setup lang="ts">
import { computed } from 'vue'
import { useApiConfigStore } from '@/stores/apiConfig'
import Input from '@/shared/components/Input.vue'

const store = useApiConfigStore()

const summaryText = computed(() => {
  const a = store.acsAuthBaseTrimmed
  const w = store.acsAuthWebBaseTrimmed
  if (!a && !w) return '相對路徑 → 目前 Vite proxy'
  const parts: string[] = []
  if (a) parts.push(`acs-auth: ${a}`)
  if (w) parts.push(`acs-auth-web: ${w}`)
  return parts.join('  |  ')
})

const proxyBadgeLabel = computed(() =>
  store.proxyEnv === 'remote' ? 'proxy: Remote' : 'proxy: Local'
)
</script>

<template>
  <div class="flex flex-col gap-1 w-full px-4 py-2">
    <div class="flex items-center justify-between gap-4 w-full">
      <div class="flex items-center gap-3 min-w-0">
        <span class="text-sm font-semibold shrink-0 text-base-content/80">API 網域</span>
        <span
          class="badge badge-sm shrink-0"
          :class="
            store.proxyEnv === 'remote' ? 'badge-warning text-warning-content' : 'badge-ghost'
          "
        >
          {{ proxyBadgeLabel }}
        </span>
        <span class="text-sm text-base-content/70 truncate">{{ summaryText }}</span>
      </div>
      <div class="dropdown dropdown-end shrink-0">
        <label tabindex="0" class="btn btn-primary btn-sm gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          設定
        </label>
        <div
          tabindex="0"
          class="dropdown-content z-50 w-96 p-4 bg-base-100 rounded-box shadow-lg border border-base-300 mt-2"
        >
          <div class="space-y-3">
            <p class="text-xs text-base-content/60">
              一般留空，走 Vite proxy。只有要直打某個 origin 才填（可能遇 CORS）。
            </p>
            <Input
              v-model="store.acsAuthBase"
              label="acs-auth"
              placeholder="例如 http://localhost:30100"
              class="text-sm"
            />
            <Input
              v-model="store.acsAuthWebBase"
              label="acs-auth-web"
              placeholder="例如 http://localhost:8050"
              class="text-sm"
            />
            <div class="flex gap-2">
              <button type="button" class="btn btn-ghost btn-sm" @click="store.useProxyPaths">
                清空（走 Vite proxy）
              </button>
              <button type="button" class="btn btn-ghost btn-sm" @click="store.loadDefaults">
                還原 .env 預設
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p
      v-if="store.proxyEnv === 'remote'"
      class="text-xs font-medium text-warning-content bg-warning px-2 py-1 rounded w-fit"
    >
      Remote：真 ACS／3DS API，不是灌 ES 假資料。
    </p>
  </div>
</template>
