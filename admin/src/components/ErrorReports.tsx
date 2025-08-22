/**
 * 错误统计报告组件
 * 提供错误数据的统计分析和报告生成功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  DatePicker,
  Select,
  Button,
  Table,
  Statistic,
  Progress,
  Tag,
  Space,
  Divider,
  Alert,
  Tooltip,
  Modal,
  Form,
  Input,
  message,
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  ProjectOutlined,
  BugOutlined,
  UserOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 错误统计数据接口
 */
interface ErrorStats {
  totalErrors: number;
  resolvedErrors: number;
  unresolvedErrors: number;
  newErrors: number;
  criticalErrors: number;
  affectedUsers: number;
  errorRate: number;
  avgResolutionTime: number;
}

/**
 * 项目错误统计接口
 */
interface ProjectErrorStats {
  projectName: string;
  totalErrors: number;
  errorRate: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  lastError: string;
  status: 'healthy' | 'warning' | 'critical';
}

/**
 * 错误类型统计接口
 */
interface ErrorTypeStats {
  type: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  avgResolutionTime: number;
}

/**
 * 错误统计报告组件
 * @returns JSX.Element
 */
const ErrorReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectErrorStats[]>([]);
  const [errorTypeStats, setErrorTypeStats] = useState<ErrorTypeStats[]>([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportForm] = Form.useForm();

  /**
   * 获取错误统计数据
   */
  const fetchErrorStats = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      setTimeout(() => {
        const mockErrorStats: ErrorStats = {
          totalErrors: 1248,
          resolvedErrors: 892,
          unresolvedErrors: 356,
          newErrors: 89,
          criticalErrors: 23,
          affectedUsers: 456,
          errorRate: 2.3,
          avgResolutionTime: 4.2,
        };

        const mockProjectStats: ProjectErrorStats[] = [
          {
            projectName: '前端项目',
            totalErrors: 456,
            errorRate: 3.2,
            trend: 'down',
            trendValue: 12,
            lastError: '2小时前',
            status: 'warning',
          },
          {
            projectName: '后端API',
            totalErrors: 234,
            errorRate: 1.8,
            trend: 'up',
            trendValue: 8,
            lastError: '30分钟前',
            status: 'healthy',
          },
          {
            projectName: '移动端',
            totalErrors: 558,
            errorRate: 4.1,
            trend: 'up',
            trendValue: 25,
            lastError: '5分钟前',
            status: 'critical',
          },
        ];

        const mockErrorTypeStats: ErrorTypeStats[] = [
          {
            type: 'TypeError',
            count: 456,
            percentage: 36.5,
            trend: 'down',
            avgResolutionTime: 3.2,
          },
          {
            type: 'ReferenceError',
            count: 234,
            percentage: 18.8,
            trend: 'stable',
            avgResolutionTime: 2.8,
          },
          {
            type: 'SyntaxError',
            count: 189,
            percentage: 15.1,
            trend: 'up',
            avgResolutionTime: 1.5,
          },
          {
            type: 'NetworkError',
            count: 167,
            percentage: 13.4,
            trend: 'down',
            avgResolutionTime: 5.6,
          },
          {
            type: 'Other',
            count: 202,
            percentage: 16.2,
            trend: 'stable',
            avgResolutionTime: 4.1,
          },
        ];

        setErrorStats(mockErrorStats);
        setProjectStats(mockProjectStats);
        setErrorTypeStats(mockErrorTypeStats);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('获取统计数据失败');
      setLoading(false);
    }
  };

  /**
   * 组件挂载时获取数据
   */
  useEffect(() => {
    fetchErrorStats();
  }, [dateRange, selectedProject]);

  /**
   * 处理日期范围变化
   * @param dates 日期范围
   */
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  /**
   * 生成错误趋势图表配置
   * @returns ECharts 配置对象
   */
  const getErrorTrendOption = () => {
    const dates = Array.from({ length: 7 }, (_, i) => 
      dayjs().subtract(6 - i, 'day').format('MM-DD')
    );
    const errorCounts = [45, 52, 38, 67, 89, 76, 58];
    const resolvedCounts = [32, 41, 29, 54, 72, 63, 45];

    return {
      title: {
        text: '错误趋势分析',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: ['新增错误', '已解决错误'],
        top: '10%',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: {
        type: 'value',
        name: '数量',
      },
      series: [
        {
          name: '新增错误',
          type: 'line',
          data: errorCounts,
          smooth: true,
          itemStyle: { color: '#ff4d4f' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 77, 79, 0.3)' },
                { offset: 1, color: 'rgba(255, 77, 79, 0.1)' },
              ],
            },
          },
        },
        {
          name: '已解决错误',
          type: 'line',
          data: resolvedCounts,
          smooth: true,
          itemStyle: { color: '#52c41a' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                { offset: 1, color: 'rgba(82, 196, 26, 0.1)' },
              ],
            },
          },
        },
      ],
    };
  };

  /**
   * 生成错误类型分布图表配置
   * @returns ECharts 配置对象
   */
  const getErrorTypeDistributionOption = () => {
    const data = errorTypeStats.map(item => ({
      value: item.count,
      name: item.type,
    }));

    return {
      title: {
        text: '错误类型分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: '15%',
      },
      series: [
        {
          name: '错误类型',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '60%'],
          data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            formatter: '{b}\n{d}%',
          },
        },
      ],
    };
  };

  /**
   * 项目统计表格列配置
   */
  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string) => (
        <Space>
          <ProjectOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '错误总数',
      dataIndex: 'totalErrors',
      key: 'totalErrors',
      sorter: (a: ProjectErrorStats, b: ProjectErrorStats) => a.totalErrors - b.totalErrors,
      render: (value: number) => (
        <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value}</Text>
      ),
    },
    {
      title: '错误率',
      dataIndex: 'errorRate',
      key: 'errorRate',
      sorter: (a: ProjectErrorStats, b: ProjectErrorStats) => a.errorRate - b.errorRate,
      render: (value: number) => `${value}%`,
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string, record: ProjectErrorStats) => {
        const icon = trend === 'up' ? <RiseOutlined style={{ color: '#ff4d4f' }} /> : 
                    trend === 'down' ? <FallOutlined style={{ color: '#52c41a' }} /> : 
                    <span style={{ color: '#faad14' }}>—</span>;
        return (
          <Space>
            {icon}
            <Text>{record.trendValue}%</Text>
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          healthy: { color: 'green', text: '健康' },
          warning: { color: 'orange', text: '警告' },
          critical: { color: 'red', text: '严重' },
        };
        const { color, text } = config[status as keyof typeof config];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '最近错误',
      dataIndex: 'lastError',
      key: 'lastError',
    },
  ];

  /**
   * 错误类型统计表格列配置
   */
  const errorTypeColumns = [
    {
      title: '错误类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => (
        <Space>
          <BugOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: ErrorTypeStats, b: ErrorTypeStats) => a.count - b.count,
      render: (value: number) => (
        <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>{value}</Text>
      ),
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (value: number) => (
        <div>
          <Progress percent={value} size="small" showInfo={false} />
          <Text style={{ fontSize: '12px' }}>{value}%</Text>
        </div>
      ),
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => {
        const icon = trend === 'up' ? <RiseOutlined style={{ color: '#ff4d4f' }} /> : 
                    trend === 'down' ? <FallOutlined style={{ color: '#52c41a' }} /> : 
                    <span style={{ color: '#faad14' }}>—</span>;
        return icon;
      },
    },
    {
      title: '平均解决时间',
      dataIndex: 'avgResolutionTime',
      key: 'avgResolutionTime',
      render: (value: number) => `${value}小时`,
    },
  ];

  /**
   * 处理导出报告
   * @param values 表单值
   */
  const handleExportReport = async (values: any) => {
    try {
      message.loading('正在生成报告...', 2);
      // 模拟导出过程
      setTimeout(() => {
        message.success(`${values.format === 'excel' ? 'Excel' : 'PDF'}报告已生成并下载`);
        setExportModalVisible(false);
        exportForm.resetFields();
      }, 2000);
    } catch (error) {
      message.error('导出报告失败');
    }
  };

  if (!errorStats) {
    return <Card loading={loading} style={{ height: '400px' }} />;
  }

  return (
    <div>
      {/* 筛选控件 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <div>
                <CalendarOutlined style={{ marginRight: 8 }} />
                <Text strong>时间范围：</Text>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ marginLeft: 8 }}
                />
              </div>
              <div>
                <ProjectOutlined style={{ marginRight: 8 }} />
                <Text strong>项目：</Text>
                <Select
                  value={selectedProject}
                  onChange={setSelectedProject}
                  style={{ width: 150, marginLeft: 8 }}
                >
                  <Option value="all">全部项目</Option>
                  <Option value="frontend">前端项目</Option>
                  <Option value="backend">后端API</Option>
                  <Option value="mobile">移动端</Option>
                </Select>
              </div>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => setExportModalVisible(true)}
            >
              导出报告
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="错误总数"
              value={errorStats.totalErrors}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
              suffix={
                <Tooltip title="相比上周增长8%">
                  <InfoCircleOutlined style={{ color: '#bfbfbf' }} />
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已解决"
              value={errorStats.resolvedErrors}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ({((errorStats.resolvedErrors / errorStats.totalErrors) * 100).toFixed(1)}%)
                  </Text>
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="影响用户"
              value={errorStats.affectedUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="错误率"
              value={errorStats.errorRate}
              precision={1}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="错误趋势分析" extra={<BarChartOutlined />}>
            <ReactECharts
              option={getErrorTrendOption()}
              style={{ height: '400px' }}
              opts={{ renderer: 'canvas' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="错误类型分布" extra={<GlobalOutlined />}>
            <ReactECharts
              option={getErrorTypeDistributionOption()}
              style={{ height: '400px' }}
              opts={{ renderer: 'canvas' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 项目统计表格 */}
      <Card title="项目错误统计" style={{ marginBottom: 16 }}>
        <Table
          columns={projectColumns}
          dataSource={projectStats}
          rowKey="projectName"
          pagination={false}
          size="middle"
        />
      </Card>

      {/* 错误类型统计表格 */}
      <Card title="错误类型统计">
        <Table
          columns={errorTypeColumns}
          dataSource={errorTypeStats}
          rowKey="type"
          pagination={false}
          size="middle"
        />
      </Card>

      {/* 导出报告模态框 */}
      <Modal
        title="导出错误报告"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
      >
        <Form
          form={exportForm}
          layout="vertical"
          onFinish={handleExportReport}
        >
          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Select placeholder="选择导出格式">
              <Option value="excel">
                <Space>
                  <FileExcelOutlined style={{ color: '#52c41a' }} />
                  Excel 格式
                </Space>
              </Option>
              <Option value="pdf">
                <Space>
                  <FilePdfOutlined style={{ color: '#ff4d4f' }} />
                  PDF 格式
                </Space>
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="reportName"
            label="报告名称"
            rules={[{ required: true, message: '请输入报告名称' }]}
          >
            <Input placeholder="输入报告名称" />
          </Form.Item>
          
          <Form.Item
            name="includeCharts"
            label="包含图表"
            valuePropName="checked"
            initialValue={true}
          >
            <Select defaultValue={true}>
              <Option value={true}>包含图表</Option>
              <Option value={false}>仅数据表格</Option>
            </Select>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setExportModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                导出
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ErrorReports;