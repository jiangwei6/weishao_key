const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');

// 获取设置
router.get('/', auth, async (req, res) => {
  try {
    // 获取所有设置
    let [apiSettings, keySettings] = await Promise.all([
      Setting.findOne({ key: 'apiSettings' }),
      Setting.findOne({ key: 'keySettings' })
    ]);

    const defaultSettings = Setting.getDefaultSettings();

    // 如果 apiSettings 不存在，创建默认值
    if (!apiSettings) {
      apiSettings = await Setting.create({
        key: 'apiSettings',
        value: defaultSettings.apiSettings
      });
    }

    // 如果 keySettings 不存在，创建默认值
    if (!keySettings) {
      keySettings = await Setting.create({
        key: 'keySettings',
        value: defaultSettings.keySettings
      });
    }

    // 返回合并后的设置
    res.json({ 
      success: true, 
      data: {
        apiSettings: apiSettings.value,
        keySettings: keySettings.value
      }
    });
  } catch (error) {
    console.error('获取设置错误:', error);
    res.status(500).json({ success: false, message: error.message });
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
          { key: 'apiSettings' },
          { value: apiSettings },
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
          { key: 'keySettings' },
          { 
            value: {
              seed: keySettings.seed,
              prefix: keySettings.prefix || ''
            }
          },
          { upsert: true, new: true }
        )
      );
    }

    // 执行所有更新
    const [updatedApiSettings, updatedKeySettings] = await Promise.all(updates);

    // 返回更新后的设置
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

module.exports = router; 