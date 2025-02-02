const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const fs = require("fs");

// 簡單的 in-memory 相簿資料
let albums = [];
let albumIdCounter = 1;
let userIdCounter = 1;

// 用於加密密碼的函數
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 設定 multer 儲存上傳的檔案到 uploads 資料夾
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // 加上時間戳記避免檔名重複
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const app = express();
const PORT = 5001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// 取得所有相簿
app.get("/api/albums", (req, res) => {
  // 不返回密碼欄位
  const safeAlbums = albums.map(({ password, ...album }) => ({
    ...album,
    hasPassword: !!password
  }));
  res.json(safeAlbums);
});

// 建立新相簿
app.post("/api/albums", (req, res) => {
  const { title, date, description, isPublic, hasPassword, password } = req.body;
  const now = new Date().toISOString();
  
  const newAlbum = {
    id: albumIdCounter++,
    title,
    date,
    description,
    cover: "",
    files: [],
    ownerId: 1, // 暫時固定為 1
    isPublic: isPublic || false,
    hasPassword: hasPassword || false,
    password: hasPassword && password ? hashPassword(password) : null,
    permissionType: isPublic ? 'full' : 'view',
    createdAt: now,
    updatedAt: now
  };
  
  albums.push(newAlbum);
  
  // 返回安全版本的相簿資料（不包含密碼）
  const { password: _, ...safeAlbum } = newAlbum;
  res.json({
    ...safeAlbum,
    hasPassword: !!newAlbum.password,
    currentPassword: newAlbum.password
  });
});

// 驗證相簿密碼
app.post("/api/albums/:id/verify", (req, res) => {
  const albumId = parseInt(req.params.id);
  const { password } = req.body;
  
  const album = albums.find((a) => a.id === albumId);
  if (!album) {
    return res.status(404).json({ message: "相簿不存在" });
  }
  
  if (!album.password) {
    return res.status(400).json({ message: "此相簿無需密碼" });
  }
  
  if (hashPassword(password) === album.password) {
    res.json({ message: "密碼正確" });
  } else {
    res.status(401).json({ message: "密碼錯誤" });
  }
});

// 取得指定相簿
app.get("/api/albums/:id", (req, res) => {
  const albumId = parseInt(req.params.id);
  const album = albums.find((a) => a.id === albumId);
  if (!album) {
    return res.status(404).json({ message: "相簿不存在" });
  }
  
  // 返回相簿資料，包含密碼
  res.json({
    ...album,
    hasPassword: !!album.password,
    currentPassword: album.password ? album.password : null
  });
});

// 刪除相簿
app.delete("/api/albums/:id", (req, res) => {
  const albumId = parseInt(req.params.id);
  const albumIndex = albums.findIndex((a) => a.id === albumId);
  if (albumIndex === -1) {
    return res.status(404).json({ message: "相簿不存在" });
  }
  albums.splice(albumIndex, 1);
  res.status(204).send();
});

// 上傳檔案至指定相簿 (支援單一或多檔案上傳)
app.post("/api/albums/:id/upload", upload.array("files"), (req, res) => {
  const albumId = parseInt(req.params.id);
  const album = albums.find((a) => a.id === albumId);
  if (!album) {
    return res.status(404).json({ message: "相簿不存在" });
  }
  
  const now = new Date().toISOString();
  const uploadedFiles = req.files.map((file) => ({
    id: Math.floor(Math.random() * 10000), // 簡單的隨機ID
    filename: file.filename,
    originalname: file.originalname,
    path: file.filename, // 只儲存檔名，不包含 uploads/
    uploadedBy: 1, // 暫時固定為 1
    uploadedAt: now
  }));
  
  album.files = album.files.concat(uploadedFiles);
  album.updatedAt = now;
  
  res.json({ message: "上傳成功", files: uploadedFiles });
});

// 更新相簿權限
app.put('/api/albums/:id/permissions', (req, res) => {
  const { id } = req.params;
  const { isPublic, hasPassword, password, permissionType } = req.body;

  const album = albums.find(a => a.id === parseInt(id));
  if (!album) {
    return res.status(404).json({ error: '相簿不存在' });
  }

  try {
    // 更新相簿權限
    album.isPublic = isPublic;
    album.hasPassword = hasPassword;
    
    // 只有在提供新密碼時才更新密碼
    if (hasPassword && password) {
      album.password = hashPassword(password);
    } else if (!hasPassword) {
      album.password = null;
    }
    
    // 設置權限類型
    album.permissionType = isPublic ? 'full' : (permissionType || 'view');
    album.updatedAt = new Date().toISOString();

    // 返回更新後的相簿資料
    const response = {
      ...album,
      hasPassword: !!album.password,
      currentPassword: album.password
    };

    console.log('更新權限成功:', response);
    res.json(response);
  } catch (error) {
    console.error('更新權限時發生錯誤:', error);
    res.status(500).json({ error: '更新權限失敗' });
  }
});

// 刪除相簿中的檔案
app.delete("/api/albums/:albumId/files/:fileId", (req, res) => {
  const albumId = parseInt(req.params.albumId);
  const fileId = parseInt(req.params.fileId);
  
  const album = albums.find((a) => a.id === albumId);
  if (!album) {
    return res.status(404).json({ error: "相簿不存在" });
  }
  
  const fileIndex = album.files.findIndex((f) => f.id === fileId);
  if (fileIndex === -1) {
    return res.status(404).json({ error: "檔案不存在" });
  }

  try {
    // 從檔案系統中刪除檔案
    const filePath = path.join(__dirname, album.files[fileIndex].path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 從相簿中移除檔案記錄
    album.files.splice(fileIndex, 1);
    album.updatedAt = new Date().toISOString();

    // 如果刪除的是封面圖片，重置封面
    if (album.files[fileIndex]?.isCover) {
      album.cover = album.files.length > 0 ? album.files[0].path : "";
    }

    res.status(204).send();
  } catch (error) {
    console.error('刪除檔案時發生錯誤:', error);
    res.status(500).json({ error: '刪除檔案失敗' });
  }
});

// 設置相簿封面
app.put("/api/albums/:id/cover", (req, res) => {
  const albumId = parseInt(req.params.id);
  const { fileId } = req.body;
  
  const album = albums.find((a) => a.id === albumId);
  if (!album) {
    return res.status(404).json({ error: "相簿不存在" });
  }
  
  const file = album.files.find((f) => f.id === fileId);
  if (!file) {
    return res.status(404).json({ error: "檔案不存在" });
  }

  try {
    // 重置所有檔案的 isCover 狀態
    album.files.forEach((f) => {
      f.isCover = f.id === fileId;
    });

    // 更新相簿封面路徑
    album.cover = file.path;
    album.updatedAt = new Date().toISOString();

    res.json({
      ...album,
      hasPassword: !!album.password,
      currentPassword: album.password
    });
  } catch (error) {
    console.error('設置封面時發生錯誤:', error);
    res.status(500).json({ error: '設置封面失敗' });
  }
});

// 更新相簿基本資訊
app.put('/api/albums/:id', (req, res) => {
  const { id } = req.params;
  const { title, date, description } = req.body;

  const album = albums.find(a => a.id === parseInt(id));
  if (!album) {
    return res.status(404).json({ error: '相簿不存在' });
  }

  try {
    // 更新相簿基本資訊
    album.title = title;
    album.date = date;
    album.description = description;
    album.updatedAt = new Date().toISOString();

    // 返回更新後的相簿資料
    const response = {
      ...album,
      hasPassword: !!album.password,
      currentPassword: album.password
    };

    console.log('更新相簿基本資訊成功:', response);
    res.json(response);
  } catch (error) {
    console.error('更新相簿基本資訊時發生錯誤:', error);
    res.status(500).json({ error: '更新相簿基本資訊失敗' });
  }
});

// 靜態提供 uploads 資料夾內的檔案
app.use('/uploads', cors(), express.static('uploads'));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 