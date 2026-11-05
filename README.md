# 舒逸官網｜第一版

這是一個以 Node 內建 HTTP server 與 SQLite 為核心的品牌官網，前台與內容管理後台在同一個專案。內容和版型拆開，方便後續擴充。

## 目前已完成

- 獨立路由：`/`、`/services/`、`/journal/`、`/studio/`、`/booking/`
- 三個可直連內容頁：`/journal/activate-after-sitting/`、`/journal/first-breath/`、`/journal/studio-in-progress/`
- `/manage-center/` 內容管理後台：登入後可新增、編輯、刪除文章／影片／情報，並控制草稿／發布
- SQLite 儲存於 `data/shuyi.sqlite`（已被 `.gitignore` 排除）
- 自建第一方網站流量分析：SQLite 記錄伺服器請求、匿名訪客工作階段、頁面瀏覽及重要事件
- `/manage-center/analytics/` 管理員流量分析儀表板；沿用既有後台登入權限
- 深色／淺色主題切換（會記住使用者上次選擇），並隨主題切換對應 Logo
- 使用既有兩支影片作為首頁動態與可播放內容
- 手機導覽、內容分類與影片燈箱
- 集中內容資料於 `content.js`；目前不含虛構的預約、後台或聯絡資料

## 如何啟動

需要用伺服器啟動，不能直接雙擊 HTML 資料夾。首次啟動：

```bash
SHUYI_ADMIN_PASSWORD='請設定自己的長密碼' npm start
```

接著開啟 `http://localhost:4173/`；後台在 `http://localhost:4173/manage-center/`。所有環境都必須提供管理密碼，沒有固定開發密碼。

## 後續擴充建議

1. **內容後台**：目前已由 `server.js` 提供 SQLite CRUD API，欄位包含 `type`、`title`、`excerpt`、`body`、`published_at`、`cover_url`、`video_url`、`slug`。
2. **正式部署**：正式環境需使用安全的 `SHUYI_ADMIN_PASSWORD`、HTTPS、反向代理與定期備份 `data/shuyi.sqlite`；登入 session 儲存在 SQLite 並設有到期時間。
3. **真實資訊**：確認地址、營業方式、聯絡帳號、服務範圍與預約規則後，再加入頁尾與預約按鈕。現階段不假設任何尚未提供的聯絡資訊。

## 檔案責任

- `index.html`：內容結構與區塊
- `styles.css`：兩套主題、響應式版面與動態
- `content.js`：文章／影片／情報的暫存資料，未來 API 的替換點
- `server.js`：網站伺服器、登入、SQLite schema 與 CRUD API
- `admin/`：內容管理後台 UI
- `素材/`：使用者提供的 Logo 與影片
- `analytics/`：分析資料表、寫入、報表、爬蟲分類及 Cloudflare peer CIDR 清單
- `public/analytics.js`：第一方非阻塞行為追蹤
- `admin/analytics.*`：分析後台頁面、樣式及互動程式
- `docs/analytics-preparation.md`：收集欄位、保存期限、部署與檢查方式
- `docs/analytics-privacy-notice-draft.md`：需負責人審閱後才能發布的隱私權告知草稿

## 網站流量分析

- 管理頁：`/manage-center/analytics/`；分析 API 全部要求有效管理員 session，只有 `/api/analytics/collect` 可匿名送入經過格式與速率檢查的追蹤事件。
- 前端分析以本站 `/analytics.js` 與 `/api/analytics/collect` 通訊；不載入 GA4 或第三方分析服務。追蹤失敗不影響網站瀏覽。
- 預設保留 30 天，可設定 `ANALYTICS_RETENTION_DAYS`。Railway 的 `DATABASE_PATH` 必須指向持久化 Volume，例如 `/data/shuyi.sqlite`，並維持備份。
- IP 在管理頁預設遮罩。Railway 部署只允許明確列出的 ingress peer 使用 Railway 提供的 `X-Real-IP`。該來源屬於 Cloudflare 官方範圍時，才採信 `CF-Connecting-IP` 與 `CF-IPCountry`。不使用 `X-Forwarded-For` 判定來源；無法確認的代理來源留空。
- Googlebot/Bingbot User-Agent 只作宣稱分類；反向與正向 DNS 驗證成功後才標示已驗證。查詢快取 7 天，不影響請求回應或限制爬蟲。
- 上線前需完成 `docs/analytics-privacy-notice-draft.md` 標示的負責人、聯絡方式、資料儲存地及適用法規確認。

- 所有環境都必須設定 `SHUYI_ADMIN_PASSWORD`；缺少時拒絕啟動，沒有固定備用密碼。
- 公開資源採明確允許清單；環境檔、後端原始碼、資料庫、測試與 Git 內部檔案不提供下載。舊 `/admin` 路徑回 404。
- 資安調整與上線驗證報告：`docs/security-analytics-report-2026-11-05.md`。

- 分析圖表提示、管理者數列、完整請求分頁與安全 CSV 匯出：[功能與限制說明](docs/analytics-dashboard-improvements-2026-11-06.md)。
