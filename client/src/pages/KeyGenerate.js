import React, { useState } from 'react';
import { 
  Form, Button, Radio, Input, message, InputNumber, 
  Space
} from 'antd';
import { 
  CalendarOutlined, 
  NumberOutlined,
  FileTextOutlined,
  RocketOutlined
} from '@ant-design/icons';
import axios from '../utils/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { messages } from '../locales';

const KeyGenerate = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { lang } = useLanguage();
  const t = messages[lang].generateKey;

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/keys', values);
      if (response.data.success) {
        message.success(t.success);
        form.resetFields();
      }
    } catch (error) {
      message.error(error.response?.data?.message || t.failed);
    } finally {
      setLoading(false);
    }
  };

  const handleDurationChange = (e) => {
    form.setFieldValue('customDuration', e.target.value);
  };

  const handleQuantityChange = (e) => {
    form.setFieldValue('customQuantity', e.target.value);
  };

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      layout="vertical"
      initialValues={{
        duration: 30,
        quantity: 1,
        customDuration: 30,
        customQuantity: 1
      }}
      style={{
        background: 'linear-gradient(180deg, rgba(44, 229, 123, 0.05) 0%, rgba(255, 255, 255, 1) 25%)',
        padding: '32px',
        borderRadius: '12px',
        minHeight: 'calc(100vh - 184px)'
      }}
    >
      <Form.Item 
        label={
          <Space>
            <CalendarOutlined style={{ color: '#2CE57B' }} />
            <span style={{ fontSize: '16px' }}>时间标记</span>
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item name="duration" noStyle>
            <Radio.Group 
              onChange={handleDurationChange}
              buttonStyle="solid"
              size="large"
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px'
              }}
            >
              <Radio.Button 
                value={30}
                style={{ 
                  height: '48px', 
                  lineHeight: '48px',
                  padding: '0 24px',
                  fontSize: '16px'
                }}
              >
                30天
              </Radio.Button>
              <Radio.Button 
                value={90}
                style={{ 
                  height: '48px', 
                  lineHeight: '48px',
                  padding: '0 24px',
                  fontSize: '16px'
                }}
              >
                90天
              </Radio.Button>
              <Radio.Button 
                value={365}
                style={{ 
                  height: '48px', 
                  lineHeight: '48px',
                  padding: '0 24px',
                  fontSize: '16px'
                }}
              >
                365天
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="customDuration" noStyle>
            <InputNumber
              min={1}
              max={3650}
              style={{ 
                width: 200,
                height: '48px',
                fontSize: '16px'
              }}
              addonAfter="天"
              onChange={(value) => form.setFieldValue('duration', value)}
              placeholder="自定义天数"
            />
          </Form.Item>
        </Space>
      </Form.Item>

      <Form.Item
        label={
          <Space>
            <NumberOutlined style={{ color: '#2CE57B' }} />
            <span style={{ fontSize: '16px' }}>生成数量</span>
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item name="quantity" noStyle>
            <Radio.Group 
              onChange={handleQuantityChange}
              buttonStyle="solid"
              size="large"
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px'
              }}
            >
              {[1, 5, 10, 20, 50].map(num => (
                <Radio.Button 
                  key={num}
                  value={num}
                  style={{ 
                    height: '48px', 
                    lineHeight: '48px',
                    padding: '0 24px',
                    fontSize: '16px'
                  }}
                >
                  {num}个
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item name="customQuantity" noStyle>
            <InputNumber
              min={1}
              max={100}
              style={{ 
                width: 200,
                height: '48px',
                fontSize: '16px'
              }}
              addonAfter="个"
              onChange={(value) => form.setFieldValue('quantity', value)}
              placeholder="自定义数量"
            />
          </Form.Item>
        </Space>
      </Form.Item>

      <Form.Item
        label={
          <Space>
            <FileTextOutlined style={{ color: '#2CE57B' }} />
            <span style={{ fontSize: '16px' }}>备注信息</span>
          </Space>
        }
        name="note"
      >
        <Input.TextArea
          placeholder="可以附带产品名称、VIP内容等信息（可选）"
          rows={4}
          style={{ 
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          icon={<RocketOutlined />}
          style={{
            height: '50px',
            fontSize: '16px',
            borderRadius: '8px'
          }}
        >
          {t.generateButton}
        </Button>
      </Form.Item>

      <div style={{ marginTop: '24px', color: '#666' }}>
        <div style={{ fontSize: '14px' }}>Key生成规则：</div>
        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
          <li>时间标记：1-3650天（用于标记用户购买的时长）</li>
          <li>单次生成数量：1-100个</li>
          <li>备注信息：可以附带产品名称、VIP内容等，API调用时可获取此信息</li>
        </ul>
      </div>
    </Form>
  );
};

export default KeyGenerate; 