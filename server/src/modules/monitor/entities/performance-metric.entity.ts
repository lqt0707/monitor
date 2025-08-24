import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * 性能指标实体类
 * 专门存储性能监控数据
 */
@Entity("performance_metrics")
@Index(["projectId", "metricTimestamp"])
@Index(["platformCode", "metricTimestamp"])
@Index(["metricType", "metricTimestamp"])
@Index(["metricTimestamp"])
export class PerformanceMetric {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string;

  // ========== 基础信息 ==========

  /**
   * 项目ID
   */
  @Column({ name: "project_id", length: 100 })
  projectId: string;

  /**
   * 平台代码
   */
  @Column({ name: "platform_code", length: 50 })
  platformCode: string;

  /**
   * 会话ID
   */
  @Column({ name: "session_id", length: 100, nullable: true })
  sessionId?: string;

  /**
   * 用户ID
   */
  @Column({ name: "user_id", length: 100, nullable: true })
  userId?: string;

  // ========== 性能指标类型 ==========

  /**
   * 指标类型
   */
  @Column({
    name: "metric_type",
    type: "enum",
    enum: [
      "page_load",
      "api_response",
      "resource_load",
      "user_interaction",
      "memory_usage",
      "custom",
    ],
  })
  metricType:
    | "page_load"
    | "api_response"
    | "resource_load"
    | "user_interaction"
    | "memory_usage"
    | "custom";

  /**
   * 指标名称
   */
  @Column({ name: "metric_name", length: 100 })
  metricName: string;

  // ========== 页面信息 ==========

  /**
   * 页面URL
   */
  @Column({ name: "page_url", length: 1000, nullable: true })
  pageUrl?: string;

  /**
   * 页面标题
   */
  @Column({ name: "page_title", length: 255, nullable: true })
  pageTitle?: string;

  // ========== 核心性能指标 ==========

  /**
   * First Contentful Paint (FCP) - 首次内容绘制时间
   */
  @Column({ name: "fcp", type: "int", nullable: true })
  fcp?: number;

  /**
   * Largest Contentful Paint (LCP) - 最大内容绘制时间
   */
  @Column({ name: "lcp", type: "int", nullable: true })
  lcp?: number;

  /**
   * First Input Delay (FID) - 首次输入延迟
   */
  @Column({ name: "fid", type: "int", nullable: true })
  fid?: number;

  /**
   * Cumulative Layout Shift (CLS) - 累积布局偏移
   */
  @Column({
    name: "cls",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
  })
  cls?: number;

  /**
   * Time to First Byte (TTFB) - 首字节时间
   */
  @Column({ name: "ttfb", type: "int", nullable: true })
  ttfb?: number;

  // ========== 页面加载性能 ==========

  /**
   * DOM Ready 时间
   */
  @Column({ name: "dom_ready", type: "int", nullable: true })
  domReady?: number;

  /**
   * 完整页面加载时间
   */
  @Column({ name: "load_complete", type: "int", nullable: true })
  loadComplete?: number;

  /**
   * 白屏时间
   */
  @Column({ name: "first_paint", type: "int", nullable: true })
  firstPaint?: number;

  // ========== 资源加载性能 ==========

  /**
   * DNS解析时间
   */
  @Column({ name: "dns_lookup", type: "int", nullable: true })
  dnsLookup?: number;

  /**
   * TCP连接时间
   */
  @Column({ name: "tcp_connect", type: "int", nullable: true })
  tcpConnect?: number;

  /**
   * SSL握手时间
   */
  @Column({ name: "ssl_connect", type: "int", nullable: true })
  sslConnect?: number;

  /**
   * 请求响应时间
   */
  @Column({ name: "response_time", type: "int", nullable: true })
  responseTime?: number;

  // ========== API性能 ==========

  /**
   * API URL
   */
  @Column({ name: "api_url", length: 1000, nullable: true })
  apiUrl?: string;

  /**
   * HTTP方法
   */
  @Column({ name: "http_method", length: 10, nullable: true })
  httpMethod?: string;

  /**
   * 响应状态码
   */
  @Column({ name: "status_code", type: "int", nullable: true })
  statusCode?: number;

  /**
   * 请求大小（字节）
   */
  @Column({ name: "request_size", type: "int", nullable: true })
  requestSize?: number;

  /**
   * 响应大小（字节）
   */
  @Column({ name: "response_size", type: "int", nullable: true })
  responseSize?: number;

  // ========== 内存性能 ==========

  /**
   * 已使用内存（MB）
   */
  @Column({
    name: "memory_used",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  memoryUsed?: number;

  /**
   * 总内存（MB）
   */
  @Column({
    name: "memory_total",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  memoryTotal?: number;

  /**
   * 内存使用率（%）
   */
  @Column({
    name: "memory_usage_percent",
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  memoryUsagePercent?: number;

  // ========== 环境信息 ==========

  /**
   * 设备信息（JSON格式）
   */
  @Column({ name: "device_info", type: "text", nullable: true })
  deviceInfo?: string;

  /**
   * 网络信息（JSON格式）
   */
  @Column({ name: "network_info", type: "text", nullable: true })
  networkInfo?: string;

  /**
   * 用户代理
   */
  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent?: string;

  // ========== 自定义数据 ==========

  /**
   * 自定义指标数据（JSON格式）
   */
  @Column({ name: "custom_metrics", type: "text", nullable: true })
  customMetrics?: string;

  /**
   * 扩展数据（JSON格式）
   */
  @Column({ name: "extra_data", type: "text", nullable: true })
  extraData?: string;

  // ========== 时间戳 ==========

  /**
   * 指标发生时间戳（毫秒）
   */
  @Column({ name: "metric_timestamp", type: "bigint" })
  metricTimestamp: number;

  /**
   * 服务器接收时间
   */
  @CreateDateColumn({ name: "received_at" })
  receivedAt: Date;

  // ========== 统计标识 ==========

  /**
   * 数据版本（用于Schema演进）
   */
  @Column({ name: "data_version", length: 10, default: "1.0" })
  dataVersion: string;

  /**
   * 是否已聚合统计
   */
  @Column({ name: "is_aggregated", default: false })
  isAggregated: boolean;
}
