import { CustomData, Env } from "../monitor";
import { PerformanceData } from "../performance";
import { INetworkInfo } from "../util";

// 微信小程序类型声明
declare namespace WechatMiniprogram {
  namespace Page {
    interface Instance<TData extends Record<string, any>, TCustom extends Record<string, any>> {
      route?: string;
      __route__?: string;
      options?: Record<string, any>;
      data?: TData;
      setData?: (data: Partial<TData>, callback?: () => void) => void;
    }
    
    interface Options<TData extends Record<string, any>, TCustom extends Record<string, any>> {
      data?: TData;
      onLoad?: (options: Record<string, any>) => void;
      onShow?: () => void;
      onHide?: () => void;
      onUnload?: () => void;
      onElementTrack?: (event: TouchEvent) => void;
      [key: string]: any;
    }
    
    interface DataOption {
      [key: string]: any;
    }
    
    interface CustomOption {
      [key: string]: any;
    }
  }
  
  interface SystemInfo {
    brand: string;
    model: string;
    pixelRatio: number;
    screenWidth: number;
    screenHeight: number;
    windowWidth: number;
    windowHeight: number;
    statusBarHeight: number;
    language: string;
    version: string;
    system: string;
    platform: string;
    fontSizeSetting: number;
    SDKVersion: string;
    benchmarkLevel: number;
    albumAuthorized: boolean;
    cameraAuthorized: boolean;
    locationAuthorized: boolean;
    microphoneAuthorized: boolean;
    notificationAuthorized: boolean;
    bluetoothEnabled: boolean;
    locationEnabled: boolean;
    wifiEnabled: boolean;
    safeArea: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      width: number;
      height: number;
    };
  }
  
  interface RequestOption {
    url: string;
    data?: any;
    header?: Record<string, string>;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT';
    dataType?: string;
    responseType?: string;
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
  
  interface TouchEvent {
    type: string;
    timeStamp: number;
    target: {
      id: string;
      dataset: Record<string, any>;
    };
    currentTarget: {
      id: string;
      dataset: Record<string, any>;
    };
    detail: {
      x: number;
      y: number;
    };
    touches: Array<{
      identifier: number;
      pageX: number;
      pageY: number;
      clientX: number;
      clientY: number;
    }>;
    changedTouches: Array<{
      identifier: number;
      pageX: number;
      pageY: number;
      clientX: number;
      clientY: number;
    }>;
  }
  
  interface EntryList {
    getEntries(): any[];
  }
}

// Taro相关类型导入
declare const Taro: any;
declare const getCurrentPages: () => any[];
declare const getApp: () => any;

// 兼容Taro和原生小程序的页面实例类型
export interface TaroPageInstance {
  route?: string;
  __route__?: string;
  options?: Record<string, any>;
  data?: Record<string, any>;
  setData?: (data: Record<string, any>, callback?: () => void) => void;
  [key: string]: any;
}

/**
 * TrackerEvents.event will emit all events
 */
export enum TrackerEvents {
  event = "event",
  jsError = "jsError",
  reqError = "reqError",
  unHandleRejection = "unHandleRejection",
  performanceInfoReady = "performanceInfoReady",
  slowHttpRequest = "slowHttpRequest"
}

export enum IBehaviorItemType {
  fn = "function",
  console = "console",
  http = "http",
  custom = "custom",
  tap = "tap"
}

export interface IReq {
  url: string;
  header?: any;
  dataType?: string;
}

export interface IRes {
  data?: any;
  header?: any;
  statusCode?: number;
  cookies?: string[];
  errMsg: string;
}

export interface IHttpInfo {
  req: IReq;
  res: IRes;
}

// 兼容Taro和原生小程序的页面类型
export type ActivePage = 
  | WechatMiniprogram.Page.Instance<Record<string, any>, Record<string, any>>
  | TaroPageInstance
  | null;

export interface IBehaviorItem extends Partial<IHttpInfo> {
  time?: number;
  type?: IBehaviorItemType;
  message?: string;
  method?: string;
  activePage?: ActivePage;
  belong?: string;
  args?: any;
  timeConsume?: number;
}

export interface IDecorateData {
  env?: Env;
  scene?: number;
  time?: number;
  systemInfo?: WechatMiniprogram.SystemInfo | null;
  network?: INetworkInfo[];
  performanceData?: PerformanceData;
  customData?: CustomData;
  globalData?: any;
}

export interface IBaseError extends IDecorateData {
  behavior: IBehaviorItem[];
  error: string;
}

export interface IReqError extends IBaseError, IHttpInfo {
  timeConsume?: number
}
