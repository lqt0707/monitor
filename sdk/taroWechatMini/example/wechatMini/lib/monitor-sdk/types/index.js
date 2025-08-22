/**
 * 微信小程序监控SDK类型定义
 * JavaScript版本
 */

// 环境枚举
const Env = {
  Dev: 'dev',
  Sandbox: 'sandbox',
  Production: 'production'
};

// 事件类型枚举
const TrackerEvents = {
  event: "event",
  jsError: "jsError",
  reqError: "reqError",
  unHandleRejection: "unHandleRejection",
  performanceInfoReady: "performanceInfoReady",
  slowHttpRequest: "slowHttpRequest"
};

// 行为项类型枚举
const IBehaviorItemType = {
  fn: "function",
  console: "console",
  http: "http",
  custom: "custom",
  tap: "tap"
};

// 默认监控选项
const DefaultMonitorOptions = {
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

// 工具函数：检查是否为Taro环境
function isTaroEnv() {
  try {
    // 使用全局对象检查
    return typeof global !== 'undefined' && global.Taro !== undefined ||
           typeof window !== 'undefined' && window.Taro !== undefined ||
           typeof wx !== 'undefined' && wx.Taro !== undefined;
  } catch (e) {
    return false;
  }
}

// 工具函数：获取当前页面
function getCurrentPage() {
  try {
    if (isTaroEnv()) {
      // Taro环境
      return null; // Taro环境下需要特殊处理
    } else {
      // 原生小程序环境
      if (typeof getCurrentPages === 'function') {
        const pages = getCurrentPages();
        return pages && pages.length > 0 ? pages[pages.length - 1] : null;
      }
      return null;
    }
  } catch (e) {
    return null;
  }
}

// 工具函数：获取应用实例
function getAppInstance() {
  try {
    if (typeof getApp === 'function') {
      return getApp();
    }
    return null;
  } catch (e) {
    return null;
  }
}

// 工具函数：创建行为项
function createBehaviorItem(options) {
  options = options || {};
  return {
    time: options.time || Date.now(),
    type: options.type || IBehaviorItemType.custom,
    message: options.message || '',
    method: options.method || '',
    activePage: options.activePage || getCurrentPage(),
    belong: options.belong || '',
    args: options.args || null,
    timeConsume: options.timeConsume || 0,
    // HTTP相关字段
    req: options.req || null,
    res: options.res || null
  };
}

// 工具函数：创建错误对象
function createBaseError(error, behavior, decorateData) {
  decorateData = decorateData || {};
  return {
    error: error || '',
    behavior: behavior || [],
    env: decorateData.env || Env.Dev,
    scene: decorateData.scene || 0,
    time: decorateData.time || Date.now(),
    systemInfo: decorateData.systemInfo || null,
    network: decorateData.network || [],
    performanceData: decorateData.performanceData || null,
    customData: decorateData.customData || {},
    globalData: decorateData.globalData || null
  };
}

// 导出
module.exports = {
  Env,
  TrackerEvents,
  IBehaviorItemType,
  DefaultMonitorOptions,
  isTaroEnv,
  getCurrentPage,
  getAppInstance,
  createBehaviorItem,
  createBaseError
};