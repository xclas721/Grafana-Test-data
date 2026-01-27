<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import Select, { type SelectOption } from '@/shared/components/Select.vue'

const timezoneOptions: SelectOption[] = [
  { value: 'browser', label: '瀏覽器時區 (自動檢測)' },
  { value: 'Asia/Taipei', label: '台灣 (UTC+8)' },
  { value: 'Asia/Shanghai', label: '中國 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '日本 (UTC+9)' },
  { value: 'Asia/Seoul', label: '韓國 (UTC+9)' },
  { value: 'Asia/Singapore', label: '新加坡 (UTC+8)' },
  { value: 'Asia/Hong_Kong', label: '香港 (UTC+8)' },
  { value: 'America/New_York', label: '美國東部 (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: '美國西部 (UTC-8/-7)' },
  { value: 'Europe/London', label: '英國 (UTC+0/+1)' },
  { value: 'Europe/Paris', label: '法國 (UTC+1/+2)' },
  { value: 'Australia/Sydney', label: '澳洲東部 (UTC+10/+11)' },
  { value: 'UTC', label: 'UTC (UTC+0)' }
]
</script>

<template>
  <!-- 基礎配置 -->
  <section id="base-config" class="scroll-mt-24">
    <Card>
      <div class="flex items-center gap-2 mb-4">
        <h3 class="text-base font-semibold text-base-content/80">基礎配置</h3>
        <span id="modeIndicator" class="mode-indicator unified">統一</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            id="baseUrl"
            type="url"
            label="Elasticsearch URL (base_url)"
            :modelValue="'http://localhost:9200'"
            required
          />
          <p class="text-xs text-base-content/60 mt-1">Elasticsearch 服務地址</p>
        </div>
        <Input id="username" label="用戶名 (username)" :modelValue="'elastic'" required />
        <Input
          id="password"
          type="password"
          label="密碼 (password)"
          :modelValue="'123456'"
          required
        />
        <div>
          <Input id="currentDate" type="date" label="當前日期 (current_date)" required />
          <p class="text-xs text-base-content/60 mt-1">交易日期 (YYYY-MM-DD-HH:MM:SS)</p>
          <p class="text-xs text-error mt-1">
            HH:MM:SS將自動生成隨機時間，並依據時區轉換為 UTC 時間，根據UTC時間決定儲存的索引名稱
          </p>
        </div>
        <div>
          <Select
            id="timezone"
            label="時區 (timezone)"
            :modelValue="'browser'"
            :options="timezoneOptions"
            required
          />
          <p class="text-xs text-base-content/60 mt-1">選擇時區用於時間轉換，預設使用瀏覽器時區</p>
        </div>
        <div>
          <label class="label">
            <span class="label-text">UTC時間區間 (Time Range)</span>
          </label>
          <div id="timeRangeDisplay" class="rounded-md bg-base-200 px-3 py-2">
            <span id="timeRangeText" class="text-base-content/60">請選擇日期</span>
          </div>
        </div>
      </div>
    </Card>
  </section>
</template>
