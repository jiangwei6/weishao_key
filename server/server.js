require('dotenv').config({ path: '.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./models/User');
const Setting = require('./models/Setting');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');

// 设置默认环境变量
if (!process.env.ADMIN_USERNAME) {
  process.env.ADMIN_USERNAME = 'admin';
}
if (!process.env.ADMIN_PASSWORD) {
  process.env.ADMIN_PASSWORD = 'admin123';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'weiShao_2024_key_System_Secret_!@';
}
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://jiangwei1718:MPcDXeSAHgaSK7eI@cluster0.msdrj.mongodb.net/keySystem?retryWrites=true&w=majority&appName=Cluster0';
}

const app = express();

// 简化环境变量日志
console.log('Server started with MongoDB URI:', process.env.MONGODB_URI ? '已设置' : '未设置');

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/keys', require('./routes/keys'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));

// 在生产环境下服务静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// 错误处理中间件 - 放在路由后面
app.use((err, req, res, next) => {
  logger.error(`${err.stack}`);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误' 
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '接口不存在' 
  });
});

// 初始化默认用户和设置
async function initializeDefaultUsers() {
  try {
    // 创建或更新管理员
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created');
    }

    // 创建或更新访客账户
    let guestUser = await User.findOne({ role: 'guest' });
    if (!guestUser) {
      guestUser = await User.create({
        username: 'guest',
        password: 'guest23',
        role: 'guest'
      });
      console.log('Guest user created');
    }

    // 为所有用户初始化设置
    const users = await User.find();
    for (const user of users) {
      // 检查并创建 API 设置
      const apiSettings = await Setting.findOne({ 
        userId: user._id, 
        key: 'apiSettings' 
      });
      
      if (!apiSettings) {
        const token = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET
        );
        
        await Setting.create({
          userId: user._id,
          key: 'apiSettings',
          value: {
            enabled: true,
            token: token
          }
        });
        console.log(`API settings created for ${user.username}`);
      }

      // 检查并创建 Key 设置
      const keySettings = await Setting.findOne({ 
        userId: user._id, 
        key: 'keySettings' 
      });
      
      if (!keySettings) {
        await Setting.create({
          userId: user._id,
          key: 'keySettings',
          value: {
            seed: `default_seed_${user._id}_${Date.now()}`,
            prefix: 'KEY'
          }
        });
        console.log(`Key settings created for ${user.username}`);
      }
    }

    // 打印所有设置以验证
    const allSettings = await Setting.find();
    console.log('All settings:', allSettings);

  } catch (error) {
    console.error('初始化失败:', error);
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    initializeDefaultUsers();
  })
  .catch(err => console.error('MongoDB connection error:', err.message));

// 数据库连接错误处理
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting reconnect...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 优雅退出
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  app.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
}); 