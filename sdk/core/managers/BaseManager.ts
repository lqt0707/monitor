/**
 * 核心基础管理器
 * 提供监控SDK的基础功能：配置管理、事件系统、队列管理等
 */

import {
  MonitorConfig,
  MonitorData,
  SDKStatus,
  EventEmitter,
  ErrorData,
  PerformanceData,
  BehaviorData,
} from "../types/base";
import { PlatformAdapter } from "../interfaces/PlatformAdapter";
import { generateId, getTimestamp, generateSessionId } from "../utils/common";

/**
 * 监控SDK核心管理器
 */
export class BaseManager implements EventEmitter {
  protected config: MonitorConfig;
  protected platformAdapter: PlatformAdapter;
  protected sessionId: string;
  protected dataQueue: MonitorData[] = [];
  protected isInitialized: boolean = false;
  protected isEnabled: boolean = true;
  protected listeners: Map<string, Function[]> = new Map();
  protected reportTimer?: any;

  constructor(config: MonitorConfig, platformAdapter: PlatformAdapter) {
    this.config = this.mergeConfig(config);
    this.platformAdapter = platformAdapter;
    this.sessionId = generateSessionId();
  }

  /**
   * 合并默认配置和用户配置
   * @param userConfig 用户配置
   * @returns 合并后的配置
   */
  private mergeConfig(userConfig: MonitorConfig): MonitorConfig {
    const defaultConfig: Partial<MonitorConfig> = {
      enableInDev: false,
      sampleRate: 1,
      error: {
        enabled: true,
        maxErrors: 100,
        filters: [],
        sampleRate: 1,
      },
      performance: {
        enabled: true,
        maxPerformance: 100,
        enableResourceTiming: true,
        enableUserTiming: true,
      },
      behavior: {
        enabled: true,
        maxBehaviors: 200,
        autoTrackClick: true,
        autoTrackPageView: true,
      },
      report: {
        interval: 10000,
        maxQueueSize: 500,
        batchSize: 20,
        timeout: 5000,
        maxRetries: 3,
        retryDelay: 2000,
        enableOfflineCache: true,
      },
    };

    return this.deepMerge(defaultConfig, userConfig) as MonitorConfig;
  }

  /**
   * 深度合并对象
   * @param target 目标对象
   * @param source 源对象
   * @returns 合并后的对象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === "object" &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          result[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * 初始化监控SDK
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn("[Monitor] SDK already initialized");
      return;
    }

    // 检查环境是否应该启用监控
    if (!this.shouldEnable()) {
      this.isEnabled = false;
      return;
    }

    try {
      // 初始化平台适配器
      await this.platformAdapter.init(this.config);

      // 初始化各个监控模块
      this.initErrorMonitor();
      this.initPerformanceMonitor();
      this.initBehaviorMonitor();

      // 启动定时上报
      this.startReportTimer();

      this.isInitialized = true;
      this.emit("init", this.getStatus());

      console.log("[Monitor] SDK initialized successfully");
    } catch (error) {
      console.error("[Monitor] Failed to initialize SDK:", error);
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * 检查是否应该启用监控
   * @returns 是否启用
   */
  private shouldEnable(): boolean {
    // 开发环境检查
    if (this.isDevelopment() && !this.config.enableInDev) {
      return false;
    }

    // 采样率检查
    if (Math.random() > (this.config.sampleRate || 1)) {
      return false;
    }

    return true;
  }

  /**
   * 检查是否为开发环境
   * @returns 是否为开发环境
   */
  private isDevelopment(): boolean {
    // 根据不同平台判断开发环境
    if (typeof process !== "undefined" && process.env) {
      return process.env.NODE_ENV === "development";
    }

    if (
      typeof globalThis !== "undefined" &&
      typeof globalThis.location !== "undefined"
    ) {
      return (
        globalThis.location.hostname === "localhost" ||
        globalThis.location.hostname === "127.0.0.1"
      );
    }

    return false;
  }

  /**
   * 初始化错误监控
   */
  private initErrorMonitor(): void {
    if (!this.config.error?.enabled) return;

    this.platformAdapter.errorCapture.initErrorListeners(
      (errorData: ErrorData) => {
        this.addToQueue(errorData);
        this.emit("error", errorData);
      }
    );
  }

  /**
   * 初始化性能监控
   */
  private initPerformanceMonitor(): void {
    if (!this.config.performance?.enabled) return;

    this.platformAdapter.performance.initPerformanceMonitor(
      (performanceData: PerformanceData) => {
        this.addToQueue(performanceData);
        this.emit("performance", performanceData);
      }
    );
  }

  /**
   * 初始化行为监控
   */
  private initBehaviorMonitor(): void {
    if (!this.config.behavior?.enabled) return;

    this.platformAdapter.behavior.initBehaviorMonitor(
      (behaviorData: BehaviorData) => {
        this.addToQueue(behaviorData);
        this.emit("behavior", behaviorData);
      }
    );
  }

  /**
   * 添加数据到队列
   * @param data 监控数据
   */
  protected addToQueue(data: MonitorData): void {
    if (!this.isEnabled) return;

    // 填充基础信息
    data.projectId = this.config.projectId;
    data.userId = this.config.userId;
    data.sessionId = this.sessionId;
    data.platform = this.platformAdapter.platformInfo.platform;

    if (this.config.tags) {
      data.tags = { ...data.tags, ...this.config.tags };
    }

    // 检查队列大小限制
    const maxQueueSize = this.config.report?.maxQueueSize || 500;
    if (this.dataQueue.length >= maxQueueSize) {
      // 移除最旧的数据
      this.dataQueue.shift();
    }

    this.dataQueue.push(data);
    this.emit("dataAdded", data);
  }

  /**
   * 启动定时上报
   */
  private startReportTimer(): void {
    const interval = this.config.report?.interval || 10000;

    this.reportTimer = setInterval(() => {
      this.flush();
    }, interval);
  }

  /**
   * 立即上报所有数据
   * @returns Promise
   */
  public async flush(): Promise<void> {
    if (!this.isEnabled || this.dataQueue.length === 0) {
      return;
    }

    const batchSize = this.config.report?.batchSize || 20;
    const dataToSend = this.dataQueue.splice(0, batchSize);

    try {
      await this.sendData(dataToSend);
      this.emit("dataReported", dataToSend);
    } catch (error) {
      // 发送失败，将数据重新放回队列
      this.dataQueue.unshift(...dataToSend);
      this.emit("reportError", error);
      throw error;
    }
  }

  /**
   * 发送数据到服务器
   * @param data 要发送的数据
   */
  private async sendData(data: MonitorData[]): Promise<void> {
    const url = `${this.config.serverUrl}/api/monitor/report`;
    const options = {
      timeout: this.config.report?.timeout || 5000,
      retries: this.config.report?.maxRetries || 3,
      headers: this.config.apiKey
        ? { "X-API-Key": this.config.apiKey }
        : undefined,
    };

    await this.platformAdapter.network.sendData(url, data, options);
  }

  /**
   * 手动捕获错误
   * @param error 错误对象或消息
   * @param extra 额外信息
   */
  public captureError(
    error: Error | string,
    extra?: Record<string, any>
  ): void {
    if (!this.config.error?.enabled) return;

    const errorData = this.platformAdapter.errorCapture.captureError(
      error,
      extra
    );
    this.addToQueue(errorData);
  }

  /**
   * 手动记录性能指标
   * @param name 指标名称
   * @param metrics 指标数据
   */
  public recordPerformance(
    name: string,
    metrics: Record<string, number>
  ): void {
    if (!this.config.performance?.enabled) return;

    const performanceData = this.platformAdapter.performance.recordPerformance(
      name,
      metrics
    );
    this.addToQueue(performanceData);
  }

  /**
   * 手动记录用户行为
   * @param event 事件名称
   * @param data 事件数据
   */
  public recordBehavior(event: string, data?: Record<string, any>): void {
    if (!this.config.behavior?.enabled) return;

    const behaviorData = this.platformAdapter.behavior.recordBehavior(
      event,
      data
    );
    this.addToQueue(behaviorData);
  }

  /**
   * 获取SDK状态
   * @returns SDK状态
   */
  public getStatus(): SDKStatus {
    const errorCount = this.dataQueue.filter(
      (item) => "type" in item && (item as ErrorData).type
    ).length;
    const performanceCount = this.dataQueue.filter(
      (item) => "metrics" in item
    ).length;
    const behaviorCount = this.dataQueue.filter(
      (item) => "event" in item
    ).length;

    return {
      initialized: this.isInitialized,
      enabled: this.isEnabled,
      queue: {
        size: this.dataQueue.length,
        maxSize: this.config.report?.maxQueueSize || 500,
        isFull:
          this.dataQueue.length >= (this.config.report?.maxQueueSize || 500),
        errorCount,
        performanceCount,
        behaviorCount,
      },
      lastReportTime: Date.now(),
      errorMonitor: !!this.config.error?.enabled,
      performanceMonitor: !!this.config.performance?.enabled,
      behaviorMonitor: !!this.config.behavior?.enabled,
    };
  }

  /**
   * 销毁SDK
   */
  public destroy(): void {
    if (!this.isInitialized) return;

    // 清理定时器
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = undefined;
    }

    // 最后一次上报
    this.flush().catch((error) => {
      console.warn("[Monitor] Failed to flush data on destroy:", error);
    });

    // 销毁平台适配器
    this.platformAdapter.destroy();

    // 清理状态
    this.dataQueue = [];
    this.listeners.clear();
    this.isInitialized = false;
    this.isEnabled = false;

    this.emit("destroy");
    console.log("[Monitor] SDK destroyed");
  }

  // EventEmitter 实现
  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  public off(event: string, listener?: Function): void {
    if (!this.listeners.has(event)) return;

    if (listener) {
      const listeners = this.listeners.get(event)!;
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  public emit(event: string, ...args: any[]): boolean {
    if (!this.listeners.has(event)) return false;

    const listeners = this.listeners.get(event)!;
    listeners.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(
          `[Monitor] Error in event listener for '${event}':`,
          error
        );
      }
    });

    return true;
  }

  public once(event: string, listener: Function): void {
    const onceListener = (...args: any[]) => {
      this.off(event, onceListener);
      listener(...args);
    };
    this.on(event, onceListener);
  }
}
