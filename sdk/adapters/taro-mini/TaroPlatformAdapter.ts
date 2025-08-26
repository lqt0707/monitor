/**
 * Taro平台适配器实现
 * 实现Taro环境下的监控功能适配，兼容Taro框架和原生微信小程序
 */

import {
  PlatformAdapter,
  PlatformInfo,
  ErrorCaptureAdapter,
  PerformanceAdapter,
  BehaviorAdapter,
  NetworkAdapter,
  StorageAdapter,
  HttpRequestInfo,
} from "../../core/interfaces/PlatformAdapter";
import {
  ErrorData,
  PerformanceData,
  BehaviorData,
  ErrorType,
  PerformanceType,
  BehaviorType,
} from "../../core/types/base";
import {
  generateId,
  getTimestamp,
  generateSessionId,
  serializeError,
} from "../../core/utils/common";

// 兼容性检测
const isTaroEnv = typeof Taro !== "undefined";
const isWxEnv = typeof wx !== "undefined";

// 全局声明
declare const Taro: any;
declare const wx: any;
declare const getCurrentPages: () => any[];
declare const getApp: () => any;

/**
 * Taro错误捕获适配器
 */
class TaroErrorCapture implements ErrorCaptureAdapter {
  private onError?: (error: ErrorData) => void;
  private originalConsole: any;
  private config?: any;

  /**
   * 设置配置
   * @param config 配置对象
   */
  setConfig(config: any): void {
    this.config = config;
  }

  /**
   * 获取项目ID
   * @returns 项目ID
   */
  private getProjectId(): string {
    return this.config?.projectId || "default-project";
  }

  initErrorListeners(onError: (error: ErrorData) => void): void {
    this.onError = onError;
    this.setupGlobalErrorHandler();
    this.setupUnhandledRejectionHandler();
    this.setupConsoleErrorHandler();
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandler(): void {
    if (isTaroEnv && Taro.onError) {
      Taro.onError((error: string) => {
        this.handleError(ErrorType.JS_ERROR, error, { source: "Taro.onError" });
      });
    } else if (isWxEnv && wx.onError) {
      wx.onError((error: string) => {
        this.handleError(ErrorType.JS_ERROR, error, { source: "wx.onError" });
      });
    }
  }

  /**
   * 设置未处理的Promise错误处理器
   */
  private setupUnhandledRejectionHandler(): void {
    if (isTaroEnv && Taro.onUnhandledRejection) {
      Taro.onUnhandledRejection((res: any) => {
        this.handleError(ErrorType.PROMISE_ERROR, res.reason, {
          source: "Taro.onUnhandledRejection",
        });
      });
    } else if (isWxEnv && wx.onUnhandledRejection) {
      wx.onUnhandledRejection((res: any) => {
        this.handleError(ErrorType.PROMISE_ERROR, res.reason, {
          source: "wx.onUnhandledRejection",
        });
      });
    }
  }

  /**
   * 设置Console错误监控
   */
  private setupConsoleErrorHandler(): void {
    const self = this;
    this.originalConsole = { ...console };

    console.error = function (...args: any[]) {
      self.handleError(ErrorType.JS_ERROR, args.join(" "), {
        source: "console.error",
        args: args,
      });
      return self.originalConsole.error.apply(console, args);
    };
  }

  /**
   * 处理错误
   * @param type 错误类型
   * @param error 错误信息
   * @param extra 额外信息
   */
  private handleError(type: ErrorType, error: any, extra: any = {}): void {
    if (!this.onError) return;

    const errorData: ErrorData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: this.getProjectId(), // 使用方法获取projectId
      projectVersion: this.config?.projectVersion, // 添加项目版本信息
      sessionId: generateSessionId(),
      url: this.getCurrentPagePath(),
      userAgent: this.getUserAgent(),
      platform: "taro-mini",
      type,
      message:
        typeof error === "string" ? error : error?.message || String(error),
      stack: error?.stack,
      error: serializeError(error),
      ...extra,
    };

    console.log("🚨 错误被捕获:", {
      type: errorData.type,
      message: errorData.message,
      projectId: errorData.projectId,
      url: errorData.url,
    });

    this.onError(errorData);
  }

  /**
   * 获取当前页面路径
   */
  private getCurrentPagePath(): string {
    try {
      if (typeof getCurrentPages === "function") {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        return currentPage?.route || currentPage?.__route__ || "";
      }
    } catch (e) {
      // 忽略错误
    }
    return "";
  }

  /**
   * 获取用户代理信息
   * 使用新的微信小程序API替代废弃的getSystemInfoSync
   */
  private getUserAgent(): string {
    try {
      if (isTaroEnv) {
        // 优先使用Taro的新API
        if (Taro.getDeviceInfo && Taro.getSystemSetting) {
          const deviceInfo = Taro.getDeviceInfo();
          const systemInfo = Taro.getSystemSetting();
          return `${deviceInfo.brand || "Unknown"} ${deviceInfo.model || ""} ${deviceInfo.system || ""}`;
        }
        // 降级使用旧API（如果新API不可用）
        else if (Taro.getSystemInfoSync) {
          const systemInfo = Taro.getSystemInfoSync();
          return `${systemInfo.brand} ${systemInfo.model} ${systemInfo.system}`;
        }
      } else if (isWxEnv) {
        // 优先使用微信小程序的新API
        if (wx.getDeviceInfo && wx.getSystemSetting) {
          const deviceInfo = wx.getDeviceInfo();
          const systemInfo = wx.getSystemSetting();
          return `${deviceInfo.brand || "Unknown"} ${deviceInfo.model || ""} ${deviceInfo.system || ""}`;
        }
        // 降级使用旧API（如果新API不可用）
        else if (wx.getSystemInfoSync) {
          const systemInfo = wx.getSystemInfoSync();
          return `${systemInfo.brand} ${systemInfo.model} ${systemInfo.system}`;
        }
      }
    } catch (e) {
      // 如果所有API都失败，记录错误但不影响主流程
      console.warn("[TaroMonitorSDK] Failed to get system info:", e);
    }
    return "Taro-MiniProgram";
  }

  destroyErrorListeners(): void {
    if (this.originalConsole) {
      Object.assign(console, this.originalConsole);
    }
  }

  captureError(error: Error | string, extra?: Record<string, any>): ErrorData {
    const errorData: ErrorData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: this.getProjectId(), // 使用正确的projectId
      projectVersion: this.config?.projectVersion, // 添加项目版本信息
      sessionId: generateSessionId(),
      url: this.getCurrentPagePath(),
      userAgent: this.getUserAgent(),
      platform: "taro-mini",
      type: ErrorType.CUSTOM_ERROR,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error: serializeError(error),
      ...extra,
    };

    return errorData;
  }

  captureHttpError(request: HttpRequestInfo): ErrorData {
    return {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: this.getCurrentPagePath(),
      userAgent: this.getUserAgent(),
      platform: "taro-mini",
      type: ErrorType.HTTP_ERROR,
      message: `HTTP ${request.status}: ${request.method} ${request.url}`,
      error: {
        url: request.url,
        method: request.method,
        status: request.status,
        statusText: request.statusText,
        duration: request.duration,
      },
    };
  }
}

/**
 * Taro性能监控适配器
 */
class TaroPerformanceAdapter implements PerformanceAdapter {
  private onPerformance?: (data: PerformanceData) => void;
  private static originalRequest: any = null; // 保存原始的request方法

  initPerformanceMonitor(onPerformance: (data: PerformanceData) => void): void {
    this.onPerformance = onPerformance;
    this.setupRequestPerformanceMonitor();
  }

  /**
   * 获取原始的request方法（供SDK内部使用，避免被监控）
   */
  static getOriginalRequest(): any {
    return TaroPerformanceAdapter.originalRequest;
  }

  /**
   * 设置请求性能监控
   */
  private setupRequestPerformanceMonitor(): void {
    const self = this;

    if (isTaroEnv && Taro.request) {
      // 保存原始request方法（只保存一次）
      if (!TaroPerformanceAdapter.originalRequest) {
        TaroPerformanceAdapter.originalRequest = Taro.request;
      }
      const originalRequest = TaroPerformanceAdapter.originalRequest;

      Taro.request = function (options: any) {
        const startTime = Date.now();

        const originalSuccess = options.success;
        const originalFail = options.fail;

        options.success = function (res: any) {
          const duration = Date.now() - startTime;
          self.recordRequestPerformance(
            options.url,
            options.method || "GET",
            res.statusCode,
            duration,
            true
          );
          if (originalSuccess) originalSuccess(res);
        };

        options.fail = function (err: any) {
          const duration = Date.now() - startTime;
          self.recordRequestPerformance(
            options.url,
            options.method || "GET",
            0,
            duration,
            false
          );
          if (originalFail) originalFail(err);
        };

        return originalRequest(options);
      };
    } else if (isWxEnv && wx.request) {
      // 保存原始request方法（只保存一次）
      if (!TaroPerformanceAdapter.originalRequest) {
        TaroPerformanceAdapter.originalRequest = wx.request;
      }
      const originalRequest = TaroPerformanceAdapter.originalRequest;

      wx.request = function (options: any) {
        const startTime = Date.now();

        const originalSuccess = options.success;
        const originalFail = options.fail;

        options.success = function (res: any) {
          const duration = Date.now() - startTime;
          self.recordRequestPerformance(
            options.url,
            options.method || "GET",
            res.statusCode,
            duration,
            true
          );
          if (originalSuccess) originalSuccess(res);
        };

        options.fail = function (err: any) {
          const duration = Date.now() - startTime;
          self.recordRequestPerformance(
            options.url,
            options.method || "GET",
            0,
            duration,
            false
          );
          if (originalFail) originalFail(err);
        };

        return originalRequest(options);
      };
    }
  }

  /**
   * 记录请求性能
   */
  private recordRequestPerformance(
    url: string,
    method: string,
    status: number,
    duration: number,
    success: boolean
  ): void {
    if (!this.onPerformance) return;

    // 过滤SDK监控接口的请求
    const monitorEndpoints = [
      "/api/monitor/report",
      "/api/monitor/data",
      "/api/monitor/stats",
      "/api/error-logs",
      "/api/health",
    ];

    const isMonitorEndpoint = monitorEndpoints.some((endpoint) =>
      url.includes(endpoint)
    );

    if (isMonitorEndpoint) {
      console.log("🚫 过滤SDK监控接口性能数据:", url);
      return; // 不记录SDK相关的网络请求性能
    }

    // 新增：检查当前页面堆栈，如果来自SDK内部调用则过滤
    try {
      const stack = new Error().stack || "";
      const isSDKInternalCall =
        stack.includes("sendSingleData") ||
        stack.includes("TaroNetworkAdapter") ||
        stack.includes("sendData");
      if (isSDKInternalCall) {
        console.log("🚫 过滤SDK内部调用的网络请求:", url);
        return;
      }
    } catch (e) {
      // 忽略堆栈检查错误
    }

    const performanceData: PerformanceData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: this.getCurrentPagePath(),
      userAgent: this.getUserAgent(),
      platform: "taro-mini",
      type: PerformanceType.HTTP_REQUEST,
      metrics: {
        duration,
        status,
        success: success ? 1 : 0,
      },
      resource: {
        name: url,
        size: 0,
        duration,
        type: "request",
      },
    };

    this.onPerformance(performanceData);
  }

  private getCurrentPagePath(): string {
    try {
      if (typeof getCurrentPages === "function") {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        return currentPage?.route || currentPage?.__route__ || "";
      }
    } catch (e) {
      // 忽略错误
    }
    return "";
  }

  private getUserAgent(): string {
    try {
      if (isTaroEnv && Taro.getSystemInfoSync) {
        const systemInfo = Taro.getSystemInfoSync();
        return `${systemInfo.brand} ${systemInfo.model} ${systemInfo.system}`;
      } else if (isWxEnv && wx.getSystemInfoSync) {
        const systemInfo = wx.getSystemInfoSync();
        return `${systemInfo.brand} ${systemInfo.model} ${systemInfo.system}`;
      }
    } catch (e) {
      // 忽略错误
    }
    return "Taro-MiniProgram";
  }

  destroyPerformanceMonitor(): void {
    // 清理性能监控
  }

  recordPerformance(
    name: string,
    metrics: Record<string, number>
  ): PerformanceData {
    return {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: this.getCurrentPagePath(),
      userAgent: this.getUserAgent(),
      platform: "taro-mini",
      type: PerformanceType.CUSTOM_METRIC,
      metrics,
    };
  }

  getPagePerformance(): Record<string, number> {
    return {};
  }
}

/**
 * Taro行为监控适配器
 */
class TaroBehaviorAdapter implements BehaviorAdapter {
  private onBehavior?: (data: BehaviorData) => void;

  initBehaviorMonitor(onBehavior: (data: BehaviorData) => void): void {
    this.onBehavior = onBehavior;
  }

  destroyBehaviorMonitor(): void {
    // 清理行为监控
  }

  recordBehavior(event: string, data?: Record<string, any>): BehaviorData {
    return {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: this.getCurrentPagePath(),
      userAgent: this.getUserAgent(),
      platform: "taro-mini",
      type: BehaviorType.CUSTOM,
      event,
      data,
    };
  }

  private getCurrentPagePath(): string {
    try {
      if (typeof getCurrentPages === "function") {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        return currentPage?.route || currentPage?.__route__ || "";
      }
    } catch (e) {
      // 忽略错误
    }
    return "";
  }

  private getUserAgent(): string {
    try {
      if (isTaroEnv && Taro.getSystemInfoSync) {
        const systemInfo = Taro.getSystemInfoSync();
        return `${systemInfo.brand} ${systemInfo.model} ${systemInfo.system}`;
      } else if (isWxEnv && wx.getSystemInfoSync) {
        const systemInfo = wx.getSystemInfoSync();
        return `${systemInfo.brand} ${systemInfo.model} ${systemInfo.system}`;
      }
    } catch (e) {
      // 忽略错误
    }
    return "Taro-MiniProgram";
  }
}

/**
 * Taro网络适配器
 */
class TaroNetworkAdapter implements NetworkAdapter {
  interceptNetwork(
    onRequest: (request: any) => void,
    onResponse: (response: any) => void,
    onError: (error: any) => void
  ): void {
    // 网络拦截实现
  }

  async sendData(url: string, data: any, options?: any): Promise<any> {
    // 如果是数组，需要逐个发送（因为后端接口只支持单条数据）
    if (Array.isArray(data)) {
      const results = [];
      for (const item of data) {
        // 过滤SDK相关数据
        if (this.shouldFilterSDKRelatedData(item)) {
          console.log("🚫 过滤了SDK相关数据，不进行上报");
          continue; // 跳过该数据，不上报
        }

        try {
          const transformedData = this.transformDataToReportDto(item);
          const result = await this.sendSingleData(
            url,
            transformedData,
            options
          );
          results.push(result);
          console.log(
            "✅ 数据上报成功:",
            transformedData.type,
            transformedData.errorMessage || transformedData.type
          );
        } catch (error) {
          console.error("❌ 数据上报失败:", error);
          throw error;
        }
      }
      return results;
    } else {
      // 单条数据
      // 过滤SDK相关数据
      if (this.shouldFilterSDKRelatedData(data)) {
        console.log("🚫 过滤了SDK相关数据，不进行上报");
        return { filtered: true, reason: "SDK related data" };
      }

      const transformedData = this.transformDataToReportDto(data);
      return this.sendSingleData(url, transformedData, options);
    }
  }

  /**
   * 检查是否为SDK相关的请求或错误，需要过滤掉
   * @param data 监控数据
   * @returns 是否应该过滤（true表示过滤掉，不上报）
   */
  private shouldFilterSDKRelatedData(data: any): boolean {
    // 过滤监控接口相关的请求
    const monitorEndpoints = [
      "/api/monitor/report",
      "/api/monitor/data",
      "/api/monitor/stats",
      "/api/error-logs",
      "/api/health",
    ];

    // 检查网络请求性能数据
    if (data.type === "http_request" || data.type === "slowHttpRequest") {
      if (data.error?.url) {
        const isMonitorEndpoint = monitorEndpoints.some((endpoint) =>
          data.error.url.includes(endpoint)
        );
        if (isMonitorEndpoint) {
          console.log("🚫 过滤SDK监控接口请求:", data.error.url);
          return true;
        }
      }

      // 检查extraData中的resource.name
      if (data.extraData) {
        try {
          const extraData =
            typeof data.extraData === "string"
              ? JSON.parse(data.extraData)
              : data.extraData;

          if (extraData.resource?.name) {
            const isMonitorEndpoint = monitorEndpoints.some((endpoint) =>
              extraData.resource.name.includes(endpoint)
            );
            if (isMonitorEndpoint) {
              console.log("🚫 过滤SDK监控接口请求:", extraData.resource.name);
              return true;
            }
          }
        } catch (e) {
          // 忽略JSON解析错误
        }
      }
    }

    // 过滤SDK内部错误
    if (data.message || data.errorMessage) {
      const errorMessage = data.message || data.errorMessage;
      const sdkErrorPatterns = [
        "MonitorSDK",
        "TaroMonitorSDK",
        "PlatformAdapter",
        "BaseManager",
        "sendData",
        "transformDataToReportDto",
        "monitor/report",
        "monitor initialization",
        "SDK not initialized",
      ];

      const isSDKError = sdkErrorPatterns.some((pattern) =>
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );

      if (isSDKError) {
        console.log("🚫 过滤SDK内部错误:", errorMessage);
        return true;
      }
    }

    // 过滤SDK堆栈跟踪
    if (data.stack || data.errorStack) {
      const stack = data.stack || data.errorStack;
      const sdkStackPatterns = [
        "TaroPlatformAdapter",
        "BaseManager",
        "sendData",
        "transformDataToReportDto",
        "TaroMonitorSDK",
      ];

      const isSDKStack = sdkStackPatterns.some((pattern) =>
        stack.includes(pattern)
      );

      if (isSDKStack) {
        console.log("🚫 过滤SDK内部堆栈错误");
        return true;
      }
    }

    return false;
  }
  private transformDataToReportDto(data: any): any {
    console.log("🔄 开始数据转换，原始数据:", data);

    // 基础字段映射
    const reportData: any = {
      projectId: data.projectId || "default-project",
      type: this.mapErrorTypeToReportType(data.type),
      pageUrl: data.url || data.pageUrl,
      userAgent: data.userAgent,
    };

    // 添加项目版本信息（重要：作为顶级字段）
    if (data.projectVersion) {
      reportData.projectVersion = data.projectVersion;
    }

    // 根据数据类型添加特定字段
    if (data.message) {
      reportData.errorMessage = data.message;
    }

    if (data.stack) {
      reportData.errorStack = data.stack;
    }

    if (data.sessionId) {
      reportData.userId = data.sessionId; // 使用sessionId作为userId
    }

    // 性能数据处理
    if (data.metrics) {
      reportData.performanceData = JSON.stringify(data.metrics);
    }

    // HTTP错误数据处理
    if (data.error && typeof data.error === "object") {
      if (data.error.url) reportData.requestUrl = data.error.url;
      if (data.error.method) reportData.requestMethod = data.error.method;
      if (data.error.status) reportData.responseStatus = data.error.status;
      if (data.error.duration) reportData.duration = data.error.duration;
    }

    // 处理额外数据 - 将所有未映射的字段合并到extraData中
    const extraFields: any = {};

    // 收集所有额外字段
    Object.keys(data).forEach((key) => {
      if (
        ![
          "id",
          "timestamp",
          "projectId",
          "projectVersion", // 添加projectVersion到排除列表
          "sessionId",
          "url",
          "pageUrl",
          "userAgent",
          "platform",
          "type",
          "message",
          "stack",
          "error",
          "metrics",
        ].includes(key)
      ) {
        extraFields[key] = data[key];
      }
    });

    // 如果有额外数据或者原有的extra/data字段，合并处理
    if (Object.keys(extraFields).length > 0 || data.extra || data.data) {
      const combinedExtra = {
        ...extraFields,
        ...(data.extra || {}),
        ...(data.data || {}),
      };
      reportData.extraData = JSON.stringify(combinedExtra);
    }

    console.log("✅ 数据转换完成，转换后数据:", reportData);

    // 验证必需字段
    if (!reportData.projectId || !reportData.type) {
      console.error("❌ 数据转换后缺少必需字段:", {
        projectId: reportData.projectId,
        type: reportData.type,
      });
    }

    return reportData;
  }

  /**
   * 将SDK错误类型映射为后端期望的类型
   * @param sdkType SDK错误类型
   * @returns 后端类型
   */
  private mapErrorTypeToReportType(sdkType: string): string {
    console.log("🔄 映射错误类型:", sdkType);

    const typeMap: Record<string, string> = {
      // SDK内部错误类型 -> 后端期望类型
      js_error: "jsError",
      promise_error: "unHandleRejection",
      http_error: "reqError",
      custom_error: "jsError",
      custom_metric: "performanceInfoReady",
      http_request: "slowHttpRequest",

      // 直接映射后端类型（兼容性）
      jsError: "jsError",
      unHandleRejection: "unHandleRejection",
      reqError: "reqError",
      performanceInfoReady: "performanceInfoReady",
      slowHttpRequest: "slowHttpRequest",
    };

    const mappedType = typeMap[sdkType] || "jsError";
    console.log("✅ 类型映射结果:", sdkType, "->", mappedType);

    return mappedType;
  }

  /**
   * 发送单条数据
   * @param url 请求URL
   * @param data 数据
   * @param options 选项
   * @returns Promise
   */
  private async sendSingleData(
    url: string,
    data: any,
    options?: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log("🚀 发送数据到:", url);
      console.log("📊 数据内容:", data);

      const requestOptions = {
        url,
        method: "POST",
        data,
        header: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        timeout: options?.timeout || 5000,
        success: (res: any) => {
          console.log("✅ 请求成功:", res.statusCode, res.data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            console.error("❌ HTTP错误:", res.statusCode, res.data);
            reject(
              new Error(
                `HTTP ${res.statusCode}: ${res.errMsg || "Request failed"}`
              )
            );
          }
        },
        fail: (err: any) => {
          console.error("❌ 请求失败:", err);
          reject(new Error(err.errMsg || "Request failed"));
        },
      };

      // 优先使用原始的未被拦截的request方法，避免SDK监控自己的上报请求
      const originalRequest = TaroPerformanceAdapter.getOriginalRequest();
      if (originalRequest) {
        console.log("📡 使用原始request方法发送数据，避免重复监控");
        originalRequest(requestOptions);
      } else if (isTaroEnv && Taro.request) {
        console.log("⚠️ 使用当前Taro.request方法（可能被监控）");
        Taro.request(requestOptions);
      } else if (isWxEnv && wx.request) {
        console.log("⚠️ 使用当前wx.request方法（可能被监控）");
        wx.request(requestOptions);
      } else {
        reject(new Error("Request API not available"));
      }
    });
  }
}

/**
 * Taro存储适配器
 */
class TaroStorageAdapter implements StorageAdapter {
  setItem(key: string, value: string): void {
    try {
      if (isTaroEnv && Taro.setStorageSync) {
        Taro.setStorageSync(key, value);
      } else if (isWxEnv && wx.setStorageSync) {
        wx.setStorageSync(key, value);
      }
    } catch (error) {
      console.warn("[TaroStorageAdapter] setItem failed:", error);
    }
  }

  getItem(key: string): string | null {
    try {
      if (isTaroEnv && Taro.getStorageSync) {
        return Taro.getStorageSync(key) || null;
      } else if (isWxEnv && wx.getStorageSync) {
        return wx.getStorageSync(key) || null;
      }
    } catch (error) {
      console.warn("[TaroStorageAdapter] getItem failed:", error);
    }
    return null;
  }

  removeItem(key: string): void {
    try {
      if (isTaroEnv && Taro.removeStorageSync) {
        Taro.removeStorageSync(key);
      } else if (isWxEnv && wx.removeStorageSync) {
        wx.removeStorageSync(key);
      }
    } catch (error) {
      console.warn("[TaroStorageAdapter] removeItem failed:", error);
    }
  }

  clear(): void {
    try {
      if (isTaroEnv && Taro.clearStorageSync) {
        Taro.clearStorageSync();
      } else if (isWxEnv && wx.clearStorageSync) {
        wx.clearStorageSync();
      }
    } catch (error) {
      console.warn("[TaroStorageAdapter] clear failed:", error);
    }
  }
}

/**
 * Taro平台适配器
 */
export class TaroPlatformAdapter implements PlatformAdapter {
  readonly platformInfo: PlatformInfo;
  readonly errorCapture: ErrorCaptureAdapter;
  readonly performance: PerformanceAdapter;
  readonly behavior: BehaviorAdapter;
  readonly network: NetworkAdapter;
  readonly storage: StorageAdapter;

  constructor() {
    this.platformInfo = this.getPlatformInfo();
    this.errorCapture = new TaroErrorCapture();
    this.performance = new TaroPerformanceAdapter();
    this.behavior = new TaroBehaviorAdapter();
    this.network = new TaroNetworkAdapter();
    this.storage = new TaroStorageAdapter();
  }

  /**
   * 获取平台信息
   */
  private getPlatformInfo(): PlatformInfo {
    let deviceInfo: any = {};

    try {
      if (isTaroEnv && Taro.getSystemInfoSync) {
        deviceInfo = Taro.getSystemInfoSync();
      } else if (isWxEnv && wx.getSystemInfoSync) {
        deviceInfo = wx.getSystemInfoSync();
      }
    } catch (e) {
      console.warn("[TaroPlatformAdapter] Failed to get system info:", e);
    }

    return {
      platform: "taro-mini",
      version: "1.0.0",
      userAgent: `${deviceInfo.brand || "Unknown"} ${
        deviceInfo.model || "Unknown"
      } ${deviceInfo.system || "Unknown"}`,
      deviceInfo: {
        brand: deviceInfo.brand,
        model: deviceInfo.model,
        system: deviceInfo.system,
        platform: deviceInfo.platform,
        version: deviceInfo.version,
        SDKVersion: deviceInfo.SDKVersion,
        screenWidth: deviceInfo.screenWidth,
        screenHeight: deviceInfo.screenHeight,
        windowWidth: deviceInfo.windowWidth,
        windowHeight: deviceInfo.windowHeight,
        pixelRatio: deviceInfo.pixelRatio,
        language: deviceInfo.language,
      },
    };
  }

  init(config: Record<string, any>): void {
    console.log("[TaroPlatformAdapter] Initialized with config:", config);

    // 将配置传递给错误捕获器
    if (this.errorCapture && "setConfig" in this.errorCapture) {
      (this.errorCapture as any).setConfig(config);
    }
  }

  destroy(): void {
    this.errorCapture.destroyErrorListeners();
    this.performance.destroyPerformanceMonitor();
    this.behavior.destroyBehaviorMonitor();
    console.log("[TaroPlatformAdapter] Destroyed");
  }
}
