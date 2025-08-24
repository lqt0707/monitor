import React, { useState } from 'react'
import { useMonitor } from '../hooks/useMonitor.jsx'

function StatusDashboard() {
  const { status, logs, clearLogs, flush } = useMonitor()
  const [activeTab, setActiveTab] = useState('status')

  const handleFlush = async () => {
    try {
      await flush()
    } catch (error) {
      console.error('批量上报失败:', error)
    }
  }

  return (
    <div className="section">
      <h2>📊 监控仪表板</h2>
      
      {/* 标签页 */}
      <div className="tab-buttons">
        <button 
          className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          SDK状态
        </button>
        <button 
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          实时日志 ({logs.length})
        </button>
      </div>

      {/* SDK状态面板 */}
      {activeTab === 'status' && (
        <div>
          <div className="info-box">
            <h4>📈 实时状态</h4>
            {status ? (
              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                <p><strong>初始化状态:</strong> {status.isInitialized ? '✅ 已初始化' : '❌ 未初始化'}</p>
                <p><strong>会话ID:</strong> {status.sessionId}</p>
                <p><strong>运行时间:</strong> {Math.floor((Date.now() - status.startTime) / 1000)}秒</p>
                <p><strong>错误数量:</strong> {status.errorCount}</p>
                <p><strong>性能数据:</strong> {status.performanceCount}</p>
                <p><strong>行为数据:</strong> {status.behaviorCount}</p>
                <p><strong>队列状态:</strong> {status.reporterStatus ? JSON.stringify(status.reporterStatus) : '无数据'}</p>
              </div>
            ) : (
              <p>正在加载状态信息...</p>
            )}
          </div>

          <div className="button-grid">
            <button className="btn success" onClick={handleFlush}>
              📤 批量上报数据
            </button>
            <button className="btn" onClick={clearLogs}>
              🗑️ 清空日志
            </button>
          </div>
        </div>
      )}

      {/* 日志面板 */}
      {activeTab === 'logs' && (
        <div>
          <div className="status-panel">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="status-item">
                  <span className="timestamp">[{log.timestamp}]</span>
                  <span className="log-type">{log.type.toUpperCase()}:</span>
                  <span className="log-message">{log.message}</span>
                  {log.extra && Object.keys(log.extra).length > 0 && (
                    <details style={{ marginTop: '0.25rem' }}>
                      <summary style={{ cursor: 'pointer', color: '#9ca3af' }}>详细信息</summary>
                      <pre style={{ 
                        fontSize: '0.8rem', 
                        color: '#9ca3af', 
                        marginTop: '0.25rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {JSON.stringify(log.extra, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            ) : (
              <div className="status-item">
                <span className="log-message">暂无日志记录</span>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <button className="btn" onClick={clearLogs}>
              🗑️ 清空所有日志
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusDashboard