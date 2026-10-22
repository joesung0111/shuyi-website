# Google Search Console 設定準備

目前網站可提交的 Sitemap：<https://sy-web.up.railway.app/sitemap.xml>。本文件不包含驗證 token；請由網站擁有者登入 Google 帳戶完成驗證。

## 設定步驟

1. 開啟 [Google Search Console](https://search.google.com/search-console/) 並選擇「新增資源」。
2. 若要管理目前 Railway 網址，選「網址前置字元」並輸入 `https://sy-web.up.railway.app/`。若日後改用自有網域，可評估使用網域資源；該方式需要 DNS 驗證。
3. 依 Google 顯示的驗證方式完成擁有權驗證。若選 HTML 檔案或 meta 標籤，請先將 Google 提供的真實驗證值交由網站管理者加入；本專案不預置假值。
4. 在「Sitemap」提交 `https://sy-web.up.railway.app/sitemap.xml`，確認狀態與已發現網址數量。
5. 使用「網址檢查」檢查首頁、`/services/`、`/journal/`、一篇已發布文章與 `/booking/`。需要時測試即時網址並要求建立索引。
6. 定期查看「成效」中的搜尋查詢、曝光、點擊、點閱率和平均排名，以及「索引」和 Sitemap 報告中的錯誤。

Google 官方說明：[新增網站資源](https://support.google.com/webmasters/answer/34592)、[網址檢查](https://support.google.com/webmasters/answer/12482179?hl=zh-Hant)。搜尋引擎是否收錄及收錄時間由 Google 決定，提交 Sitemap 不保證索引。
