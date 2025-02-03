# 相簿管理系統

一個現代化的相簿管理系統，支持照片和視頻的上傳、管理和展示。

## 功能特點

### 相簿管理
- 創建、編輯和刪除相簿
- 支持公開/私密相簿設置
- 私密相簿密碼保護
- 相簿分類管理
- 靈活的排序選項（按類別、創建時間）

### 媒體管理
- 支持照片和視頻上傳
- 批量上傳功能
- 支持拖放上傳
- 設置相簿封面
- 媒體文件預覽
- 下載功能

### 視圖模式
1. 相簿視圖
   - 網格展示所有相簿
   - 顯示相簿封面和文件數量
   - 快速編輯功能

2. 照片視圖
   - 按相簿分組展示所有照片
   - 支持小、中、大三種尺寸顯示
   - 懸停顯示下載和刪除選項
   - 顯示剩餘照片數量

3. 視頻視圖
   - 按相簿分組展示所有視頻
   - 視頻縮略圖預覽
   - 支持小、中、大三種尺寸顯示
   - 視頻播放、下載和刪除功能

### 展示設置
- 自定義排序方式
- 靈活的視圖大小控制
- 支持不同的瀏覽模式

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

## 雲端部署方案

### 系統架構

```plaintext
Client Side (PWA)
├── 前端 (Render)
│   ├── PWA 支持
│   │   ├── manifest.json
│   │   ├── service-worker.js
│   │   └── icons/
│   └── 響應式設計優化
│
Backend Services
├── API 服務 (Render)
│   ├── 主要 API
│   └── 文件處理中間件
│
├── 數據存儲
│   ├── MongoDB Atlas（元數據）
│   │   ├── 相簿信息
│   │   ├── 用戶數據
│   │   └── 文件索引
│   │
│   └── Azure Blob Storage（媒體存儲）
│       ├── 原始文件
│       └── 縮略圖
│
└── Azure CDN（可選）
    └── 媒體文件加速
```

### 所需服務
1. Render
   - 前端部署（靜態網站託管）
   - 後端 API 部署（Web Service）
2. MongoDB Atlas
   - 數據庫服務
   - 存儲相簿和用戶信息
3. Azure 服務
   - Blob Storage（媒體文件存儲）
   - CDN（可選，用於加速媒體訪問）

### PWA 支持

#### 主要功能
- 離線訪問支持
- 可安裝到手機主屏幕
- iOS 照片/視頻直接上傳
- 後台同步（計劃中）
- 推送通知（計劃中）

#### 支持的文件格式
```typescript
// 圖片格式
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',  // iOS 照片格式
  'image/heif'   // iOS 照片格式
];

// 視頻格式
const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',  // iOS 視頻格式
  'video/mov'
];
```

### 部署準備

#### 1. 環境變量配置
```env
# Render 環境變量
MONGODB_URI=your_mongodb_atlas_uri
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_ACCOUNT_NAME=your_storage_account_name
AZURE_CONTAINER_NAME=your_container_name
```

#### 2. 前端配置
```typescript
// vite.config.ts PWA 配置
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '相簿管理系統',
        short_name: '相簿',
        description: '照片和視頻管理系統',
        theme_color: '#1a1a1a',
        icons: [
          // 需要添加不同尺寸的圖標
        ],
        display: 'standalone',
        background_color: '#1a1a1a'
      }
    })
  ]
});
```

#### 3. 後端調整
- 文件上傳至 Azure Blob Storage
- HEIC/HEIF 格式自動轉換
- 縮略圖生成
- 跨域設置

### 性能優化

1. 媒體文件處理
   - 自動生成縮略圖
   - 響應式圖片加載
   - 視頻轉碼（可選）

2. 緩存策略
   - Azure CDN 緩存
   - Service Worker 緩存
   - 瀏覽器緩存

3. 加載優化
   - 圖片延遲加載
   - 路由代碼分割
   - 資源預加載

### 安全性考慮

1. 數據傳輸
   - HTTPS 加密
   - 文件上傳驗證
   - 請求限流

2. 存儲安全
   - Azure Blob Storage 訪問控制
   - MongoDB Atlas 安全配置
   - 敏感信息加密

3. 應用安全
   - CSP 配置
   - XSS 防護
   - CSRF 防護

### 部署步驟（待實施）

1. 數據庫設置
   - MongoDB Atlas 集群創建
   - 數據庫用戶設置
   - 連接字符串獲取

2. Azure 設置
   - Blob Storage 容器創建
   - 訪問策略配置
   - CDN 設置（可選）

3. Render 部署
   - 前端部署配置
   - 後端服務設置
   - 環境變量配置

4. 域名和 SSL
   - 自定義域名設置
   - SSL 證書配置
   - DNS 記錄設置

### 後續計劃

1. 功能擴展
   - 離線編輯支持
   - 文件同步機制
   - 推送通知系統

2. 性能優化
   - 圖片處理優化
   - 視頻轉碼優化
   - 加載性能優化

3. 用戶體驗
   - 手勢操作支持
   - 動畫效果優化
   - 離線提示優化

## 本地桌面啟動

### 快速啟動
1. 雙擊運行 `start_app.bat`
2. 等待服務自動啟動
3. 瀏覽器會自動打開應用程序
4. 關閉命令行窗口即可停止所有服務

### 啟動腳本功能
- 自動檢查 Node.js 環境
- 自動安裝前後端依賴
- 自動創建必要的目錄
- 同時啟動前後端服務
- 自動打開瀏覽器訪問應用
- 一鍵關閉所有相關服務

### 注意事項
1. 首次運行可能需要較長時間安裝依賴
2. 確保已安裝 Node.js（建議版本 v22.12.0 或以上）
3. 確保 5173 和 5001 端口未被占用
4. 如遇到權限問題，請以管理員身份運行 