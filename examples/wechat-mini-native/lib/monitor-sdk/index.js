/**
 * 微信小程序监控SDK入口文件
 * 兼容Taro框架和原生微信小程序
 */

const { Monitor } = require('./monitor.js');
const { TrackerEvents, IBehaviorItemType, Env } = require('./types/index.js');

/**
 * 创建监控实例的便捷方法
 * @param {Object} options 监控配置选项
 * @returns {Monitor} Monitor实例
 */
function createMonitor(options) {
  return Monitor.init(options || {});
}

/**
 * 原生小程序专用的监控初始化函数
 * @param {Object} options 监控配置选项
 * @returns {Monitor} Monitor实例
 */
function initNativeMonitor(options) {
  options = options || {};
  
  // 原生小程序环境特定的默认配置
  const nativeDefaults = {
    env: 'dev',
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

  // 合并配置
  const mergedOptions = Object.assign({}, nativeDefaults, options);
  
  return Monitor.init(mergedOptions);
}

/**
 * 检测是否为Taro环境
 * @returns {boolean}
 */
function isTaroEnvironment() {
  return typeof Taro !== 'undefined';
}

// 版本信息
const VERSION = '1.0.0-native';

// 导出
module.exports = {
  Monitor,
  TrackerEvents,
  IBehaviorItemType,
  Env,
  createMonitor,
  initNativeMonitor,
  isTaroEnvironment,
  VERSION
};