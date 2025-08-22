/**
 * 数据导出组件
 * 提供多种格式的数据导出功能，包括 Excel、CSV、PDF 等
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Checkbox,
  Radio,
  message,
  Progress,
  Typography,
  Divider,
  Card,
  Row,
  Col,
  Alert
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LoadingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;

/**
 * 导出格式常量
 */
const ExportFormat = {
  EXCEL: 'excel',
  CSV: 'csv',
  PDF: 'pdf',
  JSON: 'json'
} as const;

type ExportFormat = typeof ExportFormat[keyof typeof ExportFormat];

/**
 * 导出数据类型常量
 */
const ExportDataType = {
  ERROR_REPORTS: 'error_reports',
  USER_ANALYTICS: 'user_analytics',
  SYSTEM_METRICS: 'system_metrics',
  PROJECT_STATISTICS: 'project_statistics'
} as const;

type ExportDataType = typeof ExportDataType[keyof typeof ExportDataType];

/**
 * 导出配置接口
 */
interface ExportConfig {
  format: ExportFormat;
  dataType: ExportDataType;
  dateRange: [Dayjs, Dayjs];
  includeFields: string[];
  filters?: Record<string, any>;
}

/**
 * 导出状态接口
 */
interface ExportStatus {
  isExporting: boolean;
  progress: number;
  message: string;
  downloadUrl?: string;
}

/**
 * 数据导出组件属性
 */
interface DataExportProps {
  visible: boolean;
  onCancel: () => void;
  defaultDataType?: ExportDataType;
  onExportComplete?: (downloadUrl: string) => void;
}

/**
 * 数据导出组件
 * @param props 组件属性
 * @returns JSX.Element
 */
const DataExport: React.FC<DataExportProps> = ({
  visible,
  onCancel,
  defaultDataType = ExportDataType.ERROR_REPORTS,
  onExportComplete
}) => {
  const [form] = Form.useForm();
  const [exportStatus, setExportStatus] = useState<ExportStatus>({
    isExporting: false,
    progress: 0,
    message: ''
  });
  const [selectedDataType, setSelectedDataType] = useState<ExportDataType>(defaultDataType);

  /**
   * 获取数据类型对应的可选字段
   */
  const getAvailableFields = (dataType: ExportDataType): Array<{ label: string; value: string }> => {
    const fieldMap = {
      [ExportDataType.ERROR_REPORTS]: [
        { label: '错误ID', value: 'id' },
        { label: '错误消息', value: 'message' },
        { label: '错误类型', value: 'type' },
        { label: '错误级别', value: 'level' },
        { label: '发生时间', value: 'timestamp' },
        { label: '项目名称', value: 'project' },
        { label: '用户代理', value: 'userAgent' },
        { label: '页面URL', value: 'url' },
        { label: '堆栈信息', value: 'stack' },
        { label: '用户ID', value: 'userId' },
        { label: '会话ID', value: 'sessionId' }
      ],
      [ExportDataType.USER_ANALYTICS]: [
        { label: '用户ID', value: 'userId' },
        { label: '用户名', value: 'username' },
        { label: '邮箱', value: 'email' },
        { label: '注册时间', value: 'registerTime' },
        { label: '最后登录', value: 'lastLogin' },
        { label: '登录次数', value: 'loginCount' },
        { label: '活跃度', value: 'activity' },
        { label: '设备类型', value: 'deviceType' },
        { label: '浏览器', value: 'browser' },
        { label: '地理位置', value: 'location' }
      ],
      [ExportDataType.SYSTEM_METRICS]: [
        { label: '时间戳', value: 'timestamp' },
        { label: 'CPU使用率', value: 'cpu' },
        { label: '内存使用率', value: 'memory' },
        { label: '磁盘使用率', value: 'disk' },
        { label: '网络流量', value: 'network' },
        { label: '响应时间', value: 'responseTime' },
        { label: '错误率', value: 'errorRate' },
        { label: '并发用户数', value: 'concurrentUsers' },
        { label: '请求数', value: 'requestCount' }
      ],
      [ExportDataType.PROJECT_STATISTICS]: [
        { label: '项目ID', value: 'projectId' },
        { label: '项目名称', value: 'projectName' },
        { label: '创建时间', value: 'createTime' },
        { label: '总错误数', value: 'totalErrors' },
        { label: '未解决错误', value: 'unresolvedErrors' },
        { label: '今日错误', value: 'todayErrors' },
        { label: '活跃用户数', value: 'activeUsers' },
        { label: '页面浏览量', value: 'pageViews' },
        { label: '平均响应时间', value: 'avgResponseTime' }
      ]
    };
    return fieldMap[dataType] || [];
  };

  /**
   * 获取格式图标
   */
  const getFormatIcon = (format: ExportFormat) => {
    const iconMap = {
      [ExportFormat.EXCEL]: <FileExcelOutlined style={{ color: '#52c41a' }} />,
      [ExportFormat.CSV]: <FileTextOutlined style={{ color: '#1890ff' }} />,
      [ExportFormat.PDF]: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
      [ExportFormat.JSON]: <FileTextOutlined style={{ color: '#722ed1' }} />
    };
    return iconMap[format];
  };

  /**
   * 模拟导出过程
   */
  const simulateExport = async (config: ExportConfig): Promise<string> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setExportStatus({
            isExporting: false,
            progress: 100,
            message: '导出完成',
            downloadUrl: `/downloads/export_${Date.now()}.${config.format}`
          });
          resolve(`/downloads/export_${Date.now()}.${config.format}`);
        } else {
          setExportStatus(prev => ({
            ...prev,
            progress: Math.floor(progress),
            message: `正在导出数据... ${Math.floor(progress)}%`
          }));
        }
      }, 200);
    });
  };

  /**
   * 处理导出
   */
  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      const config: ExportConfig = {
        format: values.format,
        dataType: values.dataType,
        dateRange: values.dateRange,
        includeFields: values.includeFields || [],
        filters: values.filters
      };

      setExportStatus({
        isExporting: true,
        progress: 0,
        message: '开始导出数据...'
      });

      const downloadUrl = await simulateExport(config);
      
      message.success('数据导出成功！');
      onExportComplete?.(downloadUrl);
      
      // 3秒后重置状态
      setTimeout(() => {
        setExportStatus({
          isExporting: false,
          progress: 0,
          message: ''
        });
      }, 3000);
      
    } catch (error) {
      message.error('导出失败，请重试');
      setExportStatus({
        isExporting: false,
        progress: 0,
        message: '导出失败'
      });
    }
  };

  /**
   * 下载文件
   */
  const handleDownload = () => {
    if (exportStatus.downloadUrl) {
      // 模拟下载
      const link = document.createElement('a');
      link.href = exportStatus.downloadUrl;
      link.download = exportStatus.downloadUrl.split('/').pop() || 'export';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('下载开始');
    }
  };

  /**
   * 重置表单
   */
  const handleReset = () => {
    form.resetFields();
    setExportStatus({
      isExporting: false,
      progress: 0,
      message: ''
    });
  };

  /**
   * 关闭弹窗
   */
  const handleCancel = () => {
    if (!exportStatus.isExporting) {
      handleReset();
      onCancel();
    }
  };

  return (
    <Modal
      title="数据导出"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={exportStatus.isExporting}>
          取消
        </Button>,
        <Button key="reset" onClick={handleReset} disabled={exportStatus.isExporting}>
          重置
        </Button>,
        exportStatus.downloadUrl ? (
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
            下载文件
          </Button>
        ) : (
          <Button 
            key="export" 
            type="primary" 
            loading={exportStatus.isExporting}
            icon={exportStatus.isExporting ? <LoadingOutlined /> : <DownloadOutlined />}
            onClick={handleExport}
          >
            {exportStatus.isExporting ? '导出中...' : '开始导出'}
          </Button>
        )
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          format: ExportFormat.EXCEL,
          dataType: defaultDataType,
          dateRange: [dayjs().subtract(7, 'day'), dayjs()],
          includeFields: getAvailableFields(defaultDataType).map(field => field.value)
        }}
      >
        {/* 导出进度 */}
        {exportStatus.isExporting && (
          <Alert
            message="正在导出数据"
            description={
              <div style={{ marginTop: 16 }}>
                <Progress percent={exportStatus.progress} status="active" />
                <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                  {exportStatus.message}
                </Text>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 导出完成 */}
        {exportStatus.downloadUrl && (
          <Alert
            message="导出完成"
            description="数据已成功导出，点击下载按钮获取文件"
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="dataType"
              label="数据类型"
              rules={[{ required: true, message: '请选择数据类型' }]}
            >
              <Select
                placeholder="选择要导出的数据类型"
                onChange={(value) => {
                  setSelectedDataType(value);
                  // 重置字段选择
                  form.setFieldsValue({
                    includeFields: getAvailableFields(value).map(field => field.value)
                  });
                }}
              >
                <Option value={ExportDataType.ERROR_REPORTS}>错误报告</Option>
                <Option value={ExportDataType.USER_ANALYTICS}>用户分析</Option>
                <Option value={ExportDataType.SYSTEM_METRICS}>系统指标</Option>
                <Option value={ExportDataType.PROJECT_STATISTICS}>项目统计</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="format"
              label="导出格式"
              rules={[{ required: true, message: '请选择导出格式' }]}
            >
              <Radio.Group>
                <Radio.Button value={ExportFormat.EXCEL}>
                  {getFormatIcon(ExportFormat.EXCEL)} Excel
                </Radio.Button>
                <Radio.Button value={ExportFormat.CSV}>
                  {getFormatIcon(ExportFormat.CSV)} CSV
                </Radio.Button>
                <Radio.Button value={ExportFormat.PDF}>
                  {getFormatIcon(ExportFormat.PDF)} PDF
                </Radio.Button>
                <Radio.Button value={ExportFormat.JSON}>
                  {getFormatIcon(ExportFormat.JSON)} JSON
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="dateRange"
          label="时间范围"
          rules={[{ required: true, message: '请选择时间范围' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            placeholder={['开始时间', '结束时间']}
          />
        </Form.Item>

        <Form.Item
          name="includeFields"
          label="包含字段"
          rules={[{ required: true, message: '请至少选择一个字段' }]}
        >
          <Checkbox.Group style={{ width: '100%' }}>
            <Row gutter={[16, 8]}>
              {getAvailableFields(selectedDataType).map(field => (
                <Col span={8} key={field.value}>
                  <Checkbox value={field.value}>{field.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>

        <Divider />

        <Card size="small" title="导出说明" style={{ backgroundColor: '#fafafa' }}>
          <Space direction="vertical" size="small">
            <Text type="secondary">• Excel格式：适合数据分析和图表制作</Text>
            <Text type="secondary">• CSV格式：通用格式，可用于数据导入</Text>
            <Text type="secondary">• PDF格式：适合报告展示和打印</Text>
            <Text type="secondary">• JSON格式：适合程序处理和API对接</Text>
          </Space>
        </Card>
      </Form>
    </Modal>
  );
};

export default DataExport;
export { ExportFormat, ExportDataType };
export type { ExportConfig, DataExportProps };