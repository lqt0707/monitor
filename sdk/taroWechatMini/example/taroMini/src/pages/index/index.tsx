import { View, Text, Button } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";
import Taro from "@tarojs/taro";
import { Monitor, TrackerEvents } from "@monitor/taro-wechat-mini-sdk";
import { createErrorBoundary } from "../../utils/errorBoundary";
import "./index.scss";

function Index() {
  useLoad(() => {
    console.log("Page loaded.");

    // 获取监控实例并设置页面级自定义数据
    // const monitor = Monitor.instance;
    // if (monitor) {
    //   // 设置页面级自定义数据（仅包含页面特定信息）
    //   monitor.setCustomData({
    //     pageId: "index",
    //   });
    // }
  });

  // 测试JavaScript错误
  const testJSError = () => {
    // 故意触发一个未捕获的错误 - 现在会自动被捕获
    console.log("触发JS错误测试...");
    const obj: any = null;
    obj.someProperty.test = "error";
  };

  // 测试网络请求
  const testNetworkRequest = () => {
    Taro.request({
      url: "https://jsonplaceholder.typicode.com/posts/1",
      method: "GET",
      success: (res) => {
        console.log("请求成功:", res.data);
        Taro.showToast({
          title: "请求成功",
          icon: "success",
        });
      },
      fail: (err) => {
        console.error("请求失败:", err);
        Taro.showToast({
          title: "请求失败",
          icon: "error",
        });
      },
    });
  };

  // 测试慢请求（设置很短的超时时间）
  const testSlowRequest = () => {
    Taro.request({
      url: "https://httpbin.org/delay/3", // 延迟3秒响应
      method: "GET",
      timeout: 1000, // 1秒超时
      success: (res) => {
        console.log("慢请求成功:", res.data);
      },
      fail: (err) => {
        console.error("慢请求失败:", err);
      },
    });
  };

  // 测试Promise错误
  const testPromiseError = () => {
    console.log("正在测试Promise拒绝错误捕获...");
    
    // 方式1：使用async/await的未处理Promise拒绝
    const asyncOperation = async () => {
      throw new Error("测试Promise拒绝 - async/await");
    };
    
    // 执行但不处理，确保触发unhandledrejection
    asyncOperation();
    
    // 方式2：使用Promise链的未处理拒绝
    Promise.reject(new Error("测试Promise拒绝 - 直接拒绝"));
    
    // 方式3：使用setTimeout确保在事件循环中触发
    setTimeout(() => {
      Promise.reject(new Error("测试Promise拒绝 - setTimeout"));
    }, 0);
    
    // 方式4：使用fetch的错误（模拟网络请求失败）
    Taro.request({
      url: "https://httpbin.org/status/500",
      method: "GET"
    }).then(response => {
      if (response.statusCode >= 400) {
        throw new Error(`HTTP错误: ${response.statusCode}`);
      }
    }).catch(err => {
      // 这里不处理错误，让它成为未处理的Promise拒绝
      console.log("网络请求失败，错误将上报:", err);
    });
  };

  // 测试直接抛出错误
  const testThrowError = () => {
    // 直接抛出错误
    throw new Error("测试直接抛出的错误");
  };

  return (
    <View className="index">
      <Text className="title">Taro监控SDK测试</Text>

      <View className="test-section">
        <Text className="section-title">错误监控测试</Text>
        <Button className="test-btn" onClick={testJSError} type="primary">
          触发JS错误
        </Button>
        <Button className="test-btn" onClick={testPromiseError} type="warn">
          触发Promise错误
        </Button>
        <Button className="test-btn" onClick={testThrowError} type="warn">
          触发直接错误
        </Button>
      </View>

      <View className="test-section">
        <Text className="section-title">网络监控测试</Text>
        <Button
          className="test-btn"
          onClick={testNetworkRequest}
          type="primary"
        >
          发起网络请求
        </Button>
        <Button className="test-btn" onClick={testSlowRequest} type="warn">
          测试慢请求
        </Button>
      </View>
    </View>
  );
}

// 使用错误边界HOC包装页面
export default createErrorBoundary(Index);
