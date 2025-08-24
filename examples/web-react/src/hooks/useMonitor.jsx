import React, { createContext, useContext, useEffect, useState } from 'react'
import MonitorSDK from '@monitor/web-sdk'

// 创建监控上下文
const MonitorContext = createContext(null)

// 监控状态管理Hook
export function useMonitor() {
  const context = useContext(MonitorContext)
  if (!context) {
    throw new Error('useMonitor must be used within a MonitorProvider')
  }
  return context
}

// 监控Provider组件
export function MonitorProvider({ children, config }) {
  const [status, setStatus] = useState(null)
  const [logs, setLogs] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)

  // 添加日志
  const addLog = (type, message, extra = {}) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      extra
    }
    setLogs(prev => [...prev.slice(-99), logEntry]) // 保持最新100条记录
  }

  // 初始化SDK
  useEffect(() => {
    try {
      MonitorSDK.init(config)
      setIsInitialized(true)
      addLog('system', 'Monitor SDK 初始化成功', config)
      
      // 定期更新状态
      const interval = setInterval(() => {
        const sdkStatus = MonitorSDK.getStatus()
        setStatus(sdkStatus)
      }, 2000)

      return () => clearInterval(interval)
    } catch (error) {
      console.error('Monitor SDK 初始化失败:', error)
      addLog('error', 'Monitor SDK 初始化失败: ' + error.message, { error })
    }
  }, [config])

  // 捕获错误
  const captureError = (error, extra = {}) => {
    try {
      MonitorSDK.captureError(error, extra)
      addLog('error', `捕获错误: ${error.message || error}`, { error, extra })
    } catch (err) {
      console.error('捕获错误失败:', err)
      addLog('error', '捕获错误失败: ' + err.message)
    }
  }

  // 捕获HTTP错误
  const captureHttpError = (url, method, status, statusText, response) => {
    try {
      MonitorSDK.captureHttpError(url, method, status, statusText, response)
      addLog('http', `HTTP错误: ${method} ${url} - ${status} ${statusText}`, { response })
    } catch (err) {
      console.error('捕获HTTP错误失败:', err)
      addLog('error', '捕获HTTP错误失败: ' + err.message)
    }
  }

  // 追踪用户行为
  const trackBehavior = (event, data = {}) => {
    try {
      MonitorSDK.trackBehavior(event, data)
      addLog('behavior', `用户行为: ${event}`, data)
    } catch (err) {
      console.error('追踪行为失败:', err)
      addLog('error', '追踪行为失败: ' + err.message)
    }
  }

  // 追踪页面访问
  const trackPageView = (page) => {
    try {
      MonitorSDK.trackPageView(page)
      addLog('page', `页面访问: ${page?.title || document.title}`, page)
    } catch (err) {
      console.error('追踪页面访问失败:', err)
      addLog('error', '追踪页面访问失败: ' + err.message)
    }
  }

  // 设置用户信息
  const setUser = (userId, extra = {}) => {
    try {
      MonitorSDK.setUser(userId, extra)
      addLog('user', `设置用户: ${userId}`, extra)
    } catch (err) {
      console.error('设置用户信息失败:', err)
      addLog('error', '设置用户信息失败: ' + err.message)
    }
  }

  // 设置标签
  const setTags = (tags) => {
    try {
      MonitorSDK.setTags(tags)
      addLog('tags', '设置标签', tags)
    } catch (err) {
      console.error('设置标签失败:', err)
      addLog('error', '设置标签失败: ' + err.message)
    }
  }

  // 批量上报
  const flush = async () => {
    try {
      await MonitorSDK.flush()
      addLog('flush', '批量数据上报成功')
    } catch (err) {
      console.error('批量上报失败:', err)
      addLog('error', '批量上报失败: ' + err.message)
    }
  }

  // 清空日志
  const clearLogs = () => {
    setLogs([])
  }

  const value = {
    // SDK状态
    status,
    logs,
    isInitialized,
    
    // SDK方法
    captureError,
    captureHttpError,
    trackBehavior,
    trackPageView,
    setUser,
    setTags,
    flush,
    
    // 工具方法
    addLog,
    clearLogs,
    
    // 原始SDK实例
    sdk: MonitorSDK
  }

  return (
    <MonitorContext.Provider value={value}>
      {children}
    </MonitorContext.Provider>
  )
}

// 错误捕获Hook
export function useErrorCapture() {
  const { captureError } = useMonitor()

  const captureAsyncError = async (asyncFn, context = {}) => {
    try {
      return await asyncFn()
    } catch (error) {
      captureError(error, {
        ...context,
        type: 'async-operation'
      })
      throw error
    }
  }

  const capturePromiseError = (promise, context = {}) => {
    return promise.catch(error => {
      captureError(error, {
        ...context,
        type: 'promise-rejection'
      })
      throw error
    })
  }

  return {
    captureAsyncError,
    capturePromiseError,
    captureError
  }
}

// 性能监控Hook
export function usePerformanceMonitor() {
  const { trackBehavior } = useMonitor()

  const measurePerformance = (name, fn) => {
    const startTime = performance.now()
    
    const measure = (result) => {
      const duration = performance.now() - startTime
      trackBehavior('performance-measure', {
        name,
        duration,
        startTime,
        timestamp: Date.now()
      })
      return result
    }

    if (typeof fn === 'function') {
      try {
        const result = fn()
        if (result instanceof Promise) {
          return result.then(measure).catch(error => {
            measure(null)
            throw error
          })
        } else {
          return measure(result)
        }
      } catch (error) {
        measure(null)
        throw error
      }
    } else {
      return {
        finish: measure
      }
    }
  }

  return {
    measurePerformance
  }
}