const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
});

// 添加复合索引
settingSchema.index({ userId: 1, key: 1 }, { unique: true });

// 添加默认设置方法
settingSchema.statics.getDefaultSettings = function() {
  return {
    apiSettings: {
      enabled: true,
      token: ''
    },
    keySettings: {
      seed: 'default_seed_' + Date.now(),
      prefix: 'KEY'
    }
  };
};

module.exports = mongoose.model('Setting', settingSchema); 