import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  
  // 如果没有登录，重定向到登录页
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 已登录用户可以访问所有页面
  return children;
};

export default PrivateRoute; 