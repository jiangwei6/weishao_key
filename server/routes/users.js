const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
    console.log('正在获取用户列表...');
    // 不要使用字段筛选，获取所有字段
    const users = await User.find();
    
    console.log('获取到的用户列表:', users);  // 添加日志

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
    const { username, password, role, expiresAt } = req.body;
    
    // 创建用户前加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = new User({
      username,
      password: hashedPassword,  // 使用加密后的密码
      role,
      expiresAt: expiresAt || null
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
    const { expiresAt, ...updateData } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 更新到期时间
    user.expiresAt = expiresAt || null;
    
    // 如果已过期，则锁定用户
    if (user.expiresAt && new Date() > new Date(user.expiresAt)) {
      user.status = 'locked';
    } else {
      user.status = 'active';
    }

    // 更新其他字段
    Object.assign(user, updateData);
    
    await user.save();
    res.json({ success: true, data: user });
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

    // 使用 bcrypt 加密新密码
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;  // 使用加密后的密码
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

// 在登录时检查用户是否过期
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username });
    
    // 检查用户是否过期
    if (user.expiresAt && new Date() > new Date(user.expiresAt)) {
      user.status = 'locked';
      await user.save();
      return res.status(403).json({
        success: false,
        message: '账户已过期，请联系管理员'
      });
    }

    // ... 其他登录逻辑 ...
  } catch (error) {
    // ... 错误处理 ...
  }
});

module.exports = router; 