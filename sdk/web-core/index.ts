/**
 * Web监控SDK
 * 基于Core架构的Web平台SDK实现
 */

import { BaseManager } from "../core/managers/BaseManager";
import { MonitorConfig } from "../core/types/base";
import { WebPlatformAdapter } from "../adapters/web/WebPlatformAdapter";
import { getVersionInfo, VersionInfo } from "../core/utils/version";

/**
 * Web监控SDK类
 */
export class WebMonitorSDK extends BaseManager {
  private static instance: WebMonitorSDK | null = null;

  constructor(config: MonitorConfig) {
    const platformAdapter = new WebPlatformAdapter();
    super(config, platformAdapter);
  }

  /**
   * 初始化Web监控SDK（单例模式）
   * @param config 配置选项
   * @returns SDK实例
   */
  public static init(config: MonitorConfig): WebMonitorSDK {
    if (WebMonitorSDK.instance) {
      console.warn(
        "[WebMonitorSDK] SDK already initialized, returning existing instance"
      );
      return WebMonitorSDK.instance;
    }

    WebMonitorSDK.instance = new WebMonitorSDK(config);

    // 自动初始化
    WebMonitorSDK.instance.init().catch((error) => {
      console.error("[WebMonitorSDK] Failed to initialize:", error);
    });

    return WebMonitorSDK.instance;
  }

  /**
   * 获取当前SDK实例
   * @returns SDK实例或null
   */
  public static getInstance(): WebMonitorSDK | null {
    return WebMonitorSDK.instance;
  }

  /**
   * 销毁SDK
   */
  public static destroy(): void {
    if (WebMonitorSDK.instance) {
      WebMonitorSDK.instance.destroy();
      WebMonitorSDK.instance = null;
    }
  }
}

// 便捷的静态方法
const MonitorSDK = {
  /**
   * 初始化监控SDK
   * @param config 配置选项
   * @returns SDK实例
   */
  init: (config: MonitorConfig) => WebMonitorSDK.init(config),
  
  /**
   * 设置版本信息
   * @param versionInfo 版本信息对象
   */
  setVersionInfo: (versionInfo: VersionInfo) => {
    const instance = WebMonitorSDK.getInstance();
    if (instance) {
      instance.setConfig({ versionInfo });
    } else {
      console.warn("[MonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 获取当前实例
   * @returns SDK实例或null
   */
  getInstance: () => WebMonitorSDK.getInstance(),

  /**
   * 手动捕获错误
   * @param error 错误对象或消息
   * @param extra 额外信息
   */
  captureError: (error: Error | string, extra?: Record<string, any>) => {
    const instance = WebMonitorSDK.getInstance();
    if (instance) {
      instance.captureError(error, extra);
    } else {
      console.warn("[MonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 记录性能指标
   * @param name 指标名称
   * @param metrics 指标数据
   */
  recordPerformance: (name: string, metrics: Record<string, number>) => {
    const instance = WebMonitorSDK.getInstance();
    if (instance) {
      instance.recordPerformance(name, metrics);
    } else {
      console.warn("[MonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 记录用户行为
   * @param event 事件名称
   * @param data 事件数据
   */
  recordBehavior: (event: string, data?: Record<string, any>) => {
    const instance = WebMonitorSDK.getInstance();
    if (instance) {
      instance.recordBehavior(event, data);
    } else {
      console.warn("[MonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 立即上报数据
   */
  flush: async () => {
    const instance = WebMonitorSDK.getInstance();
    if (instance) {
      await instance.flush();
    } else {
      console.warn("[MonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 获取SDK状态
   */
  getStatus: () => {
    const instance = WebMonitorSDK.getInstance();
    if (instance) {
      return instance.getStatus();
    } else {
      console.warn("[MonitorSDK] SDK not initialized, call init() first");
      return null;
    }
  },

  /**
   * 销毁SDK
   */
  destroy: () => WebMonitorSDK.destroy(),

  /**
   * 监听事件
   * @param event 事件名称
   * @param listener 监听器函数
   */
  on: (event: string, listener: Function) => {
    const instance = WebMonitorSDK.getInstance();
    if (instance) {
      instance.on(event, listener);
    } else {
      console.warn("[MonitorSDK] SDK not initialized, call init() first");
    }
  },

  /**
   * 移除事件监听
   * @param event 事件名称
   * @param listener 监听器函数
   */
  off: (event: string, listener?: Function) => {
    const instance = WebMonitorSDK.getInstance();
    if (instance) {
      instance.off(event, listener);
    } else {
      console.warn("[MonitorSDK] SDK not initialized, call init() first");
    }
  },
};

// 导出类型和接口
export * from "../core/types/base";
export { MonitorConfig } from "../core/types/base";
export { getVersionInfo, VersionInfo } from "../core/utils/version";

// 默认导出
export default MonitorSDK;

// 为了向后兼容，也可以挂载到window对象（仅在浏览器环境）
if (typeof window !== "undefined") {
  (window as any).MonitorSDK = MonitorSDK;
}