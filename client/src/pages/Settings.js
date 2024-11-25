import React, { useState, useEffect } from 'react';
import { Card, Form, Button, message, Input } from 'antd';
import axios from '../utils/axios';

const Settings = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 获取设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get('/api/settings');
        if (response.data.success) {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      <Card title="Key生成设置" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSettingsUpdate}
        >
          <Form.Item
            label="Key生成种子"
            name="seed"
            extra="用于生成唯一Key的种子值，修改后会影响新生成的Key"
            rules={[{ required: true, message: '请输入种子值' }]}
          >
            <Input.Password placeholder="请输入种子值" />
          </Form.Item>

          <Form.Item
            label="Key前缀"
            name="prefix"
            extra="生成的Key会带有此前缀（可选）"
          >
            <Input placeholder="请输入Key前缀" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="修改密码">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            label="原密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordLoading}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings; 