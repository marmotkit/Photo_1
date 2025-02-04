const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 獲取所有群組
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', '-password')
      .populate('createdBy', '-password');
    res.json(groups);
  } catch (error) {
    console.error('獲取群組列表失敗:', error);
    res.status(500).json({ message: '獲取群組列表失敗' });
  }
});

// 創建新群組（需要管理員權限）
router.post('/', [auth, admin], async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // 檢查群組名稱是否已存在
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: '群組名稱已存在' });
    }

    const group = new Group({
      name,
      description,
      permissions,
      createdBy: req.user.id
    });

    await group.save();

    res.status(201).json({
      message: '群組創建成功',
      group
    });
  } catch (error) {
    console.error('創建群組失敗:', error);
    res.status(500).json({ message: '創建群組失敗' });
  }
});

// 更新群組信息（需要管理員權限）
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const groupId = req.params.id;

    // 檢查群組是否存在
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '群組不存在' });
    }

    // 如果要更改群組名稱，檢查是否已被使用
    if (name !== group.name) {
      const existingGroup = await Group.findOne({
        _id: { $ne: groupId },
        name
      });
      if (existingGroup) {
        return res.status(400).json({ message: '群組名稱已存在' });
      }
    }

    // 更新群組信息
    group.name = name || group.name;
    group.description = description || group.description;
    if (permissions) group.permissions = permissions;

    await group.save();

    res.json({
      message: '群組信息更新成功',
      group
    });
  } catch (error) {
    console.error('更新群組信息失敗:', error);
    res.status(500).json({ message: '更新群組信息失敗' });
  }
});

// 刪除群組（需要管理員權限）
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const groupId = req.params.id;

    // 檢查群組是否存在
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '群組不存在' });
    }

    // 從所有用戶中移除該群組
    await User.updateMany(
      { groups: groupId },
      { $pull: { groups: groupId } }
    );

    await Group.findByIdAndDelete(groupId);
    res.json({ message: '群組已刪除' });
  } catch (error) {
    console.error('刪除群組失敗:', error);
    res.status(500).json({ message: '刪除群組失敗' });
  }
});

// 添加成員到群組（需要管理員權限）
router.post('/:id/members', [auth, admin], async (req, res) => {
  try {
    const { userIds } = req.body;
    const groupId = req.params.id;

    // 檢查群組是否存在
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '群組不存在' });
    }

    // 檢查用戶是否存在
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({ message: '部分用戶不存在' });
    }

    // 添加用戶到群組
    group.members.push(...userIds);
    group.members = [...new Set(group.members)]; // 去重

    // 更新用戶的群組列表
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { groups: groupId } }
    );

    await group.save();

    res.json({
      message: '成員添加成功',
      group: await group.populate('members', '-password')
    });
  } catch (error) {
    console.error('添加群組成員失敗:', error);
    res.status(500).json({ message: '添加群組成員失敗' });
  }
});

// 從群組移除成員（需要管理員權限）
router.delete('/:id/members/:userId', [auth, admin], async (req, res) => {
  try {
    const { id: groupId, userId } = req.params;

    // 檢查群組是否存在
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '群組不存在' });
    }

    // 從群組中移除用戶
    group.members = group.members.filter(
      memberId => memberId.toString() !== userId
    );

    // 從用戶的群組列表中移除該群組
    await User.findByIdAndUpdate(userId, {
      $pull: { groups: groupId }
    });

    await group.save();

    res.json({
      message: '成員移除成功',
      group: await group.populate('members', '-password')
    });
  } catch (error) {
    console.error('移除群組成員失敗:', error);
    res.status(500).json({ message: '移除群組成員失敗' });
  }
});

module.exports = router; 