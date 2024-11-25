const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { 
    username, 
    password,
    expectedUsername: process.env.ADMIN_USERNAME,
    expectedPassword: process.env.ADMIN_PASSWORD,
    envVars: {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: process.env.JWT_SECRET ? '已设置' : '未设置',
      MONGODB_URI: process.env.MONGODB_URI ? '已设置' : '未设置'
    }
  });
  
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.error('环境变量未正确加载');
    return res.status(500).json({ 
      success: false, 
      message: '系统配置错误',
      debug: {
        adminUsername: !!process.env.ADMIN_USERNAME,
        adminPassword: !!process.env.ADMIN_PASSWORD
      }
    });
  }

  if (username === process.env.ADMIN_USERNAME && 
      password === process.env.ADMIN_PASSWORD) {
    console.log('登录验证成功');
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ success: true, token });
  } else {
    console.log('登录验证失败');
    res.status(401).json({ 
      success: false, 
      message: '用户名或密码错误',
      debug: process.env.NODE_ENV === 'development' ? {
        provided: { username, password },
        expected: { 
          username: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD
        }
      } : undefined
    });
  }
});

// 添加修改密码路由
router.put('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // 验证旧密码
    if (oldPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    // 更新环境变量中的密码
    process.env.ADMIN_PASSWORD = newPassword;

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