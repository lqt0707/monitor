/**
 * Web SDK 基础集成示例
 * 展示如何在现代Web应用中集成Monitor SDK
 */

import MonitorSDK from '@monitor/web-sdk';

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  initializeMonitor();
  setupTestButtons();
  setupErrorBoundaries();
});

/**
 * 初始化监控SDK
 */
function initializeMonitor() {
  try {
    // SDK配置
    const config = {
      projectId: 'web-basic-example',
      serverUrl: 'http://localhost:3001/api/monitor',
      enableErrorMonitor: true,
      enablePerformanceMonitor: true,
      enableBehaviorMonitor: true,
      sampleRate: 1,
      maxErrors: 100,
      reportInterval: 5000,
      enableInDev: true,
      userId: 'test-user-123',
      tags: {
        version: '1.0.0',
        environment: 'development',
        project: 'web-basic-example'
      }
    };

    // 初始化SDK
    MonitorSDK.init(config);
    console.log('Monitor SDK 初始化成功');

    // 显示SDK状态
    updateSDKStatus();
    
    // 记录页面访问
    MonitorSDK.trackPageView({
      title: document.title,
      url: window.location.href
    });

    // 设置定时状态更新
    setInterval(updateSDKStatus, 2000);

  } catch (error) {
    console.error('Monitor SDK 初始化失败:', error);
    document.getElementById('sdk-status').textContent = 'SDK初始化失败: ' + error.message;
  }
}

/**
 * 设置测试按钮事件
 */
function setupTestButtons() {
  // JavaScript错误测试
  document.getElementById('test-js-error').addEventListener('click', () => {
    try {
      throw new Error('测试JavaScript错误');
    } catch (error) {
      MonitorSDK.captureError(error, {
        category: 'manual',
        severity: 'medium',
        context: 'error-test-button'
      });
      addTestResult('JavaScript错误', '手动捕获错误成功');
    }
  });

  // Promise错误测试
  document.getElementById('test-promise-error').addEventListener('click', () => {
    // 创建未处理的Promise拒绝
    Promise.reject(new Error('测试Promise拒绝错误'))
      .catch(error => {
        // 这个错误会被SDK自动捕获
        addTestResult('Promise错误', 'Promise拒绝错误被自动捕获');
      });
  });

  // HTTP错误测试
  document.getElementById('test-http-error').addEventListener('click', async () => {
    try {
      const response = await fetch('https://httpstat.us/500');
      if (!response.ok) {
        MonitorSDK.captureHttpError(
          'https://httpstat.us/500',
          'GET',
          response.status,
          response.statusText,
          { testType: 'manual' }
        );
        addTestResult('HTTP错误', `HTTP ${response.status} 错误捕获成功`);
      }
    } catch (error) {
      MonitorSDK.captureError(error, {
        category: 'network',
        context: 'http-error-test'
      });
      addTestResult('HTTP错误', '网络请求错误捕获成功');
    }
  });

  // 用户行为测试
  document.getElementById('test-behavior').addEventListener('click', () => {
    MonitorSDK.trackBehavior('button-click', {
      buttonId: 'test-behavior',
      buttonText: '用户行为测试',
      timestamp: Date.now(),
      userAction: 'manual-test'
    });
    addTestResult('用户行为', '用户行为记录成功');
  });

  // 自定义性能测试
  document.getElementById('test-performance').addEventListener('click', () => {
    const startTime = performance.now();
    
    // 模拟一些工作
    setTimeout(() => {
      const duration = performance.now() - startTime;
      MonitorSDK.trackBehavior('custom-performance', {
        operation: 'test-async-operation',
        duration: duration,
        startTime: startTime,
        timestamp: Date.now()
      });
      addTestResult('性能测试', `异步操作耗时: ${duration.toFixed(2)}ms`);
    }, Math.random() * 1000 + 500);
  });

  // 批量数据上报测试
  document.getElementById('test-flush').addEventListener('click', async () => {
    try {
      await MonitorSDK.flush();
      addTestResult('数据上报', '批量数据上报成功');
    } catch (error) {
      addTestResult('数据上报', '数据上报失败: ' + error.message);
    }
  });

  // 设置用户信息测试
  document.getElementById('test-user-info').addEventListener('click', () => {
    const userId = 'user-' + Date.now();
    MonitorSDK.setUser(userId, {
      name: '测试用户',
      email: 'test@example.com',
      role: 'tester'
    });
    addTestResult('用户信息', `用户ID设置为: ${userId}`);
  });

  // 清空测试结果
  document.getElementById('clear-results').addEventListener('click', () => {
    document.getElementById('test-results').innerHTML = '';
  });
}

/**
 * 设置错误边界
 */
function setupErrorBoundaries() {
  // 全局错误处理
  window.addEventListener('error', (event) => {
    console.log('全局错误被捕获:', event.error);
  });

  // 全局Promise拒绝处理
  window.addEventListener('unhandledrejection', (event) => {
    console.log('未处理的Promise拒绝被捕获:', event.reason);
  });

  // 资源加载错误处理
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      console.log('资源加载错误被捕获:', event.target);
    }
  }, true);
}

/**
 * 更新SDK状态显示
 */
function updateSDKStatus() {
  const status = MonitorSDK.getStatus();
  const statusElement = document.getElementById('sdk-status');
  
  if (statusElement && status) {
    statusElement.innerHTML = `
      <strong>SDK状态:</strong> ${status.isInitialized ? '已初始化' : '未初始化'}<br>
      <strong>会话ID:</strong> ${status.sessionId}<br>
      <strong>错误数量:</strong> ${status.errorCount}<br>
      <strong>性能数据:</strong> ${status.performanceCount}<br>
      <strong>行为数据:</strong> ${status.behaviorCount}<br>
      <strong>运行时间:</strong> ${Math.floor((Date.now() - status.startTime) / 1000)}秒
    `;
  }
}

/**
 * 添加测试结果
 */
function addTestResult(type, message) {
  const resultsContainer = document.getElementById('test-results');
  const resultItem = document.createElement('div');
  resultItem.className = 'test-result-item';
  resultItem.innerHTML = `
    <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
    <span class="test-type">${type}:</span>
    <span class="test-message">${message}</span>
  `;
  resultsContainer.appendChild(resultItem);
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
}

// 导出供HTML使用
window.addTestResult = addTestResult;
window.MonitorSDK = MonitorSDK;