import { Component } from "react";
import { View, Text } from "@tarojs/components";
import Monitor, { TrackerEvents } from "@monitor/taro-wechat-mini-sdk";

/**
 * 创建错误边界高阶组件
 * @param Page 需要包装的页面组件
 * @returns 包装后的页面组件
 */
export function createErrorBoundary(Page: any) {
  return class ErrorBoundary extends Component {
    state = {
      hasError: false,
      error: null as Error | null,
    };

    static getDerivedStateFromError(error: Error) {
      return {
        hasError: true,
        error,
      };
    }

    componentDidCatch(error: Error, errorInfo: any) {
      console.log("错误边界捕获到错误:", error, errorInfo);

      // 将错误传递给监控SDK
      const monitor = Monitor.instance;
      if (monitor) {
        // 创建一个新的Error对象，并添加自定义属性
        const customError = new Error(error.message);
        customError.stack = error.stack;
        (customError as any).componentStack = errorInfo.componentStack;
        (customError as any).type = "Page ErrorBoundary";
        
        monitor.handleErrorEvent(TrackerEvents.jsError, customError);
      }
    }

    render() {
      if (this.state.hasError) {
        // 简单的错误提示UI
        return (
          <View style={{ padding: "20px", textAlign: "center" }}>
            <Text style={{ color: "#ff4d4f", fontSize: "16px" }}>
              页面加载出错，请重试
            </Text>
          </View>
        );
      }

      return <Page {...this.props} />;
    }
  };
}
