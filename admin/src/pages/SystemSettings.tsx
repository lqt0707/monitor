/**
 * 系统设置页面
 * 提供监控系统的各种配置选项
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Select,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Alert,
  Tabs,
  Upload,
  Badge,
  Tag,
  Tooltip,
  Modal,
  Table,
  Popconfirm,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined,
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  CloudOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
// const { TabPane } = Tabs; // 已弃用，使用items格式
const { TextArea } = Input;

/**
 * 系统配置接口
 */
interface SystemConfig {
  // 基础设置
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  timezone: string;
  language: string;

  // 监控设置
  errorRetentionDays: number;
  maxErrorsPerProject: number;
  enableRealTimeAlerts: boolean;
  alertThreshold: number;

  // 通知设置
  emailNotifications: boolean;
  webhookUrl: string;
  slackWebhook: string;
  dingtalkWebhook: string;

  // 安全设置
  enableTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  ipWhitelist: string[];

  // 存储设置
  storageType: "local" | "oss" | "s3";
  storageConfig: Record<string, any>;
  enableBackup: boolean;
  backupInterval: number;

  // 性能设置
  enableCache: boolean;
  cacheExpiration: number;
  enableCompression: boolean;
  maxRequestSize: number;
}

/**
 * API密钥接口
 */
interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
  status: "active" | "disabled";
}

/**
 * 系统设置组件
 * @returns JSX.Element
 */
const SystemSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [config, setConfig] = useState<SystemConfig>({
    siteName: "错误监控系统",
    siteDescription: "实时监控和分析前端错误",
    adminEmail: "admin@example.com",
    timezone: "Asia/Shanghai",
    language: "zh-CN",
    errorRetentionDays: 30,
    maxErrorsPerProject: 10000,
    enableRealTimeAlerts: true,
    alertThreshold: 10,
    emailNotifications: true,
    webhookUrl: "",
    slackWebhook: "",
    dingtalkWebhook: "",
    enableTwoFactor: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    ipWhitelist: [],
    storageType: "local",
    storageConfig: {},
    enableBackup: true,
    backupInterval: 24,
    enableCache: true,
    cacheExpiration: 3600,
    enableCompression: true,
    maxRequestSize: 10,
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: "1",
      name: "默认API密钥",
      key: "sk_test_1234567890abcdef",
      permissions: ["read", "write"],
      createdAt: "2024-01-01 10:00:00",
      lastUsed: "2024-01-15 14:30:00",
      status: "active",
    },
  ]);

  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);

  /**
   * 初始化表单数据
   */
  useEffect(() => {
    form.setFieldsValue(config);
  }, [config, form]);

  /**
   * 保存配置
   */
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setConfig({ ...config, ...values });
      message.success("配置保存成功");
    } catch (error) {
      message.error("保存失败，请检查配置");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 重置配置
   */
  const handleReset = () => {
    Modal.confirm({
      title: "确认重置",
      content: "确定要重置所有配置到默认值吗？此操作不可撤销。",
      icon: <ExclamationCircleOutlined />,
      onOk: () => {
        form.resetFields();
        message.success("配置已重置");
      },
    });
  };

  /**
   * 测试连接
   */
  const handleTestConnection = async (type: string) => {
    try {
      setLoading(true);
      // 模拟测试连接
      await new Promise((resolve) => setTimeout(resolve, 2000));
      message.success(`${type}连接测试成功`);
    } catch (error) {
      message.error(`${type}连接测试失败`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 导出配置
   */
  const handleExportConfig = () => {
    const configData = JSON.stringify(config, null, 2);
    const blob = new Blob([configData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "system-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("配置导出成功");
  };

  /**
   * 导入配置
   */
  const handleImportConfig: UploadProps["customRequest"] = ({
    file,
    onSuccess,
  }) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setConfig({ ...config, ...importedConfig });
        form.setFieldsValue(importedConfig);
        message.success("配置导入成功");
        onSuccess?.(file);
      } catch (error) {
        message.error("配置文件格式错误");
      }
    };
    reader.readAsText(file as File);
  };

  /**
   * 创建API密钥
   */
  const handleCreateApiKey = () => {
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: "新API密钥",
      key: `sk_${Math.random().toString(36).substring(2, 15)}${Math.random()
        .toString(36)
        .substring(2, 15)}`,
      permissions: ["read"],
      createdAt: new Date().toLocaleString(),
      status: "active",
    };

    setApiKeys([...apiKeys, newKey]);
    message.success("API密钥创建成功");
  };

  /**
   * 删除API密钥
   */
  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id));
    message.success("API密钥删除成功");
  };

  /**
   * API密钥表格列配置
   */
  const apiKeyColumns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "API密钥",
      dataIndex: "key",
      key: "key",
      render: (key: string) => (
        <Text code copyable={{ text: key }}>
          {key.substring(0, 20)}...
        </Text>
      ),
    },
    {
      title: "权限",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions: string[]) => (
        <Space>
          {permissions.map((permission) => (
            <Tag
              key={permission}
              color={permission === "write" ? "red" : "blue"}
            >
              {permission}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Badge
          status={status === "active" ? "success" : "default"}
          text={status === "active" ? "活跃" : "禁用"}
        />
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "最后使用",
      dataIndex: "lastUsed",
      key: "lastUsed",
      render: (lastUsed?: string) => lastUsed || "从未使用",
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: ApiKey) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingApiKey(record);
              setApiKeyModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个API密钥吗？"
            onConfirm={() => handleDeleteApiKey(record.id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <SettingOutlined style={{ marginRight: 8 }} />
            系统设置
          </Title>
          <Paragraph type="secondary" style={{ margin: "8px 0 0 0" }}>
            配置监控系统的各种参数和选项
          </Paragraph>
        </div>

        <Space>
          <Upload
            accept=".json"
            showUploadList={false}
            customRequest={handleImportConfig}
          >
            <Button icon={<UploadOutlined />}>导入配置</Button>
          </Upload>

          <Button icon={<DownloadOutlined />} onClick={handleExportConfig}>
            导出配置
          </Button>

          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置配置
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSave}
          >
            保存配置
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "basic",
            label: "基础设置",
            children: (
              <Card>
                <Form form={form} layout="vertical">
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="siteName"
                        label="站点名称"
                        rules={[{ required: true, message: "请输入站点名称" }]}
                      >
                        <Input placeholder="输入站点名称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="adminEmail"
                        label="管理员邮箱"
                        rules={[
                          { required: true, message: "请输入管理员邮箱" },
                          { type: "email", message: "请输入有效的邮箱地址" },
                        ]}
                      >
                        <Input placeholder="输入管理员邮箱" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="siteDescription" label="站点描述">
                    <TextArea rows={3} placeholder="输入站点描述" />
                  </Form.Item>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item name="timezone" label="时区">
                        <Select placeholder="选择时区">
                          <Option value="Asia/Shanghai">Asia/Shanghai</Option>
                          <Option value="UTC">UTC</Option>
                          <Option value="America/New_York">
                            America/New_York
                          </Option>
                          <Option value="Europe/London">Europe/London</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="language" label="语言">
                        <Select placeholder="选择语言">
                          <Option value="zh-CN">简体中文</Option>
                          <Option value="en-US">English</Option>
                          <Option value="ja-JP">日本語</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            ),
          },

          {
            key: "monitoring",
            label: "监控设置",
            children: (
              <Card>
                <Form form={form} layout="vertical">
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="errorRetentionDays"
                        label="错误数据保留天数"
                        rules={[{ required: true, message: "请输入保留天数" }]}
                      >
                        <InputNumber
                          min={1}
                          max={365}
                          style={{ width: "100%" }}
                          placeholder="输入保留天数"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="maxErrorsPerProject"
                        label="单项目最大错误数"
                        rules={[
                          { required: true, message: "请输入最大错误数" },
                        ]}
                      >
                        <InputNumber
                          min={1000}
                          max={1000000}
                          style={{ width: "100%" }}
                          placeholder="输入最大错误数"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="enableRealTimeAlerts"
                        label="启用实时告警"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="开启"
                          unCheckedChildren="关闭"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="alertThreshold"
                        label="告警阈值(分钟内错误数)"
                      >
                        <InputNumber
                          min={1}
                          max={1000}
                          style={{ width: "100%" }}
                          placeholder="输入告警阈值"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            ),
          },

          {
            key: "notifications",
            label: "通知设置",
            children: (
              <Card>
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="emailNotifications"
                    label="邮件通知"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>

                  <Divider orientation="left">
                    <BellOutlined /> Webhook配置
                  </Divider>

                  <Form.Item name="webhookUrl" label="通用Webhook URL">
                    <Input.Group compact>
                      <Input
                        style={{ width: "calc(100% - 80px)" }}
                        placeholder="输入Webhook URL"
                      />
                      <Button
                        type="primary"
                        onClick={() => handleTestConnection("Webhook")}
                        loading={loading}
                      >
                        测试
                      </Button>
                    </Input.Group>
                  </Form.Item>

                  <Form.Item name="slackWebhook" label="Slack Webhook">
                    <Input.Group compact>
                      <Input
                        style={{ width: "calc(100% - 80px)" }}
                        placeholder="输入Slack Webhook URL"
                      />
                      <Button
                        type="primary"
                        onClick={() => handleTestConnection("Slack")}
                        loading={loading}
                      >
                        测试
                      </Button>
                    </Input.Group>
                  </Form.Item>

                  <Form.Item name="dingtalkWebhook" label="钉钉Webhook">
                    <Input.Group compact>
                      <Input
                        style={{ width: "calc(100% - 80px)" }}
                        placeholder="输入钉钉Webhook URL"
                      />
                      <Button
                        type="primary"
                        onClick={() => handleTestConnection("钉钉")}
                        loading={loading}
                      >
                        测试
                      </Button>
                    </Input.Group>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },

          {
            key: "security",
            label: "安全设置",
            children: (
              <Card>
                <Form form={form} layout="vertical">
                  <Alert
                    message="安全提醒"
                    description="修改安全设置可能会影响系统访问，请谨慎操作。"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="enableTwoFactor"
                        label="启用双因子认证"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="开启"
                          unCheckedChildren="关闭"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sessionTimeout" label="会话超时(小时)">
                        <InputNumber
                          min={1}
                          max={168}
                          style={{ width: "100%" }}
                          placeholder="输入会话超时时间"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="maxLoginAttempts" label="最大登录尝试次数">
                    <InputNumber
                      min={3}
                      max={10}
                      style={{ width: "100%" }}
                      placeholder="输入最大登录尝试次数"
                    />
                  </Form.Item>

                  <Form.Item name="ipWhitelist" label="IP白名单">
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="输入允许访问的IP地址，支持CIDR格式"
                      tokenSeparators={[",", " "]}
                    ></Select>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },

          {
            key: "apikeys",
            label: "API密钥",
            children: (
              <Card
                title="API密钥管理"
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateApiKey}
                  >
                    创建密钥
                  </Button>
                }
              >
                <Table
                  columns={apiKeyColumns}
                  dataSource={apiKeys}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          },

          {
            key: "storage",
            label: "存储设置",
            children: (
              <Card>
                <Form form={form} layout="vertical">
                  <Form.Item name="storageType" label="存储类型">
                    <Select placeholder="选择存储类型">
                      <Option value="local">本地存储</Option>
                      <Option value="oss">阿里云OSS</Option>
                      <Option value="s3">Amazon S3</Option>
                    </Select>
                  </Form.Item>

                  <Divider orientation="left">
                    <DatabaseOutlined /> 备份设置
                  </Divider>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="enableBackup"
                        label="启用自动备份"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="开启"
                          unCheckedChildren="关闭"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="backupInterval" label="备份间隔(小时)">
                        <InputNumber
                          min={1}
                          max={168}
                          style={{ width: "100%" }}
                          placeholder="输入备份间隔"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            ),
          },

          {
            key: "performance",
            label: "性能设置",
            children: (
              <Card>
                <Form form={form} layout="vertical">
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="enableCache"
                        label="启用缓存"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="开启"
                          unCheckedChildren="关闭"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="cacheExpiration"
                        label="缓存过期时间(秒)"
                      >
                        <InputNumber
                          min={60}
                          max={86400}
                          style={{ width: "100%" }}
                          placeholder="输入缓存过期时间"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="enableCompression"
                        label="启用压缩"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="开启"
                          unCheckedChildren="关闭"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="maxRequestSize" label="最大请求大小(MB)">
                        <InputNumber
                          min={1}
                          max={100}
                          style={{ width: "100%" }}
                          placeholder="输入最大请求大小"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SystemSettings;
