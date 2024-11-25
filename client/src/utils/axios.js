import axios from 'axios';
import { message } from 'antd';

// 获取当前域名作为 baseURL
const baseURL = process.env.NODE_ENV === 'production' 
  ? window.location.origin  // 生产环境使用当前域名
  : 'http://localhost:5000'; // 开发环境使用本地地址

console.log('API baseURL:', baseURL); // 添加调试日志

const instance = axios.create({
  baseURL,
  timeout: 5000,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 添加详细的调试日志
    console.log('Request:', {
      url: `${config.baseURL}${config.url}`, // 完整URL
      method: config.method,
      data: config.data,
      headers: config.headers,
      baseURL: config.baseURL
    });

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
      url: response.config.url // 添加请求的URL
    });
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config,
      url: error.config?.url // 添加请求的URL
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    message.error(error.response?.data?.message || '请求失败');
    return Promise.reject(error);
  }
);

export default instance; 