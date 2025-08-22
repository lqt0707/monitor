/**
 * 数据上报模块
 * 负责将收集到的监控数据上报到服务器，支持批量上报、重试机制、离线缓存等功能
 */

import {
  MonitorConfig,
  ReportData,
  ErrorData,
  PerformanceData,
  BehaviorData,
} from "../types";
import { safeStringify, isSupported } from "../utils";

/**
 * 上报状态枚举
 */
enum ReportStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}

/**
 * 上报队列项
 */
interface ReportQueueItem {
  id: string;
  data: ReportData;
  timestamp: number;
  retryCount: number;
  status: ReportStatus;
}

/**
 * 数据上报器类
 */
export class Reporter {
  private config: MonitorConfig;
  private reportQueue: ReportQueueItem[] = [];
  private isReporting: boolean = false;
  private reportTimer: number | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;
  private maxQueueSize: number = 100;
  private storageKey: string = "monitor_report_queue";

  constructor(config: MonitorConfig) {
    this.config = config;
    this.init();
  }

  /**
   * 初始化上报器
   */
  private init(): void {
    this.loadQueueFromStorage();
    this.startReportTimer();
    this.setupBeforeUnloadHandler();
  }

  /**
   * 从本地存储加载队列
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const queue = JSON.parse(stored);
        if (Array.isArray(queue)) {
          this.reportQueue = queue.filter(
            (item) => item && typeof item === "object" && item.data
          );
        }
      }
    } catch (error) {
      console.warn("Failed to load report queue from storage:", error);
    }
  }

  /**
   * 保存队列到本地存储
   */
  private saveQueueToStorage(): void {
    try {
      const queueToSave = this.reportQueue.slice(0, 50); // 只保存前50条
      localStorage.setItem(this.storageKey, JSON.stringify(queueToSave));
    } catch (error) {
      console.warn("Failed to save report queue to storage:", error);
    }
  }

  /**
   * 启动上报定时器
   */
  private startReportTimer(): void {
    const interval = this.config.reportInterval || 10000; // 默认10秒

    this.reportTimer = window.setInterval(() => {
      this.processQueue();
    }, interval);
  }

  /**
   * 设置页面卸载处理器
   */
  private setupBeforeUnloadHandler(): void {
    const handler = () => {
      this.flushQueue();
    };

    window.addEventListener("beforeunload", handler);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flushQueue();
      }
    });
  }

  /**
   * 添加错误数据到上报队列
   * @param errors 错误数据数组
   */
  public reportErrors(errors: ErrorData[]): void {
    if (!errors || errors.length === 0) {
      return;
    }

    const reportData: ReportData = { errors };
    this.addToQueue(reportData);
  }

  /**
   * 添加性能数据到上报队列
   * @param performance 性能数据数组
   */
  public reportPerformance(performance: PerformanceData[]): void {
    if (!performance || performance.length === 0) {
      return;
    }

    const reportData: ReportData = { performance };
    this.addToQueue(reportData);
  }

  /**
   * 添加行为数据到上报队列
   * @param behaviors 行为数据数组
   */
  public reportBehaviors(behaviors: BehaviorData[]): void {
    if (!behaviors || behaviors.length === 0) {
      return;
    }

    const reportData: ReportData = { behaviors };
    this.addToQueue(reportData);
  }

  /**
   * 添加混合数据到上报队列
   * @param data 上报数据
   */
  public report(data: ReportData): void {
    this.addToQueue(data);
  }

  /**
   * 添加数据到队列
   * @param data 上报数据
   */
  private addToQueue(data: ReportData): void {
    const queueItem: ReportQueueItem = {
      id: this.generateId(),
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: ReportStatus.PENDING,
    };

    this.reportQueue.push(queueItem);

    // 限制队列大小
    if (this.reportQueue.length > this.maxQueueSize) {
      this.reportQueue.shift();
    }

    this.saveQueueToStorage();

    // 如果队列较满，立即处理
    if (this.reportQueue.length >= 10) {
      this.processQueue();
    }
  }

  /**
   * 处理上报队列
   */
  private async processQueue(): Promise<void> {
    if (this.isReporting || this.reportQueue.length === 0) {
      return;
    }

    this.isReporting = true;

    try {
      const pendingItems = this.reportQueue.filter(
        (item) => item.status === ReportStatus.PENDING
      );

      if (pendingItems.length === 0) {
        return;
      }

      // 批量处理，每次最多处理5条
      const itemsToProcess = pendingItems.slice(0, 5);

      for (const item of itemsToProcess) {
        await this.reportItem(item);
      }

      // 清理成功的项目
      this.reportQueue = this.reportQueue.filter(
        (item) => item.status !== ReportStatus.SUCCESS
      );

      this.saveQueueToStorage();
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * 上报单个项目
   * @param item 队列项目
   */
  private async reportItem(item: ReportQueueItem): Promise<void> {
    try {
      const success = await this.sendData(item.data);

      if (success) {
        item.status = ReportStatus.SUCCESS;
      } else {
        this.handleReportFailure(item);
      }
    } catch (error) {
      console.warn("Report item failed:", error);
      this.handleReportFailure(item);
    }
  }

  /**
   * 处理上报失败
   * @param item 队列项目
   */
  private handleReportFailure(item: ReportQueueItem): void {
    item.retryCount++;

    if (item.retryCount >= this.maxRetries) {
      item.status = ReportStatus.FAILED;
    } else {
      // 延迟重试
      setTimeout(() => {
        item.status = ReportStatus.PENDING;
      }, this.retryDelay * item.retryCount);
    }
  }

  /**
   * 发送数据到服务器
   * @param data 上报数据
   * @returns 是否成功
   */
  private async sendData(data: ReportData): Promise<boolean> {
    const url = `${this.config.serverUrl}/api/monitor/report`;

    // 转换数据格式以匹配server端的ReportDataDto
    const reports = this.convertToReportDataDto(data);

    // 批量发送每个报告
    const results = await Promise.all(
      reports.map((payload) => this.sendSingleReport(url, payload))
    );

    // 如果至少有一个成功，则认为成功
    return results.some((result) => result);
  }

  /**
   * 转换ReportData为ReportDataDto格式
   * @param data 原始数据
   * @returns 转换后的数据数组
   */
  private convertToReportDataDto(data: ReportData): any[] {
    const reports: any[] = [];
    const baseData = {
      projectId: this.config.projectId,
      userId: this.config.userId,
      userAgent: navigator.userAgent,
      pageUrl: window.location.href,
      extraData: JSON.stringify({
        tags: this.config.tags,
        sessionId: this.generateSessionId(),
      }),
    };

    // 处理错误数据
    if (data.errors && data.errors.length > 0) {
      data.errors.forEach((error) => {
        reports.push({
          ...baseData,
          type: this.mapErrorTypeToString(error.type),
          errorMessage: error.message,
          errorStack: error.stack,
          sourceFile: error.filename,
          lineNumber: error.lineno,
          columnNumber: error.colno,
        });
      });
    }

    // 处理性能数据
    if (data.performance && data.performance.length > 0) {
      data.performance.forEach((perf) => {
        reports.push({
          ...baseData,
          type: this.mapPerformanceTypeToString(perf.type),
          performanceData: JSON.stringify(perf.metrics),
          duration: perf.metrics.duration || 0,
        });
      });
    }

    // 处理行为数据
    if (data.behaviors && data.behaviors.length > 0) {
      data.behaviors.forEach((behavior) => {
        reports.push({
          ...baseData,
          type: "user_behavior",
          extraData: JSON.stringify({
            ...JSON.parse(baseData.extraData),
            behaviorType: behavior.type,
            event: behavior.event,
            target: behavior.target,
            data: behavior.data,
          }),
        });
      });
    }

    return reports;
  }

  /**
   * 生成会话ID
   * @returns 会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 映射错误类型到字符串
   * @param errorType 错误类型
   * @returns 字符串类型
   */
  private mapErrorTypeToString(errorType: string): string {
    const typeMap: Record<string, string> = {
      js_error: "jsError",
      promise_error: "unHandleRejection",
      resource_error: "resourceError",
      http_error: "reqError",
      custom_error: "customError",
    };
    return typeMap[errorType] || "jsError";
  }

  /**
   * 映射性能类型到字符串
   * @param perfType 性能类型
   * @returns 字符串类型
   */
  private mapPerformanceTypeToString(perfType: string): string {
    const typeMap: Record<string, string> = {
      page_load: "performanceInfoReady",
      http_request: "slowHttpRequest",
      resource_load: "resourceLoad",
      user_interaction: "userInteraction",
    };
    return typeMap[perfType] || "performanceInfoReady";
  }

  /**
   * 发送单个报告
   * @param url 请求URL
   * @param payload 请求数据
   * @returns 是否成功
   */
  private async sendSingleReport(url: string, payload: any): Promise<boolean> {
    try {
      // 优先使用sendBeacon API
      if (isSupported("sendBeacon") && navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          url,
          new Blob([safeStringify(payload)], { type: "application/json" })
        );
        return success;
      }

      // 降级到fetch API
      if (isSupported("fetch")) {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.config.apiKey && {
              Authorization: `Bearer ${this.config.apiKey}`,
            }),
          },
          body: safeStringify(payload),
          keepalive: true,
        });

        return response.ok;
      }

      // 降级到XMLHttpRequest
      return await this.sendWithXHR(url, payload);
    } catch (error) {
      console.warn("Send single report failed:", error);
      return false;
    }
  }

  /**
   * 使用XMLHttpRequest发送数据
   * @param url 请求URL
   * @param payload 请求数据
   * @returns 是否成功
   */
  private sendWithXHR(url: string, payload: any): Promise<boolean> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");

      if (this.config.apiKey) {
        xhr.setRequestHeader("Authorization", `Bearer ${this.config.apiKey}`);
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          resolve(xhr.status >= 200 && xhr.status < 300);
        }
      };

      xhr.onerror = () => resolve(false);
      xhr.ontimeout = () => resolve(false);

      xhr.timeout = 10000; // 10秒超时
      xhr.send(safeStringify(payload));
    });
  }

  /**
   * 立即刷新队列
   */
  public async flushQueue(): Promise<void> {
    if (this.reportQueue.length === 0) {
      return;
    }

    // 使用sendBeacon进行最后的数据发送
    const pendingItems = this.reportQueue.filter(
      (item) => item.status === ReportStatus.PENDING
    );

    if (pendingItems.length > 0 && isSupported("sendBeacon")) {
      const combinedData: ReportData = {
        errors: [],
        performance: [],
        behaviors: [],
      };

      pendingItems.forEach((item) => {
        if (item.data.errors) {
          combinedData.errors!.push(...item.data.errors);
        }
        if (item.data.performance) {
          combinedData.performance!.push(...item.data.performance);
        }
        if (item.data.behaviors) {
          combinedData.behaviors!.push(...item.data.behaviors);
        }
      });

      const payload = {
        projectId: this.config.projectId,
        timestamp: Date.now(),
        data: combinedData,
      };

      const url = `${this.config.serverUrl}/api/monitor/report`;
      navigator.sendBeacon(
        url,
        new Blob([safeStringify(payload)], { type: "application/json" })
      );
    }
  }

  /**
   * 生成唯一ID
   * @returns 唯一标识符
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 获取队列状态
   * @returns 队列状态信息
   */
  public getQueueStatus() {
    const pending = this.reportQueue.filter(
      (item) => item.status === ReportStatus.PENDING
    ).length;
    const failed = this.reportQueue.filter(
      (item) => item.status === ReportStatus.FAILED
    ).length;

    return {
      total: this.reportQueue.length,
      pending,
      failed,
      isReporting: this.isReporting,
    };
  }

  /**
   * 清空队列
   */
  public clearQueue(): void {
    this.reportQueue = [];
    this.saveQueueToStorage();
  }

  /**
   * 销毁上报器
   */
  public destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    this.flushQueue();
    this.reportQueue = [];
  }
}
