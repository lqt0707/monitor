import { IMonitorOptions, Monitor } from "./monitor";
import { IBehaviorItemType, TrackerEvents } from "./types";
import { getActivePage } from "./util";

// 全局声明
declare const Taro: any;
declare const wx: any;
declare let Page: any;
declare const getCurrentPages: any;

// 本地类型声明
declare namespace WechatMiniprogram {
  namespace Page {
    interface Options {
      onLoad?: (query: Record<string, string>) => void;
      onShow?: () => void;
      onReady?: () => void;
      onHide?: () => void;
      onUnload?: () => void;
      onPullDownRefresh?: () => void;
      onReachBottom?: () => void;
      onShareAppMessage?: (options: any) => any;
      onPageScroll?: (options: { scrollTop: number }) => void;
      onTabItemTap?: (options: any) => void;
      onResize?: (options: any) => void;
      [key: string]: any;
    }
    
    interface Instance {
      route: string;
      data: Record<string, any>;
      setData: (data: Record<string, any>, callback?: () => void) => void;
      [key: string]: any;
    }
  }
  
  interface TouchEvent {
    type: string;
    timeStamp: number;
    target: {
      id: string;
      dataset: Record<string, any>;
      tagName?: string;
    };
    currentTarget: {
      id: string;
      dataset: Record<string, any>;
      tagName?: string;
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
  }
}

// 兼容Taro和原生小程序的环境检测
const isTaroEnv = typeof Taro !== 'undefined';

export function setElementTrackHandler(
  monitor: Monitor,
  pageOptions: WechatMiniprogram.Page.Options
) {
  const originHandler = pageOptions.onElementTrack;

  pageOptions.onElementTrack = function (e: WechatMiniprogram.TouchEvent) {
    /* Record element tap behaviors */
    monitor.pushBehaviorItem({
      belong: "page",
      method: "onElementTrack",
      activePage: monitor.activePage,
      type: IBehaviorItemType.tap,
      args: e
    });

    if (typeof originHandler === "function") {
      originHandler.call(this, e);
    }
  };
}

/**
 * Check if methodName need to record
 */
export function isTrackCustomFn(
  options: IMonitorOptions,
  methodName: string
): boolean {
  const { methodWhiteList, methodBlackList } = options.behavior;
  if (methodWhiteList.length) {
    return methodWhiteList.includes(methodName);
  }

  if (methodBlackList.length) {
    return !methodBlackList.includes(methodName);
  }

  /* Don't track onElementTrack fn because it is tracked by element tap event */
  return methodName !== "onElementTrack";
}

/**
 * 重写页面构造函数，兼容Taro和原生小程序
 * @param monitor Monitor实例
 */
export function rewritePage(monitor: Monitor): void {
  if (isTaroEnv) {
    // Taro环境下的页面监控
    rewriteTaroPage(monitor);
  } else if (typeof Page !== 'undefined') {
    // 原生小程序环境
    rewriteNativePage(monitor);
  }
}

/**
 * 重写Taro页面
 * @param monitor Monitor实例
 */
function rewriteTaroPage(monitor: Monitor): void {
  // Taro页面监控逻辑
  // 由于Taro使用React/Vue组件，需要通过不同的方式进行监控
  console.warn('[Monitor] Taro page monitoring requires component-level integration');
}

/**
 * 重写原生小程序页面
 * @param monitor Monitor实例
 */
function rewriteNativePage(monitor: Monitor): void {
  const originPage = Page;
  Page = function (pageOptions) {
    /* Add element tab handler to pageOptions */
    setElementTrackHandler(monitor, pageOptions);

    Object.keys(pageOptions).forEach((methodName) => {
      const originMethod = pageOptions[methodName];
      if (typeof originMethod !== "function") {
        return true;
      }

      (pageOptions as any)[methodName] = function (options: any) {
        if (["onLoad", "onShow"].includes(methodName)) {
          monitor.activePage = getActivePage();
        }

        /* Record page function behaviors */
        if (isTrackCustomFn(monitor.$options, methodName)) {
          monitor.pushBehaviorItem({
            belong: "page",
            method: `${methodName}`,
            activePage: monitor.activePage,
            type: IBehaviorItemType.fn,
            args: options
          });
        }

        return originMethod.call(this, options);
      };
    });

    return originPage(pageOptions);
  };
}
