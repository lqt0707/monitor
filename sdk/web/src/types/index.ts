/**
 * Web监控SDK核心类型定义
 * 定义错误监控、性能监控、用户行为等相关类型
 */

/**
 * SDK配置选项
 */
export interface MonitorConfig {
  /** 项目ID */
  projectId: string;
  /** 服务器地址 */
  serverUrl: string;
  /** API密钥 */
  apiKey?: string;
  /** 是否启用错误监控 */
  enableErrorMonitor?: boolean;
  /** 是否启用性能监控 */
  enablePerformanceMonitor?: boolean;
  /** 是否启用用户行为监控 */
  enableBehaviorMonitor?: boolean;
  /** 采样率 (0-1) */
  sampleRate?: number;
  /** 最大错误数量 */
  maxErrors?: number;
  /** 上报间隔(毫秒) */
  reportInterval?: number;
  /** 是否在开发环境启用 */
  enableInDev?: boolean;
  /** 自定义用户信息 */
  userId?: string;
  /** 自定义标签 */
  tags?: Record<string, string>;
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** JavaScript运行时错误 */
  JS_ERROR = 'js_error',
  /** Promise未捕获错误 */
  PROMISE_ERROR = 'promise_error',
  /** 资源加载错误 */
  RESOURCE_ERROR = 'resource_error',
  /** 网络请求错误 */
  HTTP_ERROR = 'http_error',
  /** 自定义错误 */
  CUSTOM_ERROR = 'custom_error'
}

/**
 * 性能指标类型
 */
export enum PerformanceType {
  /** 页面加载性能 */
  PAGE_LOAD = 'page_load',
  /** 网络请求性能 */
  HTTP_REQUEST = 'http_request',
  /** 资源加载性能 */
  RESOURCE_LOAD = 'resource_load',
  /** 用户交互性能 */
  USER_INTERACTION = 'user_interaction'
}

/**
 * 用户行为类型
 */
export enum BehaviorType {
  /** 页面访问 */
  PAGE_VIEW = 'page_view',
  /** 点击事件 */
  CLICK = 'click',
  /** 滚动事件 */
  SCROLL = 'scroll',
  /** 表单提交 */
  FORM_SUBMIT = 'form_submit',
  /** 路由变化 */
  ROUTE_CHANGE = 'route_change',
  /** 自定义事件 */
  CUSTOM = 'custom'
}

/**
 * 基础监控数据接口
 */
export interface BaseMonitorData {
  /** 数据ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 项目ID */
  projectId: string;
  /** 用户ID */
  userId?: string;
  /** 会话ID */
  sessionId: string;
  /** 页面URL */
  url: string;
  /** 用户代理 */
  userAgent: string;
  /** 自定义标签 */
  tags?: Record<string, string>;
}

/**
 * 错误监控数据
 */
export interface ErrorData extends BaseMonitorData {
  /** 错误类型 */
  type: ErrorType;
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 文件名 */
  filename?: string;
  /** 行号 */
  lineno?: number;
  /** 列号 */
  colno?: number;
  /** 错误对象 */
  error?: any;
  /** 组件堆栈(React等框架) */
  componentStack?: string;
}

/**
 * 性能监控数据
 */
export interface PerformanceData extends BaseMonitorData {
  /** 性能类型 */
  type: PerformanceType;
  /** 性能指标 */
  metrics: Record<string, number>;
  /** 资源信息 */
  resource?: {
    name: string;
    size: number;
    duration: number;
    type: string;
  };
}

/**
 * 用户行为数据
 */
export interface BehaviorData extends BaseMonitorData {
  /** 行为类型 */
  type: BehaviorType;
  /** 事件名称 */
  event: string;
  /** 目标元素 */
  target?: string;
  /** 额外数据 */
  data?: Record<string, any>;
}

/**
 * HTTP请求信息
 */
export interface HttpRequestInfo {
  /** 请求URL */
  url: string;
  /** 请求方法 */
  method: string;
  /** 状态码 */
  status: number;
  /** 响应时间 */
  duration: number;
  /** 请求大小 */
  requestSize?: number;
  /** 响应大小 */
  responseSize?: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 页面性能指标
 */
export interface PagePerformanceMetrics {
  /** DNS查询时间 */
  dnsTime: number;
  /** TCP连接时间 */
  tcpTime: number;
  /** 请求时间 */
  requestTime: number;
  /** 响应时间 */
  responseTime: number;
  /** DOM解析时间 */
  domParseTime: number;
  /** 资源加载时间 */
  resourceLoadTime: number;
  /** 首屏时间 */
  firstPaintTime: number;
  /** 首次内容绘制时间 */
  firstContentfulPaintTime: number;
  /** 最大内容绘制时间 */
  largestContentfulPaintTime: number;
  /** 首次输入延迟 */
  firstInputDelay: number;
  /** 累积布局偏移 */
  cumulativeLayoutShift: number;
}

/**
 * 上报数据格式
 */
export interface ReportData {
  /** 错误数据 */
  errors?: ErrorData[];
  /** 性能数据 */
  performance?: PerformanceData[];
  /** 行为数据 */
  behaviors?: BehaviorData[];
}

/**
 * 插件接口
 */
export interface MonitorPlugin {
  /** 插件名称 */
  name: string;
  /** 插件初始化 */
  init(config: MonitorConfig): void;
  /** 插件销毁 */
  destroy(): void;
}