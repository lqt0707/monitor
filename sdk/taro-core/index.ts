/**
 * Taro监控SDK
 * 基于Core架构的Taro平台SDK实现
 */

import { BaseManager } from "../core/managers/BaseManager";
import { MonitorConfig } from "../core/types/base";
import { TaroPlatformAdapter } from "../adapters/taro-mini/TaroPlatformAdapter";

// 导入配置模板
const Templates = {
  TaroBasic: {
    error: {
      enabled: true,
      captureConsole: true,
      maxErrors: 50,
    },
    performance: {
      enabled: true,
      capturePageLoad: true,
      captureNetworkTiming: true,
    },
    behavior: {
      enabled: true,
      capturePageViews: true,
      captureTaps: true,
      captureRouteChange: true,
    },
    report: {
      interval: 15000,
      batchSize: 10,
      maxRetries: 2,
    },
  },
};

/**
 * 创建配置
 * @param template 配置模板
 * @param overrides 自定义覆盖配置
 * @returns 最终配置
 */
function createConfig(
  template: any,
  overrides: Partial<MonitorConfig> = {}
): MonitorConfig {
  return {
    ...template,
    ...overrides,
    error: { ...template.error, ...overrides.error },
    performance: { ...template.performance, ...overrides.performance },
    behavior: { ...template.behavior, ...overrides.behavior },
    report: { ...template.report, ...overrides.report },
  } as MonitorConfig;
}

/**
 * Taro监控SDK类
 */
export class TaroMonitorSDK extends BaseManager {
  private static instance: TaroMonitorSDK | null = null;

  constructor(config: MonitorConfig) {
    const platformAdapter = new TaroPlatformAdapter();
    super(config, platformAdapter);
  }

  /**
   * 初始化Taro监控SDK（单例模式）
   * @param config 配置选项
   * @returns SDK实例
   */
  public static init(config: MonitorConfig): TaroMonitorSDK {
    if (TaroMonitorSDK.instance) {
      console.warn(
        "[TaroMonitorSDK] SDK already initialized, returning existing instance"
      );
      return TaroMonitorSDK.instance;
    }

    TaroMonitorSDK.instance = new TaroMonitorSDK(config);

    // 自动初始化
    TaroMonitorSDK.instance.init().catch((error) => {
      console.error("[TaroMonitorSDK] Failed to initialize:", error);
    });

    return TaroMonitorSDK.instance;
  }

  /**
   * 获取当前SDK实例
   * @returns SDK实例或null
   */
  public static getInstance(): TaroMonitorSDK | null {
    return TaroMonitorSDK.instance;
  }

  /**
   * 销毁SDK
   */
  public static destroy(): void {
    if (TaroMonitorSDK.instance) {
      TaroMonitorSDK.instance.destroy();
      TaroMonitorSDK.instance = null;
    }
  }
}

// 便捷的静态方法
const TaroMonitorSDKHelper = {
  /**
   * 快速开始方法
   */
  quickStart: {
    /**
     * Taro应用快速开始
     * @param projectId 项目ID
     * @param serverUrl 服务器地址
     * @param options 额外配置
     * @returns SDK实例
     */
    taro: (
      projectId: string,
      serverUrl: string,
      options: Partial<MonitorConfig> = {}
    ) => {
      const config = createConfig(Templates.TaroBasic, {
        projectId,
        serverUrl,
        ...options,
      });
      return TaroMonitorSDK.init(config);
    },
  },

  /**
   * 初始化监控SDK
   * @param config 配置选项
   * @returns SDK实例
   */
  init: (config: MonitorConfig) => TaroMonitorSDK.init(config),

  /**
   * 获取当前实例
   * @returns SDK实例或null
   */
  getInstance: () => TaroMonitorSDK.getInstance(),

  /**
   * 手动捕获错误
   * @param error 错误对象或消息
   * @param extra 额外信息
   */
  captureError: (error: Error | string, extra?: Record<string, any>) => {
    const instance = TaroMonitorSDK.getInstance();
    if (instance) {
      instance.captureError(error, extra);
    } else {
      console.warn("[TaroMonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 记录性能指标
   * @param name 指标名称
   * @param metrics 指标数据
   */
  recordPerformance: (name: string, metrics: Record<string, number>) => {
    const instance = TaroMonitorSDK.getInstance();
    if (instance) {
      instance.recordPerformance(name, metrics);
    } else {
      console.warn("[TaroMonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 记录用户行为
   * @param event 事件名称
   * @param data 事件数据
   */
  recordBehavior: (event: string, data?: Record<string, any>) => {
    const instance = TaroMonitorSDK.getInstance();
    if (instance) {
      instance.recordBehavior(event, data);
    } else {
      console.warn("[TaroMonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 立即上报数据
   */
  flush: async () => {
    const instance = TaroMonitorSDK.getInstance();
    if (instance) {
      await instance.flush();
    } else {
      console.warn("[TaroMonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 获取SDK状态
   */
  getStatus: () => {
    const instance = TaroMonitorSDK.getInstance();
    if (instance) {
      return instance.getStatus();
    } else {
      console.warn("[TaroMonitorSDK] SDK not initialized, call init() first");
      return null;
    }
  },

  /**
   * 销毁SDK
   */
  destroy: () => TaroMonitorSDK.destroy(),

  /**
   * 监听事件
   * @param event 事件名称
   * @param listener 监听器函数
   */
  on: (event: string, listener: Function) => {
    const instance = TaroMonitorSDK.getInstance();
    if (instance) {
      instance.on(event, listener);
    } else {
      console.warn("[TaroMonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 移除事件监听
   * @param event 事件名称
   * @param listener 监听器函数
   */
  off: (event: string, listener?: Function) => {
    const instance = TaroMonitorSDK.getInstance();
    if (instance) {
      instance.off(event, listener);
    } else {
      console.warn("[TaroMonitorSDK] SDK not initialized, call init() first");
    }
  },
};

// 兼容原有的初始化方式
export const initTaroMonitor = TaroMonitorSDKHelper.init;

// 导出类型和接口
export * from "../core/types/base";
export { MonitorConfig } from "../core/types/base";

// 导出配置模板
export { Templates, createConfig };

// 默认导出
export default TaroMonitorSDKHelper;
