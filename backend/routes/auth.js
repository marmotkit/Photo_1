const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 登入
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用戶並包含密碼字段
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({ message: '用戶名或密碼錯誤' });
    }

    // 驗證密碼
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: '用戶名或密碼錯誤' });
    }

    // 檢查用戶狀態
    if (!user.isActive) {
      return res.status(403).json({ message: '帳號已被停用' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 更新最後登入時間
    user.lastLogin = new Date();
    await user.save();

    // 返回用戶信息和 token
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('登入失敗:', error);
    res.status(500).json({ message: '登入失敗' });
  }
});

// 註冊
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 檢查用戶名是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }]
    });
    if (existingUser) {
      return res.status(400).json({ 
        message: '用戶名或郵箱已被使用' 
      });
    }

    // 創建新用戶
    const user = new User({
      username,
      email,
      password,
      permissions: {
        canCreateAlbum: true,
        canEditAlbum: true,
        canDeleteAlbum: true,
        canUploadFiles: true,
        canDeleteFiles: true
      }
    });

    await user.save();

    res.status(201).json({
      message: '註冊成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('註冊失敗:', error);
    res.status(500).json({ message: '註冊失敗' });
  }
});

// 獲取當前用戶信息
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('groups');
      
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('獲取用戶信息失敗:', error);
    res.status(500).json({ message: '獲取用戶信息失敗' });
  }
});

module.exports = router; 