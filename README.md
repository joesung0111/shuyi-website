# 舒逸官網｜第一版

這是一個以 Node 內建 HTTP server 與 SQLite 為核心的品牌官網，前台與內容管理後台在同一個專案。內容和版型拆開，方便後續擴充。

## 目前已完成

- 獨立路由：`/`、`/services/`、`/journal/`、`/studio/`、`/booking/`
- 三個可直連內容頁：`/journal/activate-after-sitting/`、`/journal/first-breath/`、`/journal/studio-in-progress/`
- `/admin/` 內容管理後台：登入後可新增、編輯、刪除文章／影片／情報，並控制草稿／發布
- SQLite 儲存於 `data/shuyi.sqlite`（已被 `.gitignore` 排除）
- 深色／淺色主題切換（會記住使用者上次選擇），並隨主題切換對應 Logo
- 使用既有兩支影片作為首頁動態與可播放內容
- 手機導覽、內容分類與影片燈箱
- 集中內容資料於 `content.js`；目前不含虛構的預約、後台或聯絡資料

## 如何啟動

需要用伺服器啟動，不能直接雙擊 HTML 資料夾。首次啟動：

```bash
npm start
```

接著開啟 `http://localhost:4173/`；後台在 `http://localhost:4173/admin/`。

預設僅供本機開發使用的密碼是 `shuyi-local-dev`。正式使用前請設定：

```bash
SHUYI_ADMIN_PASSWORD='請改成自己的密碼' npm start
```

## 後續擴充建議

1. **內容後台**：目前已由 `server.js` 提供 SQLite CRUD API，欄位包含 `type`、`title`、`excerpt`、`body`、`published_at`、`cover_url`、`video_url`、`slug`。
2. **正式部署**：正式環境需使用安全的 `SHUYI_ADMIN_PASSWORD`、HTTPS、反向代理與定期備份 `data/shuyi.sqlite`；目前登入 session 儲存在記憶體，重啟伺服器會要求重新登入。
3. **真實資訊**：確認地址、營業方式、聯絡帳號、服務範圍與預約規則後，再加入頁尾與預約按鈕。現階段不假設任何尚未提供的聯絡資訊。

## 檔案責任

- `index.html`：內容結構與區塊
- `styles.css`：兩套主題、響應式版面與動態
- `content.js`：文章／影片／情報的暫存資料，未來 API 的替換點
- `server.js`：網站伺服器、登入、SQLite schema 與 CRUD API
- `admin/`：內容管理後台 UI
- `素材/`：使用者提供的 Logo 與影片
