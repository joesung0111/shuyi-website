# GA4 與跨網域預約追蹤準備

目前沒有提供 GA4 Measurement ID，因此網站不載入 GA4，也不送出分析請求。預留以下事件名稱供未來串接：

- `booking_cta_click`：點擊官網預約 CTA。
- `booking_platform_outbound`：前往 `https://sy.up.railway.app/`。
- `journal_to_service`：Journal 文章前往 `/services/`。
- `journal_to_booking`：Journal 文章前往 `/booking/`。

預約 CTA 與文章內部連結已使用 `data-*` 屬性標記，現階段僅供辨識，不會發送事件。正式設定 GA4 後，需提供真實 Measurement ID，並評估 `sy-web.up.railway.app` 與 `sy.up.railway.app` 的跨網域量測設定及預約端可配合的 linker 設定；目前未改動預約平台。
