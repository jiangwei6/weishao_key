import React from 'react';
import { Card, Typography, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const ApiDocs = () => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:5000';

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('复制成功');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const curlExample = `curl -X POST ${baseUrl}/api/keys/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "your_key_here",
    "note": "激活备注信息（可选）"
  }'`;

  const responseExample = `// 成功响应
{
  "success": true,
  "message": "验证成功",
  "data": {
    "duration": 30,           // 有效期天数
    "activatedAt": "2024-03-20T10:30:00.000Z",  // 激活时间
    "expireAt": "2024-04-19T10:30:00.000Z",     // 过期时间
    "note": "[2024-03-20 18:30:00] 激活备注信息"  // 包含时间戳的备注
  }
}

// 失败响应
{
  "success": false,
  "message": "Key不存在/已使用/API已禁用等",
  "data": null
}`;

  return (
    <Card title="API文档">
      <Typography>
        <h3>验证Key接口</h3>
        <Paragraph>
          <Text strong>接口地址：</Text>
          <Text code>{`${baseUrl}/api/keys/verify`}</Text>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(`${baseUrl}/api/keys/verify`)}
          >
            复制
          </Button>
        </Paragraph>

        <h4>请求示例：</h4>
        <Paragraph>
          <Text code copyable>
            {curlExample}
          </Text>
        </Paragraph>

        <h4>响应示例：</h4>
        <Paragraph>
          <pre>{responseExample}</pre>
        </Paragraph>

        <h4>响应说明：</h4>
        <ul>
          <li>success: true/false - 表示验证是否成功</li>
          <li>message: 返回的消息说明</li>
        </ul>
      </Typography>
    </Card>
  );
};

export default ApiDocs; 