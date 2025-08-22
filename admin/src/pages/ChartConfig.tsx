/**
 * 图表配置页面
 * 提供自定义图表和仪表板配置功能
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  Switch,
  InputNumber,
  ColorPicker,
  Tabs,
  List,
  Modal,
  message,
  Tooltip,
  Tag,
  Alert,
  Collapse,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SaveOutlined,
  EyeOutlined,
  SettingOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import type { Color } from "antd/es/color-picker";

const { Title, Text } = Typography;
const { Option } = Select;
// const { TabPane } = Tabs; // 已转换为 items 格式
const { Panel } = Collapse;

/**
 * 图表类型枚举
 */
const ChartType = {
  LINE: "line",
  BAR: "bar",
  PIE: "pie",
  SCATTER: "scatter",
  GAUGE: "gauge",
  FUNNEL: "funnel",
} as const;

type ChartType = (typeof ChartType)[keyof typeof ChartType];

/**
 * 图表配置接口
 */
interface ChartConfig {
  id: string;
  name: string;
  type: ChartType;
  title: string;
  dataSource: string;
  xAxis?: string;
  yAxis?: string;
  series: SeriesConfig[];
  colors: string[];
  width: number;
  height: number;
  refreshInterval: number;
  enabled: boolean;
  position: { x: number; y: number };
}

/**
 * 系列配置接口
 */
interface SeriesConfig {
  name: string;
  type: ChartType;
  dataKey: string;
  color: string;
  smooth?: boolean;
  stack?: string;
}

/**
 * 仪表板配置接口
 */
interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  layout: "grid" | "free";
  columns: number;
  charts: string[];
  refreshInterval: number;
  autoRefresh: boolean;
}

/**
 * 图表配置页面组件
 * @returns JSX.Element
 */
const ChartConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [dashboardForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState("charts");
  const [selectedChart, setSelectedChart] = useState<ChartConfig | null>(null);
  const [selectedDashboard, setSelectedDashboard] =
    useState<DashboardConfig | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");

  // 图表配置列表
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([
    {
      id: "1",
      name: "错误趋势图",
      type: ChartType.LINE,
      title: "错误趋势分析",
      dataSource: "error_trends",
      xAxis: "date",
      yAxis: "count",
      series: [
        {
          name: "错误数量",
          type: ChartType.LINE,
          dataKey: "count",
          color: "#ff4d4f",
          smooth: true,
        },
      ],
      colors: ["#ff4d4f", "#faad14", "#52c41a"],
      width: 12,
      height: 300,
      refreshInterval: 30,
      enabled: true,
      position: { x: 0, y: 0 },
    },
    {
      id: "2",
      name: "项目错误分布",
      type: ChartType.PIE,
      title: "项目错误分布",
      dataSource: "project_errors",
      series: [
        {
          name: "错误分布",
          type: ChartType.PIE,
          dataKey: "value",
          color: "#1890ff",
        },
      ],
      colors: ["#1890ff", "#52c41a", "#faad14", "#ff4d4f"],
      width: 6,
      height: 300,
      refreshInterval: 60,
      enabled: true,
      position: { x: 12, y: 0 },
    },
  ]);

  // 仪表板配置列表
  const [dashboardConfigs, setDashboardConfigs] = useState<DashboardConfig[]>([
    {
      id: "1",
      name: "错误监控仪表板",
      description: "实时错误监控和分析",
      layout: "grid",
      columns: 24,
      charts: ["1", "2"],
      refreshInterval: 30,
      autoRefresh: true,
    },
  ]);

  /**
   * 获取图表类型图标
   */
  const getChartIcon = (type: ChartType) => {
    const iconMap = {
      [ChartType.LINE]: <LineChartOutlined />,
      [ChartType.BAR]: <BarChartOutlined />,
      [ChartType.PIE]: <PieChartOutlined />,
      [ChartType.SCATTER]: <DashboardOutlined />,
      [ChartType.GAUGE]: <DashboardOutlined />,
      [ChartType.FUNNEL]: <DashboardOutlined />,
    };
    return iconMap[type];
  };

  /**
   * 获取预览图表配置
   */
  const getPreviewOption = (config: ChartConfig) => {
    const mockData = {
      line: {
        xAxis: {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: [120, 200, 150, 80, 70, 110, 130],
            type: "line",
            smooth: true,
            itemStyle: { color: config.colors[0] },
          },
        ],
      },
      bar: {
        xAxis: {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: [120, 200, 150, 80, 70, 110, 130],
            type: "bar",
            itemStyle: { color: config.colors[0] },
          },
        ],
      },
      pie: {
        series: [
          {
            name: "Access From",
            type: "pie",
            radius: "50%",
            data: [
              { value: 1048, name: "Search Engine" },
              { value: 735, name: "Direct" },
              { value: 580, name: "Email" },
              { value: 484, name: "Union Ads" },
              { value: 300, name: "Video Ads" },
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      },
    };

    return {
      title: {
        text: config.title,
        left: "center",
      },
      tooltip: {
        trigger: "axis",
      },
      ...mockData[config.type as keyof typeof mockData],
    };
  };

  /**
   * 创建新图表
   */
  const handleCreateChart = () => {
    setEditMode("create");
    setSelectedChart(null);
    form.resetFields();
    form.setFieldsValue({
      type: ChartType.LINE,
      colors: ["#1890ff"],
      width: 12,
      height: 300,
      refreshInterval: 30,
      enabled: true,
    });
  };

  /**
   * 编辑图表
   */
  const handleEditChart = (chart: ChartConfig) => {
    setEditMode("edit");
    setSelectedChart(chart);
    form.setFieldsValue(chart);
  };

  /**
   * 保存图表配置
   */
  const handleSaveChart = async () => {
    try {
      const values = await form.validateFields();
      const chartConfig: ChartConfig = {
        ...values,
        id: selectedChart?.id || Date.now().toString(),
        position: selectedChart?.position || { x: 0, y: 0 },
      };

      if (editMode === "create") {
        setChartConfigs((prev) => [...prev, chartConfig]);
        message.success("图表创建成功");
      } else {
        setChartConfigs((prev) =>
          prev.map((item) => (item.id === chartConfig.id ? chartConfig : item))
        );
        message.success("图表更新成功");
      }

      form.resetFields();
      setSelectedChart(null);
    } catch (error) {
      message.error("保存失败，请检查配置");
    }
  };

  /**
   * 删除图表
   */
  const handleDeleteChart = (chartId: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个图表配置吗？",
      onOk: () => {
        setChartConfigs((prev) => prev.filter((item) => item.id !== chartId));
        message.success("删除成功");
      },
    });
  };

  /**
   * 复制图表
   */
  const handleCopyChart = (chart: ChartConfig) => {
    const newChart: ChartConfig = {
      ...chart,
      id: Date.now().toString(),
      name: `${chart.name} (副本)`,
    };
    setChartConfigs((prev) => [...prev, newChart]);
    message.success("复制成功");
  };

  /**
   * 预览图表
   */
  const handlePreviewChart = (chart: ChartConfig) => {
    setSelectedChart(chart);
    setPreviewVisible(true);
  };

  /**
   * 创建仪表板
   */
  const handleCreateDashboard = () => {
    dashboardForm.resetFields();
    dashboardForm.setFieldsValue({
      layout: "grid",
      columns: 24,
      refreshInterval: 30,
      autoRefresh: true,
    });
  };

  /**
   * 保存仪表板配置
   */
  const handleSaveDashboard = async () => {
    try {
      const values = await dashboardForm.validateFields();
      const dashboardConfig: DashboardConfig = {
        ...values,
        id: selectedDashboard?.id || Date.now().toString(),
      };

      if (selectedDashboard) {
        setDashboardConfigs((prev) =>
          prev.map((item) =>
            item.id === dashboardConfig.id ? dashboardConfig : item
          )
        );
        message.success("仪表板更新成功");
      } else {
        setDashboardConfigs((prev) => [...prev, dashboardConfig]);
        message.success("仪表板创建成功");
      }

      dashboardForm.resetFields();
      setSelectedDashboard(null);
    } catch (error) {
      message.error("保存失败，请检查配置");
    }
  };

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
        <Title level={2} style={{ margin: 0 }}>
          图表配置
        </Title>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "charts",
            label: "图表管理",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={16}>
                  <Card
                    title="图表列表"
                    extra={
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateChart}
                      >
                        新建图表
                      </Button>
                    }
                  >
                    <List
                      itemLayout="horizontal"
                      dataSource={chartConfigs}
                      renderItem={(chart) => (
                        <List.Item
                          actions={[
                            <Tooltip title="预览" key="preview">
                              <Button
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() => handlePreviewChart(chart)}
                              />
                            </Tooltip>,
                            <Tooltip title="编辑" key="edit">
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEditChart(chart)}
                              />
                            </Tooltip>,
                            <Tooltip title="复制" key="copy">
                              <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyChart(chart)}
                              />
                            </Tooltip>,
                            <Tooltip title="删除" key="delete">
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteChart(chart.id)}
                              />
                            </Tooltip>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={getChartIcon(chart.type)}
                            title={
                              <Space>
                                <Text strong>{chart.name}</Text>
                                <Tag color={chart.enabled ? "green" : "red"}>
                                  {chart.enabled ? "启用" : "禁用"}
                                </Tag>
                              </Space>
                            }
                            description={
                              <Space>
                                <Text type="secondary">类型: {chart.type}</Text>
                                <Divider type="vertical" />
                                <Text type="secondary">
                                  刷新: {chart.refreshInterval}s
                                </Text>
                                <Divider type="vertical" />
                                <Text type="secondary">
                                  尺寸: {chart.width}x{chart.height}
                                </Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>

                <Col span={8}>
                  <Card title={editMode === "create" ? "新建图表" : "编辑图表"}>
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSaveChart}
                    >
                      <Form.Item
                        name="name"
                        label="图表名称"
                        rules={[{ required: true, message: "请输入图表名称" }]}
                      >
                        <Input placeholder="输入图表名称" />
                      </Form.Item>

                      <Form.Item
                        name="title"
                        label="图表标题"
                        rules={[{ required: true, message: "请输入图表标题" }]}
                      >
                        <Input placeholder="输入图表标题" />
                      </Form.Item>

                      <Form.Item
                        name="type"
                        label="图表类型"
                        rules={[{ required: true, message: "请选择图表类型" }]}
                      >
                        <Select placeholder="选择图表类型">
                          <Option value={ChartType.LINE}>折线图</Option>
                          <Option value={ChartType.BAR}>柱状图</Option>
                          <Option value={ChartType.PIE}>饼图</Option>
                          <Option value={ChartType.SCATTER}>散点图</Option>
                          <Option value={ChartType.GAUGE}>仪表盘</Option>
                          <Option value={ChartType.FUNNEL}>漏斗图</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        name="dataSource"
                        label="数据源"
                        rules={[{ required: true, message: "请输入数据源" }]}
                      >
                        <Select placeholder="选择数据源">
                          <Option value="error_trends">错误趋势</Option>
                          <Option value="project_errors">项目错误</Option>
                          <Option value="user_analytics">用户分析</Option>
                          <Option value="system_metrics">系统指标</Option>
                        </Select>
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="width" label="宽度">
                            <InputNumber
                              min={1}
                              max={24}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="height" label="高度">
                            <InputNumber
                              min={200}
                              max={800}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item name="refreshInterval" label="刷新间隔(秒)">
                        <InputNumber
                          min={10}
                          max={3600}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="enabled"
                        label="启用状态"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Space>
                          <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                          >
                            保存配置
                          </Button>
                          <Button
                            onClick={() => {
                              form.resetFields();
                              setSelectedChart(null);
                            }}
                          >
                            取消
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "dashboards",
            label: "仪表板管理",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={16}>
                  <Card
                    title="仪表板列表"
                    extra={
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateDashboard}
                      >
                        新建仪表板
                      </Button>
                    }
                  >
                    <List
                      itemLayout="horizontal"
                      dataSource={dashboardConfigs}
                      renderItem={(dashboard) => (
                        <List.Item
                          actions={[
                            <Button
                              key="edit"
                              type="text"
                              icon={<EditOutlined />}
                            >
                              编辑
                            </Button>,
                            <Button
                              key="delete"
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                            >
                              删除
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<DashboardOutlined />}
                            title={dashboard.name}
                            description={
                              <Space direction="vertical" size="small">
                                <Text type="secondary">
                                  {dashboard.description}
                                </Text>
                                <Space>
                                  <Text type="secondary">
                                    布局: {dashboard.layout}
                                  </Text>
                                  <Divider type="vertical" />
                                  <Text type="secondary">
                                    图表数: {dashboard.charts.length}
                                  </Text>
                                  <Divider type="vertical" />
                                  <Text type="secondary">
                                    刷新: {dashboard.refreshInterval}s
                                  </Text>
                                </Space>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>

                <Col span={8}>
                  <Card title="仪表板配置">
                    <Form
                      form={dashboardForm}
                      layout="vertical"
                      onFinish={handleSaveDashboard}
                    >
                      <Form.Item
                        name="name"
                        label="仪表板名称"
                        rules={[
                          { required: true, message: "请输入仪表板名称" },
                        ]}
                      >
                        <Input placeholder="输入仪表板名称" />
                      </Form.Item>

                      <Form.Item name="description" label="描述">
                        <Input.TextArea placeholder="输入仪表板描述" rows={3} />
                      </Form.Item>

                      <Form.Item name="layout" label="布局方式">
                        <Select>
                          <Option value="grid">网格布局</Option>
                          <Option value="free">自由布局</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item name="columns" label="网格列数">
                        <InputNumber
                          min={12}
                          max={24}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      <Form.Item name="charts" label="包含图表">
                        <Select mode="multiple" placeholder="选择要包含的图表">
                          {chartConfigs.map((chart) => (
                            <Option key={chart.id} value={chart.id}>
                              {chart.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item name="refreshInterval" label="刷新间隔(秒)">
                        <InputNumber
                          min={10}
                          max={3600}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="autoRefresh"
                        label="自动刷新"
                        valuePropName="checked"
                      >
                        <Switch
                          checkedChildren="开启"
                          unCheckedChildren="关闭"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Space>
                          <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                          >
                            保存配置
                          </Button>
                          <Button
                            onClick={() => {
                              dashboardForm.resetFields();
                              setSelectedDashboard(null);
                            }}
                          >
                            取消
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      {/* 图表预览弹窗 */}
      <Modal
        title={`预览: ${selectedChart?.name}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedChart && (
          <ReactECharts
            option={getPreviewOption(selectedChart)}
            style={{ height: selectedChart.height || 300 }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ChartConfig;
