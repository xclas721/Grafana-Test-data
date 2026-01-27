<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import Select, { type SelectOption } from '@/shared/components/Select.vue'

const cardSchemeOptions: SelectOption[] = [
  { value: 'V', label: 'V - Visa' },
  { value: 'M', label: 'M - Mastercard' },
  { value: 'J', label: 'J - JCB' },
  { value: 'A', label: 'A - American Express' },
  { value: 'C', label: 'C - UnionPay' },
  { value: 'P', label: 'P - PayNet' },
  { value: 'S', label: 'S - Saudi MADA' },
  { value: 'E', label: 'E - EftPos' },
  { value: 'U', label: 'U - EMVLab' }
]

const mastercardDecisionOptions: SelectOption[] = [
  { value: 'Not Low Risk', label: 'Not Low Risk' },
  { value: 'Low Risk', label: 'Low Risk' }
]
</script>

<template>
  <!-- 7.卡片信息 -->
  <section id="card-info" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">7.卡片信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          id="cardScheme"
          label="卡片組織 (cardScheme)"
          :modelValue="'V'"
          :options="cardSchemeOptions"
          required
        />
        <div>
          <Input
            id="acctNumber"
            label="帳號原始值 (acctNumber)"
            :modelValue="'4143520000000123'"
            :maxlength="19"
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableAcctNumberRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enableAcctNumberRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">此欄位不會 POST 出去，僅用於自動生成其他欄位</p>
          <p class="text-xs text-error mt-1">Visa: 4143520000000000~4143529999999999</p>
          <p class="text-xs text-error mt-1">MasterCard: 5153520000000000~5153529999999999</p>
        </div>
        <div>
          <Input
            id="cardbin6"
            label="卡片 BIN (6位) (cardbin6)"
            :modelValue="'414352'"
            :maxlength="6"
            required
            :disabled="true"
          />
          <p class="text-xs text-base-content/60 mt-1">自動從帳號原始值前6碼生成</p>
        </div>
        <div>
          <Input
            id="acctNumberHashed"
            label="帳號雜湊值 (acctNumberHashed)"
            :modelValue="'2hpBkDB7ELbcpebGl5RM+HWTQGx3qciOwskcbsEVKC4='"
            :disabled="true"
          />
          <p class="text-xs text-base-content/60 mt-1">
            自動從帳號原始值計算 (HMAC-SHA256 + Base64)
          </p>
        </div>
        <div>
          <Input
            id="acctNumberMask"
            label="帳號遮罩 (acctNumberMask)"
            :modelValue="'414352******0123'"
            :disabled="true"
          />
          <p class="text-xs text-base-content/60 mt-1">
            自動從帳號原始值生成（前6碼+******+後4碼）
          </p>
        </div>
        <div>
          <Input
            id="cardbin8"
            label="卡片 BIN (8位) (cardbin8)"
            :modelValue="'41435200'"
            :maxlength="8"
            required
            :disabled="true"
          />
          <p class="text-xs text-base-content/60 mt-1">自動從帳號原始值前8碼生成</p>
        </div>

        <!-- 卡片組織擴展內容（Visa / Mastercard）-->
        <Input
          id="visaDafMessageExtension"
          label="Visa DAF 訊息擴展 (visaDafMessageExtension)"
          :modelValue="'null'"
        />
        <div class="md:col-span-2">
          <label class="label">
            <span class="label-text">Mastercard 訊息擴展 (mastercardMessageExtension)</span>
          </label>
          <div class="flex items-center gap-2 mb-3">
            <input type="checkbox" id="enableMastercardExtension" class="checkbox checkbox-sm" />
            <label for="enableMastercardExtension" class="text-sm text-base-content/60">
              啟用 Mastercard 訊息擴展
            </label>
          </div>
          <div
            id="mastercardExtensionContainer"
            class="rounded-md border border-base-300 bg-base-200 p-4"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                id="mastercardScore"
                type="number"
                label="Score (0-650)"
                :modelValue="'600'"
                :min="'0'"
                :max="'650'"
              />
              <Select
                id="mastercardDecision"
                label="Decision"
                :modelValue="'Not Low Risk'"
                :options="mastercardDecisionOptions"
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                id="mastercardReasonCode1"
                label="Reason Code 1"
                :modelValue="'A'"
                :maxlength="1"
              />
              <Input
                id="mastercardReasonCode2"
                label="Reason Code 2"
                :modelValue="''"
                :maxlength="1"
              />
            </div>
            <Input id="mastercardStatus" label="Status" :modelValue="'success'" />
            <div class="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                id="enableMastercardExtensionRandom"
                class="checkbox checkbox-sm"
              />
              <label for="enableMastercardExtensionRandom" class="text-sm text-base-content/60">
                隨機生成時包含此欄位
              </label>
            </div>
            <p class="text-xs text-error mt-2">可隨機生成：Score、Decision，其他欄位保持預設值</p>
          </div>
        </div>
        <div>
          <Input
            id="visaRiskBasedAuthenticationScore"
            type="number"
            label="Visa 風險基礎認證分數 (visaRiskBasedAuthenticationScore)"
            :modelValue="''"
            :min="'0'"
            :max="'99'"
            placeholder="留空為 NULL"
          />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="enableVisaScoreRandom" class="checkbox checkbox-sm" />
            <label for="enableVisaScoreRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (0-99)，留空為 NULL</p>
        </div>
      </div>
    </Card>
  </section>
</template>
