import { PropsWithChildren } from "react";
import { useLaunch, useError } from "@tarojs/taro";
import Monitor, { Env, TrackerEvents } from "@monitor/taro-wechat-mini-sdk";

import "./app.scss";

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log("App launched.");

    // 初始化监控SDK
    const monitor = Monitor.init({
      httpTimeout: 5000,
      isNetwork: true,
      isSystemInfo: true,
      error: {
        filters: [],
        random: 1,
      },
      behavior: {
        isFilterConsole: false,
        queueLimit: 20,
        methodWhiteList: [],
        methodBlackList: [],
      },
      performance: {
        watch: true,
        queueLimit: 100,
      },
      env: Env.Dev,
      projectId: "taromini",
    });

    // 更新服务器地址
    monitor.updateServerUrl("http://localhost:3001");

    // 设置全局自定义数据
    // if (monitor) {
    //   monitor.setCustomData({
    //     userId: "test-user-123",
    //     version: "1.0.0",
    //   });
    // }

    // 设置全局事件调试器
    setupGlobalEventListeners();
    console.log("Monitor SDK initialized");
  });

  // 全局事件调试器 - 监听所有监控事件
  const setupGlobalEventListeners = () => {
    const monitor = Monitor.instance;
    if (!monitor) return;

    // 监听所有事件类型用于调试
    const eventsToListen = [
      TrackerEvents.reqError,
      TrackerEvents.slowHttpRequest,
      TrackerEvents.unHandleRejection,
    ];

    eventsToListen.forEach((eventName) => {
      monitor.on(eventName, (data) => {
        console.log(`[Monitor] ${eventName} 事件触发:`, data);
      });
    });
  };

  // 使用useError Hook进行全局错误监听
  useError((error) => {
    console.log("useError Hook捕获到错误:", error);
    const monitor = Monitor.instance;
    if (monitor) {
      // 创建一个新的Error对象，并添加自定义属性
      const customError = new Error(error.message || String(error));
      if (error.stack) {
        customError.stack = error.stack;
      }
      (customError as any).type = "jsError";
      (customError as any).detail = error;
      console.log("useError Hook捕获到错误:", customError);
      monitor.handleErrorEvent(TrackerEvents.jsError, customError);
    }
  });

  // 在App级别直接使用useError Hook，无需错误边界包装
  return children;
}

export default App;
