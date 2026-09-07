# Grafana-Test-data

Vue 3 + Vite 前端工具，用來產生 **ACS／3DSS** 假交易資料（供 Elasticsearch／Grafana InsightEdge 儀表驗證），並提供 **DDoS／Rate Limit** 場景的瀏覽器壓測介面。

- 目錄樹與檔案註解：[專案樹狀架構.md](./專案樹狀架構.md)

## 功能概要

| 區塊 | 路徑 | 說明 |
|------|------|------|
| 測試資料產生 | `/test-data` | ACS／3DSS 測資表單、加權隨機、批次產生，可 bulk 寫入 ES |
| 隨機機率說明 | `/test-data/random-weights` | Requestor／商店池權重與 MCC（狀態權重之後補） |
| DDoS 限流測試 | `/rate-limit-test/*` | AReq 卡號／商戶、CReq Checkpoint1／2、3DS Method |

### 測試資料產生

- **模式**：ACS／3DSS，連動預設 `stateMachineReason` 與欄位規則
- **交易狀態加權**：ARes（Y／N／C／R／U 等）、RReq（Y／N／U／R／NULL），並顯示預期成功率／Challenge 率
- **狀態連動**：
  - ARes = N／U／R → 灌 `transStatusReason`（Insight 失敗原因熱力）
  - ARes = C／D 且 RReq = N／U／R → 啟用 `challengeCancel`；可依比率灌 04／05，並帶 reason 14（3DSS 拆桶用）
  - ACS：`challengeCancel` 05 → `stateMachineReason` 1004、04 → 1005（逾時熱力 14_1004／14_1005）
- **卡組織／錯誤預設**：卡組織原因碼、EMV 錯誤預設、errorComponent C、Challenge 驗證結果混入
- **System Monitor**：I-05／I-08／I-10 相關 `stateMachineReason` 假資料路徑
- **效能／去重**：卡號重複倍率池，避免大批量產生卡住
- **輸出**：表單隨機產生 JSON／批次；可經 Elasticsearch `_bulk` 大量寫入

### DDoS 限流測試

瀏覽器介面驗證限流行為，涵蓋：

- AReq 卡號、AReq 商戶
- CReq Checkpoint1、Checkpoint2
- 3DS Method

開發可用 Local（`npm run dev`，預設）或 Remote（`npm run dev:remote`，目標必填於 `.env.remote`）。  
**Remote host 只寫在 env，不在網頁設定。** 建置期也可注入 `VITE_ACS_AUTH_*`（見 `.env.example`）。

## 技術棧

- Vue 3（`<script setup>`）+ TypeScript + Vue Router + Pinia
- Vite 8、Tailwind CSS 4、DaisyUI 5
- Vitest、ESLint、Prettier
- Node：`^20.19.0 || >=22.12.0`

## 快速開始

```sh
npm install
npm run dev          # Local（預設）：proxy → localhost:30100 / 8050
npm run dev:remote   # Remote：讀 .env.remote；未指定 VITE_PROXY_*_TARGET 會啟動失敗
```

DDoS 頂欄只顯示目前 **proxy: Local｜Remote**（來自啟動時的 env）。  
切換 Remote：編輯 `.env.remote` 後執行 `npm run dev:remote`（需重開）。

Remote 會打真 3DS API（限流／log／可能落庫）。**測資／ES bulk 僅本機假資料，不要接到 Remote。**

其他常用指令：

```sh
npm run build          # type-check + production build
npm run preview        # 預覽建置結果
npm run test           # vitest run
npm run lint           # ESLint
npm run format         # Prettier 格式化 src/
```

### 環境變數

複製 `.env.example` 為 `.env`／`.env.production`（視部署方式）。Remote 見 `.env.remote`（`npm run dev:remote` 必填 proxy 目標）。

| 變數 | 用途 |
|------|------|
| `VITE_TARGET_ENV` | `local`／`remote`（前端 badge） |
| `VITE_PROXY_ACS_AUTH_TARGET` | Vite proxy：`/acs-auth` 轉發目標 |
| `VITE_PROXY_ACS_AUTH_WEB_TARGET` | Vite proxy：`/acs-auth-web` 轉發目標 |
| `VITE_ACS_AUTH_BASE` | 建置期 acs-auth origin（可選；留空走相對路徑／proxy） |
| `VITE_ACS_AUTH_WEB_BASE` | 建置期 acs-auth-web origin（可選） |

也可改由 nginx 反代 `/acs-auth`、`/acs-auth-web`，前端留空相對路徑。

## Architecture

測資主路徑：

```text
TestInput.vue
  └─ useBatchInsert（批次／日分配／_bulk）
       └─ TestInputForm.vue（sections UI）
            ├─ useTestInputFormState（formState／getFormData）
            ├─ composables（狀態加權、商務／裝置／時間地理隨機）
            └─ shared/utils/testDataDocument.buildDocument → ES 文件
```

DDoS 限流頁：

```text
DDoS*Test.vue（場景 config + 請求迴圈）
  └─ useDDoSTestRunner（stats／logs／isTesting／shouldStop）
       └─ shared/utils/ddos-utils（AReq／CReq／3DS Method body）
```

關鍵慣例：

- **純邏輯放 composables／shared/utils**，並用 vitest 覆蓋；Vue SFC 負責組裝與 UI
- **常數集中**於 `shared/constants/`（含 `NULL_VALUE`、國別幣別、GeoIP）
- **勿在 SFC 內嵌超長 document builder／batch 迴圈**（已抽出 `testDataDocument`、`useBatchInsert`）

## 主要目錄

```text
src/
├── components/sections/   # 測資表單分段 UI
├── composables/           # 表單狀態、隨機規則、batch insert（含單元測試）
├── shared/
│   ├── constants/         # NULL_VALUE、國別幣別、GeoIP、錯誤預設
│   ├── utils/             # buildDocument、timeRange、ES bulk、DDoS body
│   └── components/        # 基礎 UI
└── views/
    ├── TestInput.vue      # 測資頁（呼叫 useBatchInsert）
    └── ddos/              # 限流場景 + useDDoSTestRunner
```

完整註解樹見 [專案樹狀架構.md](./專案樹狀架構.md)。

## Contributing

1. 改邏輯優先落在 `composables/` 或 `shared/utils/`，並補／更新 `*.test.ts`
2. 新增測資欄位：在對應 `sections/*.vue` + `useTestInputFormState` 預設值；若進 ES 文件則改 `testDataDocument.ts`
3. 新增 DDoS 場景：複製既有 `DDoS*Test.vue`，共用 `useDDoSTestRunner`，勿再複製 stats／logs
4. 提交前執行：

```sh
npm test
npm run lint
```

## 建議 IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（勿同時啟用 Vetur）。
