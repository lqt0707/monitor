/**
 * Web监控SDK主入口文件
 * 提供统一的API接口，整合错误监控、性能监控、数据上报等功能
 */

import { MonitorConfig, ErrorData, PerformanceData, BehaviorData, ErrorType, PerformanceType, BehaviorType } from './types';
import { ErrorMonitor } from './core/error-monitor';
import { PerformanceMonitor } from './core/performance-monitor';
import { BehaviorMonitor } from './core/behavior-monitor';
import { Reporter } from './core/reporter';
import { generateId, getTimestamp, generateSessionId, isDevelopment, getBrowserInfo, getDeviceInfo } from './utils';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Partial<MonitorConfig> = {
  enableErrorMonitor: true,
  enablePerformanceMonitor: true,
  enableBehaviorMonitor: true,
  sampleRate: 1,
  maxErrors: 100,
  reportInterval: 10000,
  enableInDev: false
};

/**
 * Web监控SDK主类
 */
export class MonitorSDK {
  private config!: MonitorConfig;
  private errorMonitor: ErrorMonitor | null = null;
  private performanceMonitor: PerformanceMonitor | null = null;
  private behaviorMonitor: BehaviorMonitor | null = null;
  private reporter: Reporter | null = null;
  private isInitialized: boolean = false;
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = generateSessionId();
    this.startTime = getTimestamp();
  }

  /**
   * 初始化SDK
   * @param config 配置选项
   */
  public init(config: MonitorConfig): void {
    if (this.isInitialized) {
      console.warn('MonitorSDK is already initialized');
      return;
    }

    // 合并配置
    this.config = { ...DEFAULT_CONFIG, ...config } as MonitorConfig;

    // 检查是否在开发环境且未启用
    if (isDevelopment() && !this.config.enableInDev) {
      console.log('MonitorSDK is disabled in development environment');
      return;
    }

    // 验证必要配置
    if (!this.config.projectId || !this.config.serverUrl) {
      throw new Error('MonitorSDK: projectId and serverUrl are required');
    }

    try {
      this.initializeModules();
      this.setupEventListeners();
      this.reportInitialization();
      this.isInitialized = true;
      
      console.log('MonitorSDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MonitorSDK:', error);
      throw error;
    }
  }

  /**
   * 初始化各个模块
   */
  private initializeModules(): void {
    // 初始化数据上报器
    this.reporter = new Reporter(this.config);

    // 初始化错误监控
    if (this.config.enableErrorMonitor) {
      this.errorMonitor = new ErrorMonitor(this.config);
    }

    // 初始化性能监控
    if (this.config.enablePerformanceMonitor) {
      this.performanceMonitor = new PerformanceMonitor(this.config);
    }

    // 初始化行为监控
    if (this.config.enableBehaviorMonitor) {
      this.behaviorMonitor = new BehaviorMonitor(this.config);
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听错误事件
    window.addEventListener('monitor:error', (event: any) => {
      if (this.reporter) {
        this.reporter.reportErrors([event.detail]);
      }
    });

    // 监听性能事件
    window.addEventListener('monitor:performance', (event: any) => {
      if (this.reporter) {
        this.reporter.reportPerformance([event.detail]);
      }
    });

    // 监听行为事件
    window.addEventListener('monitor:behavior', (event: any) => {
      if (this.reporter) {
        this.reporter.reportBehaviors([event.detail]);
      }
    });

    // 监听刷新事件
    window.addEventListener('monitor:flush', (event: any) => {
      if (this.reporter) {
        const data = event.detail;
        if (data.errors) {
          this.reporter.reportErrors(data.errors);
        }
        if (data.performance) {
          this.reporter.reportPerformance(data.performance);
        }
        if (data.behaviors) {
          this.reporter.reportBehaviors(data.behaviors);
        }
      }
    });
  }

  /**
   * 上报初始化信息
   */
  private reportInitialization(): void {
    const initData: BehaviorData = {
      id: generateId(),
      timestamp: this.startTime,
      projectId: this.config.projectId,
      userId: this.config.userId,
      sessionId: this.sessionId,
      url: location.href,
      userAgent: navigator.userAgent,
      tags: {
        ...this.config.tags,
        sdkVersion: '1.0.0',
        ...getBrowserInfo(),
        ...getDeviceInfo()
      },
      type: BehaviorType.CUSTOM,
      event: 'sdk_init',
      data: {
        config: {
          enableErrorMonitor: this.config.enableErrorMonitor,
          enablePerformanceMonitor: this.config.enablePerformanceMonitor,
          enableBehaviorMonitor: this.config.enableBehaviorMonitor,
          sampleRate: this.config.sampleRate
        }
      }
    };

    if (this.reporter) {
      this.reporter.reportBehaviors([initData]);
    }
  }

  /**
   * 手动捕获错误
   * @param error 错误对象或错误信息
   * @param extra 额外信息
   */
  public captureError(error: Error | string, extra?: Record<string, any>): void {
    if (!this.isInitialized || !this.errorMonitor) {
      console.warn('MonitorSDK is not initialized or error monitoring is disabled');
      return;
    }

    this.errorMonitor.captureError(error, extra);
  }

  /**
   * 捕获HTTP错误
   * @param url 请求URL
   * @param method 请求方法
   * @param status 状态码
   * @param statusText 状态文本
   * @param response 响应内容
   */
  public captureHttpError(
    url: string,
    method: string,
    status: number,
    statusText: string,
    response?: any
  ): void {
    if (!this.isInitialized || !this.errorMonitor) {
      console.warn('MonitorSDK is not initialized or error monitoring is disabled');
      return;
    }

    this.errorMonitor.captureHttpError(url, method, status, statusText, response);
  }

  /**
   * 记录用户行为
   * @param event 事件名称
   * @param data 事件数据
   */
  public trackBehavior(event: string, data?: Record<string, any>): void {
    if (!this.isInitialized || !this.behaviorMonitor) {
      console.warn('MonitorSDK is not initialized or behavior monitoring is disabled');
      return;
    }

    this.behaviorMonitor.trackCustomEvent(event, data);
  }

  /**
   * 记录页面访问
   * @param page 页面信息
   */
  public trackPageView(page?: { title?: string; url?: string }): void {
    if (!this.isInitialized || !this.behaviorMonitor) {
      console.warn('MonitorSDK is not initialized or behavior monitoring is disabled');
      return;
    }

    this.behaviorMonitor.trackPageView();
  }

  /**
   * 设置用户信息
   * @param userId 用户ID
   * @param extra 额外用户信息
   */
  public setUser(userId: string, extra?: Record<string, string>): void {
    this.config.userId = userId;
    if (extra) {
      this.config.tags = { ...this.config.tags, ...extra };
    }
  }

  /**
   * 设置标签
   * @param tags 标签对象
   */
  public setTags(tags: Record<string, string>): void {
    this.config.tags = { ...this.config.tags, ...tags };
  }

  /**
   * 获取SDK状态
   * @returns SDK状态信息
   */
  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      sessionId: this.sessionId,
      startTime: this.startTime,
      config: this.config,
      errorCount: this.errorMonitor?.getErrors().length || 0,
      performanceCount: this.performanceMonitor?.getPerformanceData().length || 0,
      behaviorCount: this.behaviorMonitor?.getBehaviors().length || 0,
      reporterStatus: this.reporter?.getQueueStatus()
    };
  }

  /**
   * 立即上报所有数据
   */
  public async flush(): Promise<void> {
    if (!this.isInitialized || !this.reporter) {
      return;
    }

    // 收集所有待上报数据
    const errors = this.errorMonitor?.getErrors() || [];
    const performance = this.performanceMonitor?.getPerformanceData() || [];
    const behaviors = this.behaviorMonitor?.getBehaviors() || [];

    if (errors.length > 0) {
      this.reporter.reportErrors(errors);
      this.errorMonitor?.clearErrors();
    }

    if (performance.length > 0) {
      this.reporter.reportPerformance(performance);
      this.performanceMonitor?.clearPerformanceData();
    }

    if (behaviors.length > 0) {
      this.reporter.reportBehaviors(behaviors);
      this.behaviorMonitor?.clearBehaviors();
    }

    await this.reporter.flushQueue();
  }

  /**
   * 销毁SDK
   */
  public destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    // 先上报剩余数据
    this.flush();

    // 销毁各个模块
    this.errorMonitor?.destroy();
    this.performanceMonitor?.destroy();
    this.behaviorMonitor?.destroy();
    this.reporter?.destroy();

    // 重置状态
    this.errorMonitor = null;
    this.performanceMonitor = null;
    this.behaviorMonitor = null;
    this.reporter = null;
    this.isInitialized = false;

    console.log('MonitorSDK destroyed');
  }
}

// 创建全局实例
const monitorSDK = new MonitorSDK();

// 导出类型和实例
export type {
  MonitorConfig,
  ErrorData,
  PerformanceData,
  BehaviorData,
  ErrorType,
  PerformanceType,
  BehaviorType
};

export default monitorSDK;

// 全局挂载（可选）
if (typeof window !== 'undefined') {
  (window as any).MonitorSDK = monitorSDK;
}