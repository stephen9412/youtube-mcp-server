# YouTube MCP 規格書

## 全局公開功能組

### describeChannel

功能描述：取得頻道公開資訊（標題、描述、自訂網址、訂閱數、統計資料等）

適用對象：所有公開頻道

輸入參數：  

- `channelId` (string, 必填)：頻道 ID

輸出描述：返回頻道元資料物件，包含 `snippet`, `statistics`, `contentDetails`

使用到的 API：`channels.list`

實作範例：

```typescript
async describeChannel(channelId: string) {
  const response = await this.youtube.channels.list({
    part: ['snippet', 'statistics'],
    id: [channelId]
  });
  return response.data.items[0];
}
```

### describePlaylist

功能描述：取得播放清單公開資訊（標題、描述、影片列表）
適用對象：所有公開播放清單

輸入參數：

- `playlistId` (string, 必填)

輸出描述：返回播放清單元資料與影片 ID 列表

使用到的 API：`playlistItems.list`

實作範例：

```typescript
async describePlaylist(playlistId: string) {
  const response = await this.youtube.playlistItems.list({
    part: ['snippet'],
    playlistId
  });
  return response.data.items;
}
```

### describeVideo

功能描述：綜合獲取影片資訊（可選資料區塊）

適用對象：所有公開影片

輸入參數：

- `videoId` (string, 必填)
- `sections` (array, 可選)：`basic`, `technical`, `metrics`, `restrictions`

輸出描述：結構化影片資料物件

使用到的 API：`videos.list`

實作範例：

```typescript
async describeVideo(videoId: string, sections = ['basic']) {
  const partMapping = {
    basic: 'snippet',
    technical: 'contentDetails',
    metrics: 'statistics',
    restrictions: 'status'
  };
  
  const response = await this.youtube.videos.list({
    part: sections.map(s => partMapping[s]),
    id: [videoId]
  });
  
  return response.data.items[0];
}
```

### getDownloadOptions

功能描述：取得影片可下載格式/畫質選項
適用對象：所有公開影片

輸入參數：

- `videoId` (string, 必填)

輸出描述：返回格式清單（包含 itag, mimeType, qualityLabel）

使用到的套件：`ytdl-core`

實作範例：

```typescript
async getDownloadOptions(videoId: string) {
  const info = await ytdl.getInfo(videoId);
  return info.formats.map(f => ({
    itag: f.itag,
    type: f.mimeType,
    quality: f.qualityLabel,
    hasAudio: !!f.audioBitrate
  }));
}
```

### downloadVideo

功能描述：下載影片/音訊流
適用對象：所有公開影片

輸入參數：

- `videoId` (string, 必填)
- `options` (object)：`{ format: 'mp4' | 'webm', quality: 'highest' | 'lowest' }`

輸出描述：返回是否成功

使用到的套件：`ytdl-core`

實作範例：

```typescript
import fs from 'fs';
import path from 'path';
import ytdl from 'ytdl-core';

// 預設下載目錄 (可從設定檔讀取)
const PREDEFINED_FOLDER = '/path/to/user/folder'; 

async function downloadVideo(
  videoId: string,
  options: { 
    format?: 'mp4' | 'webm',
    quality?: 'highest' | 'lowest',
    filename?: string  // 允許自訂檔名
  }
): Promise<{ success: boolean, filePath: string }> {
  return new Promise((resolve, reject) => {
    try {
      // 1. 建立寫入流
      const filename = options.filename || `${videoId}.${options.format || 'mp4'}`;
      const outputPath = path.join(PREDEFINED_FOLDER, filename);
      const writeStream = fs.createWriteStream(outputPath);

      // 2. 設定下載流
      const videoStream = ytdl(videoId, {
        quality: options.quality || 'highest',
        filter: format => options.format ? 
          format.container === options.format : true
      });

      // 3. 處理管線事件
      videoStream
        .pipe(writeStream)
        .on('finish', () => resolve({ 
          success: true, 
          filePath: outputPath 
        }))
        .on('error', (err) => reject(err));

    } catch (err) {
      reject(new Error(`下載失敗: ${err.message}`));
    }
  });
}

// 使用範例
downloadVideo('VIDEO_ID', { 
  format: 'mp4',
  quality: 'highest',
  filename: 'my_video.mp4' 
})
.then(result => console.log('下載完成:', result.filePath))
.catch(err => console.error('錯誤:', err));

```

### extractThumbnail

功能描述：擷取影片縮圖並處理
適用對象：所有公開影片

輸入參數：

- `videoId` (string, 必填)
- `size` (string, 可選)：'max' | 'medium' | 'default'

輸出描述：返回是否成功
使用到的套件：`ytdl-core` + `jimp`

實作範例：

```typescript
import ytdl from 'ytdl-core';
import Jimp from 'jimp';

// 快取機制 (避免重複下載)
const thumbnailCache = new Map<string, string>();

async function getYouTubeThumbnail(videoId: string) {
  // 1. 檢查快取
  if (thumbnailCache.has(videoId)) {
    return thumbnailCache.get(videoId);
  }

  // 2. 獲取影片資訊
  const info = await ytdl.getInfo(videoId);
  
  // 3. 選擇最佳縮圖 URL (需網路請求)
  const thumbnailUrl = info.videoDetails.thumbnails
    .sort((a, b) => b.width - a.width)[0].url;

  // 4. 下載並處理縮圖 (需網路請求)
  const image = await Jimp.read(thumbnailUrl);
  const buffer = await image
    .resize(800, Jimp.AUTO)
    .quality(85)
    .getBufferAsync(Jimp.MIME_JPEG);

  // 5. 轉為 base64 並快取
  const base64 = buffer.toString('base64');
  thumbnailCache.set(videoId, base64);

  return base64;
}

// 整合到 MCP 工具
server.addTool({
  name: "getYouTubeThumbnail",
  description: "獲取 YouTube 影片縮圖 (需網路請求)",
  parameters: z.object({
    videoId: z.string()
  }),
  execute: async ({ videoId }) => {
    try {
      const base64 = await getYouTubeThumbnail(videoId);
      return imageContent({
        buffer: Buffer.from(base64, 'base64')
      });
    } catch (error) {
      return {
        content: [{
          type: "error",
          message: "無法生成縮圖",
          details: error.message
        }]
      };
    }
  }
});
```

### listSubtitleLanguages

功能描述：取得影片可用字幕語言列表
適用對象：所有公開影片

輸入參數：

- `videoId` (string, 必填)

輸出描述：返回語言代碼列表 (如 ['en', 'zh-TW'])
使用到的套件：`ytdl-core`

實作範例：

```typescript
async listSubtitleLanguages(videoId: string) {
  const info = await ytdl.getInfo(videoId);
  return info.player_response.captions?.tracklist
    .map(t => t.languageCode) || [];
}
```

## 限頻道所有者功能組

### manageVideoStatus

功能描述：**影片上下架管理** - 修改影片隱私狀態（公開/不公開/未列出）

適用對象：頻道所有者

輸入參數：

- `videoId` (string, 必填)
- `status` (enum: 'public' | 'private' | 'unlisted')

輸出描述：返回更新後的影片狀態資源

使用到的 API：`videos.update`

實作範例：

```typescript
async manageVideoStatus(videoId: string, status: string) {
  return this.youtube.videos.update({
    part: ['status'],
    requestBody: {
      id: videoId,
      status: {
        privacyStatus: status,
        // 可擴充其他狀態參數
        license: 'youtube',
        embeddable: true
      }
    }
  });
}
```

### managePlaylistItems

功能描述：**播放清單內容管理** - 對播放清單進行完整 CRUD 操作

適用對象：頻道所有者

輸入參數：

- `action` (enum: 'add' | 'remove' | 'reorder')
- `playlistId` (string, 必填)
- `videoId` (string, add/reorder 時必填)
- `position` (number, reorder 時必填)

輸出描述：返回操作後的播放清單項目資源
使用到的 API：`playlistItems.insert` / `delete` / `update`

實作範例：

```typescript
async managePlaylistItems(
  action: 'add' | 'remove' | 'reorder',
  params: {
    playlistId: string,
    videoId?: string,
    itemId?: string,
    position?: number
  }
) {
  switch(action) {
    case 'add':
      return this.youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId: params.playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: params.videoId
            }
          }
        }
      });

    case 'remove':
      return this.youtube.playlistItems.delete({
        id: params.itemId
      });

    case 'reorder':
      return this.youtube.playlistItems.update({
        part: ['snippet'],
        requestBody: {
          id: params.itemId,
          snippet: {
            playlistId: params.playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: params.videoId
            },
            position: params.position
          }
        }
      });
  }
}
```

## 架構要點說明

1. **套件說明**
   - 全局功能使用 API Key：`this.youtube = google.youtube({ auth: apiKey })`
   - 獲取字幕、下載影片可以用 `ytdl-core`
   - 得到縮圖可以用 `jimp`

2. **錯誤處理模式**

    ```typescript
    import { UserError } from "fastmcp";

    server.addTool({
        name: "download",
        description: "Download a file",
        parameters: z.object({
            url: z.string(),
        }),
        execute: async (args) => {
            if (args.url.startsWith("https://example.com")) {
            throw new UserError("This URL is not allowed");
            }

            return "done";
        },
    });
    ```

此規格書完整涵蓋影片上下架與播放清單管理需求，所有功能均通過 YouTube Data API v3 實現。注意執行寫入操作時需嚴格遵守 [YouTube API Services Policy](https://developers.google.com/youtube/terms/api-services-policy)，特別注意每日配額限制與內容審查規範。
