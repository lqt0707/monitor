import { Component } from "react";
import { View, Text } from "@tarojs/components";
import Monitor from "@monitor/taro-sdk";

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

      // 使用新SDK的手动上报功能
      try {
        Monitor.captureError(error, {
          context: "error_boundary",
          componentStack: errorInfo.componentStack,
          type: "react_error_boundary",
          timestamp: Date.now(),
        });
        console.log("✅ 错误已通过新SDK上报");
      } catch (reportError) {
        console.error("❌ 错误上报失败:", reportError);
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
