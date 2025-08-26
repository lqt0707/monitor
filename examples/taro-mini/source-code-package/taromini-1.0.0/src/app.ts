import { PropsWithChildren } from "react";
import { useLaunch, useError } from "@tarojs/taro";
import { default as Monitor, Templates } from "@monitor/sdk/taro";

import "./app.scss";

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log("App launched.");

    // 使用更显式的初始化方式来确保SDK正确启动
    try {
      // 在小程序环境中，需要使用具体的IP地址而不是localhost
      // 在小程序环境中，需要使用具体的IP地址而不是localhost
      const serverUrl = "http://localhost:3001"; // 统一使用localhost:3001

      console.log("🚀 初始化Monitor SDK，服务器地址:", serverUrl);

      // 方式1: 使用显式配置初始化（推荐，确保环境配置正确）
      const config = {
        projectId: "taromini",
        projectVersion: "1.0.0", // 添加项目版本信息，与上传的源代码版本保持一致
        serverUrl,
        enableInDev: true, // 开发环境启用
        debug: true, // 启用调试信息

        // 错误监控配置 - 全局自动捕获
        error: {
          enabled: true,
          captureConsole: true, // 自动捕获console.error
          maxErrors: 50,
          sampleRate: 1, // 100%采样率
        },

        // 性能监控配置 - 全局自动监控
        performance: {
          enabled: true,
          capturePageLoad: true, // 自动捕获页面加载性能
          captureNetworkTiming: true, // 自动捕获网络请求性能
          maxPerformance: 100,
        },

        // 行为监控配置 - 全局自动追踪
        behavior: {
          enabled: true,
          capturePageViews: true, // 自动追踪页面访问
          captureTaps: true, // 自动追踪点击事件
          captureRouteChange: true, // 自动追踪路由变化
          maxBehaviors: 200,
        },

        // 数据上报配置
        report: {
          interval: 15000, // 15秒上报间隔（适合测试观察）
          batchSize: 10,
          maxRetries: 2,
        },
      };

      // 直接使用init方法
      const sdkInstance = Monitor.init(config);
      console.log("✅ Monitor SDK 初始化成功，实例:", sdkInstance);

      // 测试SDK状态
      setTimeout(() => {
        const sdkStatus = Monitor.getStatus?.();
        console.log("📊 SDK初始化后状态:", sdkStatus);

        if (!sdkStatus?.initialized) {
          console.error("❌ SDK初始化失败，可能的原因:");
          console.error("1. 配置参数不正确");
          console.error("2. 网络连接问题");
          console.error("3. Taro环境问题");
        } else {
          console.log("✅ SDK完全初始化成功!");
        }
      }, 1000);
    } catch (error) {
      console.error("❌ Monitor SDK 初始化失败:", error);
      console.error("错误详情:", error.message);
      console.error("错误堆栈:", error.stack);
    }

    console.log("Monitor SDK initialized with new version");
  });

  // 使用useError Hook进行全局错误监听
  useError((error) => {
    console.log("useError Hook捕获到错误:", error);

    // 新SDK会自动捕获错误，这里只需要记录日志
    // 手动上报可以使用：
    // Monitor.captureError(error, { context: 'useError_hook' });
  });

  // 在App级别直接使用useError Hook，无需错误边界包装
  return children;
}

export default App;
