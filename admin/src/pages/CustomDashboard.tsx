/**
 * 自定义仪表板页面
 * 提供可拖拽的图表布局和实时数据展示
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Select,
  Modal,
  message,
  Tooltip,
  Switch,
  Dropdown,
  Menu,
  Spin,
  Alert,
  Badge,
  Divider,
  InputNumber,
  Form,
  Input,
} from "antd";
import {
  PlusOutlined,
  SettingOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  SaveOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 图表组件接口
 */
interface ChartWidget {
  id: string;
  title: string;
  type: "line" | "bar" | "pie" | "gauge" | "number" | "table";
  position: { x: number; y: number; w: number; h: number };
  config: {
    dataSource: string;
    refreshInterval: number;
    showTitle: boolean;
    showLegend: boolean;
    colors: string[];
  };
  data?: any[];
  loading?: boolean;
  lastUpdate?: string;
}

/**
 * 仪表板配置接口
 */
interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: ChartWidget[];
  autoRefresh: boolean;
  refreshInterval: number;
  layout: "grid" | "free";
}

/**
 * 自定义仪表板组件
 * @returns JSX.Element
 */
const CustomDashboard: React.FC = () => {
  const [form] = Form.useForm();
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [currentDashboard, setCurrentDashboard] =
    useState<DashboardConfig | null>(null);
  const [widgets, setWidgets] = useState<ChartWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<ChartWidget | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [configVisible, setConfigVisible] = useState(false);
  const [widgetConfigVisible, setWidgetConfigVisible] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 模拟数据
  const mockChartData = {
    line: {
      xAxis: {
        type: "category",
        data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "错误数量",
          type: "line",
          smooth: true,
          data: Array.from({ length: 24 }, () =>
            Math.floor(Math.random() * 100)
          ),
          itemStyle: { color: "#ff4d4f" },
        },
      ],
    },
    bar: {
      xAxis: {
        type: "category",
        data: ["项目A", "项目B", "项目C", "项目D", "项目E"],
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "错误数量",
          type: "bar",
          data: [120, 200, 150, 80, 70],
          itemStyle: { color: "#1890ff" },
        },
      ],
    },
    pie: {
      series: [
        {
          name: "错误类型",
          type: "pie",
          radius: ["40%", "70%"],
          data: [
            { value: 335, name: "JavaScript错误" },
            { value: 310, name: "网络错误" },
            { value: 234, name: "资源错误" },
            { value: 135, name: "其他错误" },
          ],
        },
      ],
    },
    gauge: {
      series: [
        {
          name: "CPU使用率",
          type: "gauge",
          detail: { formatter: "{value}%" },
          data: [{ value: 75, name: "CPU" }],
        },
      ],
    },
  };

  /**
   * 初始化默认仪表板
   */
  useEffect(() => {
    const defaultDashboard: DashboardConfig = {
      id: "1",
      name: "默认仪表板",
      description: "系统默认的监控仪表板",
      autoRefresh: true,
      refreshInterval: 30,
      layout: "grid",
      widgets: [
        {
          id: "1",
          title: "错误趋势",
          type: "line",
          position: { x: 0, y: 0, w: 12, h: 6 },
          config: {
            dataSource: "error_trends",
            refreshInterval: 30,
            showTitle: true,
            showLegend: true,
            colors: ["#ff4d4f"],
          },
          lastUpdate: dayjs().format("HH:mm:ss"),
        },
        {
          id: "2",
          title: "项目错误分布",
          type: "bar",
          position: { x: 12, y: 0, w: 12, h: 6 },
          config: {
            dataSource: "project_errors",
            refreshInterval: 60,
            showTitle: true,
            showLegend: false,
            colors: ["#1890ff"],
          },
          lastUpdate: dayjs().format("HH:mm:ss"),
        },
        {
          id: "3",
          title: "错误类型分布",
          type: "pie",
          position: { x: 0, y: 6, w: 8, h: 6 },
          config: {
            dataSource: "error_types",
            refreshInterval: 60,
            showTitle: true,
            showLegend: true,
            colors: ["#1890ff", "#52c41a", "#faad14", "#ff4d4f"],
          },
          lastUpdate: dayjs().format("HH:mm:ss"),
        },
        {
          id: "4",
          title: "CPU使用率",
          type: "gauge",
          position: { x: 8, y: 6, w: 8, h: 6 },
          config: {
            dataSource: "system_cpu",
            refreshInterval: 10,
            showTitle: true,
            showLegend: false,
            colors: ["#52c41a"],
          },
          lastUpdate: dayjs().format("HH:mm:ss"),
        },
        {
          id: "5",
          title: "实时错误数",
          type: "number",
          position: { x: 16, y: 6, w: 8, h: 6 },
          config: {
            dataSource: "realtime_errors",
            refreshInterval: 5,
            showTitle: true,
            showLegend: false,
            colors: ["#ff4d4f"],
          },
          lastUpdate: dayjs().format("HH:mm:ss"),
        },
      ],
    };

    setDashboards([defaultDashboard]);
    setCurrentDashboard(defaultDashboard);
    setWidgets(defaultDashboard.widgets);
  }, []);

  /**
   * 自动刷新数据
   */
  useEffect(() => {
    if (!autoRefresh || !currentDashboard) return;

    const interval = setInterval(() => {
      refreshAllWidgets();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, currentDashboard]);

  /**
   * 刷新所有组件数据
   */
  const refreshAllWidgets = useCallback(() => {
    setWidgets((prev) =>
      prev.map((widget) => ({
        ...widget,
        lastUpdate: dayjs().format("HH:mm:ss"),
        loading: false,
      }))
    );
  }, []);

  /**
   * 获取图表配置
   */
  const getChartOption = (widget: ChartWidget): EChartsOption => {
    const baseOption = mockChartData[widget.type as keyof typeof mockChartData];
    if (!baseOption) return {};

    const option: any = {
      ...baseOption,
      tooltip: {
        trigger: "axis",
      },
      grid: {
        top: widget.config.showTitle ? 40 : 20,
        bottom: widget.config.showLegend ? 40 : 20,
        left: 20,
        right: 20,
      },
    };

    if (widget.config.showTitle) {
      option.title = {
        text: widget.title,
        left: "center",
        textStyle: { fontSize: 14 },
      };
    }

    if (widget.config.showLegend) {
      option.legend = {
        bottom: 0,
        left: "center",
      };
    }

    return option as EChartsOption;
  };

  /**
   * 渲染数字组件
   */
  const renderNumberWidget = (widget: ChartWidget) => {
    const value = Math.floor(Math.random() * 1000);
    const change = Math.floor(Math.random() * 20) - 10;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: "#1890ff",
            marginBottom: 8,
          }}
        >
          {value.toLocaleString()}
        </div>
        <div
          style={{
            fontSize: 14,
            color: change >= 0 ? "#52c41a" : "#ff4d4f",
            marginBottom: 4,
          }}
        >
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
        </div>
        <div style={{ fontSize: 12, color: "#999" }}>
          更新时间: {widget.lastUpdate}
        </div>
      </div>
    );
  };

  /**
   * 渲染组件内容
   */
  const renderWidgetContent = (widget: ChartWidget) => {
    if (widget.loading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Spin size="large" />
        </div>
      );
    }

    switch (widget.type) {
      case "number":
        return renderNumberWidget(widget);
      case "table":
        return (
          <div style={{ padding: 16 }}>
            <Alert message="表格组件开发中..." type="info" />
          </div>
        );
      default:
        return (
          <ReactECharts
            option={getChartOption(widget)}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
        );
    }
  };

  /**
   * 添加新组件
   */
  const handleAddWidget = () => {
    const newWidget: ChartWidget = {
      id: Date.now().toString(),
      title: "新图表",
      type: "line",
      position: { x: 0, y: 0, w: 12, h: 6 },
      config: {
        dataSource: "custom",
        refreshInterval: 30,
        showTitle: true,
        showLegend: true,
        colors: ["#1890ff"],
      },
      lastUpdate: dayjs().format("HH:mm:ss"),
    };

    setWidgets((prev) => [...prev, newWidget]);
    setSelectedWidget(newWidget);
    setWidgetConfigVisible(true);
  };

  /**
   * 删除组件
   */
  const handleDeleteWidget = (widgetId: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个图表组件吗？",
      onOk: () => {
        setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
        message.success("删除成功");
      },
    });
  };

  /**
   * 编辑组件
   */
  const handleEditWidget = (widget: ChartWidget) => {
    setSelectedWidget(widget);
    form.setFieldsValue({
      title: widget.title,
      type: widget.type,
      dataSource: widget.config.dataSource,
      refreshInterval: widget.config.refreshInterval,
      showTitle: widget.config.showTitle,
      showLegend: widget.config.showLegend,
    });
    setWidgetConfigVisible(true);
  };

  /**
   * 保存组件配置
   */
  const handleSaveWidget = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedWidget) return;

      const updatedWidget: ChartWidget = {
        ...selectedWidget,
        title: values.title,
        type: values.type,
        config: {
          ...selectedWidget.config,
          dataSource: values.dataSource,
          refreshInterval: values.refreshInterval,
          showTitle: values.showTitle,
          showLegend: values.showLegend,
        },
      };

      setWidgets((prev) =>
        prev.map((w) => (w.id === selectedWidget.id ? updatedWidget : w))
      );

      setWidgetConfigVisible(false);
      setSelectedWidget(null);
      form.resetFields();
      message.success("保存成功");
    } catch (error) {
      message.error("保存失败，请检查配置");
    }
  };

  /**
   * 组件操作菜单
   */
  const getWidgetMenu = (widget: ChartWidget) => (
    <Menu>
      <Menu.Item
        key="edit"
        icon={<EditOutlined />}
        onClick={() => handleEditWidget(widget)}
      >
        编辑
      </Menu.Item>
      <Menu.Item
        key="refresh"
        icon={<ReloadOutlined />}
        onClick={() => {
          setWidgets((prev) =>
            prev.map((w) =>
              w.id === widget.id
                ? {
                    ...w,
                    loading: true,
                    lastUpdate: dayjs().format("HH:mm:ss"),
                  }
                : w
            )
          );
          setTimeout(() => {
            setWidgets((prev) =>
              prev.map((w) =>
                w.id === widget.id ? { ...w, loading: false } : w
              )
            );
          }, 1000);
        }}
      >
        刷新
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDeleteWidget(widget.id)}
      >
        删除
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* 头部工具栏 */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title
            level={2}
            style={{ margin: 0, marginRight: 16, display: "inline-block" }}
          >
            自定义仪表板
          </Title>
          {currentDashboard && (
            <Badge
              status={autoRefresh ? "processing" : "default"}
              text={`${currentDashboard.name} - ${
                autoRefresh ? "自动刷新" : "手动刷新"
              }`}
            />
          )}
        </div>

        <Space>
          <Select
            value={currentDashboard?.id}
            style={{ width: 200 }}
            placeholder="选择仪表板"
            onChange={(value) => {
              const dashboard = dashboards.find((d) => d.id === value);
              if (dashboard) {
                setCurrentDashboard(dashboard);
                setWidgets(dashboard.widgets);
              }
            }}
          >
            {dashboards.map((dashboard) => (
              <Option key={dashboard.id} value={dashboard.id}>
                {dashboard.name}
              </Option>
            ))}
          </Select>

          <Tooltip title="仪表板设置">
            <Button
              icon={<SettingOutlined />}
              onClick={() => setConfigVisible(true)}
            />
          </Tooltip>

          <Tooltip title="添加组件">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddWidget}
            >
              添加组件
            </Button>
          </Tooltip>

          <Tooltip title="刷新数据">
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshAllWidgets}
              loading={loading}
            />
          </Tooltip>

          <Tooltip title={autoRefresh ? "暂停自动刷新" : "开启自动刷新"}>
            <Button
              icon={
                autoRefresh ? <PauseCircleOutlined /> : <PlayCircleOutlined />
              }
              onClick={() => setAutoRefresh(!autoRefresh)}
            />
          </Tooltip>

          <Switch
            checked={isEditing}
            onChange={setIsEditing}
            checkedChildren="编辑"
            unCheckedChildren="查看"
          />
        </Space>
      </div>

      {/* 仪表板网格 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(24, 1fr)",
          gridTemplateRows: "repeat(auto-fit, 60px)",
          gap: 16,
          minHeight: "calc(100vh - 200px)",
        }}
      >
        {widgets.map((widget) => (
          <Card
            key={widget.id}
            size="small"
            style={{
              gridColumn: `${widget.position.x + 1} / ${
                widget.position.x + widget.position.w + 1
              }`,
              gridRow: `${widget.position.y + 1} / ${
                widget.position.y + widget.position.h + 1
              }`,
              cursor: isEditing ? "move" : "default",
              border: isEditing ? "2px dashed #1890ff" : "1px solid #f0f0f0",
              transition: "all 0.3s ease",
            }}
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{widget.title}</span>
                <Space size="small">
                  {widget.lastUpdate && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {widget.lastUpdate}
                    </Text>
                  )}
                  {isEditing && (
                    <>
                      <DragOutlined style={{ cursor: "grab" }} />
                      <Dropdown
                        overlay={getWidgetMenu(widget)}
                        trigger={["click"]}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                        />
                      </Dropdown>
                    </>
                  )}
                </Space>
              </div>
            }
            styles={{
              body: {
                padding: widget.type === "number" ? 0 : 8,
                height: "calc(100% - 57px)",
              },
            }}
          >
            {renderWidgetContent(widget)}
          </Card>
        ))}
      </div>

      {/* 仪表板配置弹窗 */}
      <Modal
        title="仪表板设置"
        open={configVisible}
        onCancel={() => setConfigVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfigVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />}>
            保存设置
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="仪表板名称">
            <Input
              value={currentDashboard?.name}
              placeholder="输入仪表板名称"
            />
          </Form.Item>

          <Form.Item label="描述">
            <Input.TextArea
              value={currentDashboard?.description}
              placeholder="输入描述"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="自动刷新">
                <Switch
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="刷新间隔(秒)">
                <InputNumber
                  value={refreshInterval}
                  onChange={(value) => setRefreshInterval(value || 30)}
                  min={5}
                  max={3600}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 组件配置弹窗 */}
      <Modal
        title={selectedWidget ? "编辑组件" : "添加组件"}
        open={widgetConfigVisible}
        onCancel={() => {
          setWidgetConfigVisible(false);
          setSelectedWidget(null);
          form.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setWidgetConfigVisible(false);
              setSelectedWidget(null);
              form.resetFields();
            }}
          >
            取消
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveWidget}
          >
            保存
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="组件标题"
            rules={[{ required: true, message: "请输入组件标题" }]}
          >
            <Input placeholder="输入组件标题" />
          </Form.Item>

          <Form.Item
            name="type"
            label="组件类型"
            rules={[{ required: true, message: "请选择组件类型" }]}
          >
            <Select placeholder="选择组件类型">
              <Option value="line">折线图</Option>
              <Option value="bar">柱状图</Option>
              <Option value="pie">饼图</Option>
              <Option value="gauge">仪表盘</Option>
              <Option value="number">数字卡片</Option>
              <Option value="table">数据表格</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dataSource"
            label="数据源"
            rules={[{ required: true, message: "请选择数据源" }]}
          >
            <Select placeholder="选择数据源">
              <Option value="error_trends">错误趋势</Option>
              <Option value="project_errors">项目错误</Option>
              <Option value="error_types">错误类型</Option>
              <Option value="system_cpu">系统CPU</Option>
              <Option value="realtime_errors">实时错误</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="refreshInterval" label="刷新间隔(秒)">
                <InputNumber min={5} max={3600} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="showTitle"
                label="显示标题"
                valuePropName="checked"
              >
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="showLegend" label="显示图例" valuePropName="checked">
            <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomDashboard;
