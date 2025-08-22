import { interceptRequest } from "./interceptRequest";
import { observePagePerformance, PerformanceData } from "./performance";
import { IProcessDataHandler, processDataFactory } from "./processData";
import { Reporter, IReporterOptions } from "./reporter";
import { rewriteApp } from "./rewriteApp";
import { rewriteConsole } from "./rewriteConsole";
import { rewritePage } from "./rewritePage";
import {
  ActivePage,
  IBaseError,
  IBehaviorItem,
  IBehaviorItemType,
  TrackerEvents,
} from "./types";
import * as Util from "./util";

// 简单的EventEmitter实现
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
      return true;
    }
    return false;
  }

  off(event: string, listener: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((l) => l !== listener);
    }
  }
}

// 简单的deepmerge实现
function merge(target: any, source: any): any {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = merge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

// 全局声明
declare const Taro: any;
declare const wx: any;

// 本地类型声明
declare namespace WechatMiniprogram {
  interface SystemInfo {
    brand: string;
    model: string;
    system: string;
    platform: string;
    version: string;
    SDKVersion: string;
    [key: string]: any;
  }
}

// 兼容Taro和原生小程序的环境检测
const isTaroEnv = typeof Taro !== "undefined";

export enum Env {
  Dev = "dev",
  Sandbox = "sandbox",
  Production = "production",
}

export interface IPerformanceOptions {
  watch: boolean;
  queueLimit: number;
}

export interface IBehaviorOptions {
  isFilterConsole: boolean;
  queueLimit: number;
  methodWhiteList: string[];
  methodBlackList: string[];
}

export type CustomData = Record<string, any>;

export interface IErrorOptions {
  random: number;
  filters: RegExp[];
  ignoreMonitorEndpointErrors: boolean;
}

export interface IMonitorOptions {
  env: Env;
  isSystemInfo: boolean;
  isNetwork: boolean;
  httpTimeout: number;
  error: IErrorOptions;
  behavior: IBehaviorOptions;
  performance: IPerformanceOptions;
  serverUrl?: string;
  projectId?: string;
  apiKey?: string;
  reporter?: {
    serverUrl?: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
    batchSize?: number;
    flushInterval?: number;
    maxQueueSize?: number;
    enableOfflineCache?: boolean;
    maxCacheSize?: number;
    projectId?: string;
    apiKey?: string;
  };
}

export const defaultOptions = {
  env: Env.Dev,
  isSystemInfo: true,
  isNetwork: true,
  httpTimeout: 0,
  error: {
    filters: [],
    random: 1,
    ignoreMonitorEndpointErrors: true, // 默认过滤监控接口报错
  },
  behavior: {
    isFilterConsole: false,
    queueLimit: 20,
    methodWhiteList: [],
    methodBlackList: [],
  },
  performance: {
    watch: true,
    queueLimit: 20,
  },
  reporter: {
    serverUrl: "http://localhost:3000",
    timeout: 5000,
    maxRetries: 3,
    retryDelay: 2000,
    batchSize: 10,
    flushInterval: 10000,
    maxQueueSize: 100,
    enableOfflineCache: true,
    maxCacheSize: 50,
  },
};

export const ERROR_EVENTS: string[] = [
  TrackerEvents.jsError,
  TrackerEvents.reqError,
  TrackerEvents.unHandleRejection,
  TrackerEvents.custom,
];

/**
 * 监控类，兼容Taro和原生小程序
 */
export class Monitor extends EventEmitter {
  public static instance: Monitor;
  public $options!: IMonitorOptions;
  public activePage!: ActivePage;
  public systemInfo: any; // 使用any类型以兼容不同环境
  public performanceData!: PerformanceData;
  public network!: Util.INetworkInfo[];
  public scene!: number;
  public processData!: IProcessDataHandler;
  public behavior!: IBehaviorItem[];
  public customData!: CustomData;
  public reporter!: Reporter;
  private serverUrl!: string;
  private projectId?: string;
  private apiKey?: string;

  constructor(options: IMonitorOptions) {
    super();

    // 首先初始化属性
    this.initProperties(options);
    this.processData = processDataFactory(this);
    this.initReporter();
    this.setupReportListener();
    this.initTaroCompatibility();

    // 确保$options已初始化后再使用
    if (this.$options && this.$options.isNetwork) {
      this.getNetworkInfo();
      this.observeNetworkChange();
    }

    if (this.$options && this.$options.isSystemInfo) {
      this.getSystemInfo();
    }

    rewriteApp(this);
    rewritePage(this);
    rewriteConsole(this);
    interceptRequest(this);

    if (
      this.$options &&
      this.$options.performance &&
      this.$options.performance.watch
    ) {
      observePagePerformance(this);
    }
  }

  /**
   * 初始化Taro兼容性
   */
  private initTaroCompatibility(): void {
    console.log(
      `[Monitor] Initializing in ${isTaroEnv ? "Taro" : "Native"} environment`
    );
  }

  static init(options: Partial<IMonitorOptions>): Monitor {
    if (this.instance) {
      return this.instance;
    }

    const mergeOptions = options
      ? merge(defaultOptions, options)
      : defaultOptions;

    return (this.instance = new Monitor(mergeOptions));
  }

  private initProperties(options: IMonitorOptions) {
    this.$options = options;
    this.activePage = null;
    this.systemInfo = null;
    this.customData = {};
    this.network = [];
    this.performanceData = [];
    this.behavior = [];

    // 从配置中提取上报相关参数
    const reporterOptions = options.reporter || {};
    this.serverUrl =
      reporterOptions.serverUrl || options.serverUrl || "http://localhost:3000";
    this.projectId = reporterOptions.projectId || options.projectId;
    this.apiKey = reporterOptions.apiKey || options.apiKey;
  }

  /**
   * 初始化Reporter实例
   */
  private initReporter() {
    const reporterOptions = {
      serverUrl: this.serverUrl,
      projectId: this.projectId,
      apiKey: this.apiKey,
      ...(this.$options.reporter || {}),
    };

    this.reporter = new Reporter(reporterOptions);
  }

  /**
   * 设置数据上报监听
   */
  private setupReportListener() {
    // 监听所有错误事件
    ERROR_EVENTS.forEach((eventName) => {
      this.on(eventName, (data: any) => {
        this.reportData(data);
      });
    });
  }

  /**
   * 数据上报方法
   */
  private reportData(data: any) {
    if (!data) return;

    // 构造上报数据
    const reportData = {
      ...data,
      // 确保type字段被正确设置
      type: data.type || "customError",
      activePage: this.activePage ? Util.getPageUrl() : "",
      systemInfo: this.systemInfo,
      network: this.network,
      scene: this.scene,
      customData: this.customData,
      behavior: this.behavior.slice(-5), // 只保留最近5条行为数据
    };

    // 添加到Reporter队列
    this.reporter.addData(reportData);
  }

  public handleErrorEvent(eventName: TrackerEvents, error: Error): void {
    const errorStr = error.toString().trim();
    const errorObj = this.processData<IBaseError>({
      error: errorStr,
      behavior: this.behavior,
      // 根据事件名称设置type字段
      type: this.getErrorTypeByEventName(eventName),
    });

    this.emit(eventName, errorObj);
  }

  /**
   * 根据事件名称获取错误类型
   * @param eventName 事件名称
   * @returns 错误类型
   */
  private getErrorTypeByEventName(eventName: TrackerEvents): string {
    switch (eventName) {
      case TrackerEvents.jsError:
        return "jsError";
      case TrackerEvents.unHandleRejection:
        return "promiseRejection";
      case TrackerEvents.reqError:
        return "httpError";
      default:
        return "customError";
    }
  }

  public handleOnLaunch(options: any) {
    this.scene = options && options.scene;
  }

  public pushBehaviorItem(item: IBehaviorItem): IBehaviorItem {
    if (!item.type) {
      item.type = IBehaviorItemType.custom;
    }

    if (!item.time) {
      item.time = Date.now();
    }

    const { queueLimit } = this.$options.behavior;

    if (this.behavior.length >= queueLimit) {
      this.behavior.shift();
    }

    this.behavior.push(item);

    return item;
  }

  public async getNetworkInfo(): Promise<Util.INetworkInfo[]> {
    if (this.network.length) return this.network;

    const networkInfo = await Util.getNetworkInfo();
    this.network.push(networkInfo);

    return this.network;
  }

  public async observeNetworkChange() {
    Util.observeNetworkChange(this);
  }

  public async getSystemInfo(): Promise<any> {
    if (this.systemInfo) return this.systemInfo;

    const systemInfo = await Util.getSystemInfo();
    return (this.systemInfo = systemInfo);
  }

  public setCustomData(
    key: string,
    value: Record<string, unknown> | string | number | Array<any>
  ): Monitor;
  public setCustomData(options: Record<string, unknown>): Monitor;
  public setCustomData(
    key: Record<string, unknown> | string,
    value:
      | Record<string, unknown>
      | string
      | number
      | boolean
      | Array<any> = true
  ): Monitor {
    if (typeof key === "string") {
      this.customData[key as string] = value;
    } else if (Util.isObject(key)) {
      value = key;
      this.customData = {
        ...this.customData,
        ...value,
      };
    }

    return this;
  }

  isRandomError(options: IMonitorOptions): boolean {
    const rate = options.error.random;

    return Math.random() <= rate;
  }

  isFilterError(options: IMonitorOptions, errorStr: string) {
    const rules = options.error.filters || [];
    const ignoreMonitorErrors =
      options.error?.ignoreMonitorEndpointErrors !== false; // 默认启用

    if (ignoreMonitorErrors) {
      // 过滤监控接口本身的报错
      const monitorEndpointFilters = [
        /\/api\/monitor\/report/i,
        /\/api\/error-logs\/batch/i,
        /localhost:\d+.*ECONNREFUSED/i,
        /net::ERR_CONNECTION_REFUSED/i,
        /Request.*fail/i,
        /Network.*error/i,
      ];

      // 检查是否匹配监控接口报错
      const isMonitorEndpointError = monitorEndpointFilters.some((regExp) =>
        regExp.test(errorStr)
      );

      if (isMonitorEndpointError) {
        return true;
      }
    }

    // 应用用户自定义的过滤规则
    if (!rules.length) return false;

    return rules?.some((regExp) => {
      if (regExp.test(errorStr)) {
        return true;
      }

      return false;
    });
  }

  isEmitErrorEvent(emitData: any) {
    const isRandom = this.isRandomError(this.$options);
    const isFilter = this.isFilterError(
      this.$options,
      emitData.error as string
    );

    return isRandom && !isFilter;
  }

  /**
   * 立即上报所有待发送的数据
   */
  async flush() {
    return this.reporter.flushData();
  }

  /**
   * 停止监控和数据上报
   */
  stop() {
    this.reporter.stop();
  }

  /**
   * 获取监控状态
   */
  getStatus() {
    return {
      reporter: this.reporter.getStatus(),
      queueSize: this.behavior.length,
      systemInfo: this.systemInfo,
      options: this.$options,
    };
  }

  /**
   * 清空所有缓存和队列数据
   */
  clear() {
    this.reporter.clear();
    this.behavior = [];
    this.performanceData = [];
  }

  /* Rewrite super.emit, to add some custom logic */
  emit(event: string, data: any): boolean {
    const isErrorEvent = ERROR_EVENTS.includes(event);
    /* Check if error events hit random sample and match filter rule */
    if (isErrorEvent && !this.isEmitErrorEvent(data)) {
      return false;
    }

    /* TrackerEvents.events listen all emit events */
    super.emit(TrackerEvents.event, event, data);

    return super.emit(event, data);
  }

  /**
   * 更新服务器地址
   * @param newServerUrl 新的服务器地址
   */
  public updateServerUrl(newServerUrl: string): void {
    this.serverUrl = newServerUrl;
    this.reporter.updateServerUrl(newServerUrl);
  }

  /**
   * 获取当前服务器地址
   * @returns 当前服务器地址
   */
  public getServerUrl(): string {
    return this.serverUrl;
  }
}
