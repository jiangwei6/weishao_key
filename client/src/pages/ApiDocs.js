import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, message, Spin } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import axios from '../utils/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { messages } from '../locales';

const { Text, Paragraph } = Typography;

const ApiDocs = () => {
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const t = messages[lang].apiDocs;
  const commonT = messages[lang].common.operation;

  useEffect(() => {
    const fetchApiToken = async () => {
      const cacheKey = 'apiTokenCache';
      const cacheTime = 5 * 60 * 1000; // 5分钟缓存

      try {
        setLoading(true);

        // 检查缓存
        const cache = localStorage.getItem(cacheKey);
        if (cache) {
          const { token, timestamp } = JSON.parse(cache);
          if (Date.now() - timestamp < cacheTime) {
            console.log('Using cached token');
            setApiToken(token);
            setLoading(false);
            return;
          }
        }

        const response = await axios.get('/api/settings');
        if (response.data.success) {
          const token = response.data.data.apiSettings?.token;
          if (token) {
            // 更新缓存
            localStorage.setItem(cacheKey, JSON.stringify({
              token,
              timestamp: Date.now()
            }));
            setApiToken(token);
          }
        }
      } catch (error) {
        console.error('获取API token失败:', error);
        message.error('获取API token失败');
      } finally {
        setLoading(false);
      }
    };

    fetchApiToken();
  }, []);

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
  -H "Authorization: Bearer ${apiToken}" \\
  -d '{
    "key": "your_key_here",
    "note": "激活备注信息（可选）"
  }'`;

  const getResponseExample = (lang) => {
    return lang === 'zh' ? 
      `{
  "success": true,
  "message": "验证成功",
  "data": {
    "duration": 30,
    "bean": 500,
    "activatedAt": "2024-03-20T10:30:00.000Z",
    "note": "[2024-03-20 18:30:00] 激活备注信息"
  }
}` : 
      `{
  "success": true,
  "message": "Verification successful",
  "data": {
    "duration": 30,
    "bean": 500,
    "activatedAt": "2024-03-20T10:30:00.000Z",
    "note": "[2024-03-20 18:30:00] Activation note"
  }
}`;
  };

  return (
    <Card>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip={t.loading} />
        </div>
      ) : (
        <>
          <Typography>
            <h3>{t.endpoint}</h3>
            <Paragraph>
              <Text strong>{t.endpoint}：</Text>
              <Text code>{`${baseUrl}/api/keys/verify`}</Text>
              <Button
                type="link"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(`${baseUrl}/api/keys/verify`)}
              >
                {t.copy}
              </Button>
            </Paragraph>

            <h4>{t.headers}</h4>
            <Paragraph>
              <ul>
                <li>Content-Type: application/json</li>
                <li>Authorization: Bearer {apiToken}</li>
              </ul>
            </Paragraph>

            <h4>{t.requestExample}</h4>
            <Paragraph>
              <Text code copyable>
                {curlExample}
              </Text>
            </Paragraph>

            <h4>{t.responseExample}</h4>
            <Paragraph>
              <pre style={{ 
                background: '#1f1f1f',
                padding: '16px',
                borderRadius: '8px',
                color: '#fff'
              }}>
                {getResponseExample(lang)}
              </pre>
            </Paragraph>

            <h4>{t.tips.title}</h4>
            <ul>
              {t.tips.content.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>

            <h4>{t.yourToken}</h4>
            <Paragraph>
              <Text code copyable>{apiToken || t.noToken}</Text>
            </Paragraph>
          </Typography>
        </>
      )}
    </Card>
  );
};

export default ApiDocs; 