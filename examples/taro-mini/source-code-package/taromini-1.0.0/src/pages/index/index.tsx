import { View, Text, Button } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import Taro from "@tarojs/taro";
import Monitor, { Templates } from "@monitor/taro-sdk";
import { createErrorBoundary } from "../../utils/errorBoundary";
import { useState, useEffect } from "react";
import "./index.scss";

function Index() {
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [lastFlushTime, setLastFlushTime] = useState<string>("");

  // 更新队列状态
  const updateQueueStatus = () => {
    try {
      const sdkInstance = Monitor.getInstance?.();
      if (sdkInstance && sdkInstance.getStatus) {
        const status = sdkInstance.getStatus();
        setQueueStatus(status);
        console.log("📊 当前SDK状态:", status);
      }
    } catch (error) {
      console.error("❌ 获取SDK状态失败:", error);
    }
  };

  useLoad(() => {
    console.log("Page loaded.");

    // 检查SDK状态
    setTimeout(() => {
      try {
        const sdkInstance = Monitor.getInstance?.();
        console.log("📊 SDK实例状态:", sdkInstance);

        if (sdkInstance) {
          console.log("✅ SDK已正常初始化");
          updateQueueStatus();
        } else {
          console.log("❌ SDK未初始化或初始化失败");
        }
      } catch (error) {
        console.error("❌ 检查SDK状态失败:", error);
      }
    }, 1000);
  });

  // 定期更新队列状态
  useEffect(() => {
    const timer = setInterval(updateQueueStatus, 2000);
    return () => clearInterval(timer);
  }, []);

  // 测试JavaScript错误 - SDK会自动捕获
  const testJSError = () => {
    console.log("触发JS错误测试 - SDK将自动捕获...");

    // 检查SDK状态
    const sdkInstance = Monitor.getInstance?.();
    console.log("📊 错误测试前 SDK状态:", sdkInstance);

    if (!sdkInstance) {
      console.error("❌ SDK未初始化，无法自动捕获错误");
      Taro.showToast({
        title: "SDK未初始化",
        icon: "error",
      });
      return;
    }

    // 直接抛出错误，SDK会自动捕获，无需手动上报
    try {
      const obj: any = null;
      obj.someProperty.test = "error";
    } catch (error) {
      console.log("🚨 错误被捕获:", error);

      // 也可以手动上报错误作为备份
      try {
        Monitor.captureError(error as Error, {
          context: "manual_test_backup",
          page: "index",
          action: "testJSError",
          timestamp: Date.now(),
        });
        console.log("✅ 错误已加入队列（手动上报）");

        // 立即更新队列状态
        setTimeout(updateQueueStatus, 100);
      } catch (reportError) {
        console.error("❌ 手动上报失败:", reportError);
      }

      Taro.showToast({
        title: "错误已加入队列，等待上报",
        icon: "success",
      });
    }
  };

  // 测试网络请求 - SDK会自动监控性能
  const testNetworkRequest = () => {
    console.log("发起网络请求 - SDK将自动监控性能...");

    Taro.request({
      url: "https://jsonplaceholder.typicode.com/posts/1",
      method: "GET",
      success: (res) => {
        console.log("请求成功:", res.data);
        // SDK会自动记录成功的网络请求性能，无需手动记录

        Taro.showToast({
          title: "请求成功，SDK自动监控",
          icon: "success",
        });
      },
      fail: (err) => {
        console.error("请求失败:", err);
        // SDK会自动记录失败的网络请求，无需手动记录

        Taro.showToast({
          title: "请求失败，SDK自动监控",
          icon: "error",
        });
      },
    });
  };

  // 测试慢请求 - SDK会自动监控超时
  const testSlowRequest = () => {
    console.log("测试慢请求 - SDK将自动监控超时...");

    Taro.request({
      url: "https://httpbin.org/delay/3", // 延迟3秒响应
      method: "GET",
      timeout: 1000, // 1秒超时
      success: (res) => {
        console.log("慢请求成功:", res.data);
      },
      fail: (err) => {
        console.error("慢请求失败:", err);
        // SDK会自动捕获和记录超时错误
      },
    });
  };

  // 测试Promise错误 - SDK会自动捕获
  const testPromiseError = () => {
    console.log("正在测试Promise拒绝错误 - SDK将自动捕获...");

    // 方式1：未处理的Promise拒绝 - SDK会自动捕获
    // const asyncOperation = async () => {
    //   throw new Error("测试Promise拒绝 - async/await");
    // };

    // // 不处理Promise，让SDK自动捕获
    // asyncOperation();

    // 方式2：直接拒绝的Promise - SDK会自动捕获
    Promise.reject(new Error("测试Promise拒绝 - 直接拒绝"));

    Taro.showToast({
      title: "Promise错误已触发，SDK自动捕获",
      icon: "success",
    });
  };

  // 测试直接抛出错误 - SDK会自动捕获
  const testThrowError = () => {
    console.log("测试直接抛出错误 - SDK将自动捕获...");

    // 直接抛出错误，不用try-catch，让SDK自动捕获
    throw new Error("测试直接抛出的错误");
  };

  // 测试Console错误 - SDK会自动捕获
  const testConsoleError = () => {
    console.log("测试Console错误 - SDK将自动捕获...");

    // 直接使用console.error，SDK会自动捕获
    console.error("这是一个测试Console错误", {
      page: "index",
      action: "testConsoleError",
      timestamp: Date.now(),
    });

    Taro.showToast({
      title: "Console错误已触发，SDK自动捕获",
      icon: "success",
    });
  };

  // 新增：测试用户行为记录
  const testBehaviorTracking = () => {
    Monitor.recordBehavior("button_click", {
      buttonName: "测试行为记录",
      page: "index",
      timestamp: Date.now(),
      userAgent: "miniprogram",
    });

    setTimeout(updateQueueStatus, 100);

    Taro.showToast({
      title: "行为已加入队列",
      icon: "success",
    });
  };

  // 测试SDK过滤机制：发起monitor相关请求
  const testSDKFilter = () => {
    console.log("🧪 测试SDK过滤机制：发起monitor相关请求...");

    // 这些请求应该被SDK的过滤机制过滤掉，不会被监控和上报
    const testRequests = [
      {
        name: "Monitor报告接口",
        url: "http://127.0.0.1:3001/api/monitor/report",
      },
      {
        name: "Health检查接口",
        url: "http://127.0.0.1:3001/api/health",
      },
      {
        name: "Monitor数据接口",
        url: "http://127.0.0.1:3001/api/monitor/data",
      },
    ];

    console.log("📤 即将发起以下请求（应该被SDK过滤）:");
    testRequests.forEach((req) => {
      console.log(`  - ${req.name}: ${req.url}`);
    });

    // 发起这些请求，SDK应该会过滤掉对这些请求的性能监控
    testRequests.forEach((req, index) => {
      setTimeout(() => {
        Taro.request({
          url: req.url,
          method: "GET",
          success: (res) => {
            console.log(`✅ ${req.name} 请求成功:`, res.statusCode);
          },
          fail: (err) => {
            console.log(`❌ ${req.name} 请求失败:`, err);
          },
          complete: () => {
            if (index === testRequests.length - 1) {
              // 最后一个请求完成后，提示检查
              setTimeout(() => {
                console.log("\n🔍 过滤测试完成！请检查:");
                console.log("1. 网络面板是否有这些请求的性能监控数据上报");
                console.log(
                  "2. 如果没有相关的slowHttpRequest上报，说明过滤机制生效"
                );
                console.log("3. 队列中应该不包含这些monitor接口的性能数据");

                updateQueueStatus();

                Taro.showModal({
                  title: "SDK过滤测试完成",
                  content:
                    "请检查网络面板和控制台日志，确认SDK是否正确过滤了monitor相关接口的性能监控",
                  showCancel: false,
                });
              }, 1000);
            }
          },
        });
      }, index * 500); // 间隔500ms发起请求
    });

    Taro.showToast({
      title: "正在测试SDK过滤机制",
      icon: "loading",
      duration: 2000,
    });
  };

  // 测试普通请求（不应该被过滤）
  const testNormalRequest = () => {
    console.log("🌐 测试普通请求（不应该被过滤）...");

    Taro.request({
      url: "https://jsonplaceholder.typicode.com/posts/1",
      method: "GET",
      success: (res) => {
        console.log("✅ 普通请求成功，SDK应该监控此请求性能:", res.statusCode);

        setTimeout(() => {
          updateQueueStatus();
          console.log("🔍 检查队列中是否增加了这个请求的性能数据");
        }, 500);
      },
      fail: (err) => {
        console.log("❌ 普通请求失败:", err);
      },
    });

    Taro.showToast({
      title: "发起普通请求",
      icon: "success",
    });
  };

  // 跳转到真实应用测试页面
  const navigateToRealWorld = () => {
    Taro.navigateTo({
      url: "/pages/realworld/realworld",
    });
  };

  // 立即上报所有队列数据
  const flushAllData = async () => {
    console.log("🚀 开始立即上报队列中的所有数据...");

    try {
      const beforeStatus = Monitor.getInstance()?.getStatus();
      console.log("📊 上报前队列状态:", beforeStatus);

      // 调用flush方法立即上报
      await Monitor.flush();

      const afterStatus = Monitor.getInstance()?.getStatus();
      console.log("📊 上报后队列状态:", afterStatus);

      setLastFlushTime(new Date().toLocaleTimeString());
      updateQueueStatus();

      console.log("✅ 立即上报完成！请检查网络请求日志");

      Taro.showToast({
        title: "立即上报完成",
        icon: "success",
      });
    } catch (error) {
      console.error("❌ 立即上报失败:", error);

      Taro.showToast({
        title: "上报失败，请检查网络",
        icon: "error",
      });
    }
  };

  // 获取并显示详细状态
  const showDetailedStatus = () => {
    try {
      const status = Monitor.getInstance()?.getStatus();
      if (status) {
        console.log("📋 详细SDK状态:", JSON.stringify(status, null, 2));

        const statusText = `
队列大小: ${status.queue?.size || 0}
错误数量: ${status.queue?.errorCount || 0}
性能数据: ${status.queue?.performanceCount || 0}
行为数据: ${status.queue?.behaviorCount || 0}
最大队列: ${status.queue?.maxSize || 0}
队列已满: ${status.queue?.isFull ? "是" : "否"}
错误监控: ${status.errorMonitor ? "开启" : "关闭"}
性能监控: ${status.performanceMonitor ? "开启" : "关闭"}
行为监控: ${status.behaviorMonitor ? "开启" : "关闭"}`;

        Taro.showModal({
          title: "SDK详细状态",
          content: statusText,
          showCancel: false,
          confirmText: "确定",
        });
      } else {
        throw new Error("无法获取状态");
      }
    } catch (error) {
      console.error("❌ 获取状态失败:", error);
      Taro.showToast({
        title: "获取状态失败",
        icon: "error",
      });
    }
  };

  return (
    <View className="index">
      <Text className="title">🚀 Taro监控SDK - 自动捕获演示</Text>
      <Text className="subtitle">SDK已启用全自动错误捕获，无需手动上报</Text>

      <View className="test-section">
        <Text className="section-title">🔥 错误监控测试（自动捕获）</Text>
        <Text className="section-desc">
          以下按钮会触发各种错误，SDK会自动捕获并上报
        </Text>
        <Button className="test-btn" onClick={testJSError} type="primary">
          触发JS错误（自动捕获）
        </Button>
        <Button className="test-btn" onClick={testPromiseError} type="warn">
          触发Promise错误（自动捕获）
        </Button>
        <Button className="test-btn" onClick={testThrowError} type="warn">
          触发直接错误（自动捕获）
        </Button>
        <Button className="test-btn" onClick={testConsoleError} type="default">
          触发Console错误（自动捕获）
        </Button>
      </View>

      <View className="test-section">
        <Text className="section-title">📊 性能监控测试（自动捕获）</Text>
        <Text className="section-desc">
          网络请求会被SDK自动监控，无需手动记录
        </Text>
        <Button
          className="test-btn"
          onClick={testNetworkRequest}
          type="primary"
        >
          发起网络请求（自动监控）
        </Button>
        <Button className="test-btn" onClick={testSlowRequest} type="warn">
          测试慢请求（自动监控）
        </Button>
      </View>

      <View className="test-section">
        <Text className="section-title">👤 行为监控测试</Text>
        <Text className="section-desc">
          用户行为可以手动记录，也可以配置自动追踪
        </Text>
        <Button
          className="test-btn"
          onClick={testBehaviorTracking}
          type="primary"
        >
          记录用户行为
        </Button>
      </View>

      <View className="test-section">
        <Text className="section-title">🚫 SDK过滤机制测试</Text>
        <Text className="section-desc">
          测试SDK是否正确过滤自身相关的接口和错误
        </Text>
        <Button className="test-btn" onClick={testSDKFilter} type="warn">
          🧪 测试SDK过滤机制
        </Button>
        <Button className="test-btn" onClick={testNormalRequest} type="primary">
          🌐 测试普通请求（对比）
        </Button>
      </View>

      <View className="test-section">
        <Text className="section-title">🌍 真实应用场景测试</Text>
        <Text className="section-desc">
          模拟真实应用使用场景，测试SDK全局自动监控功能
        </Text>
        <Button
          className="test-btn"
          onClick={navigateToRealWorld}
          type="primary"
        >
          🚀 进入真实应用测试
        </Button>
      </View>

      <View className="test-section">
        <Text className="section-title">📤 数据上报控制</Text>
        <Text className="section-desc">
          控制队列数据的立即上报，查看真实的网络请求
        </Text>
        <Button
          className="test-btn flush-btn"
          onClick={flushAllData}
          type="primary"
        >
          🚀 立即上报队列数据
        </Button>
        <Button className="test-btn" onClick={updateQueueStatus} type="default">
          🔄 刷新队列状态
        </Button>
        <Button
          className="test-btn"
          onClick={showDetailedStatus}
          type="default"
        >
          📋 查看详细状态
        </Button>
      </View>

      <View className="status-section">
        <Text className="section-title">📊 队列状态监控</Text>
        {queueStatus ? (
          <View className="status-content">
            <Text className="status-item">
              📦 队列大小: {queueStatus.queue?.size || 0} /{" "}
              {queueStatus.queue?.maxSize || 0}
            </Text>
            <Text className="status-item">
              🚨 错误数据: {queueStatus.queue?.errorCount || 0}
            </Text>
            <Text className="status-item">
              📈 性能数据: {queueStatus.queue?.performanceCount || 0}
            </Text>
            <Text className="status-item">
              👆 行为数据: {queueStatus.queue?.behaviorCount || 0}
            </Text>
            <Text className="status-item">
              🔄 队列状态: {queueStatus.queue?.isFull ? "已满" : "正常"}
            </Text>
            {lastFlushTime && (
              <Text className="status-item">🕐 最后上报: {lastFlushTime}</Text>
            )}
          </View>
        ) : (
          <Text className="status-loading">加载状态中...</Text>
        )}
      </View>

      <View className="info-section">
        <Text className="info-title">💡 SDK工作原理说明</Text>
        <Text className="info-text">
          • JavaScript错误：自动捕获所有未处理的错误
        </Text>
        <Text className="info-text">
          • Promise错误：自动捕获未处理的Promise拒绝
        </Text>
        <Text className="info-text">
          • Console错误：自动捕获console.error调用
        </Text>
        <Text className="info-text">
          • 网络请求：自动监控所有Taro.request调用
        </Text>
        <Text className="info-text">
          • 数据队列：所有数据先存入队列，定时批量上报（默认10秒）
        </Text>
        <Text className="info-text">
          • 立即上报：可手动触发立即上报，查看真实网络请求
        </Text>
        <Text className="info-text">
          • 状态监控：实时查看队列状态和数据统计
        </Text>
      </View>
    </View>
  );
}

// 使用错误边界HOC包装页面
// export default createErrorBoundary(Index);
export default Index;
