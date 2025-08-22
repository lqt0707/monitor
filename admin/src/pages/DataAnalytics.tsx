/**
 * 数据分析页面组件
 * 提供全面的数据统计和可视化分析功能
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  DatePicker,
  Button,
  Space,
  Tabs,
  Table,
  Tag,
  Progress,
  Alert,
  Tooltip,
  Divider,
} from "antd";
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  DotChartOutlined,
  FundOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CalendarOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { fetchErrorStats, fetchErrorTrends } from "../store/slices/errorSlice";
import { fetchProjects } from "../store/slices/projectSlice";
import DataExport, { ExportDataType } from "../components/DataExport";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
// const { TabPane } = Tabs; // 已弃用，使用 items 属性替代

/**
 * 数据分析页面组件
 * @returns JSX.Element
 */
const DataAnalytics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { errorStats, errorTrends } = useAppSelector(
    (state: any) => state.error
  );
  const { projects } = useAppSelector((state: any) => state.project);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [exportDataType, setExportDataType] = useState<ExportDataType>(
    ExportDataType.ERROR_REPORTS
  );

  /**
   * 组件挂载时获取数据
   */
  useEffect(() => {
    dispatch(fetchErrorStats());
    dispatch(fetchErrorTrends({}));
    dispatch(fetchProjects());
  }, [dispatch]);

  /**
   * 刷新数据
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchErrorStats()),
        dispatch(fetchErrorTrends({})),
        dispatch(fetchProjects()),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * 打开导出弹窗
   */
  const handleExport = (dataType: ExportDataType) => {
    setExportDataType(dataType);
    setExportVisible(true);
  };

  /**
   * 导出完成回调
   */
  const handleExportComplete = (downloadUrl: string) => {
    console.log("Export completed:", downloadUrl);
    setExportVisible(false);
  };

  /**
   * 生成错误趋势图表配置
   * @returns ECharts 配置对象
   */
  const getErrorTrendOption = () => {
    const dates = Array.from({ length: 30 }, (_, i) =>
      dayjs()
        .subtract(29 - i, "day")
        .format("MM-DD")
    );
    const errorData = dates.map(() => Math.floor(Math.random() * 100));
    const resolvedData = dates.map(() => Math.floor(Math.random() * 80));

    return {
      title: {
        text: "错误趋势分析",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#6a7985",
          },
        },
      },
      legend: {
        data: ["新增错误", "已解决错误"],
        top: 30,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: dates,
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "新增错误",
          type: "line",
          stack: "Total",
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(255, 77, 79, 0.8)" },
                { offset: 1, color: "rgba(255, 77, 79, 0.1)" },
              ],
            },
          },
          emphasis: {
            focus: "series",
          },
          data: errorData,
          itemStyle: {
            color: "#ff4d4f",
          },
        },
        {
          name: "已解决错误",
          type: "line",
          stack: "Total",
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(82, 196, 26, 0.8)" },
                { offset: 1, color: "rgba(82, 196, 26, 0.1)" },
              ],
            },
          },
          emphasis: {
            focus: "series",
          },
          data: resolvedData,
          itemStyle: {
            color: "#52c41a",
          },
        },
      ],
    };
  };

  /**
   * 生成错误类型分布饼图配置
   * @returns ECharts 配置对象
   */
  const getErrorTypeDistributionOption = () => {
    const data = [
      { value: 1048, name: "JavaScript错误" },
      { value: 735, name: "网络错误" },
      { value: 580, name: "API错误" },
      { value: 484, name: "资源加载错误" },
      { value: 300, name: "其他错误" },
    ];

    return {
      title: {
        text: "错误类型分布",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b} : {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
        top: "middle",
      },
      series: [
        {
          name: "错误类型",
          type: "pie",
          radius: "50%",
          center: ["60%", "50%"],
          data,
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
   * 生成性能指标雷达图配置
   * @returns ECharts 配置对象
   */
  const getPerformanceRadarOption = () => {
    return {
      title: {
        text: "系统性能指标",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {},
      legend: {
        data: ["当前性能", "目标性能"],
        top: 30,
      },
      radar: {
        indicator: [
          { name: "响应时间", max: 100 },
          { name: "错误率", max: 100 },
          { name: "可用性", max: 100 },
          { name: "吞吐量", max: 100 },
          { name: "用户满意度", max: 100 },
          { name: "系统稳定性", max: 100 },
        ],
      },
      series: [
        {
          name: "性能指标",
          type: "radar",
          data: [
            {
              value: [85, 15, 95, 80, 90, 88],
              name: "当前性能",
              itemStyle: {
                color: "#1890ff",
              },
            },
            {
              value: [95, 5, 99, 90, 95, 95],
              name: "目标性能",
              itemStyle: {
                color: "#52c41a",
              },
            },
          ],
        },
      ],
    };
  };

  /**
   * 生成用户活跃度热力图配置
   * @returns ECharts 配置对象
   */
  const getUserActivityHeatmapOption = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i + "");
    const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const data = [];

    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 24; j++) {
        data.push([j, i, Math.floor(Math.random() * 100)]);
      }
    }

    return {
      title: {
        text: "用户活跃度热力图",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {
        position: "top",
        formatter: function (params: any) {
          return `${days[params.data[1]]} ${params.data[0]}:00<br/>活跃度: ${
            params.data[2]
          }`;
        },
      },
      grid: {
        height: "50%",
        top: "10%",
      },
      xAxis: {
        type: "category",
        data: hours,
        splitArea: {
          show: true,
        },
      },
      yAxis: {
        type: "category",
        data: days,
        splitArea: {
          show: true,
        },
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "15%",
        inRange: {
          color: ["#e0f3ff", "#1890ff"],
        },
      },
      series: [
        {
          name: "活跃度",
          type: "heatmap",
          data,
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  };

  /**
   * 生成项目对比柱状图配置
   * @returns ECharts 配置对象
   */
  const getProjectComparisonOption = () => {
    const projectNames = projects
      .slice(0, 8)
      .map((p: any) => p.name || `项目${p.id}`);
    const errorCounts = projectNames.map(() => Math.floor(Math.random() * 200));
    const userCounts = projectNames.map(() => Math.floor(Math.random() * 1000));

    return {
      title: {
        text: "项目对比分析",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: "#999",
          },
        },
      },
      toolbox: {
        feature: {
          dataView: { show: true, readOnly: false },
          magicType: { show: true, type: ["line", "bar"] },
          restore: { show: true },
          saveAsImage: { show: true },
        },
      },
      legend: {
        data: ["错误数量", "用户数量"],
        top: 30,
      },
      xAxis: [
        {
          type: "category",
          data: projectNames,
          axisPointer: {
            type: "shadow",
          },
          axisLabel: {
            rotate: 45,
          },
        },
      ],
      yAxis: [
        {
          type: "value",
          name: "错误数量",
          min: 0,
          axisLabel: {
            formatter: "{value}",
          },
        },
        {
          type: "value",
          name: "用户数量",
          min: 0,
          axisLabel: {
            formatter: "{value}",
          },
        },
      ],
      series: [
        {
          name: "错误数量",
          type: "bar",
          data: errorCounts,
          itemStyle: {
            color: "#ff4d4f",
          },
        },
        {
          name: "用户数量",
          type: "line",
          yAxisIndex: 1,
          data: userCounts,
          itemStyle: {
            color: "#1890ff",
          },
        },
      ],
    };
  };

  /**
   * 统计数据表格列配置
   */
  const statisticsColumns = [
    {
      title: "指标名称",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "当前值",
      dataIndex: "current",
      key: "current",
      width: 120,
      render: (value: number, record: any) => (
        <Text
          strong
          style={{
            color:
              record.trend === "up"
                ? "#52c41a"
                : record.trend === "down"
                ? "#ff4d4f"
                : "#1890ff",
          }}
        >
          {value}
        </Text>
      ),
    },
    {
      title: "昨日值",
      dataIndex: "yesterday",
      key: "yesterday",
      width: 120,
    },
    {
      title: "变化趋势",
      dataIndex: "trend",
      key: "trend",
      width: 120,
      render: (trend: string, record: any) => {
        const change = (
          ((record.current - record.yesterday) / record.yesterday) *
          100
        ).toFixed(1);
        return (
          <Space>
            {trend === "up" ? (
              <RiseOutlined style={{ color: "#52c41a" }} />
            ) : trend === "down" ? (
              <FallOutlined style={{ color: "#ff4d4f" }} />
            ) : null}
            <Text
              type={
                trend === "up"
                  ? "success"
                  : trend === "down"
                  ? "danger"
                  : undefined
              }
            >
              {change}%
            </Text>
          </Space>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "good" ? "green" : status === "warning" ? "orange" : "red";
        const text =
          status === "good" ? "良好" : status === "warning" ? "警告" : "异常";
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  /**
   * 统计数据
   */
  const statisticsData = [
    {
      key: "1",
      name: "总错误数",
      current: 1234,
      yesterday: 1156,
      trend: "up",
      status: "warning",
    },
    {
      key: "2",
      name: "活跃用户数",
      current: 8765,
      yesterday: 8432,
      trend: "up",
      status: "good",
    },
    {
      key: "3",
      name: "错误率",
      current: 2.3,
      yesterday: 2.8,
      trend: "down",
      status: "good",
    },
    {
      key: "4",
      name: "平均响应时间(ms)",
      current: 245,
      yesterday: 198,
      trend: "up",
      status: "warning",
    },
    {
      key: "5",
      name: "系统可用性",
      current: 99.8,
      yesterday: 99.9,
      trend: "down",
      status: "good",
    },
  ];

  return (
    <div>
      {/* 页面标题和操作区 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2}>数据分析</Title>
        <Space>
          <Select
            value={selectedProject}
            onChange={setSelectedProject}
            style={{ width: 200 }}
            placeholder="选择项目"
          >
            <Option value="all">全部项目</Option>
            {projects.map((project: any) => (
              <Option key={project.id} value={project.id}>
                {project.name || `项目${project.id}`}
              </Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
            }
            format="YYYY-MM-DD"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            刷新
          </Button>
          <Button icon={<FilterOutlined />}>高级筛选</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleExport(ExportDataType.ERROR_REPORTS)}
          >
            导出报告
          </Button>
        </Space>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总错误数"
              value={errorStats?.totalErrors || 1234}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
            <Progress
              percent={78}
              showInfo={false}
              strokeColor="#ff4d4f"
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={8765}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
            <Progress
              percent={85}
              showInfo={false}
              strokeColor="#1890ff"
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="错误率"
              value={2.3}
              precision={1}
              suffix="%"
              prefix={<PieChartOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <Progress
              percent={23}
              showInfo={false}
              strokeColor="#52c41a"
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="系统可用性"
              value={99.8}
              precision={1}
              suffix="%"
              prefix={<FundOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
            <Progress
              percent={99.8}
              showInfo={false}
              strokeColor="#722ed1"
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 图表分析区域 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "trend",
            label: "趋势分析",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card title="错误趋势分析" extra={<AreaChartOutlined />}>
                    <ReactECharts
                      option={getErrorTrendOption()}
                      style={{ height: "400px" }}
                      opts={{ renderer: "canvas" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="错误类型分布" extra={<PieChartOutlined />}>
                    <ReactECharts
                      option={getErrorTypeDistributionOption()}
                      style={{ height: "400px" }}
                      opts={{ renderer: "canvas" }}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "performance",
            label: "性能分析",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="系统性能指标" extra={<DotChartOutlined />}>
                    <ReactECharts
                      option={getPerformanceRadarOption()}
                      style={{ height: "400px" }}
                      opts={{ renderer: "canvas" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="用户活跃度热力图" extra={<CalendarOutlined />}>
                    <ReactECharts
                      option={getUserActivityHeatmapOption()}
                      style={{ height: "400px" }}
                      opts={{ renderer: "canvas" }}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "comparison",
            label: "项目对比",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title="项目对比分析" extra={<BarChartOutlined />}>
                    <ReactECharts
                      option={getProjectComparisonOption()}
                      style={{ height: "500px" }}
                      opts={{ renderer: "canvas" }}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "statistics",
            label: "统计报表",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title="关键指标统计" extra={<FundOutlined />}>
                    <Alert
                      message="数据更新时间"
                      description={`最后更新时间: ${dayjs().format(
                        "YYYY-MM-DD HH:mm:ss"
                      )}`}
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Table
                      columns={statisticsColumns}
                      dataSource={statisticsData}
                      pagination={false}
                      size="middle"
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      {/* 数据导出弹窗 */}
      <DataExport
        visible={exportVisible}
        onCancel={() => setExportVisible(false)}
        defaultDataType={exportDataType}
        onExportComplete={handleExportComplete}
      />
    </div>
  );
};

export default DataAnalytics;
