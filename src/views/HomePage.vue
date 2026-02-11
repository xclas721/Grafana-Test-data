<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="card bg-base-100 border border-base-300 shadow-sm">
    <div class="card-body">
      <h1 class="card-title text-2xl">Grafana 測試工具</h1>
      <p class="text-base-content/70 mb-4">本工具提供以下功能：</p>
      <ul class="list-disc list-inside space-y-2 text-base-content/80 mb-6">
        <li><strong>測試資料產生</strong> — ACS / 3DSS 測試資料產生器</li>
        <li><strong>DDoS 限流測試</strong> — AReq / CReq / 3DS Method 限流驗證</li>
      </ul>
      <div class="flex flex-wrap gap-4">
        <RouterLink to="/test-data" class="btn btn-primary">測試資料產生</RouterLink>
        <RouterLink to="/rate-limit-test" class="btn btn-outline">DDoS 限流測試</RouterLink>
      </div>
    </div>
  </div>
</template>
