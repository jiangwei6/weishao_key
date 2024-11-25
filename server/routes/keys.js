const express = require('express');
const router = express.Router();
const Key = require('../models/Key');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const Setting = require('../models/Setting');

// 生成Key
const generateKey = (seed, index) => {
  const data = `${seed}_${index}_${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
};

router.post('/', auth, async (req, res) => {
  try {
    const { quantity = 1, duration = 30, note = '' } = req.body;
    
    // 获取设置中的种子值
    const keySettings = await Setting.findOne({ key: 'keySettings' });
    if (!keySettings) {
      return res.status(400).json({ 
        success: false, 
        message: '请先在设置中配置Key生成规则' 
      });
    }

    const seed = keySettings.value.seed;
    const prefix = keySettings.value.prefix;
    
    if (!seed) {
      return res.status(400).json({ 
        success: false, 
        message: '请先设置Key生成种子' 
      });
    }
    
    const keys = [];
    const keyCount = parseInt(quantity);
    
    for (let i = 0; i < keyCount; i++) {
      const keyString = generateKey(seed, i);
      // 如果有前缀就添加前缀，没有就直接使用生成的key
      const finalKey = prefix ? `${prefix}_${keyString}` : keyString;
      
      keys.push({
        key: finalKey,
        duration: parseInt(duration),
        quantity: 1,
        note,
        status: 'inactive'
      });
    }
    
    console.log('Generating keys with settings:', { seed, prefix }); // 调试日志
    const savedKeys = await Key.insertMany(keys);
    res.json({ 
      success: true, 
      data: savedKeys,
      message: `成功生成 ${keyCount} 个Key`
    });
  } catch (error) {
    console.error('生成Key错误:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '生成Key失败' 
    });
  }
});

// 获取Key列表
router.get('/', auth, async (req, res) => {
  try {
    const keys = await Key.find().sort({ createdAt: -1 });
    
    // 计算统计数据
    const total = keys.length;
    const active = keys.filter(key => key.status === 'active').length;
    
    res.json({ 
      success: true, 
      data: {
        list: keys,
        stats: {
          total,
          active,
          inactive: total - active
        }
      }
    });
  } catch (error) {
    console.error('获取Key列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '获取Key列表失败' 
    });
  }
});

// 删除Key
router.delete('/:id', auth, async (req, res) => {
  try {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 验证Key API
router.post('/verify', async (req, res) => {
  try {
    // 检查API是否启用
    const settings = await Setting.findOne({ key: 'apiSettings' });
    if (settings && !settings.value.enabled) {
      return res.status(403).json({ 
        success: false, 
        message: 'API服务已禁用' 
      });
    }

    const { key, note } = req.body;  // 添加 note 参数
    const keyDoc = await Key.findOne({ key });
    
    if (!keyDoc) {
      return res.json({ 
        success: false, 
        message: 'Key不存在',
        data: null
      });
    }
    
    if (keyDoc.status === 'active') {
      return res.json({ 
        success: false, 
        message: 'Key已被使用',
        data: null
      });
    }
    
    // 激活Key，并处��备注
    keyDoc.status = 'active';
    keyDoc.activatedAt = new Date();
    
    // 如果有新备注，追加到现有备注后面
    if (note) {
      const existingNote = keyDoc.note || '';
      keyDoc.note = existingNote 
        ? `${existingNote}\n[${new Date().toLocaleString()}] ${note}`
        : `[${new Date().toLocaleString()}] ${note}`;
    }
    
    await keyDoc.save();
    
    // 返回更详细的信息
    res.json({ 
      success: true, 
      message: '验证成功',
      data: {
        duration: keyDoc.duration,  // 有效期天数
        activatedAt: keyDoc.activatedAt,  // 激活时间
        expireAt: new Date(keyDoc.activatedAt.getTime() + (keyDoc.duration * 24 * 60 * 60 * 1000)), // 过期时间
        note: keyDoc.note || ''  // 包含新增的备注
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      data: null
    });
  }
});

module.exports = router; 