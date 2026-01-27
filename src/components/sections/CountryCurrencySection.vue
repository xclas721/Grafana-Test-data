<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
</script>

<template>
  <!-- 5.國家和貨幣信息 -->
  <section id="country-currency" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">5.國家和貨幣信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input id="countryAlpha2" label="國家代碼 (Alpha-2) (countryAlpha2)" :modelValue="'CN'" />
        <Input id="countryNumeric" label="國家代碼 (數字) (countryNumeric)" :modelValue="'156'" />
        <Input id="countryAlpha3" label="國家代碼 (Alpha-3) (countryAlpha3)" :modelValue="'CHN'" />
        <Input id="countryName" label="國家名稱 (英文) (countryName)" :modelValue="'China'" />
        <Input
          id="currencyMinorUnit"
          type="number"
          label="貨幣小數位數 (currencyMinorUnit)"
          :modelValue="'2'"
        />
        <Input
          id="currencyName"
          label="貨幣名稱 (英文) (currencyName)"
          :modelValue="'Yuan Renminbi'"
        />
        <Input
          id="currencyAlphabeticCode"
          label="貨幣代碼 (字母) (currencyAlphabeticCode)"
          :modelValue="'CNY'"
        />
        <Input
          id="currencyNumericCode"
          label="貨幣代碼 (數字) (currencyNumericCode)"
          :modelValue="'156'"
        />
      </div>
    </Card>
  </section>
</template>
