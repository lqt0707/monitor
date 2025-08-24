/**
 * 平台适配器接口
 * 定义各平台需要实现的核心接口，实现平台无关的监控功能
 */

import { ErrorData, PerformanceData, BehaviorData } from "../types/base";

/**
 * 平台环境信息
 */
export interface PlatformInfo {
  /** 平台类型 */
  platform: "web" | "taro-mini" | "wechat-mini" | "react-native";
  /** 平台版本 */
  version: string;
  /** 用户代理信息 */
  userAgent: string;
  /** 设备信息 */
  deviceInfo: Record<string, any>;
}

/**
 * 错误捕获接口
 */
export interface ErrorCaptureAdapter {
  /**
   * 初始化错误监听
   * @param onError 错误回调函数
   */
  initErrorListeners(onError: (error: ErrorData) => void): void;

  /**
   * 销毁错误监听
   */
  destroyErrorListeners(): void;

  /**
   * 手动捕获错误
   * @param error 错误对象或消息
   * @param extra 额外信息
   */
  captureError(error: Error | string, extra?: Record<string, any>): ErrorData;

  /**
   * 捕获HTTP错误
   * @param request 请求信息
   */
  captureHttpError(request: HttpRequestInfo): ErrorData;
}

/**
 * 性能监控接口
 */
export interface PerformanceAdapter {
  /**
   * 初始化性能监控
   * @param onPerformance 性能数据回调
   */
  initPerformanceMonitor(onPerformance: (data: PerformanceData) => void): void;

  /**
   * 销毁性能监控
   */
  destroyPerformanceMonitor(): void;

  /**
   * 手动记录性能指标
   * @param name 指标名称
   * @param metrics 指标数据
   */
  recordPerformance(
    name: string,
    metrics: Record<string, number>
  ): PerformanceData;

  /**
   * 获取页面性能指标
   */
  getPagePerformance(): Record<string, number>;
}

/**
 * 行为监控接口
 */
export interface BehaviorAdapter {
  /**
   * 初始化行为监控
   * @param onBehavior 行为数据回调
   */
  initBehaviorMonitor(onBehavior: (data: BehaviorData) => void): void;

  /**
   * 销毁行为监控
   */
  destroyBehaviorMonitor(): void;

  /**
   * 手动记录行为
   * @param event 事件名称
   * @param data 事件数据
   */
  recordBehavior(event: string, data?: Record<string, any>): BehaviorData;
}

/**
 * 网络适配接口
 */
export interface NetworkAdapter {
  /**
   * 拦截网络请求
   * @param onRequest 请求回调
   * @param onResponse 响应回调
   * @param onError 错误回调
   */
  interceptNetwork(
    onRequest: (request: any) => void,
    onResponse: (response: any) => void,
    onError: (error: any) => void
  ): void;

  /**
   * 发送监控数据
   * @param url 接口地址
   * @param data 数据
   * @param options 选项
   */
  sendData(
    url: string,
    data: any,
    options?: {
      timeout?: number;
      retries?: number;
      headers?: Record<string, string>;
    }
  ): Promise<any>;
}

/**
 * 存储适配接口
 */
export interface StorageAdapter {
  /**
   * 设置本地存储
   * @param key 键
   * @param value 值
   */
  setItem(key: string, value: string): void;

  /**
   * 获取本地存储
   * @param key 键
   */
  getItem(key: string): string | null;

  /**
   * 删除本地存储
   * @param key 键
   */
  removeItem(key: string): void;

  /**
   * 清空本地存储
   */
  clear(): void;
}

/**
 * HTTP请求信息
 */
export interface HttpRequestInfo {
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

/**
 * 完整的平台适配器接口
 */
export interface PlatformAdapter {
  /** 平台信息 */
  readonly platformInfo: PlatformInfo;

  /** 错误捕获适配器 */
  readonly errorCapture: ErrorCaptureAdapter;

  /** 性能监控适配器 */
  readonly performance: PerformanceAdapter;

  /** 行为监控适配器 */
  readonly behavior: BehaviorAdapter;

  /** 网络适配器 */
  readonly network: NetworkAdapter;

  /** 存储适配器 */
  readonly storage: StorageAdapter;

  /**
   * 初始化平台适配器
   * @param config 配置选项
   */
  init(config: Record<string, any>): void;

  /**
   * 销毁平台适配器
   */
  destroy(): void;
}
