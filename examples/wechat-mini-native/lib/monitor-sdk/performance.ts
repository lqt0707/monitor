import { Monitor } from "./monitor";
import { TrackerEvents } from "./types";

// 全局声明
declare const Taro: any;
declare const wx: any;

// 本地类型声明
declare namespace WechatMiniprogram {
  interface EntryList {
    getEntries(): any[];
  }
}

// 兼容Taro和原生小程序的API调用
const isTaroEnv = typeof Taro !== 'undefined';
const wxAPI = isTaroEnv ? Taro : (typeof wx !== 'undefined' ? wx : {});

export interface IPerformanceItem {
  duration: number;
  entryType: "script" | "render";
  name: "evaluateScript" | "firstRender";
  startTime: number;
  path?: string;
}

export type PerformanceData = IPerformanceItem[];

/**
 * 观察页面性能，兼容Taro和原生小程序
 * @param monitor Monitor实例
 */
export function observePagePerformance(monitor: Monitor): void {
  // 检查API可用性
  const canIUse = wxAPI.canIUse ? wxAPI.canIUse("Performance") : false;
  const getPerformance = wxAPI.getPerformance;

  if (monitor.performanceData.length) return;
  if (!canIUse || !getPerformance) {
    console.warn('[Monitor] Performance API not available');
    return;
  }

  const performance = getPerformance();

  const observer = performance.createObserver(
    (entryList: WechatMiniprogram.EntryList) => {
      const performanceData: PerformanceData = entryList.getEntries();

      const queueLimit = monitor.$options.performance.queueLimit;
      if (monitor.performanceData.length >= queueLimit) {
        monitor.performanceData.shift();
      }
      
      monitor.performanceData.push(...performanceData);
      monitor.emit(TrackerEvents.performanceInfoReady, monitor.performanceData);
    }
  );
  observer.observe({ entryTypes: ["render", "script"] });
}
