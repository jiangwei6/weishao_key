import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, message, Popconfirm, Space, Input, 
  Statistic, Row, Col, Dropdown, Menu, Tag, Modal, Form, Checkbox
} from 'antd';
import { 
  DeleteOutlined, CopyOutlined, DownloadOutlined,
  ReloadOutlined, FileExcelOutlined, FileTextOutlined,
  CheckCircleOutlined, KeyOutlined, MoreOutlined, EditOutlined
} from '@ant-design/icons';
import axios from '../utils/axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDateTime } from '../utils/dateUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { messages } from '../locales';

const KeyList = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({});
  const [statusFilter, setStatusFilter] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteForm] = Form.useForm();
  const { lang } = useLanguage();
  const t = messages[lang].keyList;
  const commonT = messages[lang].common.operation;

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async (page = 1, pageSize = 10, status = statusFilter) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        status
      };
      const response = await axios.get('/api/keys', { params });
      
      if (response.data.success) {
        setKeys(response.data.data.list || []);
        setStats(response.data.data.stats || {
          total: 0,
          active: 0,
          inactive: 0
        });
      }
    } catch (error) {
      message.error('获取Key列表失败');
      setKeys([]);
      setStats({
        total: 0,
        active: 0,
        inactive: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/keys/${id}`);
      message.success('删除成功');
      fetchKeys();
    } catch (error) {
      console.error('删除失败:', error);
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('复制成功');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的Key');
      return;
    }

    try {
      await axios.post('/api/keys/batch-delete', {
        ids: selectedRowKeys
      });
      message.success(`成功删除${selectedRowKeys.length}个Key`);
      setSelectedRowKeys([]);
      fetchKeys();
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error(error.response?.data?.message || '批量删除失败');
    }
  };

  const handleExport = (format = 'xlsx') => {
    if (keys.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    message.loading('正在准备导出...', 0.5);
    
    const dataToExport = selectedRowKeys.length > 0
      ? keys.filter(item => selectedRowKeys.includes(item._id))
      : keys;

    const exportData = dataToExport.map(item => ({
      'Key': item.key,
      '有效期(天)': item.duration,
      'Bean数量': item.bean,
      '生成时间': formatDateTime(item.createdAt),
      '状态': item.status === 'active' ? t.active : t.inactive,
      '备注': item.note || ''
    }));

    setTimeout(() => {
      try {
        if (format === 'xlsx') {
          const ws = XLSX.utils.json_to_sheet(exportData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Keys');
          XLSX.writeFile(wb, `keys_export_${formatDateTime(new Date()).replace(/[/:]/g, '-')}.xlsx`);
        } else {
          const BOM = '\uFEFF';
          const csv = BOM + XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(exportData));
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          saveAs(blob, `keys_export_${formatDateTime(new Date()).replace(/[/:]/g, '-')}.csv`);
        }
        message.success(`成功导出 ${exportData.length} 条数据`);
      } catch (error) {
        message.error('导出失败');
      }
    }, 500);
  };

  const exportMenu = (
    <Menu>
      <Menu.Item key="xlsx" onClick={() => handleExport('xlsx')}>
        <FileExcelOutlined /> 导出Excel
      </Menu.Item>
      <Menu.Item key="csv" onClick={() => handleExport('csv')}>
        <FileTextOutlined /> 导出CSV
      </Menu.Item>
    </Menu>
  );

  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? null : status);
    fetchKeys(1, 10, status === statusFilter ? null : status);
  };

  const filteredKeys = keys.filter(key => 
    !statusFilter || key.status === statusFilter
  );

  const handleBatchCopy = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要复制的Key');
      return;
    }

    const selectedKeys = keys
      .filter(item => selectedRowKeys.includes(item._id))
      .map(item => item.key)
      .join('\n');

    navigator.clipboard.writeText(selectedKeys).then(() => {
      message.success(`成功复制 ${selectedRowKeys.length} 个Key`);
      setSelectedRowKeys([]);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const getDurationFilters = () => {
    if (!keys || keys.length === 0) return [];
    const durationSet = new Set(keys.map(key => key.duration));
    return Array.from(durationSet)
      .sort((a, b) => a - b)
      .map(duration => ({
        text: `${duration}天`,
        value: duration
      }));
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: '40%',
      render: (text) => (
        <div 
          style={{ 
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.3s',
            '&:hover': {
              backgroundColor: 'rgba(44, 229, 123, 0.1)'
            }
          }}
          onClick={() => handleCopy(text)}
          title={`${text} (点击复制)`}
        >
          {window.innerWidth > 1200 ? text : `${text.substring(0, 20)}...`}
        </div>
      )
    },
    {
      title: '时间标记',
      dataIndex: 'duration',
      key: 'duration',
      width: '15%',
      filters: getDurationFilters(),
      filterMultiple: false,
      onFilter: (value, record) => record.duration === value,
      render: (text) => `${text}${t.days}`,
      responsive: ['sm']
    },
    {
      title: 'Bean数量',
      dataIndex: 'bean',
      key: 'bean',
      width: 150,
      align: 'center',
      render: (text) => (
        <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      align: 'center',
      render: (text) => (
        <Tag 
          icon={text === 'active' ? 
            <CheckCircleOutlined /> : 
            <KeyOutlined />
          }
          style={{ 
            padding: '4px 8px',
            borderRadius: '12px',
            ...(text === 'active' 
              ? {
                  color: '#999',
                  border: 'none',
                  background: 'none'
                }
              : {
                  color: '#52c41a',
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f'
                }
            )
          }}
        >
          {text === 'active' ? t.active : t.inactive}
        </Tag>
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '20%',
      render: (text) => formatDateTime(text),
      responsive: ['md']
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      width: '15%',
      ellipsis: true,
      responsive: ['lg'],
      render: (text, record) => (
        <div
          style={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            maxWidth: '500px',
            position: 'relative',
            padding: '4px 24px 4px 4px'
          }}
          onClick={() => {
            setEditingNote(record);
            noteForm.setFieldValue('note', record.note || '');
            setNoteModalVisible(true);
          }}
        >
          <span style={{ 
            flex: 1, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {text || '无备注'}
          </span>
          <EditOutlined 
            style={{ 
              position: 'absolute',
              right: 4,
              opacity: 0,
              color: '#1890ff',
              fontSize: '14px'
            }}
            className="edit-icon"
          />
        </div>
      )
    },
  ];

  const tableProps = {
    rowSelection: {
      selectedRowKeys,
      onChange: setSelectedRowKeys,
      selections: [
        Table.SELECTION_ALL,
        Table.SELECTION_INVERT,
        {
          key: 'none',
          text: '清除选择',
          onSelect: () => setSelectedRowKeys([])
        }
      ]
    },
    columns,
    dataSource: keys,
    rowKey: '_id',
    loading: loading,
    size: 'small',
    pagination: {
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: total => `共 ${total} 条`,
      defaultPageSize: 10,
      pageSizeOptions: ['10', '20', '50', '100'],
      total: statusFilter ? 
        (statusFilter === 'active' ? stats.active : stats.inactive) : 
        stats.total,
      onChange: (page, pageSize) => {
        fetchKeys(page, pageSize);
        setSelectedRowKeys([]);
      },
      position: ['bottomCenter']
    },
    scroll: { x: 'max-content' },
    style: { 
      width: '100%',
      overflowX: 'auto'
    },
    onChange: (pagination, filters, sorter) => {
      const { duration, status } = filters;
      fetchKeys(
        pagination.current,
        pagination.pageSize,
        status?.[0],
        duration?.[0]
      );
      setSelectedRowKeys([]);
    }
  };

  // 移动端操作菜单
  const mobileOperationMenu = ({ handleBatchCopy, handleExport, fetchKeys, handleBatchDelete }) => (
    <Menu>
      <Menu.Item key="search">
        <Input.Search
          placeholder={t.searchPlaceholder}
          allowClear
          onSearch={value => {
            setSearchText(value);
            setSelectedRowKeys([]);
          }}
        />
      </Menu.Item>
      <Menu.Item 
        key="copy" 
        icon={<CopyOutlined />}
        disabled={selectedRowKeys.length === 0}
        onClick={handleBatchCopy}
      >
        {`${t.batchCopy}${selectedRowKeys.length ? ` (${selectedRowKeys.length})` : ''}`}
      </Menu.Item>
      <Menu.SubMenu 
        key="export" 
        icon={<DownloadOutlined />} 
        title={commonT.export}
      >
        <Menu.Item key="xlsx" onClick={() => handleExport('xlsx')}>
          <FileExcelOutlined /> {t.exportExcel}
        </Menu.Item>
        <Menu.Item key="csv" onClick={() => handleExport('csv')}>
          <FileTextOutlined /> {t.exportCSV}
        </Menu.Item>
      </Menu.SubMenu>
      <Menu.Item 
        key="refresh" 
        icon={<ReloadOutlined />}
        onClick={() => {
          fetchKeys();
          setSelectedRowKeys([]);
        }}
      >
        {commonT.refresh}
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        disabled={selectedRowKeys.length === 0}
        danger
      >
        <Popconfirm
          title={t.confirmDelete}
          onConfirm={handleBatchDelete}
          okText={commonT.confirm}
          cancelText={commonT.cancel}
        >
          {`${t.batchDelete}${selectedRowKeys.length ? ` (${selectedRowKeys.length})` : ''}`}
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  // 处理备注编辑
  const handleNoteEdit = async (values) => {
    try {
      await axios.put(`/api/keys/${editingNote._id}/note`, {
        note: values.note
      });
      message.success('备注更新成功');
      setNoteModalVisible(false);
      fetchKeys();
    } catch (error) {
      console.error('更新备注失败:', error);
      message.error(error.response?.data?.message || '更新备注失败');
    }
  };

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8} sm={8} md={8}>
          <Card 
            hoverable
            onClick={() => handleStatusFilter(null)}
            style={{ 
              cursor: 'pointer',
              borderColor: !statusFilter ? '#2CE57B' : 'transparent'
            }}
          >
            <Statistic 
              title={t.totalCount} 
              value={stats.total || 0}
              valueStyle={{ color: '#2CE57B' }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={8} md={8}>
          <Card 
            hoverable
            onClick={() => handleStatusFilter('inactive')}
            style={{ 
              cursor: 'pointer',
              borderColor: statusFilter === 'inactive' ? '#52c41a' : 'transparent'
            }}
          >
            <Statistic 
              title={t.inactiveCount} 
              value={stats.inactive || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={8} md={8}>
          <Card 
            hoverable
            onClick={() => handleStatusFilter('active')}
            style={{ 
              cursor: 'pointer',
              borderColor: statusFilter === 'active' ? '#999' : 'transparent'
            }}
          >
            <Statistic 
              title={t.activeCount} 
              value={stats.active || 0}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        extra={
          <>
            {/* 桌面端操作按钮 */}
            <Space wrap size="small" className="desktop-operations" style={{ 
              display: { xs: 'none', sm: 'none', md: 'flex' } 
            }}>
              <Input.Search
                placeholder={t.searchPlaceholder}
                allowClear
                onSearch={value => {
                  setSearchText(value);
                  setSelectedRowKeys([]);
                }}
                style={{ width: window.innerWidth > 576 ? 200 : 120 }}
              />
              <Button
                icon={<CopyOutlined />}
                onClick={handleBatchCopy}
                disabled={selectedRowKeys.length === 0}
              >
                {`${t.batchCopy}${selectedRowKeys.length ? ` (${selectedRowKeys.length})` : ''}`}
              </Button>
              <Dropdown overlay={
                <Menu>
                  <Menu.Item key="xlsx" onClick={() => handleExport('xlsx')}>
                    <FileExcelOutlined /> {t.exportExcel}
                  </Menu.Item>
                  <Menu.Item key="csv" onClick={() => handleExport('csv')}>
                    <FileTextOutlined /> {t.exportCSV}
                  </Menu.Item>
                </Menu>
              }>
                <Button icon={<DownloadOutlined />}>
                  {commonT.export}
                </Button>
              </Dropdown>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchKeys();
                  setSelectedRowKeys([]);
                }}
              >
                {commonT.refresh}
              </Button>
              <Popconfirm
                title={t.confirmDelete}
                onConfirm={handleBatchDelete}
                disabled={selectedRowKeys.length === 0}
                okText={commonT.confirm}
                cancelText={commonT.cancel}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={selectedRowKeys.length === 0}
                >
                  {`${t.batchDelete}${selectedRowKeys.length ? ` (${selectedRowKeys.length})` : ''}`}
                </Button>
              </Popconfirm>
            </Space>

            {/* 移动端操作按钮 */}
            <div className="mobile-operations" style={{ 
              display: { xs: 'block', sm: 'block', md: 'none' } 
            }}>
              <Dropdown 
                overlay={mobileOperationMenu({ 
                  handleBatchCopy, 
                  handleExport, 
                  fetchKeys, 
                  handleBatchDelete 
                })} 
                trigger={['click']}
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            </div>
          </>
        }
      >
        <Table {...tableProps} />
      </Card>

      {/* 添加备注编辑弹窗 */}
      <Modal
        title="编辑备注"
        open={noteModalVisible}
        onCancel={() => {
          setNoteModalVisible(false);
          setEditingNote(null);
          noteForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={noteForm}
          onFinish={handleNoteEdit}
          layout="vertical"
        >
          <Form.Item
            name="note"
            label="备注信息"
          >
            <Input.TextArea
              rows={4}
              placeholder="请输入备注信息"
              maxLength={200}
              showCount
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setNoteModalVisible(false);
                  setEditingNote(null);
                  noteForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        @media screen and (max-width: 768px) {
          .desktop-operations {
            display: none;
          }
          .mobile-operations {
            display: block;
          }
        }
        @media screen and (min-width: 769px) {
          .desktop-operations {
            display: flex;
          }
          .mobile-operations {
            display: none;
          }
        }
      `}</style>

      <style jsx global>{`
        .ant-table-row:hover .edit-icon {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
};

export default KeyList; 