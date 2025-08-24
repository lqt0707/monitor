import { Monitor } from "./monitor";
import { ActivePage } from "./types";

// 全局声明
declare const Taro: any;
declare const wx: any;
declare const getCurrentPages: () => any[];

// 本地类型声明
declare namespace WechatMiniprogram {
  interface SystemInfo {
    [key: string]: any;
  }
}

// 兼容Taro和原生小程序的API调用
const isTaroEnv = typeof Taro !== 'undefined';
const wxAPI = isTaroEnv ? Taro : (typeof wx !== 'undefined' ? wx : {});

/**
 * 获取当前页面栈，兼容Taro和原生小程序
 * @returns 当前页面栈
 */
function getPages(): any[] {
  if (isTaroEnv && Taro.getCurrentPages) {
    return Taro.getCurrentPages();
  }
  if (typeof getCurrentPages !== 'undefined') {
    return getCurrentPages();
  }
  return [];
}

export interface INetworkInfo {
  status: string;
  time: number;
}

export function isObject(input: any): boolean {
  return Object.prototype.toString.call(input) === "[object Object]";
}

/**
 * 获取当前页面URL，兼容Taro和原生小程序
 * @returns 当前页面URL
 */
export function getPageUrl(): string {
  const curPages = getPages();
  const currentPage = curPages[curPages.length - 1];
  if (!currentPage) return "";
  
  // Taro环境下可能使用route属性
  return currentPage.__route__ || currentPage.route || "";
}

/**
 * 获取网络信息，兼容Taro和原生小程序
 * @returns Promise<INetworkInfo>
 */
export function getNetworkInfo(): Promise<INetworkInfo> {
  return new Promise((resolve) => {
    const getNetworkType = wxAPI.getNetworkType;
    if (getNetworkType) {
      getNetworkType({
        success: (res: any) => {
          const networkInfo: INetworkInfo = {
            status: res.networkType,
            time: Date.now()
          };
          resolve(networkInfo);
        },
        fail: () => {
          resolve({ status: 'unknown', time: Date.now() });
        }
      });
    } else {
      resolve({ status: 'unknown', time: Date.now() });
    }
  });
}

/**
 * 获取系统信息，兼容Taro和原生小程序
 * @returns Promise<WechatMiniprogram.SystemInfo>
 */
export function getSystemInfo(): Promise<WechatMiniprogram.SystemInfo> {
  return new Promise((resolve, reject) => {
    const getSystemInfo = wxAPI.getSystemInfo;
    if (getSystemInfo) {
      getSystemInfo({
        success: (res: any) => {
          resolve(res);
        },
        fail: (error: any) => {
          reject(error);
        }
      });
    } else {
      reject(new Error('getSystemInfo API not available'));
    }
  });
}

/**
 * 监听网络状态变化，兼容Taro和原生小程序
 * @param monitor Monitor实例
 */
export function observeNetworkChange(monitor: Monitor) {
  const onNetworkStatusChange = wxAPI.onNetworkStatusChange;
  if (onNetworkStatusChange) {
    onNetworkStatusChange(function (res: any) {
      const networkInfo: INetworkInfo = {
        status: res.networkType,
        time: Date.now()
      };
      monitor.network.push(networkInfo);
    });
  }
}

/**
 * 获取当前活跃页面，兼容Taro和原生小程序
 * @returns ActivePage
 */
export function getActivePage(): ActivePage {
  const curPages = getPages();
  if (curPages.length) {
    return curPages[curPages.length - 1];
  }
  return null;
}
