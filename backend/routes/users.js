const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 獲取所有用戶（需要管理員權限）
router.get('/', [auth, admin], async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('groups');
    res.json(users);
  } catch (error) {
    console.error('獲取用戶列表失敗:', error);
    res.status(500).json({ message: '獲取用戶列表失敗' });
  }
});

// 創建新用戶（需要管理員權限）
router.post('/', [auth, admin], async (req, res) => {
  try {
    const { username, email, password, role, permissions } = req.body;

    // 檢查用戶名和郵箱是否已存在
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (existingUser) {
      return res.status(400).json({ message: '用戶名或郵箱已被使用' });
    }

    const user = new User({
      username,
      email,
      password,
      role: role || 'user',
      permissions: permissions || {
        canCreateAlbum: true,
        canEditAlbum: true,
        canDeleteAlbum: true,
        canUploadFiles: true,
        canDeleteFiles: true
      }
    });

    await user.save();

    res.status(201).json({
      message: '用戶創建成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('創建用戶失敗:', error);
    res.status(500).json({ message: '創建用戶失敗' });
  }
});

// 更新用戶信息（需要管理員權限）
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { username, email, role, permissions, isActive } = req.body;
    const userId = req.params.id;

    // 檢查用戶是否存在
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 如果要更改用戶名或郵箱，檢查是否已被使用
    if (username !== user.username || email !== user.email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [{ username }, { email }]
      });
      if (existingUser) {
        return res.status(400).json({ message: '用戶名或郵箱已被使用' });
      }
    }

    // 更新用戶信息
    user.username = username || user.username;
    user.email = email || user.email;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      message: '用戶信息更新成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('更新用戶信息失敗:', error);
    res.status(500).json({ message: '更新用戶信息失敗' });
  }
});

// 刪除用戶（需要管理員權限）
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const userId = req.params.id;

    // 檢查用戶是否存在
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 不允許刪除管理員帳號
    if (user.role === 'admin') {
      return res.status(403).json({ message: '不能刪除管理員帳號' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: '用戶已刪除' });
  } catch (error) {
    console.error('刪除用戶失敗:', error);
    res.status(500).json({ message: '刪除用戶失敗' });
  }
});

// 重置用戶密碼（需要管理員權限）
router.post('/:id/reset-password', [auth, admin], async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: '密碼重置成功' });
  } catch (error) {
    console.error('重置密碼失敗:', error);
    res.status(500).json({ message: '重置密碼失敗' });
  }
});

module.exports = router; 