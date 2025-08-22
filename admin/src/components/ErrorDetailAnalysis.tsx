/**
 * 错误详情分析组件
 * 提供单个错误的深度分析和可视化
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Descriptions,
  Timeline,
  Table,
  Tabs,
  Button,
  Space,
  Divider,
  Alert,
  Statistic,
  Progress,
} from "antd";
import {
  BugOutlined,
  ClockCircleOutlined,
  UserOutlined,
  GlobalOutlined,
  CodeOutlined,
  EnvironmentOutlined,
  LineChartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// 启用相对时间插件
dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs; // 已转换为 items 格式

/**
 * 错误详情接口
 */
interface ErrorDetail {
  id: string;
  message: string;
  level: "error" | "warn" | "info" | "debug";
  stack: string;
  url: string;
  userAgent: string;
  timestamp: string;
  projectName: string;
  userId?: string;
  sessionId: string;
  ip: string;
  country: string;
  city: string;
  browser: string;
  os: string;
  device: string;
  resolution: string;
  occurrenceCount: number;
  affectedUsers: number;
  firstSeen: string;
  lastSeen: string;
}

/**
 * 错误详情分析组件属性
 */
interface ErrorDetailAnalysisProps {
  errorId: string;
  onClose?: () => void;
}

/**
 * 错误详情分析组件
 * @param props 组件属性
 * @returns JSX.Element
 */
const ErrorDetailAnalysis: React.FC<ErrorDetailAnalysisProps> = ({
  errorId,
  onClose,
}) => {
  const [errorDetail, setErrorDetail] = useState<ErrorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  /**
   * 模拟获取错误详情数据
   */
  useEffect(() => {
    const fetchErrorDetail = async () => {
      setLoading(true);
      // 模拟API调用
      setTimeout(() => {
        const mockErrorDetail: ErrorDetail = {
          id: errorId,
          message: "TypeError: Cannot read property 'length' of undefined",
          level: "error",
          stack: `TypeError: Cannot read property 'length' of undefined
    at processData (https://example.com/js/app.js:123:45)
    at handleSubmit (https://example.com/js/app.js:89:12)
    at HTMLFormElement.<anonymous> (https://example.com/js/app.js:67:8)
    at HTMLFormElement.dispatch (https://example.com/js/jquery.min.js:2:43064)
    at HTMLFormElement.v.handle (https://example.com/js/jquery.min.js:2:41048)`,
          url: "https://example.com/dashboard",
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          timestamp: dayjs().subtract(2, "hour").toISOString(),
          projectName: "前端项目",
          userId: "user_12345",
          sessionId: "session_67890",
          ip: "192.168.1.100",
          country: "中国",
          city: "北京",
          browser: "Chrome 91.0",
          os: "macOS 11.4",
          device: "Desktop",
          resolution: "1920x1080",
          occurrenceCount: 156,
          affectedUsers: 23,
          firstSeen: dayjs().subtract(7, "day").toISOString(),
          lastSeen: dayjs().subtract(10, "minute").toISOString(),
        };
        setErrorDetail(mockErrorDetail);
        setLoading(false);
      }, 1000);
    };

    fetchErrorDetail();
  }, [errorId]);

  /**
   * 生成错误趋势图表配置
   * @returns ECharts 配置对象
   */
  const getErrorTrendOption = () => {
    const dates = Array.from({ length: 7 }, (_, i) =>
      dayjs()
        .subtract(6 - i, "day")
        .format("MM-DD")
    );
    const counts = [12, 19, 8, 25, 32, 18, 15];

    return {
      title: {
        text: "错误发生趋势",
        left: "center",
        textStyle: {
          fontSize: 14,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "axis",
        formatter: "{b}: {c}次",
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
        data: dates,
      },
      yAxis: {
        type: "value",
        name: "次数",
      },
      series: [
        {
          name: "错误次数",
          type: "line",
          data: counts,
          smooth: true,
          itemStyle: { color: "#ff4d4f" },
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
        },
      ],
    };
  };

  /**
   * 生成浏览器分布图表配置
   * @returns ECharts 配置对象
   */
  const getBrowserDistributionOption = () => {
    const data = [
      { value: 65, name: "Chrome", itemStyle: { color: "#4285f4" } },
      { value: 20, name: "Safari", itemStyle: { color: "#34a853" } },
      { value: 10, name: "Firefox", itemStyle: { color: "#ea4335" } },
      { value: 5, name: "Edge", itemStyle: { color: "#fbbc05" } },
    ];

    return {
      title: {
        text: "浏览器分布",
        left: "center",
        textStyle: {
          fontSize: 14,
          fontWeight: "normal",
        },
      },
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c}% ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
        data: ["Chrome", "Safari", "Firefox", "Edge"],
      },
      series: [
        {
          name: "浏览器",
          type: "pie",
          radius: "50%",
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
   * 用户会话表格列配置
   */
  const sessionColumns = [
    {
      title: "会话ID",
      dataIndex: "sessionId",
      key: "sessionId",
      width: 120,
      render: (text: string) => (
        <Text code style={{ fontSize: "12px" }}>
          {text.substring(0, 8)}...
        </Text>
      ),
    },
    {
      title: "用户ID",
      dataIndex: "userId",
      key: "userId",
      width: 100,
    },
    {
      title: "发生时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 150,
      render: (text: string) => dayjs(text).format("MM-DD HH:mm:ss"),
    },
    {
      title: "浏览器",
      dataIndex: "browser",
      key: "browser",
      width: 100,
    },
    {
      title: "位置",
      dataIndex: "location",
      key: "location",
      width: 120,
      render: (_: any, record: any) => `${record.city}, ${record.country}`,
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
      width: 120,
    },
  ];

  /**
   * 模拟用户会话数据
   */
  const sessionData = Array.from({ length: 10 }, (_, index) => ({
    key: index,
    sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
    userId: `user_${1000 + index}`,
    timestamp: dayjs()
      .subtract(index * 30, "minute")
      .toISOString(),
    browser: ["Chrome", "Safari", "Firefox"][index % 3],
    city: ["北京", "上海", "深圳", "广州"][index % 4],
    country: "中国",
    ip: `192.168.1.${100 + index}`,
  }));

  if (loading || !errorDetail) {
    return (
      <Card loading={loading}>
        <div style={{ height: "400px" }} />
      </Card>
    );
  }

  return (
    <div>
      {/* 头部信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <div>
                <BugOutlined
                  style={{ color: "#ff4d4f", fontSize: "24px", marginRight: 8 }}
                />
                <Title level={4} style={{ display: "inline", margin: 0 }}>
                  错误详情分析
                </Title>
              </div>
              <Tag color="red" style={{ fontSize: "14px", padding: "4px 8px" }}>
                {errorDetail.level.toUpperCase()}
              </Tag>
            </Space>
          </Col>
          <Col>{onClose && <Button onClick={onClose}>关闭</Button>}</Col>
        </Row>

        <Divider />

        <Alert
          message={errorDetail.message}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 关键指标 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Statistic
              title="发生次数"
              value={errorDetail.occurrenceCount}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="影响用户"
              value={errorDetail.affectedUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="首次发现"
              value={dayjs(errorDetail.firstSeen).fromNow()}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="最近发生"
              value={dayjs(errorDetail.lastSeen).fromNow()}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
        </Row>
      </Card>

      {/* 详细信息标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "overview",
            label: "概览",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="基本信息">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="错误ID">
                        <Text code>{errorDetail.id}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="项目名称">
                        {errorDetail.projectName}
                      </Descriptions.Item>
                      <Descriptions.Item label="发生页面">
                        <Text copyable>{errorDetail.url}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="用户代理">
                        <Text ellipsis={{ tooltip: errorDetail.userAgent }}>
                          {errorDetail.userAgent}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="会话ID">
                        <Text code>{errorDetail.sessionId}</Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="环境信息">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="浏览器">
                        <GlobalOutlined style={{ marginRight: 4 }} />
                        {errorDetail.browser}
                      </Descriptions.Item>
                      <Descriptions.Item label="操作系统">
                        {errorDetail.os}
                      </Descriptions.Item>
                      <Descriptions.Item label="设备类型">
                        {errorDetail.device}
                      </Descriptions.Item>
                      <Descriptions.Item label="屏幕分辨率">
                        {errorDetail.resolution}
                      </Descriptions.Item>
                      <Descriptions.Item label="地理位置">
                        <EnvironmentOutlined style={{ marginRight: 4 }} />
                        {errorDetail.city}, {errorDetail.country}
                      </Descriptions.Item>
                      <Descriptions.Item label="IP地址">
                        {errorDetail.ip}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "stack",
            label: "堆栈跟踪",
            children: (
              <Card title="错误堆栈" extra={<CodeOutlined />}>
                <Paragraph>
                  <pre
                    style={{
                      backgroundColor: "#f5f5f5",
                      padding: "16px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      lineHeight: "1.5",
                      overflow: "auto",
                    }}
                  >
                    {errorDetail.stack}
                  </pre>
                </Paragraph>
              </Card>
            ),
          },
          {
            key: "trends",
            label: "趋势分析",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card title="错误发生趋势">
                    <ReactECharts
                      option={getErrorTrendOption()}
                      style={{ height: "300px" }}
                      opts={{ renderer: "canvas" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="浏览器分布">
                    <ReactECharts
                      option={getBrowserDistributionOption()}
                      style={{ height: "300px" }}
                      opts={{ renderer: "canvas" }}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "sessions",
            label: "用户会话",
            children: (
              <Card title="相关用户会话">
                <Table
                  columns={sessionColumns}
                  dataSource={sessionData}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                  }}
                  scroll={{ x: 800 }}
                />
              </Card>
            ),
          },
          {
            key: "timeline",
            label: "时间线",
            children: (
              <Card title="错误发生时间线">
                <Timeline mode="left">
                  <Timeline.Item color="red">
                    <div>
                      <Text strong>首次发现</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(errorDetail.firstSeen).format(
                          "YYYY-MM-DD HH:mm:ss"
                        )}
                      </Text>
                      <br />
                      <Text>错误首次在系统中被检测到</Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="orange">
                    <div>
                      <Text strong>高频发生期</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(errorDetail.firstSeen)
                          .add(2, "day")
                          .format("YYYY-MM-DD HH:mm:ss")}
                      </Text>
                      <br />
                      <Text>错误发生频率达到峰值，影响多个用户</Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <div>
                      <Text strong>问题定位</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(errorDetail.firstSeen)
                          .add(4, "day")
                          .format("YYYY-MM-DD HH:mm:ss")}
                      </Text>
                      <br />
                      <Text>开发团队开始调查并定位问题根因</Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="green">
                    <div>
                      <Text strong>最近发生</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(errorDetail.lastSeen).format(
                          "YYYY-MM-DD HH:mm:ss"
                        )}
                      </Text>
                      <br />
                      <Text>错误最近一次发生的时间</Text>
                    </div>
                  </Timeline.Item>
                </Timeline>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ErrorDetailAnalysis;
