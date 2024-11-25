const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

const app = express();

// 添加调试日志
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET ? '已设置' : '未设置',
  MONGODB_URI: process.env.MONGODB_URI ? '已设置' : '未设置'
});

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/keys', require('./routes/keys'));
app.use('/api/settings', require('./routes/settings'));

// 在生产环境下服务静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// 错误处理中间件 - 放在路由后面
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: err.message || '服务器内部错误' 
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '接口不存在' 
  });
});

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 10,
  minPoolSize: 5,
  appName: 'Cluster0'
})
.then(() => {
  console.log('MongoDB Atlas connected successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('请检查数据库连接字符串和网络状态');
  process.exit(1);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Trying to reconnect...');
  setTimeout(() => {
    mongoose.connect(process.env.MONGODB_URI)
      .catch(err => console.error('Reconnection failed:', err));
  }, 5000);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB reconnected successfully');
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