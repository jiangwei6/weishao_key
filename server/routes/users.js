const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// 检查是否是管理员的中间件
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }
  next();
};

// 获取用户列表（仅管理员）
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    // 添加缓存控制头
    res.set('Cache-Control', 'private, max-age=300'); // 5分钟缓存

    // 使用聚合查询优化性能
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'settings',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $eq: ['$key', 'apiSettings'] }
                  ]
                }
              }
            }
          ],
          as: 'apiSettings'
        }
      },
      {
        $project: {
          username: 1,
          role: 1,
          isLocked: 1,
          loginAttempts: 1,
          createdAt: 1,
          apiToken: { $arrayElemAt: ['$apiSettings.value.token', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取用户列表失败'
    });
  }
});

// 创建新用户（仅管理员）
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // 创建用户
    const user = new User({
      username,
      password,
      role
    });

    await user.save();

    // 生成永久token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    // 创建用户默认设置
    const defaultSettings = Setting.getDefaultSettings();
    defaultSettings.apiSettings.token = token;
    defaultSettings.apiSettings.enabled = true;

    await Setting.create([
      {
        userId: user._id,
        key: 'apiSettings',
        value: defaultSettings.apiSettings
      },
      {
        userId: user._id,
        key: 'keySettings',
        value: defaultSettings.keySettings
      }
    ]);

    console.log('User created with settings:', {
      username,
      role,
      token: token.substring(0, 10) + '...'
    });

    res.json({
      success: true,
      message: '用户创建成功',
      data: {
        user: {
          username: user.username,
          role: user.role,
          _id: user._id
        },
        token
      }
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建用户失败'
    });
  }
});

// 更新用户（仅管理员）
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { password, role, isLocked } = req.body;
    const updates = {};

    if (password) updates.password = password;
    if (role) updates.role = role;
    if (typeof isLocked === 'boolean') {
      updates.isLocked = isLocked;
      if (!isLocked) {
        updates.loginAttempts = 0;
        updates.lockUntil = null;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除用户（仅管理员）
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 添加管理员修改用户密码的接口
router.put('/:id/password', auth, isAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '修改密码失败'
    });
  }
});

module.exports = router; 