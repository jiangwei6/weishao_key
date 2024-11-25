import React, { useState } from 'react';
import { Layout, Menu, Popconfirm, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  PlusOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  LogoutOutlined,
  ApiOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleMenuClick = (key) => {
    if (key === 'logout') {
      return;
    }
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/keys/generate',
      icon: <PlusOutlined />,
      label: '生成Key',
    },
    {
      key: '/keys/list',
      icon: <UnorderedListOutlined />,
      label: 'Key列表',
    },
    {
      key: '/api',
      icon: <ApiOutlined />,
      label: 'API文档',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null}
        collapsible 
        collapsed={collapsed}
        breakpoint="lg"
        style={{ 
          background: '#131416',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          height: '100vh'
        }}
      >
        <div 
          style={{ 
            height: '64px', 
            margin: '16px', 
            color: '#fff',
            textAlign: 'center',
            lineHeight: '64px',
            fontSize: collapsed ? '16px' : '24px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          {collapsed ? 'WS' : '威少激活'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{
            background: '#131416',
            flex: 1
          }}
          className="custom-menu"
        />
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#131416'
        }}>
          <Popconfirm
            title="确认退出登录？"
            onConfirm={handleLogout}
            okText="确认"
            cancelText="取消"
            placement="topRight"
          >
            <Button 
              type="text" 
              style={{ 
                color: 'rgba(255,255,255,0.45)',
                width: '100%',
                height: '50px',
                paddingLeft: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start'
              }}
            >
              <LogoutOutlined style={{ fontSize: '16px' }} />
              {!collapsed && <span style={{ marginLeft: '10px' }}>退出登录</span>}
            </Button>
          </Popconfirm>
        </div>
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard; 