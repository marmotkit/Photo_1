const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false  // 默認不返回密碼字段
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  permissions: {
    canCreateAlbum: { type: Boolean, default: false },
    canEditAlbum: { type: Boolean, default: false },
    canDeleteAlbum: { type: Boolean, default: false },
    canUploadFiles: { type: Boolean, default: true },
    canDeleteFiles: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManageGroups: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// 密碼加密
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 驗證密碼
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 檢查是否為管理員
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// 檢查特定權限
userSchema.methods.hasPermission = function(permission) {
  if (this.isAdmin()) return true;
  return this.permissions[permission] === true;
};

module.exports = mongoose.model('User', userSchema); 