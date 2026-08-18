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
import {
  ARES_STATUS_MEANING,
  computeExpectedRates,
  DEFAULT_ARES_STATUS_WEIGHTS,
  DEFAULT_RREQ_WEIGHTS,
  FORM_DEFAULT_ARES_WEIGHTS,
  FORM_DEFAULT_CHALLENGE_CANCEL_RATE,
  FORM_DEFAULT_RREQ_WEIGHTS,
  RREQ_STATUS_MEANING
} from '@/composables/useTransactionStatusRules'

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

const expectedRates = computed(() =>
  computeExpectedRates({
    aresWeightY: String(FORM_DEFAULT_ARES_WEIGHTS.Y),
    aresWeightN: String(FORM_DEFAULT_ARES_WEIGHTS.N),
    aresWeightR: String(FORM_DEFAULT_ARES_WEIGHTS.R),
    aresWeightC: String(FORM_DEFAULT_ARES_WEIGHTS.C),
    aresWeightD: String(FORM_DEFAULT_ARES_WEIGHTS.D),
    aresWeightA: String(FORM_DEFAULT_ARES_WEIGHTS.A),
    aresWeightI: String(FORM_DEFAULT_ARES_WEIGHTS.I),
    aresWeightS: String(FORM_DEFAULT_ARES_WEIGHTS.S),
    aresWeightU: String(FORM_DEFAULT_ARES_WEIGHTS.U),
    rreqWeightNull: String(FORM_DEFAULT_RREQ_WEIGHTS.NULL_VALUE),
    rreqWeightY: String(FORM_DEFAULT_RREQ_WEIGHTS.Y),
    rreqWeightN: String(FORM_DEFAULT_RREQ_WEIGHTS.N),
    rreqWeightU: String(FORM_DEFAULT_RREQ_WEIGHTS.U),
    rreqWeightR: String(FORM_DEFAULT_RREQ_WEIGHTS.R)
  })
)
</script>

<template>
  <div class="space-y-6">
    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body">
        <h1 class="card-title text-2xl">隨機機率說明</h1>
        <p class="text-base-content/70">
          數字跟測資表單預設同一套常數。商店／Requestor 已改池與 Zipf；ARes／RReq／status 先把現況寫上（測資頁仍可手動改權重）。
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
          <li>對到該 Requestor 的商店池（3000／250／100）。</li>
          <li>若有勾商店隨機：在該池裡 Zipf 抽一家（指數 {{ MERCHANT_ZIPF_EXPONENT }}），同時帶該店 MCC。</li>
        </ol>
      </div>
    </div>

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body overflow-x-auto">
        <h2 class="card-title text-lg">Requestor 權重</h2>
        <p class="text-sm text-base-content/60 mb-3">
          權重同時是「被抽到的相對次數」與「商店池大小」。四個 250 從主池 3000 切片（店會重複）；後 10 個各 100，從全球池後 2000 切開，不跟主池重複。
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

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-lg">ARes／RReq／status 怎麼抽</h2>
        <ol class="list-decimal list-inside text-sm space-y-1">
          <li>先抽 ARes（所有交易）。</li>
          <li>只有 ARes 是 C 或 D 才抽 RReq；其餘交易沒有 RReq。</li>
          <li>transStatus：非挑戰用 ARes；挑戰用 RReq（RReq 為 NULL 則仍用 ARes）。</li>
          <li>challengeCancel 只在挑戰失敗（N／U／R）時，依「取消機率」決定要不要寫 cancel；ACS 再對 cancel→stm／reason。</li>
        </ol>
        <p class="text-sm text-base-content/60 mt-2">
          下表是表單預設。測資頁改權重後，實際抽樣以表單為準。
        </p>
      </div>
    </div>

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-lg">ARes 預設權重</h2>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>值</th>
              <th>規格</th>
              <th class="text-right">權重</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in DEFAULT_ARES_STATUS_WEIGHTS" :key="row.value">
              <td class="font-mono">{{ row.value }}</td>
              <td>{{ ARES_STATUS_MEANING[row.value] }}</td>
              <td class="text-right font-mono">{{ row.weight }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-lg">RReq 預設權重（僅 C／D）</h2>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>值</th>
              <th>規格</th>
              <th class="text-right">權重</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in DEFAULT_RREQ_WEIGHTS" :key="row.value">
              <td class="font-mono">{{ row.value === 'NULL_VALUE' ? 'NULL' : row.value }}</td>
              <td>{{ RREQ_STATUS_MEANING[row.value] }}</td>
              <td class="text-right font-mono">{{ row.weight }}</td>
            </tr>
          </tbody>
        </table>
        <p class="text-sm text-base-content/60 mt-2">
          挑戰取消機率預設 {{ FORM_DEFAULT_CHALLENGE_CANCEL_RATE }}%（失敗路徑才抽）。
        </p>
      </div>
    </div>

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-lg">預設下期望成功率</h2>
        <p class="text-sm text-base-content/60 mb-2">跟測資表單同一套公式：Frictionless＝Y＋A＋I；挑戰成功＝RReq 的 Y；整筆成功再把 C／D 乘上挑戰成功率。</p>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>項目</th>
              <th class="text-right">期望 %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Frictionless</td>
              <td class="text-right font-mono">{{ expectedRates.expectedFrictionlessRate.toFixed(2) }}</td>
            </tr>
            <tr>
              <td>Challenge 成功（相對挑戰筆）</td>
              <td class="text-right font-mono">{{ expectedRates.expectedChallengeSuccessRate.toFixed(2) }}</td>
            </tr>
            <tr>
              <td>整筆交易成功</td>
              <td class="text-right font-mono">{{ expectedRates.expectedTransactionSuccessRate.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
