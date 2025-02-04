const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: {
    canCreateAlbum: { type: Boolean, default: false },
    canEditAlbum: { type: Boolean, default: false },
    canDeleteAlbum: { type: Boolean, default: false },
    canUploadFiles: { type: Boolean, default: true },
    canDeleteFiles: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManageGroups: { type: Boolean, default: false }
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新時間戳
groupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Group', groupSchema); 