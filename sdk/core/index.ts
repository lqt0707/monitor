/**
 * 监控SDK核心模块入口
 * 导出所有核心组件和类型
 */

// 核心管理器
export { BaseManager } from "./managers/BaseManager";
export { ErrorManager } from "./managers/ErrorManager";

// 核心类型
export * from "./types/base";

// 平台适配器接口
export * from "./interfaces/PlatformAdapter";

// 工具函数
export * from "./utils/common";
export { DataQueue, RetryQueue, QueueEventType } from "./utils/queue";
export type {
  QueueConfig,
  QueueStatus,
  QueueEventEmitter,
} from "./utils/queue";

// 版本信息
export const VERSION = "1.0.0";

/**
 * 核心模块元信息
 */
export const CORE_INFO = {
  name: "Monitor SDK Core",
  version: VERSION,
  description: "前端监控SDK核心模块，提供跨平台的监控功能",
  author: "Monitor Team",
  license: "MIT",
};

/**
 * 支持的平台列表
 */
export const SUPPORTED_PLATFORMS = [
  "web",
  "taro-mini",
  "wechat-mini",
  "react-native",
] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];
