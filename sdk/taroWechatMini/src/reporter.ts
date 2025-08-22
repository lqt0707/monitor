/**
 * Taro微信小程序监控SDK - 数据上报模块
 * 专门处理服务端不可用时的错误处理和优雅降级
 */

import { Monitor } from "./monitor";

// 微信小程序API声明
interface WxRequestOptions {
  url: string;
  method?: string;
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
  success?: (res: { statusCode: number; data: any }) => void;
  fail?: (error: { errMsg: string }) => void;
}

interface Wx {
  request: (options: WxRequestOptions) => any;
  getStorageSync: (key: string) => any;
  setStorageSync: (key: string, data: any) => void;
  removeStorageSync: (key: string) => void;
  getStorageInfoSync: () => { keys: string[] };
}

declare const wx: Wx;
declare const Taro: any;

// 配置接口
export interface IReporterOptions {
  serverUrl: string;
  projectId?: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  flushInterval?: number;
  maxQueueSize?: number;
  enableOfflineCache?: boolean;
  maxCacheSize?: number;
}

// 上报状态枚举
enum ReportStatus {
  SUCCESS = "success",
  FAILED = "failed",
  RETRYING = "retrying",
  OFFLINE = "offline",
  SERVICE_UNAVAILABLE = "service_unavailable",
}

// 缓存数据接口
interface ICachedData {
  data: any[];
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export class Reporter {
  private serverUrl: string;
  private projectId?: string;
  private apiKey?: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private batchSize: number;
  private flushInterval: number;
  private maxQueueSize: number;
  private enableOfflineCache: boolean;
  private maxCacheSize: number;

  private dataQueue: any[] = [];
  private isReporting = false;
  private isServiceAvailable = true;
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000; // 30秒检查一次服务状态
  private flushTimer: any = null;
  private retryTimer: any = null;

  // 缓存相关
  private readonly CACHE_KEY = "monitor_sdk_cache";
  private readonly SERVICE_STATUS_KEY = "monitor_service_status";

  constructor(options: IReporterOptions) {
    this.serverUrl = options.serverUrl;
    this.projectId = options.projectId;
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 5000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 10000;
    this.maxQueueSize = options.maxQueueSize || 100;
    this.enableOfflineCache = options.enableOfflineCache !== false;
    this.maxCacheSize = options.maxCacheSize || 50;

    this.init();
  }

  /**
   * 初始化上报器
   */
  private init() {
    // 恢复缓存数据
    this.restoreCachedData();

    // 启动定时上报
    this.startBatchReporting();

    // 启动服务健康检查
    this.startHealthCheck();

    // 监听网络状态变化
    this.observeNetworkStatus();
  }

  /**
   * 深度清理对象中的frameData字段（递归处理所有层级）
   * @param obj 需要清理的对象
   * @returns 清理后的对象
   */
  private deepCleanFrameData(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // 如果是数组，递归处理每个元素
    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepCleanFrameData(item));
    }

    // 如果是对象，处理所有属性
    if (typeof obj === "object") {
      const cleanedObj: any = {};

      for (const [key, value] of Object.entries(obj)) {
        // 跳过所有可能的frameData变体字段（不区分大小写）
        const lowerKey = key.toLowerCase();
        if (
          lowerKey === "framedata" ||
          (lowerKey.includes("frame") && lowerKey.includes("data"))
        ) {
          continue;
        }

        // 递归处理嵌套对象
        cleanedObj[key] = this.deepCleanFrameData(value);
      }

      return cleanedObj;
    }

    // 基本类型直接返回
    return obj;
  }

  /**
   * 添加数据到上报队列
   */
  addData(data: any) {
    if (!data) return;

    // 深度清理frameData字段
    const cleanedData = this.deepCleanFrameData(data);

    // 添加基础信息，但不进行格式转换（在发送时转换）
    const enrichedData = {
      ...cleanedData,
      // 确保type字段被正确设置
      type: cleanedData.type,
      timestamp: Date.now(),
      sdkVersion: "1.0.0-taro",
    };

    // console.log("[Reporter] Adding data to queue:", enrichedData);

    // 检查队列大小限制
    if (this.dataQueue.length >= this.maxQueueSize) {
      // 移除最老的数据
      this.dataQueue.shift();
      console.warn("[Reporter] Queue size limit reached, removing oldest item");
    }

    this.dataQueue.push(enrichedData);

    // 如果服务可用且队列达到批处理大小，立即上报
    if (this.isServiceAvailable && this.dataQueue.length >= this.batchSize) {
      this.flushData();
    }
  }

  /**
   * 将原始数据转换为符合后端ReportDataDto格式的数据
   * @param data 原始数据
   * @returns 转换后的数据
   */
  private transformToReportData(data: any): any {
    const reportData: any = {
      projectId: this.projectId,
      type: data.type || "customError",
    };

    // 错误相关字段
    if (data.error) {
      if (typeof data.error === "string") {
        reportData.errorMessage = data.error;
      } else if (data.error.message) {
        reportData.errorMessage = data.error.message;
        reportData.errorStack = data.error.stack;
      }
    }

    // 页面URL
    if (data.activePage) {
      reportData.pageUrl = data.activePage;
    }

    // 用户代理
    if (data.systemInfo && data.systemInfo.system) {
      reportData.userAgent = data.systemInfo.system;
    }

    // 设备信息 - 转换为JSON字符串
    if (data.systemInfo) {
      reportData.deviceInfo = JSON.stringify(data.systemInfo);
    }

    // 网络信息 - 转换为JSON字符串
    if (data.network && data.network.length > 0) {
      reportData.networkInfo = JSON.stringify(data.network[0]);
    }

    // 性能数据 - 转换为JSON字符串
    if (data.performanceData) {
      reportData.performanceData = JSON.stringify(data.performanceData);
    }

    // HTTP请求相关字段
    if (data.url) {
      reportData.requestUrl = data.url;
    }
    if (data.method) {
      reportData.requestMethod = data.method;
    }
    if (data.status) {
      reportData.responseStatus = data.status;
    }
    if (data.duration) {
      reportData.duration = data.duration;
    }

    // 额外数据 - 包含行为、自定义数据等，转换为JSON字符串
    const extraData: any = {};
    if (data.behavior) {
      extraData.behavior = data.behavior;
    }
    if (data.customData) {
      extraData.customData = data.customData;
    }
    if (data.env !== undefined) {
      extraData.env = data.env;
    }
    if (data.scene !== undefined) {
      extraData.scene = data.scene;
    }
    if (data.time) {
      extraData.time = data.time;
    }
    if (data.sdkVersion) {
      extraData.sdkVersion = data.sdkVersion;
    }

    if (Object.keys(extraData).length > 0) {
      reportData.extraData = JSON.stringify(extraData);
    }

    return reportData;
  }

  /**
   * 将原始数据转换为符合后端ErrorLogDto格式的数据
   * @param data 原始数据
   * @returns 转换后的数据
   */
  private transformToErrorLogData(data: any): any {
    const errorLogData: any = {
      projectId: this.projectId,
      type: data.type || "customError",
    };

    // 错误相关字段
    if (data.error) {
      if (typeof data.error === "string") {
        errorLogData.errorMessage = data.error;
      } else if (data.error.message) {
        errorLogData.errorMessage = data.error.message;
        errorLogData.errorStack = data.error.stack;
      }
    }

    // 页面URL
    if (data.activePage) {
      errorLogData.pageUrl = data.activePage;
    }

    // 用户代理
    if (data.systemInfo && data.systemInfo.system) {
      errorLogData.userAgent = data.systemInfo.system;
    }

    // 设备信息 - 保持为对象格式
    if (data.systemInfo) {
      errorLogData.deviceInfo = data.systemInfo;
    }

    // 网络信息 - 保持为对象格式
    if (data.network && data.network.length > 0) {
      errorLogData.networkInfo = data.network[0];
    }

    // HTTP请求相关字段
    if (data.url) {
      errorLogData.requestUrl = data.url;
    }
    if (data.method) {
      errorLogData.requestMethod = data.method;
    }
    if (data.status) {
      errorLogData.responseStatus = data.status;
    }
    if (data.duration) {
      errorLogData.duration = data.duration;
    }

    // 面包屑数据（行为数据）
    if (data.behavior && Array.isArray(data.behavior)) {
      errorLogData.breadcrumbs = data.behavior.map((item: any) => ({
        timestamp: item.time || Date.now(),
        type: item.type || "custom",
        category: item.category || "user",
        message: item.data
          ? JSON.stringify(item.data)
          : item.type || "user action",
        data: item.data || {},
      }));
    }

    // 额外数据 - 保持为对象格式
    const extraData: any = {};
    if (data.customData) {
      extraData.customData = data.customData;
    }
    if (data.env !== undefined) {
      extraData.env = data.env;
    }
    if (data.scene !== undefined) {
      extraData.scene = data.scene;
    }
    if (data.time) {
      extraData.time = data.time;
    }
    if (data.sdkVersion) {
      extraData.sdkVersion = data.sdkVersion;
    }
    if (data.performanceData) {
      extraData.performanceData = data.performanceData;
    }

    if (Object.keys(extraData).length > 0) {
      errorLogData.extraData = extraData;
    }

    // 添加时间戳
    errorLogData.timestamp = data.time || Date.now();

    return errorLogData;
  }

  /**
   * 立即上报队列中的数据
   */
  async flushData() {
    if (this.isReporting || this.dataQueue.length === 0) {
      return;
    }

    this.isReporting = true;

    try {
      const dataToReport = this.dataQueue.splice(0, this.batchSize);
      const result = await this.reportWithRetry(dataToReport);

      if (result.success) {
        console.log(
          `[Reporter] Successfully reported ${dataToReport.length} items`
        );
        // 上报成功后，尝试发送缓存的数据
        this.flushCachedData();
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("[Reporter] Failed to report data:", error);
      // 数据重新加入队列前端
      this.dataQueue.unshift(...this.dataQueue.splice(0, this.batchSize));

      // 如果启用缓存，保存到本地
      if (this.enableOfflineCache) {
        this.cacheData(this.dataQueue);
      }
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * 带重试机制的数据上报
   */
  private async reportWithRetry(
    dataList: any[],
    retryCount = 0
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查服务是否可用
      if (!this.isServiceAvailable) {
        return { success: false, error: "Service unavailable" };
      }

      const result = await this.sendRequest(dataList);

      if (result.success) {
        return { success: true };
      }

      if (result.statusCode) {
        // 如果是服务端错误，检查是否需要标记为不可用
        if (
          result.statusCode >= 500 ||
          result.error?.includes("ECONNREFUSED")
        ) {
          this.markServiceUnavailable();
        }
      }

      // 重试逻辑
      if (retryCount < this.maxRetries) {
        console.log(
          `[Reporter] Retrying in ${this.retryDelay}ms (attempt ${
            retryCount + 1
          }/${this.maxRetries})`
        );

        return new Promise((resolve) => {
          setTimeout(async () => {
            const retryResult = await this.reportWithRetry(
              dataList,
              retryCount + 1
            );
            resolve(retryResult);
          }, this.retryDelay * Math.pow(2, retryCount)); // 指数退避
        });
      }

      return {
        success: false,
        error: result.error || `Max retries (${this.maxRetries}) exceeded`,
      };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "Unknown error" };
    }
  }

  /**
   * 发送HTTP请求
   */
  private async sendRequest(
    dataList: any[]
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    return new Promise((resolve) => {
      const isBatch = dataList.length > 1;
      const url = isBatch
        ? `${this.serverUrl}/api/error-logs/batch`
        : `${this.serverUrl}/api/monitor/report`;

      // 根据端点类型转换数据格式
      let transformedData;
      if (isBatch) {
        // 批量上报使用ErrorLogDto格式
        transformedData = dataList.map((data) =>
          this.transformToErrorLogData(data)
        );
      } else {
        // 单条上报使用ReportDataDto格式
        transformedData = this.transformToReportData(dataList[0]);
      }

      const requestOptions: WxRequestOptions = {
        url,
        method: "POST",
        data: transformedData,
        header: {
          "Content-Type": "application/json",
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          "X-Project-ID": this.projectId || "",
          "X-SDK-Version": "1.0.0-taro",
        },
        timeout: this.timeout,
        success: (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve({ success: true });
          } else if (res.statusCode === 404) {
            // 服务端未启动或接口不存在
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: "Service endpoint not found",
            });
          } else if (res.statusCode === 400) {
            // 参数错误，输出响应内容以便调试
            console.error("[Reporter] Validation error:", res.data);
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: `Validation error: ${JSON.stringify(res.data)}`,
            });
          } else {
            resolve({
              success: false,
              statusCode: res.statusCode || 0,
              error: `HTTP ${res.statusCode || 0}`,
            });
          }
        },
        fail: (error: any) => {
          if (error.errMsg.includes("timeout")) {
            resolve({ success: false, error: "Request timeout" });
          } else if (
            error.errMsg.includes("fail") ||
            error.errMsg.includes("ECONNREFUSED")
          ) {
            resolve({
              success: false,
              error: "Connection failed - service may be down",
            });
          } else {
            resolve({ success: false, error: error.errMsg });
          }
        },
      };

      // 兼容Taro和原生小程序
      const wxAPI =
        typeof Taro !== "undefined"
          ? Taro
          : typeof wx !== "undefined"
          ? wx
          : {};
      if (wxAPI.request) {
        wxAPI.request(requestOptions);
      } else {
        resolve({ success: false, error: "wx.request is not available" });
      }
    });
  }

  /**
   * 服务健康检查
   */
  private async checkServiceHealth(): Promise<boolean> {
    try {
      const healthUrl = `${this.serverUrl}/api/health`;

      return new Promise((resolve) => {
        const requestOptions: WxRequestOptions = {
          url: healthUrl,
          method: "GET",
          timeout: 3000,
          success: (res) => {
            resolve(res.statusCode === 200);
          },
          fail: () => {
            resolve(false);
          },
        };

        const wxAPI =
          typeof Taro !== "undefined"
            ? Taro
            : typeof wx !== "undefined"
            ? wx
            : {};
        if (wxAPI.request) {
          wxAPI.request(requestOptions);
        } else {
          resolve(false);
        }
      });
    } catch {
      return false;
    }
  }

  /**
   * 标记服务为不可用状态
   */
  private markServiceUnavailable() {
    this.isServiceAvailable = false;
    this.lastHealthCheck = Date.now();

    // 保存服务状态到缓存
    try {
      if (this.enableOfflineCache) {
        const statusData = {
          available: false,
          timestamp: Date.now(),
        };
        wx.setStorageSync(this.SERVICE_STATUS_KEY, statusData);
      }
    } catch (error) {
      console.warn("[Reporter] Failed to save service status:", error);
    }

    console.warn(
      "[Reporter] Service marked as unavailable, will retry in background"
    );
  }

  /**
   * 启动服务健康检查
   */
  private startHealthCheck() {
    setInterval(async () => {
      const now = Date.now();

      // 如果服务不可用，或者距离上次检查超过30秒
      if (
        !this.isServiceAvailable ||
        now - this.lastHealthCheck > this.healthCheckInterval
      ) {
        const isHealthy = await this.checkServiceHealth();

        if (isHealthy !== this.isServiceAvailable) {
          this.isServiceAvailable = isHealthy;
          console.log(
            `[Reporter] Service status changed: ${
              isHealthy ? "available" : "unavailable"
            }`
          );

          if (isHealthy) {
            // 服务恢复，立即尝试上报缓存数据
            this.flushCachedData();
          }
        }

        this.lastHealthCheck = now;
      }
    }, this.healthCheckInterval);
  }

  /**
   * 监听网络状态变化
   */
  private observeNetworkStatus() {
    const wxAPI =
      typeof Taro !== "undefined" ? Taro : typeof wx !== "undefined" ? wx : {};

    if (wxAPI.onNetworkStatusChange) {
      wxAPI.onNetworkStatusChange((res: any) => {
        console.log("[Reporter] Network status changed:", res);

        // 如果网络恢复且服务可用，尝试上报
        if (res.isConnected && this.isServiceAvailable) {
          setTimeout(() => {
            this.flushData();
            this.flushCachedData();
          }, 1000);
        }
      });
    }
  }

  /**
   * 缓存数据到本地存储
   */
  private cacheData(data: any[]) {
    if (!this.enableOfflineCache) return;

    try {
      const cacheData: ICachedData = {
        data: data.slice(0, this.maxCacheSize), // 限制缓存大小
        timestamp: Date.now(),
        retryCount: 0,
      };

      wx.setStorageSync(this.CACHE_KEY, cacheData);
      console.log(`[Reporter] Cached ${cacheData.data.length} items locally`);
    } catch (error) {
      console.error("[Reporter] Failed to cache data:", error);
    }
  }

  /**
   * 恢复缓存的数据
   */
  private restoreCachedData() {
    if (!this.enableOfflineCache) return;

    try {
      const cached = wx.getStorageSync(this.CACHE_KEY);
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        // 将缓存数据添加到队列
        this.dataQueue.unshift(...cached.data);
        console.log(`[Reporter] Restored ${cached.data.length} cached items`);

        // 清除缓存
        wx.removeStorageSync(this.CACHE_KEY);
      }

      // 恢复服务状态
      const serviceStatus = wx.getStorageSync(this.SERVICE_STATUS_KEY);
      if (serviceStatus && typeof serviceStatus.available === "boolean") {
        this.isServiceAvailable = serviceStatus.available;
      }
    } catch (error) {
      console.error("[Reporter] Failed to restore cached data:", error);
    }
  }

  /**
   * 上报缓存的数据
   */
  private async flushCachedData() {
    if (!this.enableOfflineCache || !this.isServiceAvailable) return;

    try {
      const cached = wx.getStorageSync(this.CACHE_KEY);
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        console.log(
          `[Reporter] Attempting to flush ${cached.data.length} cached items`
        );

        const result = await this.reportWithRetry(cached.data);

        if (result.success) {
          // 上报成功，清除缓存
          wx.removeStorageSync(this.CACHE_KEY);
          console.log("[Reporter] Successfully flushed cached data");
        } else {
          // 更新重试次数
          cached.retryCount++;
          cached.lastError = result.error;
          wx.setStorageSync(this.CACHE_KEY, cached);
        }
      }
    } catch (error) {
      console.error("[Reporter] Failed to flush cached data:", error);
    }
  }

  /**
   * 启动定时上报
   */
  private startBatchReporting() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.dataQueue.length > 0) {
        this.flushData();
      }
    }, this.flushInterval);
  }

  /**
   * 停止上报
   */
  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // 立即上报剩余数据
    if (this.dataQueue.length > 0) {
      this.flushData();
    }

    // 缓存剩余数据
    if (this.dataQueue.length > 0 && this.enableOfflineCache) {
      this.cacheData(this.dataQueue);
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    let cachedItems = 0;
    if (this.enableOfflineCache) {
      try {
        const cached = wx.getStorageSync(this.CACHE_KEY);
        cachedItems =
          cached && Array.isArray(cached.data) ? cached.data.length : 0;
      } catch {
        /* ignore */
      }
    }
    return {
      queueSize: this.dataQueue.length,
      isServiceAvailable: this.isServiceAvailable,
      isReporting: this.isReporting,
      lastHealthCheck: this.lastHealthCheck,
      enableOfflineCache: this.enableOfflineCache,
      cachedItems,
    };
  }

  /**
   * 清空队列和缓存
   */
  clear() {
    this.dataQueue = [];

    if (this.enableOfflineCache) {
      try {
        wx.removeStorageSync(this.CACHE_KEY);
        wx.removeStorageSync(this.SERVICE_STATUS_KEY);
      } catch (error) {
        console.error("[Reporter] Failed to clear cache:", error);
      }
    }
  }

  /**
   * 更新服务器地址
   * @param newServerUrl 新的服务器地址
   */
  public updateServerUrl(newServerUrl: string): void {
    if (newServerUrl && newServerUrl !== this.serverUrl) {
      this.serverUrl = newServerUrl;
      console.log(`[Reporter] Server URL updated to: ${newServerUrl}`);
    }
  }

  /**
   * 获取当前服务器地址
   * @returns 当前服务器地址
   */
  public getServerUrl(): string {
    return this.serverUrl;
  }
}

// 创建Reporter实例的工厂函数
export function createReporter(options: IReporterOptions): Reporter {
  return new Reporter(options);
}
