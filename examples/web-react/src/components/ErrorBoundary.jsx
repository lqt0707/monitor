import React from 'react'
import { useMonitor } from '../hooks/useMonitor.jsx'

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // 上报错误到监控系统
    if (this.props.onError) {
      this.props.onError(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        timestamp: Date.now()
      })
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          onReset={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      )
    }

    return this.props.children
  }
}

// 错误回退UI组件
function ErrorFallback({ error, errorInfo, onReset }) {
  return (
    <div className="error-boundary">
      <h3>🚨 组件发生错误</h3>
      <p><strong>错误信息:</strong> {error?.message || '未知错误'}</p>
      
      {error?.stack && (
        <details style={{ marginTop: '1rem' }}>
          <summary>错误堆栈</summary>
          <pre>{error.stack}</pre>
        </details>
      )}
      
      {errorInfo?.componentStack && (
        <details style={{ marginTop: '1rem' }}>
          <summary>组件堆栈</summary>
          <pre>{errorInfo.componentStack}</pre>
        </details>
      )}
      
      <div style={{ marginTop: '1rem' }}>
        <button 
          className="btn" 
          onClick={onReset}
          style={{ marginRight: '0.5rem' }}
        >
          重试
        </button>
        <button 
          className="btn" 
          onClick={() => window.location.reload()}
        >
          刷新页面
        </button>
      </div>
    </div>
  )
}

// 使用监控Hook的错误边界包装器
function ErrorBoundary({ children, fallback }) {
  const { captureError } = useMonitor()

  const handleError = (error, extra) => {
    captureError(error, {
      ...extra,
      source: 'error-boundary',
      severity: 'high'
    })
  }

  return (
    <ErrorBoundaryClass onError={handleError} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  )
}

// 高阶组件：为任何组件添加错误边界
export function withErrorBoundary(WrappedComponent, fallbackComponent) {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallback={fallbackComponent}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook：在组件内部捕获错误
export function useErrorHandler() {
  const { captureError } = useMonitor()

  const handleError = React.useCallback((error, extra = {}) => {
    captureError(error, {
      ...extra,
      source: 'use-error-handler',
      component: extra.component || 'unknown'
    })
  }, [captureError])

  // 处理Promise错误
  const handlePromiseError = React.useCallback((promise, context = {}) => {
    return promise.catch(error => {
      handleError(error, {
        ...context,
        type: 'promise-rejection'
      })
      throw error // 重新抛出错误，保持原有的错误处理逻辑
    })
  }, [handleError])

  // 处理异步函数错误
  const handleAsyncError = React.useCallback(async (asyncFn, context = {}) => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error, {
        ...context,
        type: 'async-function'
      })
      throw error
    }
  }, [handleError])

  return {
    handleError,
    handlePromiseError,
    handleAsyncError
  }
}

export default ErrorBoundary