<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'

const props = defineProps<{
  countryAlpha2: string
  countryNumeric: string
  countryAlpha3: string
  countryName: string
  currencyMinorUnit: string
  currencyName: string
  currencyAlphabeticCode: string
  currencyNumericCode: string
}>()

const emit = defineEmits<{
  'update:countryAlpha2': [value: string]
  'update:countryNumeric': [value: string]
  'update:countryAlpha3': [value: string]
  'update:countryName': [value: string]
  'update:currencyMinorUnit': [value: string]
  'update:currencyName': [value: string]
  'update:currencyAlphabeticCode': [value: string]
  'update:currencyNumericCode': [value: string]
}>()
</script>

<template>
  <!-- 5.國家和貨幣信息 -->
  <section id="country-currency" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">5.國家和貨幣信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          id="countryAlpha2"
          label="國家代碼 (Alpha-2) (countryAlpha2)"
          :modelValue="props.countryAlpha2"
          @update:modelValue="(value) => emit('update:countryAlpha2', String(value))"
        />
        <Input
          id="countryNumeric"
          label="國家代碼 (數字) (countryNumeric)"
          :modelValue="props.countryNumeric"
          @update:modelValue="(value) => emit('update:countryNumeric', String(value))"
        />
        <Input
          id="countryAlpha3"
          label="國家代碼 (Alpha-3) (countryAlpha3)"
          :modelValue="props.countryAlpha3"
          @update:modelValue="(value) => emit('update:countryAlpha3', String(value))"
        />
        <Input
          id="countryName"
          label="國家名稱 (英文) (countryName)"
          :modelValue="props.countryName"
          @update:modelValue="(value) => emit('update:countryName', String(value))"
        />
        <Input
          id="currencyMinorUnit"
          type="number"
          label="貨幣小數位數 (currencyMinorUnit)"
          :modelValue="props.currencyMinorUnit"
          @update:modelValue="(value) => emit('update:currencyMinorUnit', String(value))"
        />
        <Input
          id="currencyName"
          label="貨幣名稱 (英文) (currencyName)"
          :modelValue="props.currencyName"
          @update:modelValue="(value) => emit('update:currencyName', String(value))"
        />
        <Input
          id="currencyAlphabeticCode"
          label="貨幣代碼 (字母) (currencyAlphabeticCode)"
          :modelValue="props.currencyAlphabeticCode"
          @update:modelValue="(value) => emit('update:currencyAlphabeticCode', String(value))"
        />
        <Input
          id="currencyNumericCode"
          label="貨幣代碼 (數字) (currencyNumericCode)"
          :modelValue="props.currencyNumericCode"
          @update:modelValue="(value) => emit('update:currencyNumericCode', String(value))"
        />
      </div>
    </Card>
  </section>
</template>
