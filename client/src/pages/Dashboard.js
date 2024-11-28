import React, { useState, useEffect } from 'react';
import { Layout, Menu, Popconfirm, Button, Tooltip, Divider } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  PlusOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  LogoutOutlined,
  ApiOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { messages } from '../locales';

const { Header, Sider, Content } = Layout;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState('');
  const { lang } = useLanguage();
  const t = messages[lang];

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    setUserRole(userInfo.role);
    setUsername(userInfo.username);
  }, []);

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
      label: t.menu.generateKey,
    },
    {
      key: '/keys/list',
      icon: <UnorderedListOutlined />,
      label: t.menu.keyList,
    },
    {
      key: '/api',
      icon: <ApiOutlined />,
      label: t.menu.apiDocs,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t.menu.settings,
    },
    userRole === 'admin' && {
      key: '/users',
      icon: <TeamOutlined />,
      label: t.menu.userManagement,
    }
  ].filter(Boolean);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/keys/generate')) return t.menu.generateKey;
    if (path.includes('/keys/list')) return t.menu.keyList;
    if (path.includes('/api')) return t.menu.apiDocs;
    if (path.includes('/settings')) return t.menu.settings;
    if (path.includes('/users')) return t.menu.userManagement;
    return '';
  };

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
          {collapsed ? 'WS' : t.login.title}
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
            title={t.common.logout.confirm}
            onConfirm={handleLogout}
            okText={t.common.logout.confirmButton}
            cancelText={t.common.logout.cancelButton}
            placement="topRight"
          >
            <div 
              style={{ 
                padding: '12px 24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {!collapsed && (
                <div style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '14px',
                  textAlign: 'left'
                }}>
                  {username}
                </div>
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.45)',
                textAlign: 'left'
              }}>
                {!collapsed && <span style={{ marginRight: '10px' }}>{t.common.logout.title}</span>}
                <LogoutOutlined style={{ fontSize: '16px' }} />
              </div>
            </div>
          </Popconfirm>
        </div>
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
            <span style={{ 
              fontSize: '16px',
              marginLeft: '16px',
              fontWeight: 500
            }}>
              {getPageTitle()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Divider type="vertical" style={{ height: 24 }} />
            <Tooltip 
              title={
                <div>
                  {t.common.contact.contactPerson}<br/>
                  {t.common.contact.wechat}
                </div>
              }
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<UserOutlined />}
                style={{
                  fontSize: '16px',
                  height: 64,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {t.common.contact.title}
              </Button>
            </Tooltip>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard; 