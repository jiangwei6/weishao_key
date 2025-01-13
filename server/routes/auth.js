const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const MAX_LOGIN_ATTEMPTS = 8;
const LOCK_TIME = 24 * 60 * 60 * 1000; // 24小时

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username }); // 不要记录密码

    const user = await User.findOne({ username });
    console.log('Found user:', user); // 添加调试日志

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查是否是 guest 账户
    if (user.role === 'guest' && user.username === 'guest' && password === 'guest23') {
      // guest 账户使用特殊处理
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET
      );

      return res.json({
        success: true,
        token,
        user: {
          username: user.username,
          role: user.role
        }
      });
    } else {
      // 先尝试直接比较（旧方案）
      let isValidPassword = password === user.password;
      
      if (!isValidPassword) {
        // 如果旧方案失败，尝试 bcrypt 比较（新方案）
        try {
          isValidPassword = await bcrypt.compare(password, user.password);
        } catch (err) {
          // 如果 bcrypt 比较出错，说明不是 bcrypt 格式，继续使用旧方案的结果
          console.log('bcrypt compare error:', err);
        }
      }

      if (!isValidPassword) {
        user.loginAttempts += 1;
        console.log('Login attempts:', user.loginAttempts);
        
        if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.isLocked = true;
          user.lockUntil = new Date(Date.now() + LOCK_TIME);
          await user.save();
          return res.status(401).json({
            success: false,
            message: '密码错误次数过多，账户已锁定'
          });
        }
        
        await user.save();
        return res.status(401).json({
          success: false,
          message: `密码错误，还剩${MAX_LOGIN_ATTEMPTS - user.loginAttempts}次机会`
        });
      }
    }

    // 登录成功，重置登录尝试次数
    user.loginAttempts = 0;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({ 
      success: true, 
      token,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

// 修改密码接口
router.put('/change-password', auth, async (req, res) => {
  try {
    // 检查是否是guest用户
    if (req.user.role === 'guest') {
      return res.status(403).json({
        success: false,
        message: 'Guest账户不能修改密码'
      });
    }

    const { oldPassword, newPassword } = req.body;
    
    // 使用 bcrypt 比较旧密码
    const isMatch = await bcrypt.compare(oldPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    // 使用 bcrypt 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    req.user.password = hashedPassword;
    await req.user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '密码修改失败'
    });
  }
});

// 添加一个临时的重置管理员密码路由
router.post('/reset-admin', async (req, res) => {
  try {
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: '管理员账户不存在'
      });
    }

    // 设置新密码并加密
    const newPassword = '51885188';  // 这里设置临时密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    adminUser.password = hashedPassword;
    await adminUser.save();

    res.json({
      success: true,
      message: '管理员密码已重置',
      username: adminUser.username,
      password: newPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '重置失败'
    });
  }
});

module.exports = router; 