import React, { useState, useEffect } from 'react';
import { Card, Form, Button, message, Input, Alert, Switch } from 'antd';
import axios from '../utils/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { messages } from '../locales';

const Settings = () => {
  const [form] = Form.useForm();
  const [passwordFormInstance] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { lang, toggleLanguage } = useLanguage();
  const t = messages[lang].settings;
  const commonT = messages[lang].common.operation;

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    setUserRole(userInfo.role);
  }, []);

  // 获取设置
  useEffect(() => {
    const loadSettings = async () => {
      const cacheKey = 'settingsCache';
      const cacheTime = 5 * 60 * 1000; // 5分钟缓存

      try {
        // 检查缓存
        const cache = localStorage.getItem(cacheKey);
        if (cache) {
          const { data, timestamp } = JSON.parse(cache);
          if (Date.now() - timestamp < cacheTime) {
            console.log('Using cached settings');
            const { keySettings } = data;
            form.setFieldsValue({
              seed: keySettings?.seed || '',
              prefix: keySettings?.prefix || ''
            });
            return;
          }
        }

        const response = await axios.get('/api/settings');
        if (response.data.success) {
          // 更新缓存
          localStorage.setItem(cacheKey, JSON.stringify({
            data: response.data.data,
            timestamp: Date.now()
          }));

          const { keySettings } = response.data.data;
          form.setFieldsValue({
            seed: keySettings?.seed || '',
            prefix: keySettings?.prefix || ''
          });
        }
      } catch (error) {
        console.error('获取设置错误:', error);
        message.error('获取设置失败');
      }
    };

    loadSettings();
  }, [form]);

  // 更新设置
  const handleSettingsUpdate = async () => {
    try {
      setLoading(true);
      const formValues = form.getFieldsValue();
      
      if (!formValues.seed) {
        message.error('Key生成种子不能为空');
        return;
      }

      const response = await axios.put('/api/settings', {
        keySettings: {
          seed: formValues.seed,
          prefix: formValues.prefix || ''
        }
      });

      if (response.data.success) {
        // 清除缓存
        localStorage.removeItem('settingsCache');
        message.success('设置更新成功');
      }
    } catch (error) {
      console.error('更新设置错误:', error);
      message.error('设置更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handlePasswordChange = async (values) => {
    try {
      setPasswordLoading(true);
      const response = await axios.put('/api/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });

      if (response.data.success) {
        message.success('密码修改成功，请重新登录');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('修改密码错误:', error);
      message.error(error.response?.data?.message || '修改密码失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSettingsUpdate}
        >
          <Form.Item
            label={t.keyGeneration.seed}
            name="seed"
            extra={t.keyGeneration.seedHelp}
            rules={[{ required: true, message: t.keyGeneration.seedPlaceholder }]}
          >
            <Input.Password placeholder={t.keyGeneration.seedPlaceholder} />
          </Form.Item>

          <Form.Item
            label={t.keyGeneration.prefix}
            name="prefix"
            extra={t.keyGeneration.prefixHelp}
          >
            <Input placeholder={t.keyGeneration.prefixPlaceholder} />
          </Form.Item>

          <Form.Item
            label={t.language.title}
            extra={t.language.help}
          >
            <Switch
              checkedChildren="EN"
              unCheckedChildren="中"
              checked={lang === 'en'}
              onChange={toggleLanguage}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t.keyGeneration.saveButton}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Form
          form={passwordFormInstance}
          onFinish={handlePasswordChange}
          layout="vertical"
        >
          {userRole === 'guest' ? (
            <Alert
              message={t.password.guestWarning}
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          ) : (
            <>
              <Form.Item
                label={t.password.oldPassword}
                name="oldPassword"
                rules={[{ required: true, message: t.password.oldPasswordPlaceholder }]}
              >
                <Input.Password placeholder={t.password.oldPasswordPlaceholder} />
              </Form.Item>

              <Form.Item
                label={t.password.newPassword}
                name="newPassword"
                rules={[{ required: true, message: t.password.newPasswordPlaceholder }]}
              >
                <Input.Password placeholder={t.password.newPasswordPlaceholder} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={passwordLoading}>
                  {t.password.changeButton}
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default Settings; 