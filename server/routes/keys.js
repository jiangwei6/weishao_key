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

// 生成新Key
router.post('/', auth, async (req, res) => {
  try {
    const { quantity = 1, duration = 30, note = '' } = req.body;
    
    // 获取用户的设置
    const keySettings = await Setting.findOne({ 
      key: 'keySettings',
      userId: req.user._id 
    });
    
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
      const finalKey = prefix ? `${prefix}_${keyString}` : keyString;
      
      keys.push({
        userId: req.user._id, // 添加用户ID
        key: finalKey,
        duration: parseInt(duration),
        quantity: 1,
        note,
        status: 'inactive'
      });
    }
    
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

// 获取Key列表 - 优化查询性能
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, duration } = req.query;
    
    // 构建查询条件
    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (duration) query.duration = parseInt(duration);

    // 移除 cache 方法，因为它可能导致问题
    const [data] = await Key.aggregate([
      { $match: query },
      {
        $facet: {
          paginatedData: [
            { $sort: { createdAt: -1 } },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
            { 
              $project: {
                key: 1,
                duration: 1,
                status: 1,
                note: 1,
                createdAt: 1
              }
            }
          ],
          stats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                  $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                inactive: {
                  $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
                }
              }
            }
          ]
        }
      }
    ]);

    const { paginatedData, stats } = data || { paginatedData: [], stats: [] };
    const statsData = stats[0] || { total: 0, active: 0, inactive: 0 };

    // 添加缓存控制头
    res.set('Cache-Control', 'private, max-age=300'); // 5分钟客户端缓存

    res.json({
      success: true,
      data: {
        list: paginatedData,
        stats: statsData,
        pagination: {
          total: status || duration ? paginatedData.length : statsData.total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取Key列表错误:', error); // 添加错误日志
    res.status(500).json({
      success: false,
      message: '获取Key列表失败'
    });
  }
});

// 获取所有可用的有效期选项 - 移到验证接口之前
router.get('/durations', auth, async (req, res) => {
  try {
    const durations = await Key.distinct('duration', { userId: req.user._id });
    res.json({
      success: true,
      data: durations.sort((a, b) => a - b)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取有效期选项失败'
    });
  }
});

// 验证Key接口
router.post('/verify', async (req, res) => {
  try {
    const { key, note } = req.body;
    
    // 查找key并检查其所属用户的API设置
    const keyDoc = await Key.findOne({ key }).populate('userId');
    if (!keyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Key不存在'
      });
    }

    // 获取用户的API设置
    const apiSettings = await Setting.findOne({ 
      key: 'apiSettings',
      userId: keyDoc.userId
    });

    // 检查API是否启用
    if (apiSettings?.value?.enabled === false) {
      return res.status(403).json({
        success: false,
        message: 'API已禁用'
      });
    }

    if (keyDoc.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Key已被使用'
      });
    }

    // 激活Key
    const now = new Date();
    keyDoc.status = 'active';
    keyDoc.activatedAt = now;
    keyDoc.note = note ? 
      `[${new Date().toLocaleString()}] ${note}` : 
      `[${new Date().toLocaleString()}] 已激活`;
    
    await keyDoc.save();

    res.json({
      success: true,
      message: '验证成功',
      data: {
        duration: keyDoc.duration,
        activatedAt: keyDoc.activatedAt,
        expireAt: new Date(now.getTime() + keyDoc.duration * 24 * 60 * 60 * 1000),
        note: keyDoc.note
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '验证失败'
    });
  }
});

// 删除Key
router.delete('/:id', auth, async (req, res) => {
  try {
    const key = await Key.findOne({ 
      _id: req.params.id,
      userId: req.user._id // 确保只能删除自己的Key
    });

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key不存在'
      });
    }

    await key.remove();
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '删除失败'
    });
  }
});

module.exports = router; 