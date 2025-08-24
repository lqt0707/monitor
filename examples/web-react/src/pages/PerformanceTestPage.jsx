import React, { useState } from 'react'
import { useMonitor } from '../hooks/useMonitor.jsx'
import { usePerformanceMonitor } from '../hooks/useMonitor.jsx'

function PerformanceTestPage() {
  const { trackBehavior } = useMonitor()
  const { measurePerformance } = usePerformanceMonitor()
  const [isRunning, setIsRunning] = useState(false)

  // 测试同步性能
  const testSyncPerformance = () => {
    measurePerformance('sync-operation', () => {
      const start = Date.now()
      let result = 0
      for (let i = 0; i < 1000000; i++) {
        result += Math.random()
      }
      console.log('同步操作耗时:', Date.now() - start, 'ms')
      return result
    })
  }

  // 测试异步性能
  const testAsyncPerformance = async () => {
    setIsRunning(true)
    try {
      await measurePerformance('async-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
        await fetch('https://jsonplaceholder.typicode.com/posts/1')
      })
    } finally {
      setIsRunning(false)
    }
  }

  // 测试内存使用
  const testMemoryUsage = () => {
    const memoryInfo = performance.memory
    trackBehavior('memory-usage', {
      used: memoryInfo?.usedJSHeapSize,
      total: memoryInfo?.totalJSHeapSize,
      limit: memoryInfo?.jsHeapSizeLimit,
      timestamp: Date.now()
    })
  }

  return (
    <div className="section">
      <h2>⚡ 性能监控测试</h2>
      <div className="button-grid">
        <button className="btn" onClick={testSyncPerformance}>
          🔄 同步性能测试
        </button>
        <button 
          className="btn" 
          onClick={testAsyncPerformance}
          disabled={isRunning}
        >
          {isRunning ? '⏳ 运行中...' : '🌐 异步性能测试'}
        </button>
        <button className="btn" onClick={testMemoryUsage}>
          💾 内存使用监控
        </button>
      </div>
    </div>
  )
}

export default PerformanceTestPage