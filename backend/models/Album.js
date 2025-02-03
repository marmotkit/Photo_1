const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  name: {
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
  isPrivate: {
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

module.exports = mongoose.model('Album', albumSchema); 