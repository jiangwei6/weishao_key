const express = require('express');
const router = express.Router();
const Key = require('../models/Key');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const Setting = require('../models/Setting');

// 生成Key
const generateKey = (seed, index) => {
  const timestamp = Date.now();
  const data = `${seed}_${index}_${timestamp}`;
  console.log('生成Key的参数:', { seed, index, timestamp, data });
  const hash = crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  console.log('生成的hash:', hash);
  return hash;
};

// 生成新Key
router.post('/', auth, async (req, res) => {
  try {
    const { count = 1, duration, bean = 500, note } = req.body;
    
    // 验证参数
    if (duration < 0 || duration > 3650) {
      return res.status(400).json({
        success: false,
        message: '时间标记范围为0-3650天'
      });
    }

    if (bean < 0 || bean > 999999) {
      return res.status(400).json({
        success: false,
        message: 'Bean数量范围为0-999999'
      });
    }

    // 获取用户的设置
    const keySettings = await Setting.findOne({ 
      key: 'keySettings',
      userId: req.user._id 
    }).lean();  // 使用lean()获取纯JavaScript对象
    
    console.log('用户设置:', keySettings); // 添加日志

    if (!keySettings || !keySettings.value) {
      return res.status(400).json({ 
        success: false, 
        message: '请先在设置中配置Key生成规则' 
      });
    }

    const { seed = '', prefix = '' } = keySettings.value;
    console.log('解析后的设置:', { seed, prefix }); // 添加日志
    
    if (!seed) {
      return res.status(400).json({ 
        success: false, 
        message: '请先设置Key生成种子' 
      });
    }
    
    const keys = [];
    for (let i = 0; i < count; i++) {
      const keyString = generateKey(seed, i);
      console.log(`第${i + 1}个基础key:`, keyString);
      
      // 添加前缀（确保前缀存在且不为空）
      const finalKey = prefix && prefix.trim() ? `${prefix.trim()}_${keyString}` : keyString;
      console.log(`第${i + 1}个完整key:`, finalKey);
      
      const key = new Key({
        userId: req.user._id,
        key: finalKey,
        duration,
        bean,
        note,
        status: 'inactive',
        quantity: 1
      });

      await key.save();
      keys.push(key);
    }

    console.log('生成的所有keys:', keys.map(k => k.key));

    res.json({
      success: true,
      message: `成功生成${count}个Key`,
      data: keys
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
                createdAt: 1,
                bean: 1
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

// 获取所有可用的有效期选项 - 移到验证接口前
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
    console.log('1. 收到请求:', req.body);  // 打印请求数据

    // 检查 Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少 Authorization Token'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '无效的 Token 格式'
      });
    }

    const { key, note } = req.body;
    
    // 查找key
    const keyDoc = await Key.findOne({ key }).populate('userId');
    console.log('2. 查询到的Key:', {
      key: keyDoc?.key,
      currentNote: keyDoc?.note  // 当前的备注
    });

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

    // 验证 token 是否匹配
    if (!apiSettings?.value?.token || apiSettings.value.token !== token) {
      return res.status(401).json({
        success: false,
        message: '无效的 Token'
      });
    }

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

    // 准备新备注
    const newNote = `[${new Date().toLocaleString()}] ${note || '已激活'}`;
    console.log('3. 新备注:', newNote);

    // 拼接备注
    const finalNote = keyDoc.note 
      ? `${keyDoc.note}\n${newNote}`
      : newNote;
    console.log('4. 拼接后的备注:', finalNote);

    // 更新并保存
    keyDoc.status = 'active';
    keyDoc.activatedAt = new Date();
    keyDoc.note = finalNote;

    const savedKey = await keyDoc.save();
    console.log('5. 保存后的备注:', savedKey.note);

    res.json({
      success: true,
      message: '验证成功',
      data: {
        duration: savedKey.duration,
        bean: savedKey.bean,
        activatedAt: savedKey.activatedAt,
        note: savedKey.note
      }
    });
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '验证失败'
    });
  }
});

// 删除Key
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('删除Key:', req.params.id); // 添加日志

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

    // 使用 deleteOne 而不是 remove
    await Key.deleteOne({ _id: req.params.id });
    
    console.log('Key删除成功'); // 添加日志

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除Key错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '删除失败'
    });
  }
});

// 批量删除Keys
router.post('/batch-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要删除的Key'
      });
    }

    console.log('批量删除Keys:', ids); // 添加日志

    const result = await Key.deleteMany({
      _id: { $in: ids },
      userId: req.user._id // 确保只能删除自己的Key
    });

    console.log('批量删除结果:', result); // 添加日志

    res.json({
      success: true,
      message: `成功删除${result.deletedCount}个Key`
    });
  } catch (error) {
    console.error('批量删除错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '批量删除失败'
    });
  }
});

// 添加还原功能 - 删除所有Keys
router.post('/reset-all', auth, async (req, res) => {
  try {
    const { confirmText } = req.body;
    
    if (confirmText !== 'delete') {
      return res.status(400).json({
        success: false,
        message: '确认文本不正确'
      });
    }

    console.log('开始还原 - 删除所有Keys'); // 添加日志

    const result = await Key.deleteMany({
      userId: req.user._id
    });

    console.log('还原结果:', result); // 添加日志

    res.json({
      success: true,
      message: `成功删除${result.deletedCount}个Key`
    });
  } catch (error) {
    console.error('还原错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '还原失败'
    });
  }
});

// 更新Key备注
router.put('/:id/note', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const key = await Key.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key不存在'
      });
    }

    // 直接设置新备注，不添加时间戳
    key.note = note;
    await key.save();

    res.json({
      success: true,
      message: '备注更新成功',
      data: key
    });
  } catch (error) {
    console.error('更新备注错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新备注失败'
    });
  }
});

module.exports = router; 