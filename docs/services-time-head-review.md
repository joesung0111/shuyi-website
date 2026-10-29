# 服務時間 Sitemap HEAD 與手機驗收報告

日期：2026 年 10 月 29 日。基準 commit：`b379725`。

狀態：本機修改完成並通過測試。沒有 commit、沒有 staging、沒有推送、沒有重新部署。正式站仍是基準版本；正式站手機測試只代表目前已上線版本的操作結果。

## 服務時間修改

修改前已比對本機與正式 `/offerings/`，全身調理均公開標示約 40 分鐘及 1,600 元，沒有發現與本次指定時間不一致的資料。

| 位置 | 修改前 | 修改後 |
|---|---|---|
| 摘要 | 服務時間約 30～60 分鐘、依項目不同 | 全身活化調理服務時間約 40 分鐘，其他服務依各項目標示 |
| 摘要預留時間 | 建議預留約 60 分鐘 | 建議預留到訪時間約 60 分鐘 |
| 時間說明 | 先說約 30～60 分鐘，後面補全身約 40 分鐘 | 先明確回答全身服務約 40 分鐘；其他項目依實際標示；另外說明到訪時間預留約 60 分鐘，包含報到、溝通、檢查、服務與再次確認 |
| 時間 FAQ | 約 30～60 分鐘、建議預留約 60 分鐘 | 全身服務約 40 分鐘、到訪預留約 60 分鐘，其他項目依各項目實際標示 |

Services 已無 30～60 分鐘的泛稱。Hero HTML 與基準完全相同，NT$1,600 的文字與出現次數均未變動。沒有更動 CSS、app.js、動畫、價格或其他服務承諾。

## 刪文檢查

正式站確認結果：

- `/journal/ddd/`：HTTP 404，無重新導向首頁。
- `/journal/test01/`：HTTP 404，無重新導向首頁。
- `GET /api/content?status=published`：16 篇，沒有這兩個 slug。
- `GET /sitemap.xml`：22 個有效網址，已移除這兩個網址，全部逐一 GET 為 200。
- 逐頁掃描這 22 個網址的初始 HTML 連結，沒有連往兩篇刪除文章的 href；Journal 瀏覽器載入後清單也沒有殘留連結。
- 未重新建立文章、未更動正式資料庫、未刪除任何其他文章。

## Sitemap HEAD

原因：既有 `server.js` 只在 GET 時進入動態 Sitemap handler，HEAD 因而落入靜態檔案處理並回 404。

修正：同一路由接受 GET 或 HEAD，兩者使用相同 200 狀態及 XML Content-Type；HEAD 直接結束，不呼叫或傳送 XML 主體。`sitemapXml()` 本身及固定頁／published 查詢完全未改。

| 環境 | GET | XML 解析 | HEAD | HEAD 主體 | 網址 |
|---|---|---|---|---|---|
| 本機修正版 | 200 | 通過 | 200 | 0 bytes | 22 個，與修改前正式站集合完全一致 |
| 正式站目前版本 | 200 | 通過 | 404 | 不作為修正版結果 | 22 個，沒有已刪測試文章 |

本機使用從公開 API 取得的 16 篇文章建立獨立暫存資料庫，未使用或修改專案原有資料庫。除了正式站公開文章快照，回歸測試另使用全新暫存資料庫與 `qa-*` fixtures 驗證刪除行為，測試後清除暫存 fixture，不重建已刪的真實文章。

## 瀏覽器手機操作

工具：Playwright 控制本機已安裝的 Google Chrome 156.0.8078.48。使用真實獨立瀏覽器 context、isMobile、hasTouch 與精確 viewport，不是只讀 CSS，也不是 iframe 模擬。這是瀏覽器行動版模擬，不是實體裝置。

| 尺寸 | 本機淺色 | 本機深色 | 正式站淺色 | 正式站深色 |
|---|---|---|---|---|
| 375 × 812 | 通過 | 通過 | 通過 | 通過 |
| 390 × 844 | 通過 | 通過 | 通過 | 通過 |
| 430 × 932 | 通過 | 通過 | 通過 | 通過 |

每個 Services 情境都實測 Hero 顯示與動畫節點移動、深淺色切換、時間與 NT$1,600、比較表寬度、五步流程排列、8 題 FAQ 全部開合、選單開關及可見連結、CTA 點擊後新分頁開啟正式預約平台並看到「使用 LINE 登入」。檢查水平 scrollWidth、文字邊界及流程數字與內文的位置，未發現 Services 溢出、截斷、重疊或被遮擋的 CTA；未捕捉到頁面 JavaScript error。

每種尺寸與主題另抽查 Offerings、Booking、Journal、Studio；本機及正式共 48 個頁面抽查情境。各頁 HTTP 200、H1 可見、手機選單可操作、無水平溢出；Journal 16 張卡片且沒有已刪文章連結。

Booking 第一輪以 scrollWidth 判斷時將 CTA 的光帶 `::after` 動畫誤判為文字溢出。未因此修改網站；已針對 12 個 Booking 情境額外檢查實際文字 Range 邊界、按鈕中心 hit-test 及實際點擊預約平台。12 個情境均通過，文字沒有被裁切，按鈕未被遮擋。原始誤判與補充證據均保留，沒有抹除第一輪紀錄。

正式站 Services 目前仍顯示舊的時間文案；正式站手機版通過代表版面與操作通過，不代表新的時間文案或 HEAD 修正已上線。

## 測試與 Git 差異

正式程式只改兩個檔案：

- `services/index.html`：3 行替換，修正摘要、時間段落、FAQ。
- `server.js`：2 行替換，HEAD handler 相容性。

另新增：

- `tests/services-sitemap.test.mjs`：使用內建 node:test 與隔離資料庫的 HTTP 回歸測試。
- `docs/services-time-head-review.md`：本報告。

專案原本只有 dev/start，沒有 test script。本次執行 `node --test tests/services-sitemap.test.mjs`，4 個子測試及父測試合計 5 個通過：GET 的 fixed/published 保留與 draft 排除、HEAD 狀態與空主體、fixture 刪除後只移除該 URL 並回 404、初始 HTML 時間分離。亦通過 `node --check server.js`、`git diff --check`。獨立 XML parser 驗證了本機與正式 Sitemap。

原有 `animation-options.html`、兩份搜尋引擎設定文件及三份未追蹤預覽檔，均以修改前後 SHA-256 比對確認保留。

## 尚未驗證與下一步

- 未推送或部署，所以無法驗證正式站修正後的時間文案、HEAD 200 與正式環境快取結果。
- 未做實體 iOS／Android 或 Safari 驗收。
- 未登入 LINE、未送出預約，不驗證登入後預約流程、帳號資料或後台功能。
- 未登入 Search Console 或 Bing，不判定 Google／Bing 是否已更新索引或移除歷史結果。
- 目前沒有需要補充或猜測的營運資料。下一步需由使用者確認是否允許提交、推送及部署；本次保持本機待審狀態。

## 本次操作證據

本機暫存驗收資料目錄：`/var/folders/t0/rgm1hl6n4r74rt7hz08lh82w0000gn/T/shuyi-time-head-qa-yi06zbrk`。

- `production-before.json`：正式站 Sitemap、16 篇公開文章與頁面掃描快照。
- `http-results.json`：本機與正式 GET／HEAD、XML 與 URL 集合比對。
- `mobile-results.json`：第一輪原始結果，包括 Booking 裝飾光帶誤判。
- `booking-validation.json`：12 個 Booking 情境的實際文字範圍、遮擋與外連複測。
- `final-mobile-results.json`：依原始與補充證據彙整的最終矩陣。
- `screenshots/`：各尺寸、主題、頁面與操作截圖。
- `mobile-qa.cjs`、`booking-validation.cjs`：本次使用的瀏覽器操作腳本。
