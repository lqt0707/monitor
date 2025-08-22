/**
 * 项目配置管理页面组件
 * 提供项目的详细配置管理功能，包括基本信息、监控配置、告警规则、性能设置等
 */

import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tabs,
  InputNumber,
  Select,
  Table,
  Modal,
  message,
  Divider,
  Tag,
  Alert,
  Tooltip,
  Upload,
  Progress,
  Spin,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  BellOutlined,
  DashboardOutlined,
  SecurityScanOutlined,
  CloudUploadOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/redux";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * 告警规则接口
 */
interface AlertRule {
  id: string;
  name: string;
  type: "error_count" | "error_rate" | "performance" | "custom";
  condition: string;
  threshold: number;
  timeWindow: number;
  enabled: boolean;
  actions: string[];
  description?: string;
}

/**
 * 性能监控配置接口
 */
interface PerformanceConfig {
  enablePerformanceMonitoring: boolean;
  sampleRate: number;
  longTaskThreshold: number;
  fmpThreshold: number;
  fcpThreshold: number;
  lcpThreshold: number;
  fidThreshold: number;
  clsThreshold: number;
}

/**
 * 项目配置管理页面组件
 * @returns JSX.Element
 */
const ProjectConfig: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const { projects, loading } = useAppSelector((state: any) => state.project);

  // 表单实例
  const [basicForm] = Form.useForm();
  const [monitorForm] = Form.useForm();
  const [performanceForm] = Form.useForm();
  const [alertForm] = Form.useForm();

  // 本地状态
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 当前项目数据
  const currentProject = projects.find(
    (p: any) => p.id.toString() === projectId
  );

  /**
   * 组件挂载时初始化数据
   */
  useEffect(() => {
    if (currentProject) {
      initializeForms();
      loadAlertRules();
    }
  }, [currentProject]);

  /**
   * 初始化表单数据
   */
  const initializeForms = () => {
    // 基本信息表单
    basicForm.setFieldsValue({
      name: currentProject.name,
      description: currentProject.description,
      domain: currentProject.domain,
      environment: currentProject.environment || "production",
      version: currentProject.version || "1.0.0",
    });

    // 监控配置表单
    monitorForm.setFieldsValue({
      enableErrorMonitoring: currentProject.enableErrorMonitoring ?? true,
      enableSourcemap: currentProject.sourcemapConfig?.isEnabled ?? false,
      sourcemapUrl: currentProject.sourcemapConfig?.url || "",
      enableConsoleCapture: currentProject.enableConsoleCapture ?? true,
      enableNetworkCapture: currentProject.enableNetworkCapture ?? true,
      enableUserActions: currentProject.enableUserActions ?? true,
      maxBreadcrumbs: currentProject.maxBreadcrumbs || 50,
      sampleRate: currentProject.sampleRate || 1.0,
    });

    // 性能监控表单
    performanceForm.setFieldsValue({
      enablePerformanceMonitoring:
        currentProject.performanceConfig?.enablePerformanceMonitoring ?? false,
      sampleRate: currentProject.performanceConfig?.sampleRate || 0.1,
      longTaskThreshold:
        currentProject.performanceConfig?.longTaskThreshold || 50,
      fmpThreshold: currentProject.performanceConfig?.fmpThreshold || 3000,
      fcpThreshold: currentProject.performanceConfig?.fcpThreshold || 2000,
      lcpThreshold: currentProject.performanceConfig?.lcpThreshold || 4000,
      fidThreshold: currentProject.performanceConfig?.fidThreshold || 100,
      clsThreshold: currentProject.performanceConfig?.clsThreshold || 0.1,
    });
  };

  /**
   * 加载告警规则
   */
  const loadAlertRules = () => {
    // 模拟数据
    const mockRules: AlertRule[] = [
      {
        id: "1",
        name: "错误数量告警",
        type: "error_count",
        condition: "count > threshold",
        threshold: 10,
        timeWindow: 300,
        enabled: true,
        actions: ["email", "webhook"],
        description: "5分钟内错误数量超过10个时触发告警",
      },
      {
        id: "2",
        name: "错误率告警",
        type: "error_rate",
        condition: "rate > threshold",
        threshold: 5,
        timeWindow: 600,
        enabled: true,
        actions: ["email"],
        description: "10分钟内错误率超过5%时触发告警",
      },
    ];
    setAlertRules(mockRules);
  };

  /**
   * 保存基本信息
   * @param values 表单值
   */
  const handleSaveBasic = async (values: any) => {
    setSaving(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success("基本信息保存成功");
    } catch (error) {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  /**
   * 保存监控配置
   * @param values 表单值
   */
  const handleSaveMonitor = async (values: any) => {
    setSaving(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success("监控配置保存成功");
    } catch (error) {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  /**
   * 保存性能配置
   * @param values 表单值
   */
  const handleSavePerformance = async (values: any) => {
    setSaving(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success("性能配置保存成功");
    } catch (error) {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  /**
   * 添加告警规则
   */
  const handleAddAlert = () => {
    setEditingAlert(null);
    alertForm.resetFields();
    setAlertModalVisible(true);
  };

  /**
   * 编辑告警规则
   * @param rule 告警规则
   */
  const handleEditAlert = (rule: AlertRule) => {
    setEditingAlert(rule);
    alertForm.setFieldsValue(rule);
    setAlertModalVisible(true);
  };

  /**
   * 删除告警规则
   * @param id 规则ID
   */
  const handleDeleteAlert = (id: string) => {
    setAlertRules((prev) => prev.filter((rule) => rule.id !== id));
    message.success("告警规则删除成功");
  };

  /**
   * 保存告警规则
   * @param values 表单值
   */
  const handleSaveAlert = async (values: any) => {
    try {
      if (editingAlert) {
        // 更新规则
        setAlertRules((prev) =>
          prev.map((rule) =>
            rule.id === editingAlert.id ? { ...rule, ...values } : rule
          )
        );
        message.success("告警规则更新成功");
      } else {
        // 新增规则
        const newRule: AlertRule = {
          id: Date.now().toString(),
          ...values,
        };
        setAlertRules((prev) => [...prev, newRule]);
        message.success("告警规则添加成功");
      }
      setAlertModalVisible(false);
      alertForm.resetFields();
    } catch (error) {
      message.error("保存失败");
    }
  };

  /**
   * Sourcemap文件上传处理
   */
  const handleSourcemapUpload = {
    name: "sourcemap",
    action: "/api/upload/sourcemap",
    headers: {
      authorization: "Bearer " + localStorage.getItem("token"),
    },
    onChange(info: any) {
      if (info.file.status === "uploading") {
        setUploadProgress(info.file.percent || 0);
      }
      if (info.file.status === "done") {
        message.success(`${info.file.name} 上传成功`);
        setUploadProgress(0);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} 上传失败`);
        setUploadProgress(0);
      }
    },
  };

  // 告警规则表格列定义
  const alertColumns: ColumnsType<AlertRule> = [
    {
      title: "规则名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const typeMap = {
          error_count: "错误数量",
          error_rate: "错误率",
          performance: "性能",
          custom: "自定义",
        };
        return <Tag>{typeMap[type as keyof typeof typeMap]}</Tag>;
      },
    },
    {
      title: "阈值",
      dataIndex: "threshold",
      key: "threshold",
    },
    {
      title: "时间窗口",
      dataIndex: "timeWindow",
      key: "timeWindow",
      render: (seconds: number) => `${seconds / 60}分钟`,
    },
    {
      title: "状态",
      dataIndex: "enabled",
      key: "enabled",
      render: (enabled: boolean) => (
        <Tag color={enabled ? "green" : "default"}>
          {enabled ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditAlert(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAlert(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <Alert
        message="项目不存在"
        description="请检查项目ID是否正确"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            <SettingOutlined style={{ marginRight: 8 }} />
            项目配置 - {currentProject.name}
          </Title>
          <Text type="secondary">管理项目的详细配置和监控设置</Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              刷新
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 配置选项卡 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "basic",
            label: (
              <span>
                <InfoCircleOutlined />
                基本信息
              </span>
            ),
            children: (
              <Card>
                <Form
                  form={basicForm}
                  layout="vertical"
                  onFinish={handleSaveBasic}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="name"
                        label="项目名称"
                        rules={[
                          { required: true, message: "请输入项目名称" },
                          { max: 50, message: "项目名称不能超过50个字符" },
                        ]}
                      >
                        <Input placeholder="请输入项目名称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="environment"
                        label="环境"
                        rules={[{ required: true, message: "请选择环境" }]}
                      >
                        <Select placeholder="请选择环境">
                          <Option value="development">开发环境</Option>
                          <Option value="testing">测试环境</Option>
                          <Option value="staging">预发布环境</Option>
                          <Option value="production">生产环境</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="domain"
                        label="项目域名"
                        rules={[
                          { required: true, message: "请输入项目域名" },
                          {
                            pattern: /^[a-zA-Z0-9.-]+$/,
                            message: "请输入有效的域名",
                          },
                        ]}
                      >
                        <Input placeholder="例如：example.com" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="version"
                        label="版本号"
                        rules={[{ required: true, message: "请输入版本号" }]}
                      >
                        <Input placeholder="例如：1.0.0" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="description"
                    label="项目描述"
                    rules={[{ max: 500, message: "描述不能超过500个字符" }]}
                  >
                    <TextArea
                      placeholder="请输入项目描述"
                      rows={4}
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={saving}
                    >
                      保存基本信息
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: "monitor",
            label: (
              <span>
                <DashboardOutlined />
                监控配置
              </span>
            ),
            children: (
              <Card>
                <Form
                  form={monitorForm}
                  layout="vertical"
                  onFinish={handleSaveMonitor}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="enableErrorMonitoring"
                        label="错误监控"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="sampleRate"
                        label={
                          <span>
                            采样率
                            <Tooltip title="设置错误采样率，1.0表示100%采样">
                              <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                          </span>
                        }
                      >
                        <InputNumber
                          min={0.01}
                          max={1}
                          step={0.01}
                          style={{ width: "100%" }}
                          placeholder="1.0"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider>Sourcemap 配置</Divider>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="enableSourcemap"
                        label="启用 Sourcemap"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="sourcemapUrl"
                        label="Sourcemap URL"
                        dependencies={["enableSourcemap"]}
                      >
                        <Input placeholder="https://example.com/sourcemaps/" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="上传 Sourcemap 文件">
                    <Upload.Dragger {...handleSourcemapUpload}>
                      <p className="ant-upload-drag-icon">
                        <CloudUploadOutlined />
                      </p>
                      <p className="ant-upload-text">
                        点击或拖拽文件到此区域上传
                      </p>
                      <p className="ant-upload-hint">
                        支持单个或批量上传 .map 文件
                      </p>
                    </Upload.Dragger>
                    {uploadProgress > 0 && (
                      <Progress
                        percent={uploadProgress}
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </Form.Item>

                  <Divider>数据采集配置</Divider>

                  <Row gutter={24}>
                    <Col span={8}>
                      <Form.Item
                        name="enableConsoleCapture"
                        label="控制台日志"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="enableNetworkCapture"
                        label="网络请求"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="enableUserActions"
                        label="用户行为"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="maxBreadcrumbs"
                    label={
                      <span>
                        最大面包屑数量
                        <Tooltip title="设置保存的用户行为轨迹数量">
                          <InfoCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip>
                      </span>
                    }
                  >
                    <InputNumber
                      min={10}
                      max={100}
                      style={{ width: 200 }}
                      placeholder="50"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={saving}
                    >
                      保存监控配置
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: "performance",
            label: (
              <span>
                <DashboardOutlined />
                性能监控
              </span>
            ),
            children: (
              <Card>
                <Alert
                  message="性能监控说明"
                  description="启用性能监控将收集页面加载时间、用户交互延迟等性能指标，帮助您优化用户体验。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Form
                  form={performanceForm}
                  layout="vertical"
                  onFinish={handleSavePerformance}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="enablePerformanceMonitoring"
                        label="启用性能监控"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sampleRate" label="性能采样率">
                        <InputNumber
                          min={0.01}
                          max={1}
                          step={0.01}
                          style={{ width: "100%" }}
                          placeholder="0.1"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider>性能阈值配置</Divider>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="fcpThreshold"
                        label={
                          <span>
                            FCP 阈值 (ms)
                            <Tooltip title="First Contentful Paint - 首次内容绘制时间">
                              <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                          </span>
                        }
                      >
                        <InputNumber
                          min={500}
                          max={10000}
                          style={{ width: "100%" }}
                          placeholder="2000"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="lcpThreshold"
                        label={
                          <span>
                            LCP 阈值 (ms)
                            <Tooltip title="Largest Contentful Paint - 最大内容绘制时间">
                              <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                          </span>
                        }
                      >
                        <InputNumber
                          min={1000}
                          max={20000}
                          style={{ width: "100%" }}
                          placeholder="4000"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="fidThreshold"
                        label={
                          <span>
                            FID 阈值 (ms)
                            <Tooltip title="First Input Delay - 首次输入延迟">
                              <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                          </span>
                        }
                      >
                        <InputNumber
                          min={50}
                          max={1000}
                          style={{ width: "100%" }}
                          placeholder="100"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="clsThreshold"
                        label={
                          <span>
                            CLS 阈值
                            <Tooltip title="Cumulative Layout Shift - 累积布局偏移">
                              <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                          </span>
                        }
                      >
                        <InputNumber
                          min={0.01}
                          max={1}
                          step={0.01}
                          style={{ width: "100%" }}
                          placeholder="0.1"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="longTaskThreshold"
                        label={
                          <span>
                            长任务阈值 (ms)
                            <Tooltip title="超过此时间的任务将被标记为长任务">
                              <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                          </span>
                        }
                      >
                        <InputNumber
                          min={10}
                          max={1000}
                          style={{ width: "100%" }}
                          placeholder="50"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="fmpThreshold"
                        label={
                          <span>
                            FMP 阈值 (ms)
                            <Tooltip title="First Meaningful Paint - 首次有意义绘制时间">
                              <InfoCircleOutlined style={{ marginLeft: 4 }} />
                            </Tooltip>
                          </span>
                        }
                      >
                        <InputNumber
                          min={1000}
                          max={15000}
                          style={{ width: "100%" }}
                          placeholder="3000"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={saving}
                    >
                      保存性能配置
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: "alerts",
            label: (
              <span>
                <BellOutlined />
                告警规则
              </span>
            ),
            children: (
              <Card>
                <Row
                  justify="space-between"
                  align="middle"
                  style={{ marginBottom: 16 }}
                >
                  <Col>
                    <Title level={4}>告警规则管理</Title>
                    <Text type="secondary">配置项目的告警规则和通知方式</Text>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddAlert}
                    >
                      添加规则
                    </Button>
                  </Col>
                </Row>

                <Table
                  columns={alertColumns}
                  dataSource={alertRules}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: "security",
            label: (
              <span>
                <SecurityScanOutlined />
                安全配置
              </span>
            ),
            children: (
              <Card>
                <Alert
                  message="安全配置"
                  description="配置项目的安全策略，包括数据脱敏、访问控制等。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Form layout="vertical">
                  <Form.Item
                    name="enableDataMasking"
                    label="数据脱敏"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>

                  <Form.Item name="allowedDomains" label="允许的域名">
                    <TextArea
                      placeholder="每行一个域名，例如：\nexample.com\n*.example.com"
                      rows={4}
                    />
                  </Form.Item>

                  <Form.Item name="ipWhitelist" label="IP白名单">
                    <TextArea
                      placeholder="每行一个IP或IP段，例如：\n192.168.1.1\n192.168.1.0/24"
                      rows={4}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={saving}
                    >
                      保存安全配置
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
        ]}
      />

      {/* 告警规则编辑模态框 */}
      <Modal
        title={editingAlert ? "编辑告警规则" : "添加告警规则"}
        open={alertModalVisible}
        onCancel={() => {
          setAlertModalVisible(false);
          alertForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={alertForm} layout="vertical" onFinish={handleSaveAlert}>
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: "请输入规则名称" }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="告警类型"
            rules={[{ required: true, message: "请选择告警类型" }]}
          >
            <Select placeholder="请选择告警类型">
              <Option value="error_count">错误数量</Option>
              <Option value="error_rate">错误率</Option>
              <Option value="performance">性能</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="threshold"
                label="阈值"
                rules={[{ required: true, message: "请输入阈值" }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="10"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeWindow"
                label="时间窗口(秒)"
                rules={[{ required: true, message: "请输入时间窗口" }]}
              >
                <InputNumber
                  min={60}
                  style={{ width: "100%" }}
                  placeholder="300"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="actions"
            label="通知方式"
            rules={[{ required: true, message: "请选择通知方式" }]}
          >
            <Select mode="multiple" placeholder="请选择通知方式">
              <Option value="email">邮件</Option>
              <Option value="webhook">Webhook</Option>
              <Option value="sms">短信</Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea placeholder="请输入规则描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingAlert ? "更新" : "添加"}
              </Button>
              <Button
                onClick={() => {
                  setAlertModalVisible(false);
                  alertForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectConfig;
