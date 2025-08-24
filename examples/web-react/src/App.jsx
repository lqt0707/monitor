import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import ErrorTestPage from './pages/ErrorTestPage.jsx'
import PerformanceTestPage from './pages/PerformanceTestPage.jsx'
import BehaviorTestPage from './pages/BehaviorTestPage.jsx'
import StatusDashboard from './components/StatusDashboard.jsx'
import { useMonitor } from './hooks/useMonitor.jsx'

function App() {
  const location = useLocation()
  const { trackPageView } = useMonitor()

  // 页面访问追踪
  React.useEffect(() => {
    trackPageView({
      title: document.title,
      url: window.location.href,
      path: location.pathname
    })
  }, [location.pathname, trackPageView])

  return (
    <div className="container">
      {/* 头部 */}
      <header className="header">
        <h1>🚀 Monitor SDK React 测试</h1>
        <p>专业的React错误监控与性能追踪测试平台</p>
      </header>

      {/* 导航 */}
      <nav className="navigation">
        <ul className="nav-links">
          <li>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
            >
              错误测试
            </Link>
          </li>
          <li>
            <Link 
              to="/performance" 
              className={location.pathname === '/performance' ? 'active' : ''}
            >
              性能测试
            </Link>
          </li>
          <li>
            <Link 
              to="/behavior" 
              className={location.pathname === '/behavior' ? 'active' : ''}
            >
              行为测试
            </Link>
          </li>
        </ul>
      </nav>

      {/* 路由内容 */}
      <main>
        <Routes>
          <Route path="/" element={<ErrorTestPage />} />
          <Route path="/performance" element={<PerformanceTestPage />} />
          <Route path="/behavior" element={<BehaviorTestPage />} />
        </Routes>
      </main>

      {/* 状态面板 */}
      <StatusDashboard />
    </div>
  )
}

export default App