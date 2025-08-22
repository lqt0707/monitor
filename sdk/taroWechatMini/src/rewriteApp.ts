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
    theme: "light" | "dark";
  }
}

// 兼容Taro和原生小程序的环境检测
const isTaroEnv = typeof Taro !== "undefined";

/**
 * onUnhandledRejection hook: App.hanldeOnUnhandledRejection doesn't support andriod platform by now.
 * See docs: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html
 */
export const appHooks = [
  "onLaunch",
  "onShow",
  "onHide",
  "onError",
  "onUnhandledRejection",
];

/**
 * 重写App构造函数，兼容Taro和原生小程序
 * @param monitor Monitor实例
 */
export function rewriteApp(monitor: Monitor): void {
  if (isTaroEnv) {
    // Taro环境下的应用监控
    rewriteTaroApp(monitor);
  } else if (typeof App !== "undefined") {
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
  console.log("[Monitor] Initializing Taro app monitoring");

  // 1. 监听全局错误（H5环境）
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      monitor.handleErrorEvent(TrackerEvents.jsError, error);
    });

    window.addEventListener(
      "unhandledrejection",
      (event: PromiseRejectionEvent) => {
        const error = new Error(String(event.reason));
        monitor.handleErrorEvent(TrackerEvents.unHandleRejection, error);
      }
    );
  }

  // 2. 监听Taro全局错误
  if (typeof Taro !== "undefined") {
    // Taro 3.x 全局错误监听
    if (Taro.onError) {
      Taro.onError((error: string) => {
        const errorObj = new Error(error);
        monitor.handleErrorEvent(TrackerEvents.jsError, errorObj);
      });
    }

    // Taro 3.x 未处理的Promise拒绝
    if (Taro.onUnhandledRejection) {
      Taro.onUnhandledRejection((res: { reason: string }) => {
        const errorObj = new Error(String(res.reason));
        monitor.handleErrorEvent(TrackerEvents.unHandleRejection, errorObj);
      });
    }

    // Taro 3.x 页面错误监听
    if (Taro.onPageNotFound) {
      Taro.onPageNotFound((res: any) => {
        const error = new Error(`Page not found: ${res.path}`);
        monitor.handleErrorEvent(TrackerEvents.jsError, error);
      });
    }
  }

  // 3. 微信小程序原生全局错误监听
  if (typeof wx !== "undefined") {
    // 微信小程序全局错误
    if (wx.onError) {
      wx.onError((error: string) => {
        const errorObj = new Error(error);
        monitor.handleErrorEvent(TrackerEvents.jsError, errorObj);
      });
    }

    // 微信小程序未处理的Promise拒绝
    if (wx.onUnhandledRejection) {
      wx.onUnhandledRejection((res: { reason: string }) => {
        const errorObj = new Error(String(res.reason));
        monitor.handleErrorEvent(TrackerEvents.unHandleRejection, errorObj);
      });
    }

    // 微信小程序页面未找到
    if (wx.onPageNotFound) {
      wx.onPageNotFound((res: { path: string }) => {
        const error = new Error(`Page not found: ${res.path}`);
        monitor.handleErrorEvent(TrackerEvents.jsError, error);
      });
    }
  }

  // 4. 设置全局错误处理器（简化版本，主要依赖useError Hook）
  try {
    if (
      typeof Taro !== "undefined" &&
      Taro.getEnv &&
      Taro.getEnv() === Taro.ENV_TYPE.WEAPP
    ) {
      // 微信小程序环境 - 保持简单，主要依赖useError Hook
      const originalApp = App;
      App = function (this: any, options: any) {
        // 基础错误处理
        if (!options.onError) {
          options.onError = function (error: string) {
            monitor.handleErrorEvent(TrackerEvents.jsError, new Error(error));
          };
        }

        if (!options.onUnhandledRejection) {
          options.onUnhandledRejection = function (res: any) {
            monitor.handleErrorEvent(
              TrackerEvents.unHandleRejection,
              new Error(String(res.reason))
            );
          };
        }

        return originalApp.call(this, options);
      };
    }
  } catch (e) {
    console.warn("[Monitor] Failed to set up global error handlers:", e);
  }

  // 5. 移除复杂的React错误捕获，主要依赖useError Hook和页面级错误边界

  // 6. 添加Taro 3.6+ useError Hook支持
  try {
    if (typeof Taro !== "undefined" && Taro.useError) {
      console.log("[Monitor] Setting up useError Hook support");

      // 提供useError Hook的包装函数，供用户直接使用
      (window as any).__MONITOR_USE_ERROR__ = function (error: any) {
        monitor.handleErrorEvent(TrackerEvents.jsError, {
          message: error.message || String(error),
          stack: error.stack,
          type: "jsError",
          detail: error,
        });
      };
    }
  } catch (e) {
    console.warn("[Monitor] Failed to set up useError Hook support:", e);
  }

  // 7. 增强Promise错误捕获（兼容所有环境）
  try {
    // 全局Promise错误捕获增强
    if (typeof Promise !== "undefined") {
      const originalThen = Promise.prototype.then;
      Promise.prototype.then = function(onResolve, onReject) {
        return originalThen.call(this, onResolve, function(error) {
          // 捕获未处理的Promise拒绝
          if (error && typeof error !== 'string') {
            error = new Error(String(error));
          }
          monitor.handleErrorEvent(TrackerEvents.unHandleRejection, new Error(String(error)));
          
          if (onReject && typeof onReject === 'function') {
            return onReject.call(this, error);
          }
        });
      };
    }
  } catch (e) {
    console.warn("[Monitor] Failed to enhance Promise error capture:", e);
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
          args: param,
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
