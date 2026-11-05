# 自建網站流量分析

本網站使用第一方追蹤程式 `/analytics.js` 和同源 `/api/analytics/collect`，不載入 GA4 或其他分析服務。伺服器請求摘要由本站 Node.js 在回應結束後分批寫入 SQLite。

## 收集內容

- 伺服器請求：時間、來源 IP（若可信代理可提供原始 IP）、HTTP method、去除 query 的路徑、狀態碼、User-Agent、去除 query 的 Referer、請求類型及 Bot 分類。Cookie、Authorization、請求 body 與 query string 不保存。
- 瀏覽行為：隨機匿名訪客 ID、分頁工作階段 ID、頁面路徑、頁面順序、同源或外站 Referer 的來源與路徑、裝置/瀏覽器/作業系統，以及明確標記的按鈕/連結事件。
- 停留時間：只累計頁面可見、視窗有焦點且最近一分鐘有互動的時間；分頁隱藏或視窗失焦時傳送累計值。這是瀏覽器狀態估算，不能證明使用者正在看螢幕。
- 追蹤不收集表單文字、表單欄位、按鈕文字或 URL query。成功表單事件如有需要，須由表單程式在伺服器確認成功後呼叫 `window.shuyiAnalytics.track('form_submit_success', 'form-id')`；網站目前沒有公開表單。
- Cloudflare 國家代碼僅在連線來源 IP 符合 Cloudflare 官方 IP CIDR 清單時採信；地區/城市沒有可靠資料時留空。

## 保存與管理

- 預設保存 30 天，可透過 `ANALYTICS_RETENTION_DAYS` 設為 1–3650 天。伺服器啟動時與每日批次清除過期分析列。
- IP 在後台預設遮罩；管理員可明確勾選顯示完整 IP。原始 IP 僅供受現有管理員驗證保護的分析 API 使用。
- visitor ID 使用第一方 `localStorage`，清除瀏覽器資料會重設；session ID 使用 `sessionStorage`，關閉分頁後不再由該分頁沿用。
- SQLite 路徑沿用 `DATABASE_PATH`；Railway 必須使用已掛載的持久化 Volume 並定期備份資料庫。

## 爬蟲驗證

Googlebot 與 Bingbot 的 UA 只代表「宣稱身分」。伺服器以訪客 IP 的反向 DNS 名稱及正向 DNS 回查驗證，結果在程序記憶體快取 7 天。DNS 逾時、失敗或來源 IP 不可用時保留未驗證狀態。驗證不會影響 HTTP 回應或封鎖任何爬蟲。

## 啟用與檢查

- `ANALYTICS_RETENTION_DAYS`：選填，預設 `30`。
- `CLOUDFLARE_PROXY_CIDRS`：選填；預設使用 `analytics/cloudflare-proxy-cidrs.txt` 中從 Cloudflare 官方來源取得的 CIDR。自訂值可用逗號或換行分隔，僅應填入可信 Cloudflare 代理 peer 的 CIDR。若 Railway 先終結代理連線，使 Node.js 只看到 Railway proxy peer，不能安全地靠 Cloudflare header 推回訪客 IP；此時應維持不信任該 header，待確認受信任代理鏈後再設定。
- `DATABASE_PATH`：正式 Railway 設為 Volume 掛載路徑，例如 `/data/shuyi.sqlite`。
- 瀏覽網站後，檢查後台 `/admin/analytics/` 的訪客/請求資料；分析 API 未登入需回 401。模擬 Googlebot UA 時應看到 Google、未驗證；只有 DNS 正反查成功才轉成已驗證。

## 隱私權告知待辦

目前專案沒有公開隱私權政策。正式啟用分析前，應由網站負責人補上並審閱公開告知，說明分析目的、資料項目（尤其 IP）、保存期限、受限的管理用途及權利行使聯絡方式。草稿位於 `docs/analytics-privacy-notice-draft.md`；其中未提供的聯絡/法律資訊不應自行推測或直接發布。
