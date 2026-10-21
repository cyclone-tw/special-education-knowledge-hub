# Special Education Knowledge Hub

特殊教育研習、鑑定實務、案例研討、研究報告與互動式 HTML 專區。

## Repository Scope

這個 repo 預設為 private，內容為教育案例與研習整理。

正式鑑定仍以送件日適用法規、所在地主管機關規定、測驗手冊與跨專業決議為準。repo 內容是研習與實務輔助資料，不取代正式鑑定文件。

## Structure

```text
.
├── index.html                         # 專區入口，由 build-index.mjs 產生
├── content.json                       # 目前所有內容的 metadata 目錄
├── scripts/build-index.mjs            # 掃描各內容資料夾並更新入口
└── YYYY-MMDD-MMDD-topic/              # 一份研習或報告
    ├── meta.json                      # 標題、日期、類型、標籤與入口
    └── index.html                     # 該份內容的 HTML
```

## Add A New Workshop Or Report

1. 建立日期前綴資料夾，例如 `2026-0815-0816-reading-assessment-workshop/`。
2. 放入內容入口 `index.html`。
3. 新增 `meta.json`，欄位參考既有資料夾。
4. 執行：

   ```bash
   node scripts/build-index.mjs
   ```

5. 檢查 `content.json`、root `index.html`、手機／桌面版面後，再 commit 與 push。

## Publication

目前只推送到 private GitHub repo，尚未啟用公開 GitHub Pages。若未來要公開，需先確認分享權限與審閱所有來源連結。
