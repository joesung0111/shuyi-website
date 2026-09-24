# 舒逸官網｜第一版

這是一個零依賴、可直接以瀏覽器開啟的品牌官網前端。它先刻意把內容和版型拆開，方便未來把「舒逸日常」改成真正可維護的文章、影片、情報系統。

## 目前已完成

- 獨立路由：`/`、`/services/`、`/journal/`、`/studio/`、`/booking/`
- 三個可直連內容頁：`/journal/activate-after-sitting/`、`/journal/first-breath/`、`/journal/studio-in-progress/`
- 深色／淺色主題切換（會記住使用者上次選擇），並隨主題切換對應 Logo
- 使用既有兩支影片作為首頁動態與可播放內容
- 手機導覽、內容分類與影片燈箱
- 集中內容資料於 `content.js`；目前不含虛構的預約、後台或聯絡資料

## 如何預覽

直接開啟 `index.html` 即可。若要用本機伺服器預覽，可在此資料夾執行：

```bash
python3 -m http.server 4173
```

接著前往 `http://localhost:4173`。

## 後續擴充建議

1. **內容後台**：將 `content.js` 換成 CMS API（例如 Sanity、Strapi 或既有後端），保留欄位：`type`、`title`、`excerpt`、`publishedAt`、`cover`、`videoUrl`、`slug`。
2. **正式分頁**：目前已使用獨立 URL；開始接後台時建議遷移至 Next.js，便於 SEO、後台登入與預約流程。
3. **真實資訊**：確認地址、營業方式、聯絡帳號、服務範圍與預約規則後，再加入頁尾與預約按鈕。現階段不假設任何尚未提供的聯絡資訊。

## 檔案責任

- `index.html`：內容結構與區塊
- `styles.css`：兩套主題、響應式版面與動態
- `content.js`：文章／影片／情報的暫存資料，未來 API 的替換點
- `素材/`：使用者提供的 Logo 與影片
