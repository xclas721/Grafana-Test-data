<script setup lang="ts">
import { computed } from 'vue'
import { useApiConfigStore } from '@/stores/apiConfig'

const store = useApiConfigStore()

const proxyBadgeLabel = computed(() =>
  store.proxyEnv === 'remote' ? 'proxy: Remote' : 'proxy: Local'
)
</script>

<template>
  <div class="flex flex-col gap-1 w-full px-4 py-2">
    <div class="flex items-center gap-3 min-w-0">
      <span class="text-sm font-semibold shrink-0 text-base-content/80">API 網域</span>
      <span
        class="badge badge-sm shrink-0"
        :class="store.proxyEnv === 'remote' ? 'badge-warning text-warning-content' : 'badge-ghost'"
      >
        {{ proxyBadgeLabel }}
      </span>
      <span class="text-sm text-base-content/70 truncate">相對路徑 → 目前 Vite proxy</span>
    </div>
    <p
      v-if="store.proxyEnv === 'remote'"
      class="text-xs font-medium text-warning-content bg-warning px-2 py-1 rounded w-fit"
    >
      Remote：真 ACS／3DS API，不是灌 ES 假資料。
    </p>
  </div>
</template>
