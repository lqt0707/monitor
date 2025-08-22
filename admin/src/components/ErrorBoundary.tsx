import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Result, Button, Typography, Space, Card, Collapse } from "antd";
import {
  BugOutlined,
  ReloadOutlined,
  HomeOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  showReload?: boolean;
  showHome?: boolean;
  title?: string;
  subtitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * 错误边界组件
 * 捕获并处理React组件树中的JavaScript错误
 * 提供友好的错误展示和恢复选项
 */
class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  /**
   * 捕获错误并更新状态
   * @param error - 捕获的错误
   * @param errorInfo - 错误信息
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * 组件捕获错误后调用
   * @param error - 捕获的错误
   * @param errorInfo - 错误信息
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 记录错误到控制台
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // 可以在这里添加错误上报逻辑
    this.reportError(error, errorInfo);
  }

  /**
   * 上报错误到监控系统
   * @param error - 错误对象
   * @param errorInfo - 错误信息
   */
  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // 记录错误信息到控制台
      console.error("ErrorBoundary caught an error:", {
        error,
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        retryCount: this.retryCount,
        errorBoundary: true,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });

      // 开发环境下也打印到控制台
      if (process.env.NODE_ENV === "development") {
        console.log("Error Report:", {
          id: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          retryCount: this.retryCount,
        });
      }
    } catch (reportError) {
      console.error("Failed to report error:", reportError);
    }
  };

  /**
   * 重试加载组件
   */
  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: "",
      });
    } else {
      // 达到最大重试次数，刷新页面
      window.location.reload();
    }
  };

  /**
   * 返回首页
   */
  private handleGoHome = () => {
    window.location.href = "/";
  };

  /**
   * 刷新页面
   */
  private handleReload = () => {
    window.location.reload();
  };

  /**
   * 获取错误详情
   */
  private getErrorDetails = () => {
    const { error, errorInfo } = this.state;
    if (!error || !errorInfo) return null;

    return {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      name: error.name,
      fileName: (error as any).fileName,
      lineNumber: (error as any).lineNumber,
      columnNumber: (error as any).columnNumber,
    };
  };

  /**
   * 渲染错误详情面板
   */
  private renderErrorDetails = () => {
    const errorDetails = this.getErrorDetails();
    if (!errorDetails || !this.props.showDetails) return null;

    return (
      <Card
        size="small"
        style={{
          marginTop: "24px",
          maxWidth: "800px",
          margin: "24px auto 0",
        }}
      >
        <Collapse ghost>
          <Panel
            header={
              <Space>
                <BugOutlined style={{ color: "#ff4d4f" }} />
                <Text strong>错误详情</Text>
                <Text type="secondary">({this.state.errorId})</Text>
              </Space>
            }
            key="error-details"
          >
            <div style={{ fontSize: "12px", fontFamily: "monospace" }}>
              <div style={{ marginBottom: "12px" }}>
                <Text strong>错误消息:</Text>
                <Paragraph
                  copyable
                  style={{
                    backgroundColor: "#fff2f0",
                    padding: "8px",
                    borderRadius: "4px",
                    marginTop: "4px",
                  }}
                >
                  {errorDetails.message}
                </Paragraph>
              </div>

              {errorDetails.stack && (
                <div style={{ marginBottom: "12px" }}>
                  <Text strong>错误堆栈:</Text>
                  <Paragraph
                    copyable
                    style={{
                      backgroundColor: "#f6f6f6",
                      padding: "8px",
                      borderRadius: "4px",
                      marginTop: "4px",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {errorDetails.stack}
                    </pre>
                  </Paragraph>
                </div>
              )}

              {errorDetails.componentStack && (
                <div>
                  <Text strong>组件堆栈:</Text>
                  <Paragraph
                    copyable
                    style={{
                      backgroundColor: "#f0f9ff",
                      padding: "8px",
                      borderRadius: "4px",
                      marginTop: "4px",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {errorDetails.componentStack}
                    </pre>
                  </Paragraph>
                </div>
              )}
            </div>
          </Panel>
        </Collapse>
      </Card>
    );
  };

  /**
   * 渲染操作按钮
   */
  private renderActions = () => {
    const { showReload = true, showHome = true } = this.props;
    const actions = [];

    // 重试按钮
    if (this.retryCount < this.maxRetries) {
      actions.push(
        <Button
          key="retry"
          type="primary"
          icon={<ReloadOutlined />}
          onClick={this.handleRetry}
        >
          重试 ({this.maxRetries - this.retryCount} 次机会)
        </Button>
      );
    }

    // 刷新页面按钮
    if (showReload) {
      actions.push(
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          onClick={this.handleReload}
        >
          刷新页面
        </Button>
      );
    }

    // 返回首页按钮
    if (showHome) {
      actions.push(
        <Button key="home" icon={<HomeOutlined />} onClick={this.handleGoHome}>
          返回首页
        </Button>
      );
    }

    return actions;
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const {
        title = "页面出现错误",
        subtitle = "抱歉，页面遇到了一些问题。请尝试刷新页面或联系技术支持。",
      } = this.props;

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div style={{ maxWidth: "600px", width: "100%" }}>
            <Result
              status="error"
              icon={<ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />}
              title={title}
              subTitle={subtitle}
              extra={
                <Space
                  direction={
                    window.innerWidth <= 768 ? "vertical" : "horizontal"
                  }
                  size="middle"
                >
                  {this.renderActions()}
                </Space>
              }
            />

            {this.renderErrorDetails()}

            {/* 额外信息 */}
            <div
              style={{
                textAlign: "center",
                marginTop: "24px",
                color: "#8c8c8c",
                fontSize: "12px",
              }}
            >
              <Text type="secondary">
                错误ID: {this.state.errorId} | 时间:{" "}
                {new Date().toLocaleString()}
              </Text>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 高阶组件：为组件添加错误边界
 * @param WrappedComponent - 要包装的组件
 * @param errorBoundaryProps - 错误边界属性
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithErrorBoundaryComponent;
};

/**
 * Hook：在函数组件中使用错误边界
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;
