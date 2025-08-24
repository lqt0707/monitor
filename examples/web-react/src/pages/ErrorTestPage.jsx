import React, { useState } from 'react'
import { useMonitor } from '../hooks/useMonitor.jsx'
import { useErrorHandler, withErrorBoundary } from '../components/ErrorBoundary.jsx'

// 有问题的组件，用于测试错误边界
function ProblematicComponent({ shouldThrow = false }) {
  if (shouldThrow) {
    throw new Error('这是一个React组件错误！')
  }
  return <div>✅ 组件正常工作</div>
}

const ProblematicComponentWithBoundary = withErrorBoundary(ProblematicComponent)

function ErrorTestPage() {
  const { captureError, captureHttpError, addLog } = useMonitor()
  const { handleError, handlePromiseError, handleAsyncError } = useErrorHandler()
  const [componentError, setComponentError] = useState(false)
  const [userInput, setUserInput] = useState('')

  // 测试JavaScript错误
  const testJSError = () => {
    try {
      // 故意触发错误
      const obj = null
      obj.nonExistentMethod()
    } catch (error) {
      captureError(error, {
        category: 'manual-test',
        severity: 'medium',
        context: 'js-error-test'
      })
    }
  }

  // 测试未捕获的错误
  const testUncaughtError = () => {
    // 延时触发错误，不在try-catch中
    setTimeout(() => {
      throw new Error('这是一个未捕获的错误！')
    }, 100)
  }

  // 测试Promise错误
  const testPromiseError = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Promise被拒绝了！'))
      }, 100)
    })
    
    // 故意不处理Promise错误
    promise.then(() => {
      console.log('不会执行到这里')
    })
  }

  // 测试带错误处理的Promise
  const testHandledPromiseError = async () => {
    const asyncOperation = async () => {
      throw new Error('模拟异步操作失败')
    }

    try {
      await handleAsyncError(asyncOperation, {
        component: 'ErrorTestPage',
        operation: 'async-operation'
      })
    } catch (error) {
      addLog('info', '异步错误已被捕获和上报')
    }
  }

  // 测试HTTP错误
  const testHttpError = async () => {
    try {
      const response = await fetch('https://httpstat.us/500', {
        method: 'GET',
        mode: 'cors'
      })
      
      if (!response.ok) {
        captureHttpError(
          'https://httpstat.us/500',
          'GET',
          response.status,
          response.statusText,
          { testType: 'manual-http-error' }
        )
      }
    } catch (error) {
      captureError(error, {
        category: 'network',
        context: 'http-error-test',
        url: 'https://httpstat.us/500'
      })
    }
  }

  // 测试网络错误
  const testNetworkError = async () => {
    try {
      await fetch('https://nonexistent-domain-12345.com/api/test')
    } catch (error) {
      captureError(error, {
        category: 'network',
        context: 'network-error-test',
        errorType: 'fetch-failure'
      })
    }
  }

  // 测试自定义错误
  const testCustomError = () => {
    const customError = new Error('这是一个自定义业务错误')
    customError.code = 'BUSINESS_ERROR'
    customError.details = {
      userInput,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }

    captureError(customError, {
      category: 'business',
      severity: 'high',
      context: 'user-action',
      metadata: {
        page: 'error-test',
        action: 'custom-error-test'
      }
    })
  }

  // 测试React组件错误
  const testComponentError = () => {
    setComponentError(true)
    // 重置组件错误状态
    setTimeout(() => setComponentError(false), 3000)
  }

  // 测试类型错误
  const testTypeError = () => {
    try {
      const str = 'hello'
      str.push('world') // 字符串没有push方法
    } catch (error) {
      captureError(error, {
        category: 'type-error',
        context: 'method-not-found'
      })
    }
  }

  // 测试引用错误
  const testReferenceError = () => {
    try {
      console.log(undefinedVariable) // 引用未定义的变量
    } catch (error) {
      captureError(error, {
        category: 'reference-error',
        context: 'undefined-variable'
      })
    }
  }

  return (
    <div>
      <div className="section">
        <h2>🐛 错误监控测试</h2>
        
        <div className="info-box">
          <h4>🎯 测试说明</h4>
          <p>点击下面的按钮来测试不同类型的错误捕获功能。每个测试都会触发特定类型的错误，并通过Monitor SDK进行上报。</p>
          <p>观察右侧的日志面板，查看错误是否被正确捕获和上报。</p>
        </div>

        <h3>JavaScript 错误测试</h3>
        <div className="button-grid">
          <button className="btn danger" onClick={testJSError}>
            🚨 测试捕获的JS错误
          </button>
          <button className="btn danger" onClick={testUncaughtError}>
            💥 测试未捕获错误
          </button>
          <button className="btn danger" onClick={testTypeError}>
            🔤 测试类型错误
          </button>
          <button className="btn danger" onClick={testReferenceError}>
            📝 测试引用错误
          </button>
        </div>

        <h3>Promise 和异步错误测试</h3>
        <div className="button-grid">
          <button className="btn warning" onClick={testPromiseError}>
            ⚠️ 测试Promise错误
          </button>
          <button className="btn warning" onClick={testHandledPromiseError}>
            🛡️ 测试处理的异步错误
          </button>
        </div>

        <h3>网络错误测试</h3>
        <div className="button-grid">
          <button className="btn warning" onClick={testHttpError}>
            🌐 测试HTTP错误 (500)
          </button>
          <button className="btn warning" onClick={testNetworkError}>
            📡 测试网络连接错误
          </button>
        </div>

        <h3>React组件错误测试</h3>
        <div className="button-grid">
          <button className="btn danger" onClick={testComponentError}>
            ⚛️ 触发组件错误
          </button>
        </div>
        
        <div style={{ margin: '1rem 0', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h4>组件错误边界测试：</h4>
          <ProblematicComponentWithBoundary shouldThrow={componentError} />
        </div>

        <h3>自定义错误测试</h3>
        <div>
          <div className="form-group">
            <label htmlFor="userInput">自定义错误信息：</label>
            <input
              id="userInput"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="输入自定义错误信息"
            />
          </div>
          <button className="btn" onClick={testCustomError}>
            📝 发送自定义错误
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorTestPage