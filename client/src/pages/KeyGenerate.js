import React, { useState } from 'react';
import { Form, InputNumber, Input, Button, Card, message, Radio, Space, Row, Col } from 'antd';
import axios from '../utils/axios';

const { TextArea } = Input;

const KeyGenerate = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const quantityOptions = [1, 5, 10, 20, 50, 100];
  const durationOptions = [1, 30, 90, 365];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const quantity = values.quantity || 1;
      const duration = values.duration || 30;
      const note = values.note || '';

      const response = await axios.post('/api/keys', {
        quantity,
        duration,
        note
      });

      if (response.data.success) {
        message.success('Key生成成功');
        form.resetFields();
      }
    } catch (error) {
      console.error('生成失败:', error);
      message.error(error.response?.data?.message || 'Key生成失败');
    }
    setLoading(false);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    form.setFieldsValue({ quantity: value });
  };

  const handleQuantityInputChange = (value) => {
    form.setFieldsValue({ quantityRadio: null });
  };

  const handleDurationChange = (e) => {
    const value = e.target.value;
    form.setFieldsValue({ duration: value });
  };

  const handleDurationInputChange = (value) => {
    form.setFieldsValue({ durationRadio: null });
  };

  return (
    <Card title="生成Key">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          quantity: 1,
          quantityRadio: 1,
          duration: 30,
          durationRadio: 30,
        }}
      >
        <Form.Item label="数量" required>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={16}>
              <Form.Item
                name="quantityRadio"
                noStyle
              >
                <Radio.Group 
                  buttonStyle="solid" 
                  onChange={handleQuantityChange}
                  style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                >
                  {quantityOptions.map(num => (
                    <Radio.Button 
                      key={num} 
                      value={num}
                      style={{ 
                        minWidth: '60px', 
                        textAlign: 'center',
                        marginRight: 0,
                        flexGrow: 1,
                        flexBasis: 'calc(33.333% - 8px)'  // 每行3个按钮
                      }}
                    >
                      {num}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Form.Item
                name="quantity"
                noStyle
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber
                  min={1}
                  max={1000}
                  placeholder="自定义数量"
                  style={{ width: '100%' }}
                  onChange={handleQuantityInputChange}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item label="有效期" required>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={16}>
              <Form.Item
                name="durationRadio"
                noStyle
              >
                <Radio.Group 
                  buttonStyle="solid"
                  onChange={handleDurationChange}
                  style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                >
                  {durationOptions.map(num => (
                    <Radio.Button 
                      key={num} 
                      value={num}
                      style={{ 
                        minWidth: '80px', 
                        textAlign: 'center',
                        marginRight: 0,
                        flexGrow: 1,
                        flexBasis: 'calc(33.333% - 8px)'  // 每行3个按钮
                      }}
                    >
                      {num}天
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Form.Item
                name="duration"
                noStyle
                rules={[{ required: true, message: '请输入有效期' }]}
              >
                <InputNumber
                  min={1}
                  max={365}
                  placeholder="自定义天数"
                  style={{ width: '100%' }}
                  onChange={handleDurationInputChange}
                  addonAfter="天"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item label="备注" name="note">
          <TextArea 
            rows={4} 
            placeholder="请输入备注信息（选填）"
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            block
            size="large"
          >
            生成
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default KeyGenerate; 