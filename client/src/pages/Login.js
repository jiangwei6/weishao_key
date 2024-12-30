import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Switch, Space } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './Login.css';
import { messages } from '../locales';

const Login = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem('language') || 'zh');
  const [form] = Form.useForm();
  const t = messages[lang].login;

  const loginAsGuest = () => {
    form.setFieldsValue({
      username: 'guest',
      password: 'guest23'
    });
    form.submit();
  };

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

  useEffect(() => {
    document.title = 'WeishaoKey';
  }, []);

  const handleLanguageChange = (checked) => {
    const newLang = checked ? 'en' : 'zh';
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="login-container">
      <div className="language-switch">
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

      <h1 className="login-title">威少激活</h1>
      <div className="login-subtitle">AI变现专属Key管理平台</div>
      
      <Card className="login-card">
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t.usernamePlaceholder }]}
          >
            <Input 
              prefix={<UserOutlined className="input-icon" />} 
              placeholder={t.usernamePlaceholder}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t.passwordPlaceholder }]}
          >
            <Input.Password
              prefix={<LockOutlined className="input-icon" />}
              placeholder={t.passwordPlaceholder}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              className="login-button"
            >
              {t.loginButton}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <div className="guest-info">
        <span className="text-faded">如果您没有账户，可以试用</span>
        <a onClick={loginAsGuest}>guest账号</a>
        <span className="text-faded">；因为是多人共用guest，key肯定是不安全的，</span>
        <a href="https://test-cyfyd24zfbua.feishu.cn/wiki/M3IQwIXUdipH2ikio6Jcq948nme" 
           target="_blank" 
           rel="noopener noreferrer">
          点击这里
        </a>
        <span className="text-faded">查看独立账号开通方法</span>
      </div>
    </div>
  );
};

export default Login; 