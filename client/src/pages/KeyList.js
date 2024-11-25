import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, message, Popconfirm, Space, Input, 
  Statistic, Row, Col, Skeleton, Modal, Upload, Dropdown,
  Menu, Checkbox
} from 'antd';
import { 
  DeleteOutlined, CopyOutlined, DownloadOutlined,
  UploadOutlined, SettingOutlined, ReloadOutlined,
  FileExcelOutlined, FileTextOutlined
} from '@ant-design/icons';
import axios from '../utils/axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const KeyList = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    duration: null,
    status: null
  });
  const [visibleColumns, setVisibleColumns] = useState([
    'key', 'duration', 'createdAt', 'status', 'note', 'action'
  ]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  const durationOptions = [
    { text: '1天', value: 1 },
    { text: '30天', value: 30 },
    { text: '90天', value: 90 },
    { text: '365天', value: 365 }
  ];

  const statusOptions = [
    { text: '未激活', value: 'inactive' },
    { text: '已激活', value: 'active' }
  ];

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 300,
      ellipsis: true,
      responsive: ['md'],
    },
    {
      title: 'Key (简略)',
      dataIndex: 'key',
      key: 'key-short',
      responsive: ['xs', 'sm'],
      render: (text) => text.substring(0, 8) + '...',
      width: 100,
    },
    {
      title: '有效期',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      filters: durationOptions,
      onFilter: (value, record) => record.duration === value,
      render: (text) => `${text}天`,
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['md'],
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: statusOptions,
      onFilter: (value, record) => record.status === value,
      render: (text) => text === 'active' ? '已激活' : '未激活',
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record.key)}
          >
            复制
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    const savedColumns = localStorage.getItem('tableColumns');
    if (savedColumns) {
      setVisibleColumns(JSON.parse(savedColumns));
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      console.log('开始获取数据');
      const response = await axios.get('/api/keys');
      console.log('获取到的数据:', response.data);
      
      if (response.data.success) {
        const keyData = response.data.data?.list || [];
        setKeys(keyData);
        
        if (response.data.data?.stats) {
          setStats(response.data.data.stats);
        } else {
          const total = keyData.length;
          const active = keyData.filter(k => k.status === 'active').length;
          setStats({
            total,
            active,
            inactive: total - active
          });
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/keys/${id}`);
      message.success('删除成功');
      fetchKeys();
    } catch (error) {
      message.error('删除失败');
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
    try {
      await Promise.all(selectedRowKeys.map(id => axios.delete(`/api/keys/${id}`)));
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      fetchKeys();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  const handleExport = (format = 'xlsx') => {
    const dataToExport = selectedRowKeys.length > 0
      ? keys.filter(item => selectedRowKeys.includes(item._id))
      : filteredKeys;

    const exportData = dataToExport.map(item => ({
      'Key': item.key,
      '有效期(天)': item.duration,
      '生成时间': new Date(item.createdAt).toLocaleString(),
      '状态': item.status === 'active' ? '已激活' : '未激活',
      '备注': item.note || ''
    }));

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Keys');
      XLSX.writeFile(wb, `keys_export_${new Date().toLocaleDateString()}.xlsx`);
    } else {
      const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(exportData));
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `keys_export_${new Date().toLocaleDateString()}.csv`);
    }
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        message.success(`成功导入 ${jsonData.length} 条数据`);
        fetchKeys();
      } catch (error) {
        message.error('导入失败');
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const columnMenu = (
    <Menu>
      {columns.map(col => (
        <Menu.Item key={col.key}>
          <Checkbox
            checked={visibleColumns.includes(col.key)}
            onChange={e => {
              const newColumns = e.target.checked
                ? [...visibleColumns, col.key]
                : visibleColumns.filter(key => key !== col.key);
              setVisibleColumns(newColumns);
              localStorage.setItem('tableColumns', JSON.stringify(newColumns));
            }}
          >
            {col.title}
          </Checkbox>
        </Menu.Item>
      ))}
    </Menu>
  );

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

  const visibleColumnsList = columns.filter(col => visibleColumns.includes(col.key));

  const filteredKeys = Array.isArray(keys) ? keys.filter(key => {
    const noteMatch = !searchText || 
      (key.note && key.note.toLowerCase().includes(searchText.toLowerCase()));

    const durationMatch = !filters.duration || key.duration === filters.duration;

    const statusMatch = !filters.status || key.status === filters.status;

    return noteMatch && durationMatch && statusMatch;
  }) : [];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="总数量" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="已激活" value={stats.active} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="未激活" value={stats.inactive} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Key列表"
        extra={
          <Space wrap size="small">
            <Input.Search
              placeholder="搜索备注"
              allowClear
              onSearch={value => setSearchText(value)}
              style={{ width: 200 }}
            />
            <Upload
              beforeUpload={handleImport}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                导入
              </Button>
            </Upload>
            <Dropdown overlay={exportMenu}>
              <Button icon={<DownloadOutlined />}>
                导出
              </Button>
            </Dropdown>
            <Dropdown overlay={columnMenu}>
              <Button icon={<SettingOutlined />}>
                列设置
              </Button>
            </Dropdown>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchKeys()}
            >
              刷新
            </Button>
            <Popconfirm
              title="确定要删除选中项吗？"
              onConfirm={handleBatchDelete}
              disabled={selectedRowKeys.length === 0}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={selectedRowKeys.length === 0}
              >
                批量删除
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={visibleColumnsList}
          dataSource={filteredKeys}
          rowKey="_id"
          loading={{
            spinning: loading,
            indicator: <Skeleton active />
          }}
          scroll={{ x: 'max-content' }}
          size="small"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          expandable={{
            expandedRowRender: record => (
              <div>
                <p><strong>完整Key：</strong> {record.key}</p>
                <p><strong>生成时间：</strong> {new Date(record.createdAt).toLocaleString()}</p>
                {record.note && <p><strong>备注：</strong> {record.note}</p>}
              </div>
            ),
            rowExpandable: record => true
          }}
        />
      </Card>
    </>
  );
};

export default KeyList; 