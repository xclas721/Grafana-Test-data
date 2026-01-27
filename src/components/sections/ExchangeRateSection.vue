<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
</script>

<template>
  <!-- 6.匯率信息 -->
  <section id="exchange-rate" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">6.匯率信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="exchangeRate"
          type="number"
          label="匯率 (exchangeRate)"
          :modelValue="'7.2244'"
          :step="'0.0001'"
        />
        <Input id="exchangeBase" label="基礎貨幣 (exchangeBase)" :modelValue="'USD'" />
        <Input id="exchangeTarget" label="目標貨幣 (exchangeTarget)" :modelValue="'CNY'" />
        <Input
          id="currencyCodeForRate"
          label="匯率貨幣代碼 (currencyCodeForRate)"
          :modelValue="'CNY'"
        />
      </div>
    </Card>
  </section>
</template>
