import { Monitor } from "./monitor";
import {
  IBehaviorItemType,
  IHttpInfo,
  IReqError,
  TrackerEvents
} from "./types";

// 全局声明
declare const Taro: any;
declare const wx: any;

// 本地类型声明
declare namespace WechatMiniprogram {
  interface RequestOption {
    url: string;
    data?: any;
    header?: Record<string, string>;
    method?: string;
    dataType?: string;
    success?: (result: RequestSuccessCallbackResult) => void;
    fail?: (result: GeneralCallbackResult) => void;
    complete?: (result: GeneralCallbackResult) => void;
  }
  
  interface RequestSuccessCallbackResult {
    data: any;
    statusCode: number;
    header: Record<string, string>;
    cookies?: string[];
    errMsg: string;
  }
  
  interface GeneralCallbackResult {
    errMsg: string;
  }
}

// 兼容Taro和原生小程序的API调用
const isTaroEnv = typeof Taro !== 'undefined';

/**
 * 拦截网络请求，兼容Taro和原生小程序
 * @param monitor Monitor实例
 */
export function interceptRequest(monitor: Monitor) {
  // 根据环境选择合适的API
  if (isTaroEnv && Taro.request) {
    // Taro环境
    const originRequest = Taro.request;
    Taro.request = function (options: WechatMiniprogram.RequestOption) {
      return interceptRequestCore(monitor, originRequest, options);
    };
  } else if (typeof wx !== 'undefined' && wx.request) {
    // 原生小程序环境
    const originRequest = wx.request;
    Object.defineProperty(wx, "request", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: function (options: WechatMiniprogram.RequestOption) {
        return interceptRequestCore(monitor, originRequest, options);
      }
    });
  }
}

/**
 * 请求拦截核心逻辑
 * @param monitor Monitor实例
 * @param originRequest 原始请求函数
 * @param options 请求选项
 */
function interceptRequestCore(
  monitor: Monitor,
  originRequest: Function,
  options: WechatMiniprogram.RequestOption
) {
  const reqStartTime = Date.now();
  const originSuccess = options.success;
  const originFail = options.fail;

  options.success = function (...args) {
    const timeConsume = Date.now() - reqStartTime;

    typeof originSuccess === "function" &&
      originSuccess.call(this, ...args);

    const res = args[0];
    handleSuccessCallback(monitor, options, res, timeConsume);
    handleSlowHttpRequest(monitor, options, res, timeConsume);
  };

  options.fail = function (...args) {
    typeof originFail === "function" && originFail.call(this, ...args);

    const res = args[0];
    handleFailCallback(monitor, options, res);
  };

  return originRequest.call(this, options);
}

export function handleSlowHttpRequest(
  monitor: Monitor,
  options: WechatMiniprogram.RequestOption,
  res: WechatMiniprogram.RequestSuccessCallbackResult,
  timeConsume: number
) {
  const httpTimeout = monitor.$options.httpTimeout;
  if (httpTimeout <= 0) return;

  if (timeConsume > monitor.$options.httpTimeout) {
    const httpInfo: IHttpInfo = getSuccessHttpInfo(options, res);

    monitor.emit(TrackerEvents.slowHttpRequest, { ...httpInfo, timeConsume });
  }
}

export function handleSuccessCallback(
  monitor: Monitor,
  options: WechatMiniprogram.RequestOption,
  res: WechatMiniprogram.RequestSuccessCallbackResult,
  timeConsume: number
): void {
  const httpInfo: IHttpInfo = getSuccessHttpInfo(options, res);

  monitor.pushBehaviorItem({
    ...httpInfo,
    timeConsume,
    type: IBehaviorItemType.http
  });

  if (res.statusCode < 200 || res.statusCode > 400) {
    const errorObj = monitor.processData<IReqError>({
      ...httpInfo,
      timeConsume,
      error: res.errMsg,
      behavior: monitor.behavior
    });
    monitor.emit(TrackerEvents.reqError, errorObj);
  }
}

export function handleFailCallback(
  monitor: Monitor,
  options: WechatMiniprogram.RequestOption,
  res: WechatMiniprogram.GeneralCallbackResult
): void {
  const reqInfo = getReqInfo(options);
  const resInfo = getFailResInfo(res);
  const httpInfo: IHttpInfo = {
    req: reqInfo,
    res: resInfo
  };

  const errorObj = monitor.processData<IReqError>({
    ...httpInfo,
    error: res.errMsg,
    behavior: monitor.behavior
  });

  monitor.pushBehaviorItem({
    ...httpInfo,
    type: IBehaviorItemType.http
  });
  monitor.emit(TrackerEvents.reqError, errorObj);
}

export function getReqInfo(options: WechatMiniprogram.RequestOption) {
  const header = options
    ? options.header
    : {
        "content-type": "application/json"
      };

  return {
    header,
    url: options.url,
    data: options.data,
    dataType: options.dataType
  };
}

export function getSuccessResInfo(
  res: WechatMiniprogram.RequestSuccessCallbackResult
) {
  return {
    data: res.data,
    header: res.header,
    statusCode: res.statusCode,
    cookies: res.cookies,
    errMsg: res.errMsg
  };
}

export function getFailResInfo(res: WechatMiniprogram.GeneralCallbackResult) {
  return {
    errMsg: res.errMsg
  };
}

export function getSuccessHttpInfo(
  options: WechatMiniprogram.RequestOption,
  res: WechatMiniprogram.RequestSuccessCallbackResult
) {
  const reqInfo = getReqInfo(options);
  const resInfo = getSuccessResInfo(res);
  const httpInfo: IHttpInfo = {
    req: reqInfo,
    res: resInfo
  };

  return httpInfo;
}
