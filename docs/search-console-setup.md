# Google Search Console 設定準備

目前網站可提交的 Sitemap：<https://sy-web.up.railway.app/sitemap.xml>。本文件不包含驗證 token；請由網站擁有者登入 Google 帳戶完成驗證。

## 設定步驟

1. 開啟 [Google Search Console](https://search.google.com/search-console/) 並選擇「新增資源」。
2. 若要管理目前 Railway 網址，選「網址前置字元」並輸入 `https://sy-web.up.railway.app/`。若日後改用自有網域，可評估使用網域資源；該方式需要 DNS 驗證。
3. 建議選「HTML 標籤」驗證。把 Google 顯示的完整 `<meta name="google-site-verification" content="...">` 標籤（或只提供 content 值）交給網站管理者，會以 Railway 環境變數 `GOOGLE_SITE_VERIFICATION` 加入首頁，再回 Search Console 按「驗證」。不要提供 Google 帳號密碼。
4. 在「Sitemap」提交 `https://sy-web.up.railway.app/sitemap.xml`，確認狀態與已發現網址數量。
5. 使用「網址檢查」檢查首頁、`/services/`、`/journal/`、一篇已發布文章與 `/booking/`。需要時測試即時網址並要求建立索引。
6. 定期查看「成效」中的搜尋查詢、曝光、點擊、點閱率和平均排名，以及「索引」和 Sitemap 報告中的錯誤。

Google 官方說明：[新增網站資源](https://support.google.com/webmasters/answer/34592)、[驗證網站擁有權](https://support.google.com/webmasters/answer/9008080)、[提交 Sitemap](https://support.google.com/webmasters/answer/7451001)、[網址檢查](https://support.google.com/webmasters/answer/12482179?hl=zh-Hant)。搜尋引擎是否收錄及收錄時間由 Google 決定，提交 Sitemap 不保證索引。
