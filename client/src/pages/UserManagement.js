import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, 
  Select, message, Space, Popconfirm, Tag, DatePicker 
} from 'antd';
import axios from '../utils/axios';
import { ReloadOutlined } from '@ant-design/icons';
import { formatDateTime } from '../utils/dateUtils';

const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordForm] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    const cacheKey = 'userListCache';
    const cacheTime = 5 * 60 * 1000; // 5分钟缓存

    try {
      setLoading(true);

      // 检查缓存
      const cache = localStorage.getItem(cacheKey);
      if (cache) {
        const { data, timestamp } = JSON.parse(cache);
        if (Date.now() - timestamp < cacheTime) {
          console.log('Using cached user list');
          setUsers(data);
          setLoading(false);
          return;
        }
      }

      const response = await axios.get('/api/users');
      if (response.data.success) {
        // 更新缓存
        localStorage.setItem(cacheKey, JSON.stringify({
          data: response.data.data,
          timestamp: Date.now()
        }));
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加手动刷新功能
  const handleRefresh = () => {
    localStorage.removeItem('userListCache');
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 处理用户创建/编辑
  const handleSubmit = async (values) => {
    try {
      console.log('提交的表单数据:', values);
      const data = {
        ...values,
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null
      };
      console.log('发送到服务器的数据:', data);

      if (editingUser) {
        const response = await axios.put(`/api/users/${editingUser._id}`, data);
        console.log('更新响应:', response.data);
        message.success('用户更新成功');
      } else {
        const response = await axios.post('/api/users', data);
        console.log('创建响应:', response.data);
        message.success('用户创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('提交失败:', error);
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 处理用户删除
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/users/${id}`);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 处理解锁用户
  const handleUnlock = async (user) => {
    try {
      await axios.put(`/api/users/${user._id}`, {
        isLocked: false
      });
      message.success('用户已解锁');
      fetchUsers();
    } catch (error) {
      message.error('解锁失败');
    }
  };

  // 处理密码修改
  const handlePasswordChange = async (values) => {
    try {
      await axios.put(`/api/users/${selectedUser._id}/password`, {
        password: values.password
      });
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const colors = {
          admin: 'red',
          user: 'blue',
          guest: 'green'
        };
        return <Tag color={colors[role]}>{role.toUpperCase()}</Tag>;
      }
    },
    {
      title: '到期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (text, record) => {
        if (record.role !== 'user') return '-';
        return text ? formatDateTime(text) : '永久';
      }
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'green' : 'red'}>
          {record.status === 'active' ? '正常' : '已锁定'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDateTime(date)
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          defaultValue={text}
          autoSize={{ minRows: 1, maxRows: 3 }}
          onBlur={async (e) => {
            const newNote = e.target.value;
            if (newNote !== text) {
              try {
                await axios.put(`/api/users/${record._id}`, {
                  ...record,
                  note: newNote
                });
                message.success('备注更新成功');
                fetchUsers();  // 刷新列表
              } catch (error) {
                message.error('备注更新失败');
                e.target.value = text;  // 恢复原值
              }
            }
          }}
          placeholder="点击添加备注"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.role !== 'guest' && (
            <>
              <Button 
                type="link" 
                onClick={() => {
                  setEditingUser(record);
                  form.setFieldsValue(record);
                  setModalVisible(true);
                }}
              >
                编辑
              </Button>
              <Button
                type="link"
                onClick={() => {
                  setSelectedUser(record);
                  setPasswordModalVisible(true);
                }}
              >
                修改密码
              </Button>
            </>
          )}
          {record.isLocked && (
            <Button 
              type="link" 
              onClick={() => handleUnlock(record)}
            >
              解锁
            </Button>
          )}
          {record.role !== 'admin' && record.role !== 'guest' && (
            <Popconfirm
              title="确定要删除此用户吗？"
              onConfirm={() => handleDelete(record._id)}
            >
              <Button type="link" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card 
      title="用户管理" 
      extra={
        <Space>
          <Button 
            type="primary" 
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            添加用户
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            刷新
          </Button>
        </Space>
      }
    >
      <Table 
        columns={columns} 
        dataSource={users}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="user">普通用户</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
          >
            {({ getFieldValue }) => 
              getFieldValue('role') === 'user' && (
                <Form.Item
                  name="expiresAt"
                  label="到期时间"
                  extra="不设置则永久有效"
                >
                  <DatePicker 
                    showTime 
                    style={{ width: '100%' }}
                    placeholder="请选择到期时间"
                    format="YYYY-MM-DD HH:mm:ss"
                  />
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item
            name="note"
            label="备注"
          >
            <Input.TextArea
              placeholder="请输入备注信息"
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingUser ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          onFinish={handlePasswordChange}
          layout="vertical"
        >
          <Form.Item
            name="password"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement; 