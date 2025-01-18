const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guest'],
    default: 'user'
  },
  note: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'locked'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'locked';
  }
  next();
});

// 注释掉自动加密的中间件
/*
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
*/

module.exports = mongoose.model('User', userSchema); 