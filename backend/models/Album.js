const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    select: false  // 默認不返回密碼字段
  },
  coverImage: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  allowedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      canView: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canUpload: { type: Boolean, default: false }
    }
  }],
  allowedGroups: [{
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    permissions: {
      canView: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canUpload: { type: Boolean, default: false }
    }
  }],
  files: [{
    path: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新 updatedAt 時間戳
albumSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 檢查用戶是否有權限
albumSchema.methods.checkUserPermission = function(userId, permission) {
  // 如果是相簿擁有者，擁有所有權限
  if (this.owner.toString() === userId.toString()) {
    return true;
  }

  // 檢查用戶直接權限
  const userPermission = this.allowedUsers.find(
    up => up.user.toString() === userId.toString()
  );
  if (userPermission && userPermission.permissions[permission]) {
    return true;
  }

  return false;
};

// 檢查群組權限
albumSchema.methods.checkGroupPermission = function(groupIds, permission) {
  return this.allowedGroups.some(
    gp => groupIds.includes(gp.group.toString()) && gp.permissions[permission]
  );
};

module.exports = mongoose.model('Album', albumSchema); 