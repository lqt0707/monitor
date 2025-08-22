import { Monitor } from "./monitor";
import { IBehaviorItemType, TrackerEvents } from "./types";

// 全局声明
declare const Taro: any;
declare const wx: any;
declare let App: any;

// 本地类型声明
declare namespace WechatMiniprogram {
  namespace App {
    interface Options {
      onLaunch?: (options: LaunchOptionsApp) => void;
      onShow?: (options: LaunchOptionsApp) => void;
      onHide?: () => void;
      onError?: (error: string) => void;
      onPageNotFound?: (options: PageNotFoundOption) => void;
      onUnhandledRejection?: (options: UnhandledRejectionOption) => void;
      onThemeChange?: (options: ThemeChangeOption) => void;
      [key: string]: any;
    }
  }
  
  interface LaunchOptionsApp {
    path: string;
    query: Record<string, any>;
    scene: number;
    shareTicket?: string;
    referrerInfo?: ReferrerInfo;
  }
  
  interface ReferrerInfo {
    appId: string;
    extraData?: Record<string, any>;
  }
  
  interface PageNotFoundOption {
    path: string;
    query: Record<string, any>;
    isEntryPage: boolean;
  }
  
  interface UnhandledRejectionOption {
    reason: string;
    promise: Promise<any>;
  }
  
  interface ThemeChangeOption {
    theme: 'light' | 'dark';
  }
}

// 兼容Taro和原生小程序的环境检测
const isTaroEnv = typeof Taro !== 'undefined';

/**
 * onUnhandledRejection hook: App.hanldeOnUnhandledRejection doesn't support andriod platform by now.
 * See docs: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html
 */
export const appHooks = [
  "onLaunch",
  "onShow",
  "onHide",
  "onError",
  "onUnhandledRejection"
];

/**
 * 重写App构造函数，兼容Taro和原生小程序
 * @param monitor Monitor实例
 */
export function rewriteApp(monitor: Monitor): void {
  if (isTaroEnv) {
    // Taro环境下的应用监控
    rewriteTaroApp(monitor);
  } else if (typeof App !== 'undefined') {
    // 原生小程序环境
    rewriteNativeApp(monitor);
  }
}

/**
 * 重写Taro应用
 * @param monitor Monitor实例
 */
function rewriteTaroApp(monitor: Monitor): void {
  // Taro应用监控逻辑
  // 由于Taro使用React/Vue应用结构，需要通过不同的方式进行监控
  console.warn('[Monitor] Taro app monitoring requires application-level integration');
  
  // 监听全局错误
   if (typeof window !== 'undefined') {
     window.addEventListener('error', (event) => {
       const errorObj = monitor.processData<any>({
         behavior: monitor.behavior
       });
       errorObj.error = event.error?.message || event.message;
       errorObj.stack = event.error?.stack;
       monitor.emit(TrackerEvents.jsError, errorObj);
     });
     
     window.addEventListener('unhandledrejection', (event) => {
       const errorObj = monitor.processData<any>({
         behavior: monitor.behavior
       });
       errorObj.error = event.reason;
       monitor.emit(TrackerEvents.unHandleRejection, errorObj);
     });
   }
}

/**
 * 重写原生小程序应用
 * @param monitor Monitor实例
 */
function rewriteNativeApp(monitor: Monitor): void {
  const originApp = App;
  App = function (appOptions: WechatMiniprogram.App.Options) {
    appHooks.forEach((methodName) => {
      const originMethod = appOptions[methodName];

      (appOptions as any)[methodName] = function (param: any) {
        /* Record appHooks behaviors */
        monitor.pushBehaviorItem({
          belong: "app",
          method: `${methodName}`,
          activePage: null,
          type: IBehaviorItemType.fn,
          args: param
        });

        if (methodName === "onLaunch") {
          monitor.handleOnLaunch(param);
        }

        const error = param as Error;

        if (methodName === "onError") {
          monitor.handleErrorEvent(TrackerEvents.jsError, error);
        }

        if (methodName === "onUnhandledRejection") {
          monitor.handleErrorEvent(TrackerEvents.unHandleRejection, error);
        }

        return originMethod && originMethod.call(this, param);
      };
    });

    return originApp(appOptions);
  };
}
