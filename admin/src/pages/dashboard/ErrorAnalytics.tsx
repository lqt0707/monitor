/**
 * 错误分析仪表板组件
 * 提供实时的错误数据可视化和深度分析功能
 * 集成后端API数据，支持多维度筛选和实时更新
 */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Statistic,
  Typography,
  Space,
  Tag,
  Table,
  Progress,
  Spin,
  Alert,
  Button,
  message,
} from "antd";
import {
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  RiseOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchErrorTrends,
  fetchErrorStats,
  fetchErrorAggregations,
} from "../../store/slices/errorSlice";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 从UserAgent中提取浏览器名称
 */
const getBrowserFromUserAgent = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (ua.includes("chrome")) return "Chrome";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("edge")) return "Edge";
  if (ua.includes("opera") || ua.includes("opr")) return "Opera";
  return "其他";
};

/**
 * 错误级别配置常量
 */
const ERROR_LEVEL_CONFIG = {
  error: { color: "#ff4d4f", label: "错误", icon: "🔴" },
  warn: { color: "#faad14", label: "警告", icon: "🟡" },
  info: { color: "#1890ff", label: "信息", icon: "🔵" },
  debug: { color: "#52c41a", label: "调试", icon: "🟢" },
};

/**
 * 时间范围预设配置
 */
const TIME_RANGE_PRESETS = [
  { label: "最近7天", value: 7 },
  { label: "最近30天", value: 30 },
  { label: "最近90天", value: 90 },
  { label: "自定义", value: "custom" },
];

/**
 * 错误分析主组件
 * 集成实时数据展示、多维度分析和交互功能
 */
const ErrorAnalytics: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    errorTrends,
    errorStats,
    errorAggregations,
    statsLoading: reduxStatsLoading,
    error: reduxError,
  } = useAppSelector((state: any) => state.error);

  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedTimePreset, setSelectedTimePreset] = useState<number | string>(
    7
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 使用本地state管理loading状态
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // 派生计算属性
  const projectId = useMemo(
    () => (selectedProject === "all" ? undefined : selectedProject),
    [selectedProject]
  );

  const days = useMemo(() => {
    if (typeof selectedTimePreset === "number") {
      return selectedTimePreset;
    }
    if (!timeRange || timeRange.length < 2) return 7;
    const diff = timeRange[1].diff(timeRange[0], "day") + 1;
    return Math.max(1, Math.min(diff, 365)); // 限制最大365天
  }, [timeRange, selectedTimePreset]);

  /**
   * 获取错误统计数据
   * 包含错误处理和数据刷新逻辑
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadingError(null);

      await Promise.all([
        dispatch(fetchErrorStats(projectId)),
        dispatch(fetchErrorTrends({ projectId, days })),
        dispatch(
          fetchErrorAggregations({
            projectId,
            startDate: timeRange[0].format("YYYY-MM-DD"),
            endDate: timeRange[1].format("YYYY-MM-DD"),
            page: 1,
            pageSize: 100,
          })
        ),
      ]);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("获取数据失败:", err);
      setLoadingError("获取数据失败，请稍后重试");
      message.error("获取数据失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, projectId, days, timeRange]);

  console.log("页面渲染");

  /**
   * 数据自动刷新和筛选条件变更处理
   */
  useEffect(() => {
    fetchData();

    // 设置定时刷新（每5分钟）
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /**
   * 处理时间预设选择变化
   */
  const handleTimePresetChange = (value: number | string) => {
    setSelectedTimePreset(value);
    if (typeof value === "number") {
      setTimeRange([dayjs().subtract(value - 1, "day"), dayjs()]);
    }
  };

  /**
   * 生成错误趋势图表配置
   * 支持多级别错误趋势展示
   */
  const getErrorTrendOption = () => {
    const dates =
      errorTrends?.map((item: any) => dayjs(item.date).format("MM-DD")) || [];

    return {
      title: {
        text: "错误趋势分析",
        left: "center",
        textStyle: { fontSize: 16, fontWeight: "normal" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },
      legend: {
        data: ["错误数量"],
        bottom: 10,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: dates,
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        name: "数量",
      },
      series: [
        {
          name: "错误数量",
          type: "line" as const,
          data: errorTrends?.map((item: any) => item.count || 0) || [],
          smooth: true,
          itemStyle: { color: "#1890ff" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#1890ff30" },
              { offset: 1, color: "#1890ff10" },
            ]),
          },
        },
      ],
    };
  };

  /**
   * 生成错误级别分布图表配置
   */
  const getErrorLevelOption = () => {
    // 根据实际API返回的数据结构调整
    const data = [
      {
        value: errorStats?.criticalErrors || 0,
        name: "严重错误",
        itemStyle: { color: "#ff4d4f" },
      },
      {
        value: errorStats?.totalErrors - (errorStats?.criticalErrors || 0),
        name: "一般错误",
        itemStyle: { color: "#faad14" },
      },
    ];

    const total = errorStats?.totalErrors || 0;

    return {
      title: {
        text: `错误级别分布${total ? ` (总计: ${total})` : ""}`,
        left: "center",
        textStyle: { fontSize: 16, fontWeight: "normal" },
      },
      tooltip: {
        trigger: "item",
        formatter: ({ name, value, percent }: any) =>
          `${name}: ${value} (${percent}%)`,
      },
      legend: {
        orient: "vertical",
        left: "left",
        data: ["严重错误", "一般错误"],
      },
      series: [
        {
          name: "错误级别",
          type: "pie",
          radius: "50%",
          data: data.filter((item) => item.value > 0),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  };

  /**
   * 生成浏览器错误分布图表配置
   * 使用真实聚合数据
   */
  const getBrowserDistributionOption = () => {
    // 从errorAggregations中提取浏览器数据
    const browserData =
      errorAggregations?.reduce((acc: any[], item: any) => {
        // 尝试从userAgent中提取浏览器信息
        if (item.userAgent) {
          const browser = getBrowserFromUserAgent(item.userAgent);
          const existing = acc.find((b) => b.browser === browser);
          if (existing) {
            existing.count += 1;
          } else {
            acc.push({ browser, count: 1 });
          }
        }
        return acc;
      }, []) || [];

    return {
      title: {
        text: "浏览器错误分布",
        left: "center",
        textStyle: { fontSize: 16, fontWeight: "normal" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: browserData.map((item: any) => item.browser),
      },
      yAxis: {
        type: "value",
        name: "错误数量",
      },
      series: [
        {
          name: "错误数量",
          type: "bar",
          data: browserData.map((item: any) => item.count),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#83bff6" },
              { offset: 0.5, color: "#188df0" },
              { offset: 1, color: "#188df0" },
            ]),
          },
        },
      ],
    };
  };

  /**
   * 热门错误表格列配置
   */
  const topErrorsColumns = [
    {
      title: "错误消息",
      dataIndex: "errorMessage",
      key: "errorMessage",
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "级别",
      dataIndex: "errorLevel",
      key: "errorLevel",
      width: 80,
      render: (level: string) => {
        const config =
          ERROR_LEVEL_CONFIG[level as keyof typeof ERROR_LEVEL_CONFIG];
        return config ? (
          <Tag color={config.color}>
            {config.icon} {level.toUpperCase()}
          </Tag>
        ) : (
          <Tag>{level}</Tag>
        );
      },
    },
    {
      title: "次数",
      dataIndex: "count",
      key: "count",
      width: 80,
      sorter: (a: any, b: any) => a.count - b.count,
      render: (count: number) => <Text strong>{count}</Text>,
    },
    {
      title: "项目",
      dataIndex: "projectId",
      key: "projectId",
      width: 120,
    },
    {
      title: "最后发生",
      dataIndex: "lastOccurrence",
      key: "lastOccurrence",
      width: 120,
      render: (date: string) => dayjs(date).format("MM-DD HH:mm"),
    },
  ];

  /**
   * 计算关键指标数据
   */
  const metrics = useMemo(
    () => ({
      totalErrors: errorStats?.totalErrors || 0,
      todayErrors: errorStats?.todayErrors || 0,
      resolvedErrors: errorStats?.resolvedErrors || 0,
      criticalErrors: errorStats?.criticalErrors || 0,
      errorRate: 0, // 默认值，后续可以从API获取
      avgResponseTime: 0, // 默认值，后续可以从API获取
      activeProjects: 0, // 默认值，后续可以从API获取
    }),
    [errorStats]
  );

  /**
   * 渲染加载状态
   */
  if (isLoading && !errorTrends) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载错误数据中...</div>
      </div>
    );
  }

  /**
   * 渲染错误状态
   */
  if (loadingError || reduxError) {
    return (
      <Alert
        type="error"
        message="数据加载失败"
        description={loadingError || reduxError}
        action={
          <Button size="small" onClick={fetchData}>
            重试
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {/* 控制面板和标题 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          错误分析中心
        </Typography.Title>
        <div>
          <Text type="secondary" style={{ marginRight: 8 }}>
            最后更新: {dayjs(lastUpdated).format("HH:mm:ss")}
          </Text>
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={fetchData}
            loading={isLoading}
          >
            刷新
          </Button>
        </div>
      </div>

      {/* 筛选控制面板 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>时间范围:</Text>
          </Col>
          <Col>
            <Select
              value={selectedTimePreset}
              onChange={handleTimePresetChange}
              style={{ width: 120 }}
            >
              {TIME_RANGE_PRESETS.map((preset) => (
                <Option key={preset.value} value={preset.value}>
                  {preset.label}
                </Option>
              ))}
            </Select>
          </Col>
          {selectedTimePreset === "custom" && (
            <Col>
              <RangePicker
                value={timeRange}
                onChange={(dates) =>
                  setTimeRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
                }
                format="YYYY-MM-DD"
              />
            </Col>
          )}
          <Col>
            <Text strong>项目:</Text>
          </Col>
          <Col>
            <Select
              value={selectedProject}
              onChange={setSelectedProject}
              style={{ width: 140 }}
              loading={isLoading}
            >
              <Option value="all">全部项目</Option>
              <Option value="frontend">前端项目</Option>
              <Option value="backend">后端API</Option>
              <Option value="mobile">移动端</Option>
              <Option value="usersystem">用户系统</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总错误数"
              value={metrics.totalErrors}
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日错误"
              value={metrics.todayErrors}
              valueStyle={{ color: "#faad14" }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已解决错误"
              value={metrics.resolvedErrors}
              valueStyle={{ color: "#52c41a" }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="严重错误"
              value={metrics.criticalErrors}
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表分析区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 错误趋势图表 */}
        <Col xs={24} lg={16}>
          <Card
            title="错误趋势分析"
            extra={
              <Text type="secondary">
                {days}天数据 | {projectId || "全部项目"}
              </Text>
            }
          >
            <ReactECharts
              option={getErrorTrendOption()}
              style={{ height: "400px" }}
              opts={{ renderer: "canvas" }}
              showLoading={isLoading}
            />
          </Card>
        </Col>

        {/* 错误级别分布 */}
        <Col xs={24} lg={8}>
          <Card title="错误级别分布">
            <ReactECharts
              option={getErrorLevelOption()}
              style={{ height: "400px" }}
              opts={{ renderer: "canvas" }}
              showLoading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细分析区域 */}
      <Row gutter={[16, 16]}>
        {/* 浏览器分布 */}
        <Col xs={24} lg={12}>
          <Card title="浏览器错误分布">
            <ReactECharts
              option={getBrowserDistributionOption()}
              style={{ height: "300px" }}
              opts={{ renderer: "canvas" }}
              showLoading={isLoading}
            />
          </Card>
        </Col>

        {/* 热门错误排行 */}
        <Col xs={24} lg={12}>
          <Card
            title="热门错误排行"
            extra={<Text type="secondary">前10条错误</Text>}
          >
            <Table
              columns={topErrorsColumns}
              dataSource={errorAggregations?.slice(0, 10) || []}
              pagination={false}
              size="small"
              scroll={{ y: 240 }}
              loading={isLoading}
              locale={{ emptyText: "暂无错误数据" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据状态提示 */}
      {!isLoading && metrics.totalErrors === 0 && (
        <Alert
          type="info"
          message="暂无错误数据"
          description="在当前筛选条件下没有发现错误记录"
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};

export default React.memo(ErrorAnalytics);
