# Runnable YouTube MCP Server

一個專為 YouTube 打造的 FastMCP 伺服器，統一提供影片、頻道、播放清單資訊查詢、下載與管理工具，適合自動化與 memo agent 整合。

---

## 為什麼要做這個專案？

市面上現有的 YouTube MCP server 不是無法編譯，就是只有 Python 版本，且僅支援影片下載功能。  
當我在開發自己的 memo agent 時，發現很難自動取得 YouTube 影片資訊來做摘要與自動化。  
因此我寫了這個專案，讓開發者能輕鬆取得、管理 YouTube 內容，並方便擴充。

---

## ✨ 特色

- 統一取得 YouTube 影片、頻道、播放清單資訊
- 支援多種格式與畫質的影片/音訊下載
- 影片縮圖擷取與處理
- 播放清單內容管理（新增、移除、排序）
- 影片隱私狀態管理（公開/私人/未公開）
- 取得可用字幕語言
- 適合自動化、memo agent、AI 應用整合
- 易於擴充、維護，完全開源

---

## 🛠️ 可用工具

| 工具名稱              | 功能描述                                   | 實現情況 |
|----------------------|--------------------------------------------|----------|
| describeVideo        | 取得影片資訊（可選區塊）                   | ✅        |
| getDownloadOptions   | 取得影片可下載格式/畫質選項                 | ❌        |
| downloadVideo        | 下載影片/音訊串流                           | ❌        |
| extractThumbnail     | 擷取並處理影片縮圖                          | ❌        |
| listSubtitleLanguages| 取得影片可用字幕語言                        | ❌        |
| manageVideoStatus    | 影片隱私狀態管理                            | ❌        |
| describeChannel      | 取得頻道公開資訊                            | ❌        |
| describePlaylist     | 取得播放清單公開資訊                        | ❌        |
| managePlaylistItems  | 播放清單內容管理（新增/移除/排序）           | ❌        |

> 目前僅 `describeVideo` 經過測試可用，其餘功能已實作但尚未完整測試。

---

## 🚀 安裝說明

### 先決條件

- Node.js 18+
- YouTube Data API v3 金鑰

### 安裝

```bash
npm install youtube-mcp-server
```

### 環境變數

請建立 `.env` 檔或於環境中設定：

```
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
DOWNLOAD_BASE_DIR=./downloads
```

### 開發模式執行

```bash
npm run dev
```

### 正式模式執行

```bash
npm run build
npm start
```

---

## 🧩 MCP 整合範例

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": [
        "tsx",
        "/PATH/TO/YOUR_PROJECT/src/server.ts"
      ],
      "env": {
        "YOUTUBE_API_KEY": "YOUR_YOUTUBE_API_KEY"
      }
    }
  }
}
```

---

## 🤝 貢獻

歡迎提出 PR、issue 或功能建議！  
請至 [issues page](https://github.com/stephen9412/youtube-mcp-server/issues)。

---

## 📄 授權

[MIT License](LICENSE) - Copyright (c) 2025 Stephen J. Li

---

[English README](README.md)