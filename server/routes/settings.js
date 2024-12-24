const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// 获取设置
router.get('/', auth, async (req, res) => {
  try {
    // 使用一次查询获取所有设置
    const settings = await Setting.find({ 
      userId: req.user._id,
      key: { $in: ['apiSettings', 'keySettings'] }
    }).lean(); // 使用 lean() 提高性能

    // 转换为对象格式
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    // 如果设置不存在，使用默认值
    const defaultSettings = Setting.getDefaultSettings();
    const response = {
      apiSettings: settingsMap.apiSettings || defaultSettings.apiSettings,
      keySettings: settingsMap.keySettings || defaultSettings.keySettings
    };

    // 添加缓存控制
    res.set('Cache-Control', 'private, max-age=300'); // 5分钟缓存

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('获取设置错���:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取设置失败'
    });
  }
});

// 生成新的 API token
router.post('/generate-token', auth, async (req, res) => {
  try {
    const token = jwt.sign(
      { userId: req.user._id, role: req.user.role },
      process.env.JWT_SECRET
    );

    const apiSettings = await Setting.findOneAndUpdate(
      { userId: req.user._id, key: 'apiSettings' },
      { 
        $set: { 
          'value.token': token,
          'value.enabled': true
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      token: apiSettings.value.token
    });
  } catch (error) {
    console.error('生成token错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '生成token失败'
    });
  }
});

// 更新设置
router.put('/', auth, async (req, res) => {
  try {
    const { apiSettings, keySettings } = req.body;
    const updates = [];

    // 更新 API 设置
    if (apiSettings !== undefined) {
      updates.push(
        Setting.findOneAndUpdate(
          { 
            key: 'apiSettings',
            userId: req.user._id 
          },
          { 
            key: 'apiSettings',
            userId: req.user._id,
            value: apiSettings 
          },
          { upsert: true, new: true }
        )
      );
    }

    // 更新 Key 设置
    if (keySettings) {
      if (!keySettings.seed) {
        return res.status(400).json({
          success: false,
          message: 'Key生成种子不能为空'
        });
      }

      updates.push(
        Setting.findOneAndUpdate(
          { 
            key: 'keySettings',
            userId: req.user._id 
          },
          { 
            key: 'keySettings',
            userId: req.user._id,
            value: {
              seed: keySettings.seed,
              prefix: keySettings.prefix || ''
            }
          },
          { upsert: true, new: true }
        )
      );
    }

    const [updatedApiSettings, updatedKeySettings] = await Promise.all(updates);

    res.json({ 
      success: true,
      message: '设置已保存',
      data: {
        apiSettings: updatedApiSettings?.value,
        keySettings: updatedKeySettings?.value
      }
    });
  } catch (error) {
    console.error('更新设置错误:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '更新设置失败' 
    });
  }
});

router.put('/keySettings', auth, async (req, res) => {
  try {
    const { seed, prefix } = req.body;
    
    console.log('保存设置:', { seed, prefix }); // 添加日志

    let setting = await Setting.findOne({
      userId: req.user._id,
      key: 'keySettings'
    });

    if (!setting) {
      setting = new Setting({
        userId: req.user._id,
        key: 'keySettings',
        value: {
          seed: seed || 'default_seed_' + Date.now(),
          prefix: prefix || ''
        }
      });
    } else {
      setting.value = {
        ...setting.value,
        seed: seed || setting.value.seed,
        prefix: prefix || setting.value.prefix
      };
    }

    console.log('保存前的设置:', setting); // 添加日志
    await setting.save();
    console.log('保存后的设置:', setting); // 添加日志

    res.json({
      success: true,
      message: '设置已更新',
      data: setting
    });
  } catch (error) {
    console.error('保存设置错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '保存设置失败'
    });
  }
});

module.exports = router; 