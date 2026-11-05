# 舒逸網站資安與流量分析調整報告

日期：2026-11-05。程式回歸、本機瀏覽器與正式站均已驗證。功能版本 feecc98 已由 Railway 部署成功。

## 調整前／調整後

| 項目 | 調整前 | 調整後 |
| --- | --- | --- |
| 靜態檔案存取 | 公開目錄等於專案根目錄；正式站 `/server.js` HEAD 回 200 | Allowlist（允許清單）只提供指定頁面、前端程式、管理頁資源與媒體；環境檔、後端原始碼、Git、資料庫及測試檔回 404 |
| CDN 快取 | 修正原站後 Cloudflare 仍曾以 HIT 回傳舊 `/server.js` | 已清除本網域 CDN 快取，重新檢查原網址回 404 / BYPASS；沒有停用 Cloudflare 安全防護 |
| 符號連結 | 未檢查實際檔案目的地 | realpath（解析真正檔案路徑）防止連結指向未授權檔案 |
| 管理密碼 | 未設定時使用固定開發密碼 | Fail closed（條件不安全就拒絕啟動）；必須設定 SHUYI_ADMIN_PASSWORD |
| 登入保護 | 沒有限制嘗試次數 | Rate limiting（限流）：同來源 15 分鐘最多 10 次失敗嘗試；登入 body 限制 4KB；密碼以固定長度摘要做 timing-safe 比較 |
| 跨站請求 | 未檢查 Origin | CSRF 基本防護：阻止其他網站 Origin / cross-site 的修改請求；登入 Cookie 維持 HttpOnly、Secure、SameSite=Lax |
| 後台入口 | /admin/ | /manage-center/；分析在 /manage-center/analytics/；舊 /admin 路徑回 404，不轉址公布新入口；API 保留原權限驗證 |
| IP 取得 | 記到 Railway 代理 100.64.0.1～21；遮罩後全部像 100.64.0.0 | 僅在 Railway 部署及明確允許的 ingress peer 上採用 X-Real-IP；來源屬可信 Cloudflare 才採用 CF-Connecting-IP；不採信 X-Forwarded-For |
| IP 隱私 | 後端回完整值，僅畫面遮罩 | 後端預設即回遮罩；只有登入管理員明確選擇 fullIp=1 才回完整值；診斷永遠遮罩 |
| 管理者流量 | 混在一般訪客 | 伺服器驗證登入 session 後標記 is_admin；訪客總覽排除管理者；完整請求保留並可單獨篩選 |
| 行為事件 | 主要只有預約 CTA/外連 | 補 LINE 點擊、HTML5 實際播放/結束、外部影片開啟及事件摘要；自動播放裝飾影片不當成使用者互動 |

## 環境與資料

- 根目錄只有 `.env.example`，沒有真正 `.env`。`.gitignore` 排除 `.env` 與 `.env.*`，範例例外；可查的完整 Git 歷史只找到範例檔。
- 本次掃描未發現正式 API Key、私鑰或帶帳密的資料庫連線字串；報告與工具回報不顯示正式密碼或 Token。這不是對所有歷史秘密與第三方設定的全面無漏洞保證。
- 已確認 Railway 正式服務設定管理密碼，DATABASE_PATH 位於 /data，Volume 狀態 READY；部署前已在該 Volume 建立 SQLite 一致性備份。
- 沿用現有資料庫；分析資料表只新增 ip_source、peer_masked、is_admin 欄位及索引。歷史資料保留，舊代理紀錄不能還原出當時未收集的訪客 IP。
- 匿名 Visitor ID 使用 localStorage；Session ID 使用 sessionStorage，代表瀏覽器與分頁，不等於實際人數。已避免不同 Visitor ID 覆用既有 Session ID。
- HTTP 安全標頭補 nosniff（禁止瀏覽器猜測檔案類型）、DENY（防止被嵌進 iframe）及來源資訊限制。管理頁禁止快取與索引。
- 公開頁面的標題、Meta、Canonical、Schema 與 Sitemap 內容未調整；robots.txt 僅增加新管理路徑的禁止爬取。

## Railway 變數

- SHUYI_ADMIN_PASSWORD：必須；原有正式密碼保留，沒有輸出或更換。
- DATABASE_PATH：必須指向持久化 Volume，沿用現有設定。
- PORT、RAILWAY_ENVIRONMENT_ID：平台提供。
- ANALYTICS_RETENTION_DAYS：選填，預設 30 天。
- RAILWAY_PROXY_PEERS：選填，逗號分隔的精確可信 HTTP ingress IP；預設使用本服務已觀察的 100.64.0.1～21。不是平台保證永久固定的範圍；遇到未知 peer 時 fail closed，不信任其 Header，IP 留空並顯示待確認。
- CLOUDFLARE_PROXY_CIDRS：選填，預設官方清單。
- BOOKING_URL、GOOGLE_SITE_VERIFICATION：選填，原本即為公開網址／驗證資料。

Railway 官方將 X-Real-IP 列為來源 IP Header：https://docs.railway.com/networking/public-networking/specs-and-limits 。需維持僅可信 ingress 能接觸這項信任邏輯；同專案其他私有服務不應取得公共 ingress 的來源身分。

## 驗證與限制

- 本機 14 項自動測試通過：敏感檔案 GET/HEAD、管理登入、代理 Header 偽造、管理者分流、事件、404、SEO 與原有內容 API/Sitemap 回歸。
- 本機瀏覽器實際登入新分析頁成功；點擊既有 LINE QR 入口後，測試資料庫收到 line_click。
- 重要事件依實際收到的資料顯示，沒有生成假流量。
- 真正預約成功發生在 booking.sy-body.com 的另一個專案。本站已提供成功事件介面，但尚未改動預約平台接入；不能把預約按鈕點擊當成成功。前端事件也不是可驗證的交易憑證。
- LINE QR 被另一台手機掃描無法由原頁面得知。YouTube 只記開啟播放器，未接官方播放器事件時不能斷言已開始播放。
- 只識別有效登入中的管理者；登出、換瀏覽器或無登入的同一個人不會被標成管理者。
- 未執行實體手機及大型壓力測試。公開隱私告知仍需負責人補齊聯絡與法規資訊後發布。

## 正式站驗證結果

- Railway 顯示功能版本 feecc98 部署 SUCCESS；本次未變更正式密碼或環境變數。
- 首頁、服務頁、預約頁、追蹤程式、新後台與管理資源回 200。
- 舊 /admin/、/admin/analytics/、/server.js、/package.json、/.env、/.env.example、/.git/config、/data/shuyi.sqlite 回 404。其中 /server.js 曾受 CDN 舊快取影響，已執行 Cloudflare「清除全部」後再次確認 404、Cache-Control: no-store、CF-Cache-Status: BYPASS。
- 未登入的 overview 與 diagnostics API 回 401；正式密碼登入及授權 overview API 回 200。沒有將正式密碼或 Token 寫入報告、測試檔或命令列參數。
- 已透過本服務既有 Railway 原生網域逐一偽造 X-Real-IP、X-Forwarded-For、CF-Connecting-IP：請求正常回 200，系統採用的來源未變成偽造值。CF 標頭雖可由直連客戶端傳入，但來源不屬可信 Cloudflare 時不採信。原生網域與 sy-body.com 指向同一服務，測試登入憑證僅送往該服務。
- 新資料已出現 railway-x-real-ip 與 is_admin 標記；查詢時新紀錄仍以 100.64.* 為訪客 IP 的筆數為 0。歷史代理資料保持原樣並標記 legacy。
- 正式 Chrome 瀏覽器確認新 /manage-center/ 顯示登入介面；管理員須以既有密碼登入。自動化測試已驗證新後台登入與分析頁功能。
- IP 與管理者診斷請求屬實際測試請求，保留於伺服器請求紀錄；正式資料庫未灌入模擬 pageview 或預約成功事件。
- 現行限流為單程序記憶體計數，適用目前單實例部署；重啟會重設，將來多副本部署需改用共享計數儲存。可信 peer 清單若變動，需用管理員診斷確認後更新，不能直接擴大信任整個私有網段。
