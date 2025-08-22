/**
 * 仪表盘页面组件
 * 显示系统概览和关键指标
 */

import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Alert,
  Tag,
  Avatar,
  List,
  Tabs,
  Button,
  Space,
  Modal,
  Progress,
  Badge,
} from "antd";
import {
  BugOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  BarChartOutlined,
  DashboardOutlined,
  MonitorOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RiseOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";

import { fetchErrorStats, fetchErrorTrends } from "../store/slices/errorSlice";
import { fetchProjects } from "../store/slices/projectSlice";
import ErrorAnalytics from "../components/ErrorAnalytics";
import RealTimeMonitor from "../components/RealTimeMonitor";
import ErrorDetailAnalysis from "../components/ErrorDetailAnalysis";
import ErrorReports from "../components/ErrorReports";
import "../styles/enhanced-ui.css";

const { Title } = Typography;
// const { TabPane } = Tabs; // 已弃用，使用items格式

/**
 * 仪表盘页面组件
 * @returns JSX.Element
 */
const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    errorStats,
    errorTrends,
    statsLoading,
    error: errorError,
  } = useAppSelector((state: any) => state.error);
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
  } = useAppSelector((state: any) => state.project);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [showErrorDetail, setShowErrorDetail] = useState(false);

  /**
   * 组件挂载时获取数据
   */
  useEffect(() => {
    dispatch(fetchErrorStats());
    dispatch(fetchErrorTrends({}));
    dispatch(fetchProjects());
  }, [dispatch]);

  /**
   * 生成错误趋势图表配置
   * @returns ECharts 配置对象
   */
  const getErrorTrendsOption = () => {
    const dates = errorTrends.map((item: any) => item.date);
    const counts = errorTrends.map((item: any) => item.count);

    return {
      title: {
        text: "错误趋势",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "axis",
        formatter: "{b}<br/>{a}: {c} 个",
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: "value",
        name: "错误数量",
      },
      series: [
        {
          name: "错误数量",
          type: "line",
          data: counts,
          smooth: true,
          itemStyle: {
            color: "#ff4d4f",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: "rgba(255, 77, 79, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(255, 77, 79, 0.1)",
              },
            ]),
          },
        },
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true,
      },
    };
  };

  /**
   * 生成项目错误分布图表配置
   * @returns ECharts 配置对象
   */
  const getProjectErrorsOption = () => {
    const projectNames = projects.slice(0, 5).map((p: any) => p.name);
    const projectCounts = projects
      .slice(0, 5)
      .map(() => Math.floor(Math.random() * 100));

    return {
      title: {
        text: "项目错误分布",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      xAxis: {
        type: "category",
        data: projectNames,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: "value",
        name: "错误数量",
      },
      series: [
        {
          name: "错误数量",
          type: "bar",
          data: projectCounts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: "#1890ff",
              },
              {
                offset: 1,
                color: "#40a9ff",
              },
            ]),
          },
        },
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true,
      },
    };
  };

  // 加载状态
  if (statsLoading || projectsLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  // 错误状态
  if (errorError || projectsError) {
    return (
      <Alert
        message="加载失败"
        description={errorError || projectsError}
        type="error"
        showIcon
        style={{ margin: "20px 0" }}
      />
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <Title level={2} className="gradient-text">
            监控仪表板
          </Title>
          <div className="dashboard-subtitle">实时监控系统状态和错误分析</div>
        </div>
        <Space className="dashboard-actions">
          <Button
            type={activeTab === "overview" ? "primary" : "default"}
            icon={<DashboardOutlined />}
            onClick={() => setActiveTab("overview")}
            className="action-button"
          >
            概览
          </Button>
          <Button
            type={activeTab === "analytics" ? "primary" : "default"}
            icon={<BarChartOutlined />}
            onClick={() => setActiveTab("analytics")}
            className="action-button"
          >
            分析
          </Button>
          <Button
            type={activeTab === "realtime" ? "primary" : "default"}
            icon={<MonitorOutlined />}
            onClick={() => setActiveTab("realtime")}
            className="action-button"
          >
            实时监控
          </Button>
        </Space>
      </div>

      {(errorError || projectsError) && (
        <Alert
          message="数据加载失败"
          description={errorError || projectsError}
          type="error"
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "overview",
            label: "概览",
            children: (
              <Spin spinning={statsLoading || projectsLoading}>
                {/* 统计卡片 */}
                <Row gutter={[24, 24]} className="stats-row">
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card stat-card-danger" hoverable>
                      <div className="stat-icon danger">
                        <BugOutlined />
                      </div>
                      <Statistic
                        title="总错误数"
                        value={errorStats?.totalErrors || 0}
                        valueStyle={{
                          color: "#ff4757",
                          fontSize: "28px",
                          fontWeight: "bold",
                        }}
                        suffix={
                          <div className="stat-trend">
                            <ArrowUpOutlined style={{ color: "#ff4757" }} />
                            <span
                              style={{ color: "#8c8c8c", fontSize: "12px" }}
                            >
                              +12%
                            </span>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card stat-card-warning" hoverable>
                      <div className="stat-icon warning">
                        <ExclamationCircleOutlined />
                      </div>
                      <Statistic
                        title="未解决错误"
                        value={errorStats?.unresolvedErrors || 0}
                        valueStyle={{
                          color: "#ffa726",
                          fontSize: "28px",
                          fontWeight: "bold",
                        }}
                        suffix={
                          <div className="stat-trend">
                            <ArrowDownOutlined style={{ color: "#52c41a" }} />
                            <span
                              style={{ color: "#8c8c8c", fontSize: "12px" }}
                            >
                              -5%
                            </span>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card stat-card-success" hoverable>
                      <div className="stat-icon success">
                        <CheckCircleOutlined />
                      </div>
                      <Statistic
                        title="已解决错误"
                        value={errorStats?.resolvedErrors || 0}
                        valueStyle={{
                          color: "#52c41a",
                          fontSize: "28px",
                          fontWeight: "bold",
                        }}
                        suffix={
                          <div className="stat-trend">
                            <RiseOutlined style={{ color: "#52c41a" }} />
                            <span
                              style={{ color: "#8c8c8c", fontSize: "12px" }}
                            >
                              +8%
                            </span>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card stat-card-info" hoverable>
                      <div className="stat-icon info">
                        <ClockCircleOutlined />
                      </div>
                      <Statistic
                        title="今日新增"
                        value={errorStats?.todayErrors || 0}
                        valueStyle={{
                          color: "#1890ff",
                          fontSize: "28px",
                          fontWeight: "bold",
                        }}
                        suffix={
                          <div className="stat-trend">
                            <ArrowUpOutlined style={{ color: "#1890ff" }} />
                            <span
                              style={{ color: "#8c8c8c", fontSize: "12px" }}
                            >
                              +3%
                            </span>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 图表区域 */}
                <Row gutter={[24, 24]} className="charts-row">
                  <Col xs={24} lg={16}>
                    <Card title="错误趋势" className="chart-card" hoverable>
                      <ReactECharts
                        option={getErrorTrendsOption()}
                        style={{ height: "400px" }}
                        opts={{ renderer: "canvas" }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="项目错误分布" className="chart-card" hoverable>
                      <ReactECharts
                        option={getProjectErrorsOption()}
                        style={{ height: "400px" }}
                        opts={{ renderer: "canvas" }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 项目概览 */}
                <Row gutter={[24, 24]} className="projects-row">
                  <Col span={24}>
                    <Card title="项目概览" className="projects-card" hoverable>
                      <Row gutter={[16, 16]}>
                        {projects.slice(0, 6).map((project: any) => (
                          <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                            <Card
                              className="project-item-card"
                              hoverable
                              onClick={() => {
                                setSelectedErrorId(`error_${project.id}`);
                                setShowErrorDetail(true);
                              }}
                            >
                              <div className="project-header">
                                <Avatar
                                  icon={<ProjectOutlined />}
                                  className="project-avatar"
                                />
                                <div className="project-info">
                                  <div className="project-name">
                                    {project.name}
                                  </div>
                                  <div className="project-description">
                                    {project.description || "暂无描述"}
                                  </div>
                                </div>
                              </div>
                              <div className="project-footer">
                                <Badge
                                  status={
                                    project.isActive ? "success" : "error"
                                  }
                                  text={project.isActive ? "活跃" : "非活跃"}
                                />
                                <div className="project-date">
                                  {new Date(
                                    project.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="project-stats">
                                <div className="stat-item">
                                  <EyeOutlined />
                                  <span>1.2k</span>
                                </div>
                                <div className="stat-item">
                                  <UserOutlined />
                                  <span>24</span>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </Spin>
            ),
          },
          {
            key: "analytics",
            label: "数据分析",
            children: <ErrorAnalytics />,
          },
          {
            key: "realtime",
            label: "实时监控",
            children: <RealTimeMonitor />,
          },
          {
            key: "reports",
            label: "统计报告",
            children: <ErrorReports />,
          },
        ]}
      />

      {/* 错误详情分析模态框 */}
      <Modal
        title="错误详情分析"
        open={showErrorDetail}
        onCancel={() => setShowErrorDetail(false)}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        {selectedErrorId && (
          <ErrorDetailAnalysis
            errorId={selectedErrorId}
            onClose={() => setShowErrorDetail(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
