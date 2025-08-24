/**
 * Monitor SDK Web Example
 * 演示如何在Web项目中集成和使用Monitor SDK
 */

import monitorSDK from '@monitor/web-sdk';

/**
 * Monitor SDK 配置
 */
const MONITOR_CONFIG = {
  projectId: 'example-project',
  serverUrl: 'http://localhost:3001/api/monitor',
  enableErrorMonitor: true,
  enablePerformanceMonitor: true,
  enableBehaviorMonitor: true,
  sampleRate: 1,
  maxErrors: 100,
  reportInterval: 5000,
  enableInDev: true
};

/**
 * 日志输出函数
 * @param {string} message - 日志消息
 * @param {string} type - 日志类型
 */
function logMessage(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logElement = document.getElementById('log-output');
  if (logElement) {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
  }
  console.log(`[Monitor SDK] ${message}`);
}

/**
 * 更新监控状态显示
 * @param {string} status - 状态信息
 */
function updateStatus(status) {
  const statusElement = document.getElementById('monitor-status');
  if (statusElement) {
    statusElement.textContent = status;
  }
}

/**
 * 初始化Monitor SDK
 */
function initMonitor() {
  try {
    monitorSDK.init(MONITOR_CONFIG);

    updateStatus('SDK已初始化');
    logMessage('Monitor SDK 初始化成功', 'success');
  } catch (error) {
    updateStatus('SDK初始化失败');
    logMessage(`SDK初始化失败: ${error.message}`, 'error');
  }
}

/**
 * 错误监控演示函数
 */

// 触发JavaScript错误
function triggerJSError() {
  try {
    // 故意触发一个引用错误
    undefinedVariable.someProperty;
  } catch (error) {
    monitorSDK.captureError(error, {
      category: 'javascript',
      context: 'error-demo'
    });
    logMessage(`JavaScript错误已触发: ${error.message}`, 'error');
  }
}

// 触发Promise错误
function triggerPromiseError() {
  Promise.reject(new Error('这是一个Promise错误示例'))
    .catch(error => {
      monitorSDK.captureError(error, {
        category: 'promise',
        context: 'error-demo'
      });
      logMessage(`Promise错误已触发: ${error.message}`, 'error');
    });
}

// 触发资源加载错误
function triggerResourceError() {
  const img = new Image();
  img.onerror = () => {
    monitorSDK.captureError('资源加载失败', {
      category: 'resource',
      url: 'https://nonexistent-domain-12345.com/image.jpg',
      context: 'error-demo'
    });
    logMessage('资源加载错误已触发', 'error');
  };
  img.src = 'https://nonexistent-domain-12345.com/image.jpg';
}

// 触发自定义错误
function triggerCustomError() {
  const customError = new Error('这是一个自定义错误示例');
  customError.name = 'CustomError';

  monitorSDK.captureError(customError, {
    category: 'custom',
    severity: 'high',
    context: 'error-demo'
  });

  logMessage('自定义错误已上报', 'error');
}

/**
 * 性能监控演示函数
 */

// 模拟慢操作
function simulateSlowOperation() {
  const startTime = performance.now();

  // 模拟一个耗时操作
  const iterations = 1000000;
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.random();
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // 使用行为跟踪记录性能数据
  monitorSDK.trackBehavior('slow-operation', {
    duration: duration,
    startTime: startTime,
    endTime: endTime,
    context: 'performance-demo'
  });

  logMessage(`慢操作完成，耗时: ${duration.toFixed(2)}ms`, 'performance');
}

// 模拟内存泄漏检测
function simulateMemoryLeak() {
  // 创建一些大对象来模拟内存使用
  const largeArray = new Array(100000).fill('memory-leak-test');

  // 获取内存信息（如果浏览器支持）
  if (performance.memory) {
    const memoryInfo = {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    };

    monitorSDK.trackBehavior('memory-usage', {
      memoryInfo: memoryInfo,
      context: 'performance-demo'
    });

    logMessage(`内存使用情况 - 已用: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`, 'performance');
  } else {
    logMessage('浏览器不支持内存监控', 'warning');
  }

  // 保持引用以模拟内存泄漏
  window.leakedArray = largeArray;
}

// 自定义性能测量
function measureCustomPerformance() {
  const measureName = 'custom-performance-measure';

  // 开始测量
  performance.mark('custom-start');

  // 模拟一些操作
  setTimeout(() => {
    performance.mark('custom-end');
    performance.measure(measureName, 'custom-start', 'custom-end');

    const measure = performance.getEntriesByName(measureName)[0];

    if (measure) {
      monitorSDK.trackBehavior('custom-measure', {
        name: measureName,
        duration: measure.duration,
        startTime: measure.startTime,
        context: 'performance-demo'
      });
    }

    logMessage(`自定义性能测量完成，耗时: ${measure ? measure.duration.toFixed(2) : 'N/A'}ms`, 'performance');

    // 清理测量标记
    performance.clearMarks('custom-start');
    performance.clearMarks('custom-end');
    performance.clearMeasures(measureName);
  }, Math.random() * 1000 + 500); // 随机延迟500-1500ms
}

/**
 * 用户行为跟踪演示函数
 */

// 跟踪按钮点击
function trackButtonClick() {
  const buttonData = {
    buttonId: 'demo-button',
    buttonText: '跟踪按钮点击',
    timestamp: Date.now(),
    page: window.location.pathname,
    context: 'behavior-demo'
  };

  monitorSDK.trackBehavior('button-click', buttonData);

  logMessage(`按钮点击已跟踪: ${buttonData.buttonText}`, 'behavior');
}

// 跟踪页面访问
function trackPageView() {
  const pageData = {
    title: document.title,
    url: window.location.href,
    timestamp: Date.now(),
    context: 'behavior-demo'
  };

  monitorSDK.trackPageView({
    title: pageData.title,
    url: pageData.url
  });

  logMessage(`页面访问已跟踪: ${pageData.title}`, 'behavior');
}

// 跟踪自定义事件
function trackCustomEvent() {
  const eventData = {
    eventName: 'custom-demo-event',
    category: 'demo',
    action: 'custom-tracking',
    label: 'behavior-demo',
    value: Math.floor(Math.random() * 100),
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    context: 'behavior-demo'
  };

  monitorSDK.trackBehavior('custom-event', eventData);

  logMessage(`自定义事件已跟踪: ${eventData.eventName} (值: ${eventData.value})`, 'behavior');
}

// 设置用户ID
function setUserId() {
  const userIdInput = document.getElementById('user-id-input');
  const userId = userIdInput?.value?.trim();

  if (userId) {
    monitorSDK.setUser(userId, {
      timestamp: Date.now().toString(),
      source: 'demo-input',
      context: 'behavior-demo'
    });

    logMessage(`用户ID已设置: ${userId}`, 'behavior');
    if (userIdInput) userIdInput.value = '';
  } else {
    logMessage('请输入有效的用户ID', 'warning');
  }
}

/**
 * 工具函数
 */

// 清理状态和日志
function clearStatus() {
  const logElement = document.getElementById('log-output');
  if (logElement) {
    logElement.innerHTML = '';
  }
  updateStatus('状态已清理');
  logMessage('日志和状态已清理', 'info');
}

// 获取SDK状态信息
function getSDKStatus() {
  const status = monitorSDK.getStatus();
  logMessage(`SDK状态: ${JSON.stringify(status, null, 2)}`, 'info');
  return status;
}

// 手动触发数据上报
function flushData() {
  monitorSDK.flush().then(() => {
    logMessage('数据上报完成', 'success');
  }).catch(error => {
    logMessage(`数据上报失败: ${error.message}`, 'error');
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // 初始化SDK
  initMonitor();

  // 将函数暴露到全局作用域供HTML调用
  window.monitorSDK = monitorSDK;
  window.triggerJSError = triggerJSError;
  window.triggerPromiseError = triggerPromiseError;
  window.triggerResourceError = triggerResourceError;
  window.triggerCustomError = triggerCustomError;
  window.simulateSlowOperation = simulateSlowOperation;
  window.simulateMemoryLeak = simulateMemoryLeak;
  window.measureCustomPerformance = measureCustomPerformance;
  window.trackButtonClick = trackButtonClick;
  window.trackPageView = trackPageView;
  window.trackCustomEvent = trackCustomEvent;
  window.setUserId = setUserId;
  window.clearStatus = clearStatus;
  window.monitorExample = {
    getStatus: getSDKStatus,
    flush: flushData
  };

  // 自动跟踪页面加载
  monitorSDK.trackPageView({
    title: document.title,
    url: window.location.href
  });

  logMessage('页面加载完成，SDK演示准备就绪', 'success');
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  try {
    monitorSDK.flush(); // 确保数据上报
    logMessage('页面卸载，数据已刷新', 'info');
  } catch (error) {
    console.error('页面卸载时数据刷新失败:', error);
  }
});

logMessage('Monitor SDK Example 已加载', 'success');