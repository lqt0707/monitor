/**
 * 统计报表页面
 * 提供综合的数据统计和报表功能
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Button,
  Space,
  Typography,
  Tabs,
  Table,
  Progress,
  Tag,
  Tooltip,
  Alert,
  Spin,
  Empty,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  FilterOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  FundOutlined,
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined,
  FunnelPlotOutlined,
  DashboardOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import {
  FunnelChart,
  GaugeChart,
  TreemapChart,
  SankeyChart,
  WordCloudChart,
  ComboChart,
} from "../components/AdvancedCharts";
import DataExport, { ExportDataType } from "../components/DataExport";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
// const { TabPane } = Tabs; // 已弃用，使用 items 属性替代

/**
 * 统计数据接口
 */
interface StatisticsData {
  overview: {
    totalErrors: number;
    resolvedErrors: number;
    activeProjects: number;
    totalUsers: number;
    errorRate: number;
    avgResponseTime: number;
  };
  trends: {
    errorTrend: Array<{ date: string; count: number; resolved: number }>;
    performanceTrend: Array<{
      date: string;
      responseTime: number;
      throughput: number;
    }>;
  };
  distribution: {
    errorTypes: Array<{ name: string; value: number }>;
    browsers: Array<{ name: string; value: number }>;
    platforms: Array<{ name: string; value: number }>;
  };
  projects: Array<{
    id: string;
    name: string;
    errorCount: number;
    resolvedCount: number;
    lastError: string;
    status: "healthy" | "warning" | "critical";
  }>;
}

/**
 * 统计报表页面组件
 * @returns JSX.Element
 */
const StatisticsReport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  // const { projects } = useSelector((state: RootState) => state.project);
  // const { errors } = useSelector((state: RootState) => state.error);
  const [loading, setLoading] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [exportDataType, setExportDataType] = useState<ExportDataType>(
    ExportDataType.PROJECT_STATISTICS
  );
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

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

  // 模拟数据
  const [statisticsData, setStatisticsData] = useState<StatisticsData>({
    overview: {
      totalErrors: 1234,
      resolvedErrors: 987,
      activeProjects: 15,
      totalUsers: 2456,
      errorRate: 2.3,
      avgResponseTime: 245,
    },
    trends: {
      errorTrend: Array.from({ length: 30 }, (_, i) => ({
        date: dayjs()
          .subtract(29 - i, "day")
          .format("YYYY-MM-DD"),
        count: Math.floor(Math.random() * 50) + 10,
        resolved: Math.floor(Math.random() * 40) + 5,
      })),
      performanceTrend: Array.from({ length: 30 }, (_, i) => ({
        date: dayjs()
          .subtract(29 - i, "day")
          .format("YYYY-MM-DD"),
        responseTime: Math.floor(Math.random() * 200) + 100,
        throughput: Math.floor(Math.random() * 1000) + 500,
      })),
    },
    distribution: {
      errorTypes: [
        { name: "JavaScript错误", value: 456 },
        { name: "API错误", value: 234 },
        { name: "资源加载错误", value: 189 },
        { name: "网络错误", value: 123 },
        { name: "其他错误", value: 89 },
      ],
      browsers: [
        { name: "Chrome", value: 678 },
        { name: "Safari", value: 234 },
        { name: "Firefox", value: 156 },
        { name: "Edge", value: 89 },
        { name: "其他", value: 45 },
      ],
      platforms: [
        { name: "Windows", value: 567 },
        { name: "macOS", value: 345 },
        { name: "iOS", value: 234 },
        { name: "Android", value: 189 },
        { name: "Linux", value: 78 },
      ],
    },
    projects: [
      {
        id: "1",
        name: "电商前端",
        errorCount: 234,
        resolvedCount: 189,
        lastError: "2024-01-15 14:30:25",
        status: "warning",
      },
      {
        id: "2",
        name: "管理后台",
        errorCount: 123,
        resolvedCount: 120,
        lastError: "2024-01-15 12:15:10",
        status: "healthy",
      },
      {
        id: "3",
        name: "移动端APP",
        errorCount: 456,
        resolvedCount: 234,
        lastError: "2024-01-15 16:45:33",
        status: "critical",
      },
    ],
  });

  /**
   * 加载统计数据
   */
  const loadStatistics = async () => {
    setLoading(true);
    try {
      // 这里应该调用实际的API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // 模拟数据更新
    } catch (error) {
      console.error("加载统计数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 导出报表
   */
  const exportReport = () => {
    // 实现报表导出功能
    console.log("导出报表");
  };

  /**
   * 获取错误趋势图表配置
   */
  const getErrorTrendOption = () => {
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
        },
      },
      legend: {
        data: ["新增错误", "已解决错误"],
        top: 30,
      },
      xAxis: {
        type: "category",
        data: statisticsData.trends.errorTrend.map((item) =>
          dayjs(item.date).format("MM-DD")
        ),
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "新增错误",
          type: "line",
          data: statisticsData.trends.errorTrend.map((item) => item.count),
          smooth: true,
          itemStyle: {
            color: "#ff4d4f",
          },
          areaStyle: {
            opacity: 0.3,
          },
        },
        {
          name: "已解决错误",
          type: "line",
          data: statisticsData.trends.errorTrend.map((item) => item.resolved),
          smooth: true,
          itemStyle: {
            color: "#52c41a",
          },
          areaStyle: {
            opacity: 0.3,
          },
        },
      ],
    };
  };

  /**
   * 获取性能趋势图表配置
   */
  const getPerformanceTrendOption = () => {
    return {
      title: {
        text: "性能趋势分析",
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
        },
      },
      legend: {
        data: ["响应时间(ms)", "吞吐量"],
        top: 30,
      },
      xAxis: {
        type: "category",
        data: statisticsData.trends.performanceTrend.map((item) =>
          dayjs(item.date).format("MM-DD")
        ),
      },
      yAxis: [
        {
          type: "value",
          name: "响应时间(ms)",
          position: "left",
        },
        {
          type: "value",
          name: "吞吐量",
          position: "right",
        },
      ],
      series: [
        {
          name: "响应时间(ms)",
          type: "line",
          yAxisIndex: 0,
          data: statisticsData.trends.performanceTrend.map(
            (item) => item.responseTime
          ),
          smooth: true,
          itemStyle: {
            color: "#1890ff",
          },
        },
        {
          name: "吞吐量",
          type: "bar",
          yAxisIndex: 1,
          data: statisticsData.trends.performanceTrend.map(
            (item) => item.throughput
          ),
          itemStyle: {
            color: "#52c41a",
            opacity: 0.7,
          },
        },
      ],
    };
  };

  /**
   * 获取分布饼图配置
   */
  const getDistributionPieOption = (
    data: Array<{ name: string; value: number }>,
    title: string
  ) => {
    return {
      title: {
        text: title,
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
        top: "middle",
      },
      series: [
        {
          name: title,
          type: "pie",
          radius: ["40%", "70%"],
          center: ["60%", "50%"],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: "18",
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: false,
          },
          data,
        },
      ],
    };
  };

  /**
   * 项目表格列配置
   */
  const projectColumns = [
    {
      title: "项目名称",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "错误总数",
      dataIndex: "errorCount",
      key: "errorCount",
      sorter: (a: any, b: any) => a.errorCount - b.errorCount,
    },
    {
      title: "已解决",
      dataIndex: "resolvedCount",
      key: "resolvedCount",
      sorter: (a: any, b: any) => a.resolvedCount - b.resolvedCount,
    },
    {
      title: "解决率",
      key: "resolveRate",
      render: (record: any) => {
        const rate = Math.round(
          (record.resolvedCount / record.errorCount) * 100
        );
        return (
          <Progress
            percent={rate}
            size="small"
            status={
              rate >= 80 ? "success" : rate >= 60 ? "normal" : "exception"
            }
          />
        );
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig = {
          healthy: { color: "success", text: "健康" },
          warning: { color: "warning", text: "警告" },
          critical: { color: "error", text: "严重" },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "最后错误时间",
      dataIndex: "lastError",
      key: "lastError",
      render: (time: string) => dayjs(time).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  useEffect(() => {
    loadStatistics();
  }, [dateRange, selectedProject]);

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
          统计报表
        </Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
            }
            format="YYYY-MM-DD"
          />
          <Select
            value={selectedProject}
            onChange={setSelectedProject}
            style={{ width: 150 }}
            placeholder="选择项目"
          >
            <Option value="all">全部项目</Option>
            {statisticsData.projects.map((project) => (
              <Option key={project.id} value={project.id}>
                {project.name}
              </Option>
            ))}
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadStatistics}
            loading={loading}
          >
            刷新
          </Button>
          <Button icon={<FilterOutlined />}>高级筛选</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleExport(ExportDataType.PROJECT_STATISTICS)}
          >
            导出报表
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "overview",
              label: "概览统计",
              children: (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="错误总数"
                          value={statisticsData.overview.totalErrors}
                          prefix={
                            <ExclamationCircleOutlined
                              style={{ color: "#ff4d4f" }}
                            />
                          }
                          valueStyle={{ color: "#ff4d4f" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="已解决错误"
                          value={statisticsData.overview.resolvedErrors}
                          prefix={<RiseOutlined style={{ color: "#52c41a" }} />}
                          valueStyle={{ color: "#52c41a" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="活跃项目"
                          value={statisticsData.overview.activeProjects}
                          prefix={<FundOutlined style={{ color: "#1890ff" }} />}
                          valueStyle={{ color: "#1890ff" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card>
                        <Statistic
                          title="总用户数"
                          value={statisticsData.overview.totalUsers}
                          prefix={
                            <BarChartOutlined style={{ color: "#722ed1" }} />
                          }
                          valueStyle={{ color: "#722ed1" }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12}>
                      <Card>
                        <Statistic
                          title="错误率"
                          value={statisticsData.overview.errorRate}
                          precision={2}
                          suffix="%"
                          valueStyle={{
                            color:
                              statisticsData.overview.errorRate > 5
                                ? "#ff4d4f"
                                : "#52c41a",
                          }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Card>
                        <Statistic
                          title="平均响应时间"
                          value={statisticsData.overview.avgResponseTime}
                          suffix="ms"
                          valueStyle={{
                            color:
                              statisticsData.overview.avgResponseTime > 300
                                ? "#ff4d4f"
                                : "#52c41a",
                          }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="错误趋势分析">
                        <ReactECharts
                          option={getErrorTrendOption()}
                          style={{ height: "400px" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="性能趋势分析">
                        <ReactECharts
                          option={getPerformanceTrendOption()}
                          style={{ height: "400px" }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: "distribution",
              label: "分布分析",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={8}>
                    <Card>
                      <ReactECharts
                        option={getDistributionPieOption(
                          statisticsData.distribution.errorTypes,
                          "错误类型分布"
                        )}
                        style={{ height: "400px" }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card>
                      <ReactECharts
                        option={getDistributionPieOption(
                          statisticsData.distribution.browsers,
                          "浏览器分布"
                        )}
                        style={{ height: "400px" }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card>
                      <ReactECharts
                        option={getDistributionPieOption(
                          statisticsData.distribution.platforms,
                          "平台分布"
                        )}
                        style={{ height: "400px" }}
                      />
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "advanced",
              label: "高级分析",
              children: (
                <>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="转化漏斗分析">
                        <FunnelChart
                          data={[
                            { name: "页面访问", value: 1000 },
                            { name: "错误触发", value: 150 },
                            { name: "错误上报", value: 120 },
                            { name: "错误分析", value: 80 },
                            { name: "问题修复", value: 60 },
                          ]}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="系统健康度">
                        <div style={{ display: "flex", gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <GaugeChart
                              title="系统稳定性"
                              value={85}
                              height="200px"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <GaugeChart
                              title="错误处理效率"
                              value={92}
                              height="200px"
                            />
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24}>
                      <Card title="错误分布树图">
                        <TreemapChart
                          data={[
                            {
                              name: "前端错误",
                              value: 800,
                              children: [
                                { name: "JavaScript错误", value: 400 },
                                { name: "CSS错误", value: 200 },
                                { name: "资源加载错误", value: 200 },
                              ],
                            },
                            {
                              name: "后端错误",
                              value: 600,
                              children: [
                                { name: "API错误", value: 300 },
                                { name: "数据库错误", value: 200 },
                                { name: "服务器错误", value: 100 },
                              ],
                            },
                          ]}
                        />
                      </Card>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: "projects",
              label: "项目统计",
              children: (
                <Card title="项目错误统计">
                  <Table
                    columns={projectColumns}
                    dataSource={statisticsData.projects}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 个项目`,
                    }}
                  />
                </Card>
              ),
            },
          ]}
        />
      </Spin>

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

export default StatisticsReport;
