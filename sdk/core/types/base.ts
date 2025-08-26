/**
 * 监控SDK核心类型定义
 * 统一各平台的数据类型，确保数据结构一致性
 */

/**
 * 基础配置接口
 */
export interface BaseConfig {
  /** 项目ID */
  projectId: string;
  /** 服务器地址 */
  serverUrl: string;
  /** API密钥 */
  apiKey?: string;
  /** 用户ID */
  userId?: string;
  /** 自定义标签 */
  tags?: Record<string, string>;
  /** 是否在开发环境启用 */
  enableInDev?: boolean;
  /** 采样率 (0-1) */
  sampleRate?: number;
  /** 项目版本 */
  projectVersion?: string;
  /** 构建ID */
  buildId?: string;
  /** 构建时间 */
  buildTime?: string;
  /** 环境 */
  environment?: "development" | "testing" | "staging" | "production";
  /** 是否启用源代码映射 */
  enableSourceMapping?: boolean;
}

/**
 * 错误监控配置
 */
export interface ErrorConfig {
  /** 是否启用错误监控 */
  enabled?: boolean;
  /** 最大错误数量 */
  maxErrors?: number;
  /** 错误过滤规则 */
  filters?: RegExp[];
  /** 采样率 */
  sampleRate?: number;
}

/**
 * 性能监控配置
 */
export interface PerformanceConfig {
  /** 是否启用性能监控 */
  enabled?: boolean;
  /** 最大性能数据数量 */
  maxPerformance?: number;
  /** 是否监控资源加载 */
  enableResourceTiming?: boolean;
  /** 是否监控用户交互 */
  enableUserTiming?: boolean;
}

/**
 * 行为监控配置
 */
export interface BehaviorConfig {
  /** 是否启用行为监控 */
  enabled?: boolean;
  /** 最大行为数据数量 */
  maxBehaviors?: number;
  /** 是否自动追踪点击 */
  autoTrackClick?: boolean;
  /** 是否自动追踪页面浏览 */
  autoTrackPageView?: boolean;
}

/**
 * 数据上报配置
 */
export interface ReportConfig {
  /** 上报间隔(毫秒) */
  interval?: number;
  /** 最大队列大小 */
  maxQueueSize?: number;
  /** 批量上报大小 */
  batchSize?: number;
  /** 请求超时时间 */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟 */
  retryDelay?: number;
  /** 是否启用离线缓存 */
  enableOfflineCache?: boolean;
}

/**
 * 完整的监控配置
 */
export interface MonitorConfig extends BaseConfig {
  /** 错误监控配置 */
  error?: ErrorConfig;
  /** 性能监控配置 */
  performance?: PerformanceConfig;
  /** 行为监控配置 */
  behavior?: BehaviorConfig;
  /** 数据上报配置 */
  report?: ReportConfig;
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** JavaScript运行时错误 */
  JS_ERROR = "js_error",
  /** Promise未捕获错误 */
  PROMISE_ERROR = "promise_error",
  /** 资源加载错误 */
  RESOURCE_ERROR = "resource_error",
  /** 网络请求错误 */
  HTTP_ERROR = "http_error",
  /** 自定义错误 */
  CUSTOM_ERROR = "custom_error",
  /** 框架错误 */
  FRAMEWORK_ERROR = "framework_error",
}

/**
 * 性能指标类型
 */
export enum PerformanceType {
  /** 页面加载性能 */
  PAGE_LOAD = "page_load",
  /** 网络请求性能 */
  HTTP_REQUEST = "http_request",
  /** 资源加载性能 */
  RESOURCE_LOAD = "resource_load",
  /** 用户交互性能 */
  USER_INTERACTION = "user_interaction",
  /** 自定义性能指标 */
  CUSTOM_METRIC = "custom_metric",
}

/**
 * 用户行为类型
 */
export enum BehaviorType {
  /** 页面访问 */
  PAGE_VIEW = "page_view",
  /** 点击事件 */
  CLICK = "click",
  /** 滚动事件 */
  SCROLL = "scroll",
  /** 表单提交 */
  FORM_SUBMIT = "form_submit",
  /** 路由变化 */
  ROUTE_CHANGE = "route_change",
  /** 自定义事件 */
  CUSTOM = "custom",
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
  /** 项目版本 */
  projectVersion?: string;
  /** 用户ID */
  userId?: string;
  /** 会话ID */
  sessionId: string;
  /** 页面URL */
  url: string;
  /** 用户代理 */
  userAgent: string;
  /** 平台信息 */
  platform: string;
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
  /** 错误级别 */
  level?: "error" | "warning" | "info";
  /** 项目版本 */
  projectVersion?: string;
  /** 构建ID */
  buildId?: string;
  /** 源代码映射状态 */
  sourceMappingStatus?: "mapped" | "unmapped" | "pending";
  /** 原始源文件路径 */
  sourceFilePath?: string;
  /** 原始源代码行号 */
  sourceLineNumber?: number;
  /** 原始源代码列号 */
  sourceColumnNumber?: number;
  /** 源代码上下文 */
  sourceContext?: {
    /** 前面的代码行 */
    preLines: string[];
    /** 错误行 */
    errorLine: string;
    /** 后面的代码行 */
    postLines: string[];
  };
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
  /** 导航时间 */
  navigation?: {
    fetchStart: number;
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    connectEnd: number;
    requestStart: number;
    responseStart: number;
    responseEnd: number;
    domContentLoadedEventStart: number;
    domContentLoadedEventEnd: number;
    loadEventStart: number;
    loadEventEnd: number;
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
  /** 元素路径 */
  xpath?: string;
  /** 额外数据 */
  data?: Record<string, any>;
  /** 持续时间 */
  duration?: number;
}

/**
 * 上报数据联合类型
 */
export type MonitorData = ErrorData | PerformanceData | BehaviorData;

/**
 * 事件发射器接口
 */
export interface EventEmitter {
  on(event: string, listener: Function): void;
  off(event: string, listener?: Function): void;
  emit(event: string, ...args: any[]): boolean;
  once(event: string, listener: Function): void;
}

/**
 * 队列状态
 */
export interface QueueStatus {
  /** 队列大小 */
  size: number;
  /** 最大队列大小 */
  maxSize: number;
  /** 是否已满 */
  isFull: boolean;
  /** 错误数量 */
  errorCount: number;
  /** 性能数据数量 */
  performanceCount: number;
  /** 行为数据数量 */
  behaviorCount: number;
}

/**
 * SDK状态
 */
export interface SDKStatus {
  /** 是否已初始化 */
  initialized: boolean;
  /** 是否启用 */
  enabled: boolean;
  /** 队列状态 */
  queue: QueueStatus;
  /** 上次上报时间 */
  lastReportTime: number;
  /** 错误监控状态 */
  errorMonitor: boolean;
  /** 性能监控状态 */
  performanceMonitor: boolean;
  /** 行为监控状态 */
  behaviorMonitor: boolean;
}
