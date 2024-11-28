import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Switch, Space } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './Login.css';
import { messages } from '../locales';

const Login = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem('language') || 'zh');
  const t = messages[lang].login;

  const onFinish = async (values) => {
    try {
      const response = await axios.post('/api/auth/login', values);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        message.success(t.loginSuccess);
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.response?.data?.message || t.loginFailed);
    }
  };

  const handleLanguageChange = (checked) => {
    const newLang = checked ? 'en' : 'zh';
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="login-container">
      <Card 
        title={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{t.title}</span>
            <Space>
              <GlobalOutlined />
              <Switch
                checkedChildren="EN"
                unCheckedChildren="中"
                checked={lang === 'en'}
                onChange={handleLanguageChange}
              />
            </Space>
          </div>
        } 
        className="login-card"
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t.usernamePlaceholder }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder={t.usernamePlaceholder}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t.passwordPlaceholder }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t.passwordPlaceholder}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              {t.loginButton}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 