/**
 * 错误监控核心模块
 * 负责捕获和处理各种类型的错误：JavaScript错误、Promise错误、资源加载错误等
 */

import { ErrorType, ErrorData, MonitorConfig } from '../types';
import { generateId, getTimestamp, generateSessionId, getPageInfo, getUserAgent, getErrorStack } from '../utils';

/**
 * 错误监控类
 */
export class ErrorMonitor {
  private config: MonitorConfig;
  private errorQueue: ErrorData[] = [];
  private listeners: Array<() => void> = [];
  private maxErrors: number;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.maxErrors = config.maxErrors || 100;
    this.init();
  }

  /**
   * 初始化错误监控
   */
  private init(): void {
    if (!this.config.enableErrorMonitor) {
      return;
    }

    this.setupGlobalErrorHandler();
    this.setupUnhandledRejectionHandler();
    this.setupResourceErrorHandler();
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandler(): void {
    const handler = (event: ErrorEvent) => {
      const errorData: ErrorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: this.config.projectId,
        userId: this.config.userId,
        sessionId: generateSessionId(),
        url: getPageInfo().url,
        userAgent: getUserAgent(),
        tags: this.config.tags,
        type: ErrorType.JS_ERROR,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? getErrorStack(event.error) : undefined,
        error: this.serializeError(event.error)
      };

      this.addError(errorData);
    };

    window.addEventListener('error', handler);
    this.listeners.push(() => window.removeEventListener('error', handler));
  }

  /**
   * 设置未处理的Promise错误处理器
   */
  private setupUnhandledRejectionHandler(): void {
    const handler = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorData: ErrorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: this.config.projectId,
        userId: this.config.userId,
        sessionId: generateSessionId(),
        url: getPageInfo().url,
        userAgent: getUserAgent(),
        tags: this.config.tags,
        type: ErrorType.PROMISE_ERROR,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? getErrorStack(error) : undefined,
        error: this.serializeError(error)
      };

      this.addError(errorData);
    };

    window.addEventListener('unhandledrejection', handler);
    this.listeners.push(() => window.removeEventListener('unhandledrejection', handler));
  }

  /**
   * 设置资源加载错误处理器
   */
  private setupResourceErrorHandler(): void {
    const handler = (event: Event) => {
      const target = event.target;
      if (!target || target === window || !(target instanceof HTMLElement)) {
        return;
      }

      const tagName = target.tagName?.toLowerCase();
      const resourceUrl = (target as any).src || (target as any).href;

      if (!resourceUrl) {
        return;
      }

      const errorData: ErrorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: this.config.projectId,
        userId: this.config.userId,
        sessionId: generateSessionId(),
        url: getPageInfo().url,
        userAgent: getUserAgent(),
        tags: this.config.tags,
        type: ErrorType.RESOURCE_ERROR,
        message: `Failed to load ${tagName}: ${resourceUrl}`,
        filename: resourceUrl,
        error: {
          tagName,
          resourceUrl,
          outerHTML: target.outerHTML?.substring(0, 200)
        }
      };

      this.addError(errorData);
    };

    // 使用捕获阶段监听资源加载错误
    window.addEventListener('error', handler, true);
    this.listeners.push(() => window.removeEventListener('error', handler, true));
  }

  /**
   * 手动添加错误
   * @param error 错误对象或错误信息
   * @param extra 额外信息
   */
  public captureError(error: Error | string, extra?: Record<string, any>): void {
    const errorData: ErrorData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: this.config.projectId,
      userId: this.config.userId,
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      tags: { ...this.config.tags, ...extra?.tags },
      type: ErrorType.CUSTOM_ERROR,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? getErrorStack(error) : undefined,
      error: this.serializeError(error),
      ...extra
    };

    this.addError(errorData);
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
    const errorData: ErrorData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: this.config.projectId,
      userId: this.config.userId,
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      tags: this.config.tags,
      type: ErrorType.HTTP_ERROR,
      message: `HTTP ${status} ${statusText}: ${method} ${url}`,
      error: {
        url,
        method,
        status,
        statusText,
        response: response ? String(response).substring(0, 1000) : undefined
      }
    };

    this.addError(errorData);
  }

  /**
   * 添加错误到队列
   * @param errorData 错误数据
   */
  private addError(errorData: ErrorData): void {
    // 检查采样率
    if (this.config.sampleRate && Math.random() > this.config.sampleRate) {
      return;
    }

    // 添加到队列
    this.errorQueue.push(errorData);

    // 限制队列大小
    if (this.errorQueue.length > this.maxErrors) {
      this.errorQueue.shift();
    }

    // 触发错误事件
    this.emitError(errorData);
  }

  /**
   * 序列化错误对象
   * @param error 错误对象
   * @returns 序列化后的错误信息
   */
  private serializeError(error: any): any {
    if (!error) {
      return null;
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: getErrorStack(error)
      };
    }

    if (typeof error === 'object') {
      try {
        return JSON.parse(JSON.stringify(error));
      } catch {
        return { error: 'Failed to serialize error object' };
      }
    }

    return { error: String(error) };
  }

  /**
   * 触发错误事件
   * @param errorData 错误数据
   */
  private emitError(errorData: ErrorData): void {
    // 可以在这里添加自定义事件处理
    if (typeof window.CustomEvent !== 'undefined') {
      const event = new CustomEvent('monitor:error', {
        detail: errorData
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * 获取错误队列
   * @returns 错误数据数组
   */
  public getErrors(): ErrorData[] {
    return [...this.errorQueue];
  }

  /**
   * 清空错误队列
   */
  public clearErrors(): void {
    this.errorQueue = [];
  }

  /**
   * 销毁错误监控
   */
  public destroy(): void {
    this.listeners.forEach(removeListener => removeListener());
    this.listeners = [];
    this.errorQueue = [];
  }
}