# Services v2 實作與驗收紀錄

日期：2026 年 10 月 29 日。依據：舒逸提供的《Services 頁 SEO × AEO 完整優化規格 v2》及已公開的 `/offerings/` 正式項目資料。本文件是維護與驗收紀錄。

## 修改檔案

- `services/index.html`：保留 Hero 結構及品牌語氣，新增原始 HTML 服務答案與原生 FAQ。
- `styles.css`：新增服務內容的資訊卡、雙欄閱讀、表格、步驟、FAQ 及手機樣式，沿用現有深淺色變數。
- `app.js`：沿用 Hero、五步流程與 CTA 動畫；移除覆寫 CTA 標題的舊程式；不重複建立新頁的流程。預約入口動畫沿用伺服器輸出的預約網址。
- `server.js`：更新 Services metadata 與既有 Service Schema 描述；保留單一 canonical、OG 與 Breadcrumb 管線；集中 `BOOKING_URL` 設定並在初始 HTML 輸出連結。
- `booking/index.html`：改用集中預約 URL 標記，伺服器回應前完成替換；更新 app.js 版本參數避免舊快取。
- `docs/seo-aeo-content-backlog.md`：記錄 Services v2 的完成範圍與後續隱私、營運資料待辦。
- `docs/services-copy-review-draft.md`：標記舊稿已由 v2 規格取代，避免誤用。
- `docs/services-v2-implementation.md`：本份紀錄。

## 新增內容與 AEO

依序為 Hero、30 秒摘要、定義、與一般按摩差異及服務方式表、生活情境、首次到訪七步驟、時間與費用、穿著及到訪準備、五步服務流程、服務部位、服務中的調整方式、目前不服務政策、醫療評估界線、8 題 FAQ、工作室與預約方式、最終 CTA。

規格的 17 個核心問題都能在初始 HTML 中找到直接答案。FAQ 使用 `<details><summary>`，答案已在回應中，無須點擊後下載或產生。服務總覽只摘要 NT$1,600；完整獨立服務項目與方案繼續由 `/offerings/` 提供，沒有搬回 Services。

時間保留規格確認的約 30～60 分鐘與預留 60 分鐘，並明示 `/offerings/` 全身調理目前約 40 分鐘，區分服務時間與整次到訪時間。FAQ 不再說所有其他項目尚未公布，因為獨立服務項目頁已有經舒逸提供的資料。

## SEO

- Title：`美式活化槍全身調理 服務方式與預約 舒逸 Shu Yi`，遵守既有「標題除問號外不放標點」規則。
- Description：`了解舒逸美式活化槍全身調理的服務方式、與一般按摩的差異、適合了解的生活情境、第一次服務流程、時間、費用與線上預約方式。`
- Canonical：沿用 `${SITE_ORIGIN}/services/`，目前為 `https://sy-body.com/services/`，單一輸出。
- OG：沿用 `addSeo()` 的 title、description、url、type、image，不增第二套。
- JSON-LD：只有既有 Service 與 BreadcrumbList 各一份；Service 描述對齊實際可見五步流程。不加 FAQPage、LocalBusiness、Offer、評價或營業時間。
- Heading：單一 H1，問題型 H2，子流程 H3；標題只保留問號，移除逗號、分隔符與句號。
- 內部連結：Booking、Journal、Studio、Offerings。

## 設定與界線

預約正式網域 `https://booking.sy-body.com/` 與舊 Railway 網址均已確認能回應。採正式網域作為 `BOOKING_URL` 的預設值，可透過同名環境變數更新。所有受本次修改影響的外連，在伺服器輸出的 HTML 中即為完整可點網址；前端新增的 Booking CTA 從既有連結取值，不重複硬編碼網址。

未新增地址、地區、電話、Email、LINE ID、固定營業時段、證書名稱、發證單位、年資、案例、評價、未公開加值項目的價格或時間。NT$1,600 及 30～60 分鐘依本次規格，其他正式項目保留在獨立頁。本次未增加圖片、套件或第三方腳本。

服務政策依舒逸確認資料呈現；就醫警訊不擴寫為疾病百科。延伸閱讀引用 NHS 背部疼痛與就醫警訊 https://www.nhs.uk/conditions/back-pain/ ，不宣稱經醫療人員審閱。

## 本機驗收

- Node 語法檢查與 `git diff --check` 通過。
- 隔離資料庫的本機 HTTP 回應：Services、robots、sitemap、Journal、Booking、Admin 均 200；未使用正式 CMS 資料或帳密。
- 原始 HTML：單一 H1、37 個 H1～H3 標題、8 題 FAQ、五步流程、價格、時間、服務政策、部位與 CTA 均存在，不依賴執行 JS。
- JSON-LD 可解析，僅 Service 與 BreadcrumbList，canonical 唯一且正確；5 個 OG 欄位存在。
- 瀏覽器檢查：Hero 原有視覺與動畫保留；375px iframe 實際窄版 viewport 下檢查淺色選單、比較表換行、FAQ 展開、深色五步流程與頁尾 CTA，內容未見溢出或重疊。這不是實體手機測試。
- 實際點擊窄版 CTA，開啟 `https://booking.sy-body.com/` 並看到「舒逸預約系統」及 LINE 登入入口，未登入或送出預約。
- Services 與 Booking 的 app.js 連結及 Services CSS 使用版本參數，避免已知舊快取導致舊標題覆寫或連結殘留。

## 額外待辦

後續需檢查舒逸預約平台／後台對身體狀況、受傷史及調理紀錄等個人資料之蒐集告知與隱私權政策。這是獨立工作，本次不自行建立法律條款。
