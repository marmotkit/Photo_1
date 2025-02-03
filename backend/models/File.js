const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  albumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  thumbnailPath: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number,  // 視頻時長（如果是視頻）
  }
});

module.exports = mongoose.model('File', fileSchema); 