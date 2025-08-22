/**
 * 错误分析组件
 * 提供详细的错误数据可视化和分析功能
 */

import React, { useEffect, useMemo, useState } from "react";
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
} from "antd";
import {
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { fetchErrorTrends, fetchErrorStats } from "../store/slices/errorSlice";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 错误级别颜色映射
 */
const ERROR_LEVEL_COLORS = {
  error: "#ff4d4f",
  warn: "#faad14",
  info: "#1890ff",
  debug: "#52c41a",
};

/**
 * 错误分析组件
 * @returns JSX.Element
 */
const ErrorAnalytics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { errorTrends, errorStats } = useAppSelector(
    (state: any) => state.error
  );
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  // 使用 useMemo 派生稳定的依赖，避免因为复杂对象（如 Dayjs 实例数组）引用变化导致的 useEffect 反复触发
  const projectId = useMemo(
    () => (selectedProject === "all" ? undefined : selectedProject),
    [selectedProject]
  );

  const days = useMemo(() => {
    if (!timeRange || timeRange.length < 2) return 7;
    const diff = timeRange[1].diff(timeRange[0], "day") + 1;
    return Math.max(1, diff);
  }, [timeRange]);

  /**
   * 组件挂载与筛选条件变更时获取统计与趋势数据
   * 参数：
   *  - projectId: string | undefined 选中的项目ID，all 时为 undefined
   *  - days: number 时间范围的天数，至少为 1
   * 返回：无
   * 异常：内部通过 Redux Thunk 捕获并通过 antd message 提示
   */
  useEffect(() => {
    dispatch(fetchErrorStats(projectId));
    dispatch(fetchErrorTrends({ projectId, days }));
  }, [projectId, days]);

  /**
   * 生成错误趋势折线图配置
   * @returns ECharts 配置对象
   */
  const getErrorTrendOption = () => {
    const dates =
      errorTrends?.map((item: any) => dayjs(item.date).format("MM-DD")) || [];
    const errorCounts =
      errorTrends?.map((item: any) => item.errorCount || 0) || [];
    const warnCounts =
      errorTrends?.map((item: any) => item.warnCount || 0) || [];
    const infoCounts =
      errorTrends?.map((item: any) => item.infoCount || 0) || [];

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
        data: ["错误", "警告", "信息"],
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
          name: "错误",
          type: "line",
          data: errorCounts,
          smooth: true,
          itemStyle: { color: ERROR_LEVEL_COLORS.error },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(255, 77, 79, 0.3)" },
              { offset: 1, color: "rgba(255, 77, 79, 0.1)" },
            ]),
          },
        },
        {
          name: "警告",
          type: "line",
          data: warnCounts,
          smooth: true,
          itemStyle: { color: ERROR_LEVEL_COLORS.warn },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(250, 173, 20, 0.3)" },
              { offset: 1, color: "rgba(250, 173, 20, 0.1)" },
            ]),
          },
        },
        {
          name: "信息",
          type: "line",
          data: infoCounts,
          smooth: true,
          itemStyle: { color: ERROR_LEVEL_COLORS.info },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(24, 144, 255, 0.3)" },
              { offset: 1, color: "rgba(24, 144, 255, 0.1)" },
            ]),
          },
        },
      ],
    };
  };

  /**
   * 生成错误级别分布饼图配置
   * @returns ECharts 配置对象
   */
  const getErrorLevelOption = () => {
    const data = [
      {
        value: errorStats?.errorCount || 0,
        name: "错误",
        itemStyle: { color: ERROR_LEVEL_COLORS.error },
      },
      {
        value: errorStats?.warnCount || 0,
        name: "警告",
        itemStyle: { color: ERROR_LEVEL_COLORS.warn },
      },
      {
        value: errorStats?.infoCount || 0,
        name: "信息",
        itemStyle: { color: ERROR_LEVEL_COLORS.info },
      },
      {
        value: errorStats?.debugCount || 0,
        name: "调试",
        itemStyle: { color: ERROR_LEVEL_COLORS.debug },
      },
    ];

    return {
      title: {
        text: "错误级别分布",
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
        data: ["错误", "警告", "信息", "调试"],
      },
      series: [
        {
          name: "错误级别",
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
   * 生成浏览器分布柱状图配置
   * @returns ECharts 配置对象
   */
  const getBrowserDistributionOption = () => {
    const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
    const data = browsers.map(() => Math.floor(Math.random() * 100));

    return {
      title: {
        text: "浏览器错误分布",
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
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: browsers,
      },
      yAxis: {
        type: "value",
        name: "错误数量",
      },
      series: [
        {
          name: "错误数量",
          type: "bar",
          data,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#83bff6" },
              { offset: 0.5, color: "#188df0" },
              { offset: 1, color: "#188df0" },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#2378f7" },
                { offset: 0.7, color: "#2378f7" },
                { offset: 1, color: "#83bff6" },
              ]),
            },
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
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "级别",
      dataIndex: "level",
      key: "level",
      width: 80,
      render: (level: string) => (
        <Tag
          color={ERROR_LEVEL_COLORS[level as keyof typeof ERROR_LEVEL_COLORS]}
        >
          {level.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "次数",
      dataIndex: "count",
      key: "count",
      width: 80,
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: "项目",
      dataIndex: "projectName",
      key: "projectName",
      width: 120,
    },
  ];

  /**
   * 模拟热门错误数据
   */
  const topErrorsData = [
    {
      key: "1",
      message: "TypeError: Cannot read property of undefined",
      level: "error",
      count: 156,
      projectName: "前端项目",
    },
    {
      key: "2",
      message: "ReferenceError: variable is not defined",
      level: "error",
      count: 89,
      projectName: "后端API",
    },
    {
      key: "3",
      message: "Network request timeout",
      level: "warn",
      count: 67,
      projectName: "移动端",
    },
    {
      key: "4",
      message: "Deprecated API usage warning",
      level: "warn",
      count: 45,
      projectName: "前端项目",
    },
    {
      key: "5",
      message: "User authentication failed",
      level: "info",
      count: 34,
      projectName: "用户系统",
    },
  ];

  return (
    <div>
      {/* 控制面板 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>时间范围:</Text>
          </Col>
          <Col>
            <RangePicker
              value={timeRange}
              onChange={(dates) =>
                setTimeRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
              }
              format="YYYY-MM-DD"
            />
          </Col>
          <Col>
            <Text strong>项目:</Text>
          </Col>
          <Col>
            <Select
              value={selectedProject}
              onChange={setSelectedProject}
              style={{ width: 120 }}
            >
              <Option value="all">全部项目</Option>
              <Option value="frontend">前端项目</Option>
              <Option value="backend">后端API</Option>
              <Option value="mobile">移动端</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 关键指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="错误解决率"
              value={85.6}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <Progress percent={85.6} showInfo={false} strokeColor="#52c41a" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={2.3}
              precision={1}
              suffix="小时"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃项目数"
              value={12}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="错误类型数"
              value={8}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 错误趋势图 */}
        <Col xs={24} lg={16}>
          <Card title="错误趋势分析">
            <ReactECharts
              option={getErrorTrendOption()}
              style={{ height: "400px" }}
              opts={{ renderer: "canvas" }}
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
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 浏览器分布 */}
        <Col xs={24} lg={12}>
          <Card title="浏览器错误分布">
            <ReactECharts
              option={getBrowserDistributionOption()}
              style={{ height: "300px" }}
              opts={{ renderer: "canvas" }}
            />
          </Card>
        </Col>

        {/* 热门错误 */}
        <Col xs={24} lg={12}>
          <Card title="热门错误排行">
            <Table
              columns={topErrorsColumns}
              dataSource={topErrorsData}
              pagination={false}
              size="small"
              scroll={{ y: 240 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ErrorAnalytics;
