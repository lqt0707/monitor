/**
 * Taro微信小程序监控SDK入口文件
 * 兼容Taro框架和原生微信小程序
 */

import { Monitor, IMonitorOptions, Env } from './monitor';
import { TrackerEvents, IBehaviorItemType } from './types';

// 导出主要类和接口
export * from "./monitor";
export * from "./types/index";
export * from "./util";

/**
 * 创建监控实例的便捷方法
 * @param options 监控配置选项
 * @returns Monitor实例
 */
export function createMonitor(options: Partial<IMonitorOptions>): Monitor {
  return Monitor.init(options);
}

/**
 * Taro专用的监控初始化函数
 * @param options 监控配置选项
 * @returns Monitor实例
 */
export function initTaroMonitor(options: Partial<IMonitorOptions> = {}): Monitor {
  // Taro环境特定的默认配置
  const taroDefaults: Partial<IMonitorOptions> = {
    env: Env.Dev,
    isSystemInfo: true,
    isNetwork: true,
    httpTimeout: 5000,
    error: {
      filters: [],
      random: 1
    },
    behavior: {
      isFilterConsole: false,
      queueLimit: 20,
      methodWhiteList: [],
      methodBlackList: []
    },
    performance: {
      watch: true,
      queueLimit: 20
    }
  };

  const finalOptions = { ...taroDefaults, ...options };
  return Monitor.init(finalOptions);
}

// 版本信息
export const VERSION = '1.0.0-taro';

// 环境检测
export const isTaroEnvironment = typeof Taro !== 'undefined';

// 全局声明（用于TypeScript支持）
declare const Taro: any;

// 默认导出Monitor类
export default Monitor;
