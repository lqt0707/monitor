import { Monitor } from "./monitor";
import { IDecorateData } from "./types";

// 声明全局函数
declare function getApp(): any;

export interface IProcessDataHandler {
  <T extends IDecorateData>(data: T): T;
}

export type IInitialEmitData = {
  [k: string]: any;
};

export function processDataFactory(monitor: Monitor): IProcessDataHandler {
  return function <T extends IDecorateData>(data: T): T {
    const { isNetwork, isSystemInfo, performance } = monitor.$options;
    const resData = Object.assign({}, data);

    resData.env = monitor.$options.env;
    resData.scene = monitor.scene;
    resData.customData = monitor.customData;
    resData.time = Date.now();
    // 安全获取全局数据
    try {
      resData.globalData = typeof getApp === 'function' ? getApp().globalData : {};
    } catch (e) {
      resData.globalData = {};
    }

    if (isNetwork) {
      resData.network = monitor.network;
    }

    if (isSystemInfo) {
      resData.systemInfo = monitor.systemInfo;
    }

    if (performance.watch) {
      resData.performanceData = monitor.performanceData;
    }

    return resData;
  };
}
