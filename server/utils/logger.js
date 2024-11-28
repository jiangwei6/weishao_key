const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const MAX_LOG_DAYS = 7; // 保留7天的日志

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// 简单的日志记录
const logger = {
  error: (message) => {
    const date = new Date().toISOString();
    const logMessage = `${date} ERROR: ${message}\n`;
    fs.appendFileSync(path.join(LOG_DIR, 'error.log'), logMessage);
  },

  info: (message) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message);
    }
  }
};

// 清理旧日志
const cleanOldLogs = () => {
  const files = fs.readdirSync(LOG_DIR);
  const now = Date.now();
  
  files.forEach(file => {
    const filePath = path.join(LOG_DIR, file);
    const stats = fs.statSync(filePath);
    const days = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    
    if (days > MAX_LOG_DAYS) {
      fs.unlinkSync(filePath);
    }
  });
};

// 每天凌晨2点清理日志
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = logger; 