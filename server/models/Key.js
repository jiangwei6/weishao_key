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
  bean: {
    type: Number,
    default: 500
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  note: {
    type: String
  },
  activatedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Key', keySchema); 