/**
 * 错误管理器
 * 专门处理错误监控的核心逻辑，包括错误过滤、聚合、上报等
 */

import { ErrorData, ErrorType, ErrorConfig } from "../types/base";
import { ErrorCaptureAdapter } from "../interfaces/PlatformAdapter";
import {
  generateId,
  getTimestamp,
  serializeError,
  debounce,
} from "../utils/common";

/**
 * 错误聚合信息
 */
interface ErrorAggregation {
  /** 错误指纹 */
  fingerprint: string;
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 发生次数 */
  count: number;
  /** 首次发生时间 */
  firstSeen: number;
  /** 最后发生时间 */
  lastSeen: number;
  /** 错误级别 */
  level: "error" | "warning" | "info";
  /** 影响的用户数 */
  affectedUsers: Set<string>;
  /** 最近的错误数据 */
  recentErrors: ErrorData[];
}

/**
 * 错误管理器配置
 */
interface ErrorManagerConfig extends ErrorConfig {
  /** 错误聚合窗口时间（毫秒） */
  aggregationWindow?: number;
  /** 最大聚合错误数 */
  maxAggregations?: number;
  /** 重复错误的最大保留数量 */
  maxRecentErrors?: number;
  /** 是否启用错误聚合 */
  enableAggregation?: boolean;
}

/**
 * 错误管理器
 */
export class ErrorManager {
  private config: ErrorManagerConfig;
  private errorCapture: ErrorCaptureAdapter;
  private aggregations: Map<string, ErrorAggregation> = new Map();
  private onError?: (error: ErrorData) => void;
  private onAggregatedError?: (aggregation: ErrorAggregation) => void;
  private cleanupTimer?: any;

  constructor(config: ErrorManagerConfig, errorCapture: ErrorCaptureAdapter) {
    this.config = {
      enabled: true,
      maxErrors: 100,
      filters: [],
      sampleRate: 1,
      aggregationWindow: 5 * 60 * 1000, // 5分钟
      maxAggregations: 1000,
      maxRecentErrors: 5,
      enableAggregation: true,
      ...config,
    };
    this.errorCapture = errorCapture;
    this.init();
  }

  /**
   * 初始化错误管理器
   */
  private init(): void {
    if (!this.config.enabled) return;

    // 初始化错误监听
    this.errorCapture.initErrorListeners((error: ErrorData) => {
      this.handleError(error);
    });

    // 启动清理定时器
    this.startCleanupTimer();
  }

  /**
   * 设置错误回调
   * @param onError 错误回调函数
   */
  public setErrorCallback(onError: (error: ErrorData) => void): void {
    this.onError = onError;
  }

  /**
   * 设置聚合错误回调
   * @param onAggregatedError 聚合错误回调函数
   */
  public setAggregatedErrorCallback(
    onAggregatedError: (aggregation: ErrorAggregation) => void
  ): void {
    this.onAggregatedError = onAggregatedError;
  }

  /**
   * 处理错误
   * @param error 错误数据
   */
  private handleError(error: ErrorData): void {
    // 过滤检查
    if (!this.shouldCaptureError(error)) {
      return;
    }

    // 采样检查
    if (Math.random() > (this.config.sampleRate || 1)) {
      return;
    }

    // 错误聚合
    if (this.config.enableAggregation) {
      this.aggregateError(error);
    } else {
      // 直接上报
      this.reportError(error);
    }
  }

  /**
   * 检查是否应该捕获错误
   * @param error 错误数据
   * @returns 是否捕获
   */
  private shouldCaptureError(error: ErrorData): boolean {
    // 检查过滤规则
    if (this.config.filters && this.config.filters.length > 0) {
      return !this.config.filters.some((filter) => filter.test(error.message));
    }
    return true;
  }

  /**
   * 聚合错误
   * @param error 错误数据
   */
  private aggregateError(error: ErrorData): void {
    const fingerprint = this.generateErrorFingerprint(error);
    let aggregation = this.aggregations.get(fingerprint);

    if (!aggregation) {
      // 创建新的聚合
      aggregation = {
        fingerprint,
        message: error.message,
        stack: error.stack,
        count: 0,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        level: error.level || "error",
        affectedUsers: new Set(),
        recentErrors: [],
      };
      this.aggregations.set(fingerprint, aggregation);
    }

    // 更新聚合信息
    aggregation.count++;
    aggregation.lastSeen = error.timestamp;
    if (error.userId) {
      aggregation.affectedUsers.add(error.userId);
    }

    // 保存最近的错误
    aggregation.recentErrors.push(error);
    if (aggregation.recentErrors.length > (this.config.maxRecentErrors || 5)) {
      aggregation.recentErrors.shift();
    }

    // 检查是否需要上报
    this.checkAggregationReporting(aggregation);

    // 限制聚合数量
    if (this.aggregations.size > (this.config.maxAggregations || 1000)) {
      this.cleanOldAggregations();
    }
  }

  /**
   * 生成错误指纹
   * @param error 错误数据
   * @returns 错误指纹
   */
  private generateErrorFingerprint(error: ErrorData): string {
    // 使用错误消息、文件名、行号、列号生成指纹
    const parts = [
      error.type,
      error.message,
      error.filename || "",
      error.lineno || 0,
      error.colno || 0,
    ];

    // 如果有堆栈信息，使用堆栈的前几行
    if (error.stack) {
      const stackLines = error.stack.split("\n").slice(0, 3);
      parts.push(stackLines.join("|"));
    }

    return this.simpleHash(parts.join("||"));
  }

  /**
   * 简单哈希函数
   * @param str 字符串
   * @returns 哈希值
   */
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * 检查聚合是否需要上报
   * @param aggregation 错误聚合
   */
  private checkAggregationReporting(aggregation: ErrorAggregation): void {
    const shouldReport =
      aggregation.count === 1 || // 第一次发生
      aggregation.count === 5 || // 发生5次
      aggregation.count === 10 || // 发生10次
      aggregation.count % 50 === 0; // 每50次

    if (shouldReport) {
      this.reportAggregatedError(aggregation);
    }
  }

  /**
   * 上报单个错误
   * @param error 错误数据
   */
  private reportError(error: ErrorData): void {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * 上报聚合错误
   * @param aggregation 错误聚合
   */
  private reportAggregatedError(aggregation: ErrorAggregation): void {
    if (this.onAggregatedError) {
      this.onAggregatedError(aggregation);
    }

    // 同时上报最新的错误实例
    const latestError =
      aggregation.recentErrors[aggregation.recentErrors.length - 1];
    if (latestError && this.onError) {
      // 在错误数据中添加聚合信息
      const enhancedError: ErrorData = {
        ...latestError,
        tags: {
          ...latestError.tags,
          aggregation_count: String(aggregation.count),
          aggregation_fingerprint: aggregation.fingerprint,
          affected_users: String(aggregation.affectedUsers.size),
        },
      };
      this.onError(enhancedError);
    }
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
    const errorData = this.errorCapture.captureError(error, extra);
    this.handleError(errorData);
  }

  /**
   * 捕获HTTP错误
   * @param request 请求信息
   */
  public captureHttpError(request: any): void {
    const errorData = this.errorCapture.captureHttpError(request);
    this.handleError(errorData);
  }

  /**
   * 获取错误统计
   * @returns 错误统计信息
   */
  public getErrorStats(): {
    totalAggregations: number;
    totalErrors: number;
    affectedUsers: number;
    topErrors: Array<{
      fingerprint: string;
      message: string;
      count: number;
      affectedUsers: number;
    }>;
  } {
    let totalErrors = 0;
    const allAffectedUsers = new Set<string>();

    for (const aggregation of this.aggregations.values()) {
      totalErrors += aggregation.count;
      aggregation.affectedUsers.forEach((user) => allAffectedUsers.add(user));
    }

    const topErrors = Array.from(this.aggregations.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((aggregation) => ({
        fingerprint: aggregation.fingerprint,
        message: aggregation.message,
        count: aggregation.count,
        affectedUsers: aggregation.affectedUsers.size,
      }));

    return {
      totalAggregations: this.aggregations.size,
      totalErrors,
      affectedUsers: allAffectedUsers.size,
      topErrors,
    };
  }

  /**
   * 清理过期的聚合
   */
  private cleanOldAggregations(): void {
    const now = Date.now();
    const maxAge = this.config.aggregationWindow || 5 * 60 * 1000;

    for (const [fingerprint, aggregation] of this.aggregations) {
      if (now - aggregation.lastSeen > maxAge) {
        this.aggregations.delete(fingerprint);
      }
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanOldAggregations();
    }, 60 * 1000); // 每分钟清理一次
  }

  /**
   * 销毁错误管理器
   */
  public destroy(): void {
    this.errorCapture.destroyErrorListeners();

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.aggregations.clear();
  }
}
