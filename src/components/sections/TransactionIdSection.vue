<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
</script>

<template>
  <!-- 交易識別（節錄核心欄位，其餘區塊將續移植） -->
  <section id="transaction-id" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">1.交易識別</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="issuerOid"
          label="發卡機構 OID (issuerOid)"
          :modelValue="'06b4b203-da05-73f9-256f-454929df6076'"
          required
        />
        <div>
          <Input
            id="acsTransId"
            label="ACS 交易 ID (acsTransID)"
            :modelValue="'17616cb5-96d5-42cb-990a-08b28ff72874'"
            required
          />
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
        <div>
          <Input
            id="threeDSServerTransId"
            label="3DS Server 交易 ID (threeDSServerTransID)"
            :modelValue="'79c42c48-b25a-49f1-a791-fb45123cd944'"
            required
          />
          <p class="text-xs text-error mt-1">可隨機生成</p>
        </div>
      </div>
    </Card>
  </section>
</template>
