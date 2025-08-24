/**
 * 微信小程序监控SDK核心类
 * JavaScript版本
 */

const { interceptRequest } = require('./interceptRequest.js');
const { observePagePerformance } = require('./performance.js');
const { processDataFactory } = require('./processData.js');
const { rewriteApp } = require('./rewriteApp.js');
const { rewriteConsole } = require('./rewriteConsole.js');
const { rewritePage } = require('./rewritePage.js');
const { TrackerEvents, IBehaviorItemType, Env } = require('./types/index.js');
const Util = require('./util.js');
const { Reporter } = require('./reporter.js');

// 简单的EventEmitter实现
class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * 监听事件
   * @param {string} event 事件名
   * @param {Function} listener 监听函数
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  /**
   * 触发事件
   * @param {string} event 事件名
   * @param {...any} args 参数
   * @returns {boolean}
   */
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  /**
   * 移除事件监听
   * @param {string} event 事件名
   * @param {Function} listener 监听函数
   */
  off(event, listener) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }
}

// 简单的deepmerge实现
function merge(target, source) {
  const result = Object.assign({}, target);
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = merge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

// 兼容Taro和原生小程序的环境检测
function isTaroEnv() {
  try {
    // 检查是否存在Taro全局对象
    return typeof wx !== 'undefined' && wx.Taro !== undefined;
  } catch (e) {
    return false;
  }
}

// 默认配置
const defaultOptions = {
  env: Env.Dev,
  isSystemInfo: true,
  isNetwork: true,
  httpTimeout: 0,
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
  },
  // 数据上报配置
  report: {
    url: 'http://localhost:3000/api/monitor/report',
    projectId: '',
    batchSize: 10,
    flushInterval: 5000,
    maxRetries: 3
  }
};

// 错误事件列表
const ERROR_EVENTS = [
  TrackerEvents.jsError,
  TrackerEvents.reqError,
  TrackerEvents.unHandleRejection
];

/**
 * 监控核心类
 */
class Monitor extends EventEmitter {
  constructor(options) {
    super();
    this.initProperties(options);
    
    // 初始化Taro兼容性
    if (isTaroEnv()) {
      this.initTaroCompatibility();
    }
  }

  /**
   * 初始化Taro兼容性
   */
  initTaroCompatibility() {
    console.log('[Monitor] Taro环境检测到，启用兼容模式');
  }

  /**
   * 静态初始化方法
   * @param {Object} options 配置选项
   * @returns {Monitor} Monitor实例
   */
  static init(options) {
    if (!Monitor.instance) {
      const mergedOptions = merge(defaultOptions, options || {});
      Monitor.instance = new Monitor(mergedOptions);
    }
    return Monitor.instance;
  }

  /**
   * 初始化属性
   * @param {Object} options 配置选项
   */
  initProperties(options) {
    this.$options = options;
    this.activePage = null;
    this.systemInfo = null;
    this.performanceData = null;
    this.network = [];
    this.scene = 0;
    this.processData = processDataFactory(this);
    this.behavior = [];
    this.customData = {};
    
    // 初始化数据上报器
    if (options.report && options.report.url && options.report.projectId) {
      this.reporter = new Reporter(options.report);
      this.setupReportListener();
    }
  }

  /**
   * 处理错误事件
   * @param {string} eventName 事件名
   * @param {Error} error 错误对象
   */
  handleErrorEvent(eventName, error) {
    if (this.isEmitErrorEvent({ eventName, error })) {
      this.processData(eventName, error);
    }
  }

  /**
   * 处理应用启动
   * @param {Object} options 启动参数
   */
  handleOnLaunch(options) {
    this.scene = options.scene || 0;
  }

  /**
   * 添加行为记录
   * @param {Object} item 行为项
   * @returns {Object} 行为项
   */
  pushBehaviorItem(item) {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const behaviorItem = Object.assign({
      time: Date.now(),
      activePage: this.activePage
    }, item);

    this.behavior.push(behaviorItem);

    // 限制队列长度
    if (this.behavior.length > this.$options.behavior.queueLimit) {
      this.behavior.shift();
    }

    return behaviorItem;
  }

  /**
   * 获取网络信息
   * @returns {Promise<Array>} 网络信息数组
   */
  async getNetworkInfo() {
    try {
      const networkInfo = await Util.getNetworkInfo();
      return [networkInfo];
    } catch (e) {
      return [];
    }
  }

  /**
   * 监听网络变化
   */
  async observeNetworkChange() {
    // 实现网络变化监听
  }

  /**
   * 获取系统信息
   * @returns {Promise<Object>} 系统信息
   */
  async getSystemInfo() {
    try {
      return await Util.getSystemInfo();
    } catch (e) {
      return null;
    }
  }

  /**
   * 设置自定义数据
   * @param {string|Object} key 键名或对象
   * @param {any} value 值
   * @returns {Monitor} Monitor实例
   */
  setCustomData(key, value) {
    if (typeof key === 'object' && key !== null) {
      // 如果key是对象，则合并到customData
      this.customData = Object.assign(this.customData, key);
    } else if (typeof key === 'string') {
      // 如果key是字符串，则设置单个值
      this.customData[key] = value;
    }
    return this;
  }

  /**
   * 检查是否为随机错误
   * @param {Object} options 配置选项
   * @returns {boolean}
   */
  isRandomError(options) {
    const random = options.error.random;
    return Math.random() <= random;
  }

  /**
   * 检查是否过滤错误
   * @param {Object} options 配置选项
   * @param {string} errorStr 错误字符串
   * @returns {boolean}
   */
  isFilterError(options, errorStr) {
    const filters = options.error.filters;
    if (!filters || !Array.isArray(filters)) {
      return false;
    }
    
    return filters.some(filter => {
      if (filter instanceof RegExp) {
        return filter.test(errorStr);
      }
      return false;
    });
  }

  /**
   * 检查是否应该触发错误事件
   * @param {Object} emitData 事件数据
   * @returns {boolean}
   */
  isEmitErrorEvent(emitData) {
    const { eventName, error } = emitData;
    const errorStr = error ? error.toString() : '';
    
    // 检查是否在错误事件列表中
    if (!ERROR_EVENTS.includes(eventName)) {
      return true;
    }
    
    // 检查随机采样
    if (!this.isRandomError(this.$options)) {
      return false;
    }
    
    // 检查错误过滤
    if (this.isFilterError(this.$options, errorStr)) {
      return false;
    }
    
    return true;
  }

  /**
   * 设置数据上报监听器
   */
  setupReportListener() {
    if (!this.reporter) return;
    
    // 监听所有事件并上报数据
    this.on(TrackerEvents.event, (eventName, eventData) => {
      this.reportData(eventName, eventData);
    });
  }

  /**
   * 上报数据到服务端
   * @param {string} eventName 事件名
   * @param {any} eventData 事件数据
   */
  reportData(eventName, eventData) {
    if (!this.reporter) return;
    
    try {
      // 构造符合服务端要求的数据格式
      const reportData = {
        projectId: this.$options.report.projectId,
        type: this.mapEventNameToType(eventName),
        timestamp: Date.now(),
        pageUrl: eventData.activePage || '',
        userAgent: this.systemInfo?.system || '',
        deviceInfo: this.systemInfo,
        networkInfo: this.network[0] || null,
        performanceData: this.performanceData,
        extraData: {
          eventName,
          eventData,
          customData: this.customData,
          behavior: this.behavior.slice(-5) // 最近5个行为
        }
      };
      
      // 根据事件类型添加特定字段
      if (eventData.error) {
        reportData.errorMessage = eventData.error.message;
        reportData.errorStack = eventData.error.stack;
      }
      
      if (eventData.url) {
        reportData.requestUrl = eventData.url;
        reportData.requestMethod = eventData.method || 'GET';
        reportData.responseStatus = eventData.status;
        reportData.duration = eventData.duration;
      }
      
      // 添加到上报队列
      this.reporter.addData(reportData);
    } catch (error) {
      console.error('[Monitor] 数据上报失败:', error);
    }
  }

  /**
   * 将事件名映射为服务端类型
   * @param {string} eventName 事件名
   * @returns {string} 服务端类型
   */
  mapEventNameToType(eventName) {
    const typeMap = {
      [TrackerEvents.jsError]: 'jsError',
      [TrackerEvents.reqError]: 'reqError',
      [TrackerEvents.unHandleRejection]: 'unHandleRejection',
      [TrackerEvents.performanceInfoReady]: 'performanceInfoReady'
    };
    
    return typeMap[eventName] || 'other';
  }

  /**
   * 触发事件（重写父类方法）
   * @param {string} event 事件名
   * @param {any} data 数据
   * @returns {boolean}
   */
  emit(event, data) {
    // 触发具体事件
    super.emit(event, data);
    // 触发通用事件
    super.emit(TrackerEvents.event, event, data);
    return true;
  }
}

// 静态属性
Monitor.instance = null;

// 导出
module.exports = {
  Monitor,
  Env,
  defaultOptions,
  ERROR_EVENTS,
  isTaroEnv
};