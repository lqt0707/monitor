/**
 * 实时监控页面
 * 提供实时的系统状态和错误监控功能
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Badge,
  Typography,
  Space,
  Button,
  Switch,
  Tooltip,
  List,
  Avatar,
  Tag,
  Timeline,
  Divider,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  BugOutlined,
  ApiOutlined,
  GlobalOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

/**
 * 实时错误数据接口
 */
interface RealTimeError {
  id: string;
  message: string;
  type: "javascript" | "api" | "network" | "database";
  level: "error" | "warning" | "info";
  timestamp: string;
  project: string;
  count: number;
}

/**
 * 系统指标数据接口
 */
interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  errorRate: number;
  responseTime: number;
  activeUsers: number;
  requestsPerSecond: number;
}

/**
 * 实时监控页面组件
 * @returns JSX.Element
 */
const RealTimeMonitor: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 实时数据状态
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 67,
    disk: 23,
    network: 89,
    errorRate: 2.3,
    responseTime: 245,
    activeUsers: 1234,
    requestsPerSecond: 156,
  });

  const [recentErrors, setRecentErrors] = useState<RealTimeError[]>([
    {
      id: "1",
      message: "TypeError: Cannot read property of undefined",
      type: "javascript",
      level: "error",
      timestamp: dayjs().subtract(2, "minute").toISOString(),
      project: "电商前端",
      count: 5,
    },
    {
      id: "2",
      message: "API请求超时",
      type: "api",
      level: "warning",
      timestamp: dayjs().subtract(5, "minute").toISOString(),
      project: "管理后台",
      count: 3,
    },
    {
      id: "3",
      message: "数据库连接失败",
      type: "database",
      level: "error",
      timestamp: dayjs().subtract(8, "minute").toISOString(),
      project: "用户服务",
      count: 1,
    },
  ]);

  const [errorTrendData, setErrorTrendData] = useState<
    Array<{ time: string; count: number }>
  >([
    { time: dayjs().subtract(30, "minute").format("HH:mm"), count: 12 },
    { time: dayjs().subtract(25, "minute").format("HH:mm"), count: 8 },
    { time: dayjs().subtract(20, "minute").format("HH:mm"), count: 15 },
    { time: dayjs().subtract(15, "minute").format("HH:mm"), count: 6 },
    { time: dayjs().subtract(10, "minute").format("HH:mm"), count: 9 },
    { time: dayjs().subtract(5, "minute").format("HH:mm"), count: 11 },
    { time: dayjs().format("HH:mm"), count: 7 },
  ]);

  /**
   * 模拟实时数据更新
   */
  const updateRealTimeData = () => {
    // 更新系统指标
    setSystemMetrics((prev) => ({
      ...prev,
      cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(
        0,
        Math.min(100, prev.memory + (Math.random() - 0.5) * 8)
      ),
      disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 3)),
      network: Math.max(
        0,
        Math.min(100, prev.network + (Math.random() - 0.5) * 15)
      ),
      errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.5),
      responseTime: Math.max(
        50,
        prev.responseTime + (Math.random() - 0.5) * 50
      ),
      activeUsers: Math.max(
        0,
        prev.activeUsers + Math.floor((Math.random() - 0.5) * 100)
      ),
      requestsPerSecond: Math.max(
        0,
        prev.requestsPerSecond + Math.floor((Math.random() - 0.5) * 50)
      ),
    }));

    // 更新错误趋势数据
    setErrorTrendData((prev) => {
      const newData = [...prev.slice(1)];
      newData.push({
        time: dayjs().format("HH:mm"),
        count: Math.floor(Math.random() * 20) + 1,
      });
      return newData;
    });

    // 随机添加新错误
    if (Math.random() < 0.3) {
      const errorTypes: RealTimeError["type"][] = [
        "javascript",
        "api",
        "network",
        "database",
      ];
      const errorLevels: RealTimeError["level"][] = [
        "error",
        "warning",
        "info",
      ];
      const projects = ["电商前端", "管理后台", "用户服务", "支付系统"];
      const messages = [
        "TypeError: Cannot read property of undefined",
        "API请求超时",
        "网络连接异常",
        "数据库查询失败",
        "内存溢出错误",
        "权限验证失败",
      ];

      const newError: RealTimeError = {
        id: Date.now().toString(),
        message: messages[Math.floor(Math.random() * messages.length)],
        type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
        level: errorLevels[Math.floor(Math.random() * errorLevels.length)],
        timestamp: dayjs().toISOString(),
        project: projects[Math.floor(Math.random() * projects.length)],
        count: Math.floor(Math.random() * 10) + 1,
      };

      setRecentErrors((prev) => [newError, ...prev.slice(0, 9)]);
    }
  };

  /**
   * 开始/停止监控
   */
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  /**
   * 手动刷新数据
   */
  const refreshData = () => {
    updateRealTimeData();
  };

  /**
   * 获取错误类型图标
   */
  const getErrorIcon = (type: RealTimeError["type"]) => {
    const iconMap = {
      javascript: <BugOutlined style={{ color: "#ff4d4f" }} />,
      api: <ApiOutlined style={{ color: "#faad14" }} />,
      network: <GlobalOutlined style={{ color: "#1890ff" }} />,
      database: <DatabaseOutlined style={{ color: "#722ed1" }} />,
    };
    return iconMap[type];
  };

  /**
   * 获取错误级别颜色
   */
  const getErrorLevelColor = (level: RealTimeError["level"]) => {
    const colorMap = {
      error: "error",
      warning: "warning",
      info: "processing",
    };
    return colorMap[level] as any;
  };

  /**
   * 获取错误趋势图表配置
   */
  const getErrorTrendOption = () => {
    return {
      title: {
        text: "实时错误趋势",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "axis",
        formatter: "{b}: {c} 个错误",
      },
      xAxis: {
        type: "category",
        data: errorTrendData.map((item) => item.time),
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        min: 0,
      },
      series: [
        {
          type: "line",
          data: errorTrendData.map((item) => item.count),
          smooth: true,
          itemStyle: {
            color: "#ff4d4f",
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(255, 77, 79, 0.3)" },
                { offset: 1, color: "rgba(255, 77, 79, 0.1)" },
              ],
            },
          },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
    };
  };

  // 设置自动刷新
  useEffect(() => {
    if (autoRefresh && isMonitoring) {
      intervalRef.current = setInterval(updateRealTimeData, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, isMonitoring, refreshInterval]);

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
          实时监控
        </Title>
        <Space>
          <Text>自动刷新</Text>
          <Switch
            checked={autoRefresh}
            onChange={setAutoRefresh}
            checkedChildren="开"
            unCheckedChildren="关"
          />
          <Button
            type={isMonitoring ? "default" : "primary"}
            icon={
              isMonitoring ? <PauseCircleOutlined /> : <PlayCircleOutlined />
            }
            onClick={toggleMonitoring}
          >
            {isMonitoring ? "暂停监控" : "开始监控"}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={refreshData}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 系统状态概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={systemMetrics.activeUsers}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="请求/秒"
              value={systemMetrics.requestsPerSecond}
              prefix={<ApiOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="错误率"
              value={systemMetrics.errorRate}
              precision={2}
              suffix="%"
              prefix={
                <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
              }
              valueStyle={{
                color: systemMetrics.errorRate > 5 ? "#ff4d4f" : "#52c41a",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="响应时间"
              value={systemMetrics.responseTime}
              suffix="ms"
              prefix={<GlobalOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{
                color: systemMetrics.responseTime > 300 ? "#ff4d4f" : "#52c41a",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 系统资源监控 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title="错误趋势监控"
            extra={
              <Badge
                status={isMonitoring ? "processing" : "default"}
                text={isMonitoring ? "监控中" : "已暂停"}
              />
            }
          >
            <ReactECharts
              option={getErrorTrendOption()}
              style={{ height: "300px" }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="系统资源">
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text>CPU使用率</Text>
                  <Text strong>{systemMetrics.cpu.toFixed(1)}%</Text>
                </div>
                <Progress
                  percent={systemMetrics.cpu}
                  status={
                    systemMetrics.cpu > 80
                      ? "exception"
                      : systemMetrics.cpu > 60
                      ? "normal"
                      : "success"
                  }
                  showInfo={false}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text>内存使用率</Text>
                  <Text strong>{systemMetrics.memory.toFixed(1)}%</Text>
                </div>
                <Progress
                  percent={systemMetrics.memory}
                  status={
                    systemMetrics.memory > 80
                      ? "exception"
                      : systemMetrics.memory > 60
                      ? "normal"
                      : "success"
                  }
                  showInfo={false}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text>磁盘使用率</Text>
                  <Text strong>{systemMetrics.disk.toFixed(1)}%</Text>
                </div>
                <Progress
                  percent={systemMetrics.disk}
                  status={
                    systemMetrics.disk > 80
                      ? "exception"
                      : systemMetrics.disk > 60
                      ? "normal"
                      : "success"
                  }
                  showInfo={false}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text>网络使用率</Text>
                  <Text strong>{systemMetrics.network.toFixed(1)}%</Text>
                </div>
                <Progress
                  percent={systemMetrics.network}
                  status={
                    systemMetrics.network > 80
                      ? "exception"
                      : systemMetrics.network > 60
                      ? "normal"
                      : "success"
                  }
                  showInfo={false}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 实时错误列表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="实时错误监控"
            extra={
              <Space>
                <Badge count={recentErrors.length} showZero />
                <Text type="secondary">最近10条错误</Text>
              </Space>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={recentErrors}
              renderItem={(error) => (
                <List.Item
                  actions={[
                    <Tag color={getErrorLevelColor(error.level)} key="level">
                      {error.level.toUpperCase()}
                    </Tag>,
                    <Text type="secondary" key="time">
                      {dayjs(error.timestamp).fromNow()}
                    </Text>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={getErrorIcon(error.type)}
                    title={
                      <Space>
                        <Text strong>{error.message}</Text>
                        <Badge
                          count={error.count}
                          style={{ backgroundColor: "#ff4d4f" }}
                        />
                      </Space>
                    }
                    description={
                      <Space>
                        <Text type="secondary">项目: {error.project}</Text>
                        <Divider type="vertical" />
                        <Text type="secondary">类型: {error.type}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RealTimeMonitor;
