# 相簿管理系統

這是一個使用 React 和 Node.js 開發的相簿管理系統，支援照片上傳、相簿分享和權限管理功能。

## 功能特點

### 已完成功能
- 相簿管理
  - 建立新相簿
  - 刪除相簿
  - 查看相簿列表
  - 查看相簿詳情
- 照片管理
  - 上傳照片（支援多檔案上傳）
  - 照片預覽
- 權限控制
  - 公開/私人相簿設定
  - 透過電子郵件分享相簿
  - 權限等級：瀏覽、編輯、管理員
- 使用者介面
  - 現代化深色主題
  - 響應式設計
  - 拖放上傳
  - 錯誤處理和提示

### 待開發功能
- 使用者認證系統
- 相簿封面設定
- 照片刪除功能
- 照片排序功能
- 相簿編輯功能
- 批次操作功能

## 技術棧

### 前端
- React 18.3.1
- TypeScript
- Vite 6.0.5
- CSS Modules

### 後端
- Node.js
- Express.js
- Multer（檔案上傳）
- CORS

## 專案結構
```
Photo_Project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreateAlbumModal.tsx
│   │   │   ├── AlbumDetail.tsx
│   │   │   ├── Modal.css
│   │   │   └── AlbumDetail.css
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── types.ts
│   └── package.json
└── backend/
    ├── server.js
    ├── uploads/
    └── package.json
```

## 安裝說明

### 前端設定
```bash
cd frontend
npm install
npm run dev
```

### 後端設定
```bash
cd backend
npm install
node server.js
```

## API 端點

### 相簿相關
- `GET /api/albums` - 取得所有相簿
- `POST /api/albums` - 建立新相簿
- `GET /api/albums/:id` - 取得特定相簿
- `DELETE /api/albums/:id` - 刪除相簿
- `POST /api/albums/:id/upload` - 上傳照片到特定相簿

## 目前狀態
- 前端基本框架已完成
- 後端 API 已實現基本功能
- 檔案上傳功能已實現
- 權限系統基礎架構已完成

## 待解決問題
1. 需要實現持久化儲存（目前使用記憶體儲存）
2. 需要添加使用者認證系統
3. 需要改進錯誤處理機制
4. 需要添加單元測試
5. 需要實現更多的相簿管理功能

## 開發環境
- Node.js v22.12.0
- npm 最新版本
- Windows 10
- VS Code（建議使用）

## 注意事項
- 目前使用記憶體儲存，重啟伺服器會清空資料
- 上傳的檔案儲存在 backend/uploads 目錄
- 預設後端伺服器運行在 port 5001
- 預設前端開發伺服器運行在 port 5173

## 影片預覽功能實現

影片預覽功能使用了以下方法來實現：

1. 使用 `video` 元素的 `loadeddata` 事件來處理影片載入：
```typescript
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  const handleLoadedData = () => {
    video.currentTime = 0.1;  // 設置到第一幀
    setThumbnailReady(true);
  };

  video.addEventListener('loadeddata', handleLoadedData);

  return () => {
    video.removeEventListener('loadeddata', handleLoadedData);
  };
}, []);
```

2. 關鍵屬性設置：
- `preload="auto"`: 預加載影片數據
- `muted`: 靜音播放
- `playsInline`: 內聯播放
- `objectFit: 'cover'`: 填滿容器
- `opacity`: 控制顯示/隱藏

3. 播放控制：
- 非播放狀態：顯示第一幀作為預覽
- 播放狀態：顯示完整影片播放器

4. 支援的影片格式：
```typescript
file.path.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/)
```

## 使用說明

1. 上傳影片後，系統會自動生成預覽畫面
2. 點擊影片可以開始播放
3. 播放時會顯示完整的影片控制項
4. 可以使用下載按鈕下載原始影片

## 注意事項

1. 影片必須是支援的格式（mp4、webm、ogg、mov）
2. 預覽圖片使用影片的第一幀
3. 需要後端支援 CORS 設置才能正常訪問影片文件 