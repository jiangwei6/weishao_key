const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  duration: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  note: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  activatedAt: {
    type: Date
  },
  bean: {
    type: Number,
    required: true,
    min: 0,
    max: 999999,
    default: 500
  }
});

keySchema.index({ userId: 1, status: 1 });
keySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Key', keySchema); 