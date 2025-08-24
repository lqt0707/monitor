import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { MonitorProvider } from './hooks/useMonitor.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// 监控SDK配置
const monitorConfig = {
  projectId: 'react-error-test',
  serverUrl: 'http://localhost:3001/api/monitor',
  enableErrorMonitor: true,
  enablePerformanceMonitor: true,
  enableBehaviorMonitor: true,
  sampleRate: 1,
  maxErrors: 100,
  reportInterval: 5000,
  enableInDev: true,
  userId: 'react-test-user',
  tags: {
    version: '1.0.0',
    environment: 'development',
    framework: 'react',
    project: 'react-error-test'
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MonitorProvider config={monitorConfig}>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </MonitorProvider>
  </React.StrictMode>,
)