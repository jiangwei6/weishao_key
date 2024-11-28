const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 24 * 60 * 60 * 1000; // 24小时

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password }); // 添加调试日志

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
    }

    // 检查账户是否锁定
    if (user.isLocked) {
      if (user.lockUntil && user.lockUntil < Date.now()) {
        // 锁定时间已过，重置状态
        user.isLocked = false;
        user.loginAttempts = 0;
        await user.save();
      } else {
        return res.status(403).json({
          success: false,
          message: '账户已锁定，请联系管理员'
        });
      }
    }

    // 验证密码
    if (password !== user.password) {
      user.loginAttempts += 1;
      console.log('Login attempts:', user.loginAttempts); // 添加调试日志
      
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
    
    if (oldPassword !== req.user.password) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    req.user.password = newPassword;
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

module.exports = router; 