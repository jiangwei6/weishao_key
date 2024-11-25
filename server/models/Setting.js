const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
});

// 添加默认设置
settingSchema.statics.getDefaultSettings = function() {
  return {
    apiSettings: {
      enabled: true
    },
    keySettings: {
      seed: 'default_seed_' + Date.now(),
      prefix: 'KEY'
    }
  };
};

module.exports = mongoose.model('Setting', settingSchema); 