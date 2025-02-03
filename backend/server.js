const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const fs = require("fs");

// 數據文件路徑
const DATA_DIR = path.join(__dirname, 'data');
const ALBUMS_FILE = path.join(DATA_DIR, 'albums.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// 確保數據目錄存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// 初始化類別數據
let categories = [];
let categoryIdCounter = 1;

// 讀取數據文件
function loadData() {
  try {
    if (fs.existsSync(ALBUMS_FILE)) {
      albums = JSON.parse(fs.readFileSync(ALBUMS_FILE, 'utf8'));
      albumIdCounter = Math.max(...albums.map(a => a.id), 0) + 1;
    }
    
    if (fs.existsSync(CATEGORIES_FILE)) {
      const categoriesData = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
      categories = Array.isArray(categoriesData) ? categoriesData : [];
    }
    
    // 如果類別為空，添加默認類別
    if (categories.length === 0) {
      categories = [{
        id: 1,
        name: '通用',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
    }
    
    // 更新類別計數器
    categoryIdCounter = Math.max(...categories.map(c => c.id), 0) + 1;
  } catch (error) {
    console.error('讀取數據文件失敗:', error);
    // 確保至少有默認類別
    if (categories.length === 0) {
      categories = [{
        id: 1,
        name: '通用',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
      categoryIdCounter = 2;
    }
  }
}

// 保存數據到文件
function saveData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albums, null, 2));
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('保存數據文件失敗:', error);
  }
}

// 初始化數據
let albums = [];
let albumIdCounter = 1;
let userIdCounter = 1;

// 載入已有數據
loadData();

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

app.use(cors());  // 允許所有來源的請求

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
  const { title, date, description, isPublic, hasPassword, password, categoryId } = req.body;
  const now = new Date().toISOString();
  
  const newAlbum = {
    id: albumIdCounter++,
    title,
    date,
    description,
    cover: "",
    files: [],
    ownerId: 1,
    isPublic: isPublic || false,
    hasPassword: hasPassword || false,
    password: hasPassword && password ? hashPassword(password) : null,
    permissionType: isPublic ? 'full' : 'view',
    categoryId: categoryId || 1,
    createdAt: now,
    updatedAt: now
  };
  
  albums.push(newAlbum);
  saveData(); // 保存數據
  
  const { password: _, ...safeAlbum } = newAlbum;
  const category = categories.find(c => c.id === newAlbum.categoryId);
  
  res.json({
    ...safeAlbum,
    hasPassword: !!newAlbum.password,
    currentPassword: newAlbum.password,
    category
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
  saveData(); // 保存數據
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
    id: Math.floor(Math.random() * 10000),
    filename: file.filename,
    originalname: file.originalname,
    path: file.filename,
    uploadedBy: 1,
    uploadedAt: now
  }));
  
  album.files = album.files.concat(uploadedFiles);
  album.updatedAt = now;
  
  saveData(); // 保存數據
  
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
    saveData(); // 保存數據
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
    const filePath = path.join(__dirname, 'uploads', album.files[fileIndex].path);
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

    saveData(); // 保存數據
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

    saveData(); // 保存數據
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
    saveData(); // 保存數據
    res.json(response);
  } catch (error) {
    console.error('更新相簿基本資訊時發生錯誤:', error);
    res.status(500).json({ error: '更新相簿基本資訊失敗' });
  }
});

// 獲取所有類別
app.get('/api/categories', (req, res) => {
  try {
    // 確保至少有默認類別
    if (categories.length === 0) {
      categories = [{
        id: 1,
        name: '通用',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
      saveData();
    }
    res.json(categories);
  } catch (error) {
    console.error('獲取類別失敗:', error);
    res.status(500).json({ error: '獲取類別失敗' });
  }
});

// 創建新類別
app.post('/api/categories', (req, res) => {
  try {
    const { name } = req.body;
    const now = new Date().toISOString();
    
    const newCategory = {
      id: categoryIdCounter++,
      name,
      createdAt: now,
      updatedAt: now
    };
    
    categories.push(newCategory);
    saveData(); // 保存到文件
    res.json(newCategory);
  } catch (error) {
    console.error('創建類別失敗:', error);
    res.status(500).json({ error: '創建類別失敗' });
  }
});

// 更新類別
app.put('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const category = categories.find(c => c.id === parseInt(id));
    if (!category) {
      return res.status(404).json({ error: '類別不存在' });
    }
    
    category.name = name;
    category.updatedAt = new Date().toISOString();
    
    saveData(); // 保存到文件
    res.json(category);
  } catch (error) {
    console.error('更新類別失敗:', error);
    res.status(500).json({ error: '更新類別失敗' });
  }
});

// 刪除類別（只能刪除沒有相簿的類別）
app.delete('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);
    
    // 檢查是否有相簿使用此類別
    const hasAlbums = albums.some(album => album.categoryId === categoryId);
    if (hasAlbums) {
      return res.status(400).json({ error: '此類別下還有相簿，無法刪除' });
    }
    
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: '類別不存在' });
    }
    
    categories.splice(categoryIndex, 1);
    saveData(); // 保存到文件
    res.status(204).send();
  } catch (error) {
    console.error('刪除類別失敗:', error);
    res.status(500).json({ error: '刪除類別失敗' });
  }
});

// 靜態提供 uploads 資料夾內的檔案
app.use('/uploads', cors(), express.static('uploads'));

app.listen(PORT, () => {
  // 確保上傳目錄存在
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  console.log(`Server is running on http://localhost:${PORT}`);
}); 