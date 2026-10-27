# GA4 與跨網域預約追蹤準備

目前沒有提供 GA4 Measurement ID，因此網站不載入 GA4，也不送出分析請求。網站已準備 `GA4_MEASUREMENT_ID` 環境變數：填入有效的 `G-...` ID 後，伺服器渲染的頁面會載入 Google tag，前端會傳送以下事件：

- `booking_cta_click`：點擊官網預約 CTA。
- `booking_platform_outbound`：前往 `https://sy.up.railway.app/`。
- `journal_to_service`：Journal 文章前往 `/services/`。
- `journal_to_booking`：Journal 文章前往 `/booking/`。

加入 Measurement ID 後，事件會由瀏覽器實際送出；部署後仍須用 GA4 DebugView／即時報表確認。要把官網到 `sy.up.railway.app` 的同一次工作階段串起來，GA4 後台需將兩個網域納入跨網域量測，而且預約平台頁面須安裝同一個 GA4 Google tag。官方建議在 GA4 管理介面的資料串流中設定網域；目前預約平台仍需其管理者配合，尚未改動。
