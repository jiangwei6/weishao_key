import axios from 'axios';
import { message } from 'antd';

const baseURL = process.env.NODE_ENV === 'production' 
  ? window.location.origin
  : 'http://localhost:5000';

const instance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache'
  }
});

// 简化请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 简化响应拦截器
instance.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      message.error(response.data.message || '操作失败');
      return Promise.reject(new Error(response.data.message));
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.config && error.config.retries > 0 && error.response?.status !== 401 && error.response?.status !== 403) {
      error.config.retries--;
      
      const delayRetry = new Promise(resolve => {
        setTimeout(resolve, error.config.retryDelay || 1000);
      });

      await delayRetry;
      return instance(error.config);
    }

    message.error(error.response?.data?.message || '请求失败');
    return Promise.reject(error);
  }
);

export default instance; 