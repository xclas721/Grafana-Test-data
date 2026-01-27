<script setup lang="ts">
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
</script>

<template>
  <!-- 9.效能監控 -->
  <section id="performance" class="scroll-mt-24">
    <Card>
      <h3 class="text-base font-semibold text-base-content/80 mb-3">9.效能監控</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="performancePath"
          label="Areq URL (performancePath)"
          :modelValue="'/acs-auth/auth/V/2.2.0/ed8544c4-fc50-289d-ee05-ee41c86bb6f5/001/areq'"
        />
        <div>
          <Input
            id="execTime"
            type="number"
            label="AReq 執行時間 (毫秒) (AReq execTime)"
            :modelValue="'5437'"
            required
          />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" id="enableExecTimeRandom" class="checkbox checkbox-sm" checked />
            <label for="enableExecTimeRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (1000-6000ms)，預設開啟</p>
        </div>
        <div>
          <Input
            id="creqExecTime"
            type="number"
            label="CReq 執行時間 (毫秒) (CReq execTime)"
            :modelValue="'500'"
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableCreqExecTimeRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enableCreqExecTimeRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (300-800ms)，預設開啟</p>
        </div>
        <div>
          <Input
            id="rreqExecTime"
            type="number"
            label="RReq 執行時間 (毫秒) (RReq execTime)"
            :modelValue="'400'"
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableRreqExecTimeRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enableRreqExecTimeRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (200-600ms)，預設開啟</p>
        </div>
        <div>
          <Input
            id="rbaExecTime"
            type="number"
            label="RBA 執行時間 (毫秒) (RBA execTime)"
            :modelValue="'100'"
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableRbaExecTimeRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enableRbaExecTimeRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (50-200ms)，預設開啟</p>
        </div>
        <div>
          <Input
            id="cavvExecTime"
            type="number"
            label="CAVV 響應時間 (毫秒) (CAVV execTime)"
            :modelValue="'20'"
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableCavvExecTimeRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enableCavvExecTimeRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (10-30ms)，預設開啟</p>
        </div>
        <div>
          <Input
            id="otpExecTime"
            type="number"
            label="簡訊OTP響應時間 (毫秒) (OTP execTime)"
            :modelValue="'50'"
          />
          <div class="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="enableOtpExecTimeRandom"
              class="checkbox checkbox-sm"
              checked
            />
            <label for="enableOtpExecTimeRandom" class="text-sm text-base-content/60">
              隨機生成時包含此欄位
            </label>
          </div>
          <p class="text-xs text-error mt-2">可隨機生成 (20-80ms)，預設開啟</p>
        </div>
      </div>
    </Card>
  </section>
</template>
