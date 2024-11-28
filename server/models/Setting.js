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

// 复合唯一索引
settingSchema.index({ userId: 1, key: 1 }, { unique: true });

// 在模型创建之前删除旧索引
mongoose.connection.once('open', async () => {
  try {
    await mongoose.connection.collection('settings').dropIndex('key_1');
  } catch (error) {
    // 如果索引不存在，忽略错误
    console.log('No old index to drop');
  }
});

// 添加默认设置
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