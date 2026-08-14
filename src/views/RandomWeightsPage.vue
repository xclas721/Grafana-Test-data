<script setup lang="ts">
import { computed } from 'vue'
import { MERCHANT_KINDS } from '@/shared/constants/merchantNameLexicon'
import {
  MERCHANT_MCC_BASE,
  MERCHANT_POOL_SIZE,
  MERCHANT_ZIPF_EXPONENT,
  merchantRankWeight
} from '@/shared/constants/merchantPool'
import {
  REQUESTOR_ID_OPTIONS,
  REQUESTOR_MERCHANT_WEIGHTS,
  REQUESTOR_WEIGHT_TOTAL
} from '@/shared/constants/requestorIds'

const requestorRows = computed(() =>
  REQUESTOR_ID_OPTIONS.map((id, index) => {
    const weight = REQUESTOR_MERCHANT_WEIGHTS[index] ?? 0
    const percent = ((weight / REQUESTOR_WEIGHT_TOTAL) * 100).toFixed(1)
    return { id, weight, percent }
  })
)

const zipfPreview = computed(() => {
  const ranks = [0, 1, 9, 21, 99, 999]
  const sampleSize = 3000
  let total = 0
  for (let i = 0; i < sampleSize; i++) total += merchantRankWeight(i, MERCHANT_ZIPF_EXPONENT)
  return ranks.map((rank) => ({
    rank: rank + 1,
    label:
      rank < MERCHANT_MCC_BASE.length
        ? (MERCHANT_MCC_BASE[rank]?.name ?? `#${rank + 1}`)
        : `池內第 ${rank + 1} 家`,
    percent: ((merchantRankWeight(rank, MERCHANT_ZIPF_EXPONENT) / total) * 100).toFixed(2)
  }))
})
</script>

<template>
  <div class="space-y-6">
    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body">
        <h1 class="card-title text-2xl">隨機機率說明</h1>
        <p class="text-base-content/70">
          這頁只講<strong>已改過的商店／Requestor</strong>。ARes／RReq／transStatus 權重仍用測資表單上的數字，之後再補到這裡。
        </p>
        <p class="text-sm text-base-content/60">
          預設：Requestor 不隨機（固定第一個）；商店隨機開啟。要看到下表 Requestor 分佈，請在測資頁勾「隨機 Requestor ID」。
        </p>
      </div>
    </div>

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-lg">一筆資料怎麼抽</h2>
        <ol class="list-decimal list-inside space-y-2 text-sm text-base-content/80">
          <li>若有勾 Requestor 隨機：依權重抽 15 個之一（總權重 {{ REQUESTOR_WEIGHT_TOTAL }}）。</li>
          <li>對到該 Requestor 的商店池（3000／250／200）。</li>
          <li>若有勾商店隨機：在該池裡 Zipf 抽一家（指數 {{ MERCHANT_ZIPF_EXPONENT }}），同時帶該店 MCC。</li>
        </ol>
      </div>
    </div>

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body overflow-x-auto">
        <h2 class="card-title text-lg">Requestor 權重</h2>
        <p class="text-sm text-base-content/60 mb-3">
          權重同時是「被抽到的相對次數」與「商店池大小」。四個 250 從主池 3000 切片（店會重複）；後 10 個用全球池後 2000，不跟主池重複。
        </p>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Requestor ID</th>
              <th class="text-right">權重／池大小</th>
              <th class="text-right">約佔比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in requestorRows" :key="row.id">
              <td class="font-mono text-xs">{{ row.id }}</td>
              <td class="text-right">{{ row.weight }}</td>
              <td class="text-right">{{ row.percent }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body overflow-x-auto">
        <h2 class="card-title text-lg">商店池 Zipf（主池 3000 為例）</h2>
        <p class="text-sm text-base-content/60 mb-3">
          全球 {{ MERCHANT_POOL_SIZE }} 家。主池前面是 22 家品牌，所以熱門店交易會明顯多於後面的獨立店。
        </p>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>順位</th>
              <th>店</th>
              <th class="text-right">單筆被抽到約佔比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in zipfPreview" :key="row.rank">
              <td>#{{ row.rank }}</td>
              <td>{{ row.label }}</td>
              <td class="text-right">{{ row.percent }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body overflow-x-auto">
        <h2 class="card-title text-lg">品牌 MCC</h2>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>商店</th>
              <th>MCC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in MERCHANT_MCC_BASE" :key="m.name">
              <td>{{ m.name }}</td>
              <td class="font-mono">{{ m.mcc }}</td>
            </tr>
          </tbody>
        </table>
        <p class="text-sm text-base-content/60 mt-3">獨立店名 MCC 跟後綴走：</p>
        <table class="table table-sm mt-2">
          <thead>
            <tr>
              <th>後綴</th>
              <th>MCC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kind in MERCHANT_KINDS" :key="kind.suffix">
              <td>{{ kind.suffix }}</td>
              <td class="font-mono">{{ kind.mcc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card bg-base-100 border border-dashed border-base-300">
      <div class="card-body">
        <h2 class="card-title text-lg">之後要補</h2>
        <p class="text-sm text-base-content/70">
          交易狀態（ARes／RReq／transStatusReason／challengeCancel）仍以測資表單權重為準，還沒搬到這頁。
        </p>
      </div>
    </div>
  </div>
</template>
