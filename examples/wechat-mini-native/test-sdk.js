/**
 * SDK测试脚本
 * 用于验证监控SDK的基本功能
 */

const { Monitor } = require('@monitor/taro-wechat-mini-sdk');

// 模拟wx全局对象
global.wx = {
  request: () => {},
  getSystemInfo: () => {},
  getNetworkType: () => {}
};

// 初始化监控SDK
const monitor = Monitor.init({
  httpTimeout: 5000, // 5秒超时
  performance: {
    watch: true
  },
  isError: true,
  isNetwork: true
});

// 设置自定义数据
monitor.setCustomData('testKey', 'testValue');
monitor.setCustomData({
  environment: 'test',
  version: '1.0.0'
});

// 监听所有事件
monitor.on('event', (eventName, data) => {
  console.log(`[SDK Test] Event: ${eventName}`, data);
});

// 监听特定事件
monitor.on('jsError', (error) => {
  console.log('[SDK Test] JavaScript Error:', error);
});

monitor.on('reqError', (error) => {
  console.log('[SDK Test] Request Error:', error);
});

monitor.on('slowHttpRequest', (data) => {
  console.log('[SDK Test] Slow HTTP Request:', data);
});

monitor.on('performanceInfoReady', (info) => {
  console.log('[SDK Test] Performance Info:', info);
});

// 测试函数
const testFunctions = {
  // 测试JavaScript错误
  testJsError() {
    console.log('[SDK Test] Testing JavaScript Error...');
    try {
      // 故意触发错误
      throw new Error('Test JavaScript Error');
    } catch (e) {
      // 手动触发错误事件
      monitor.emit('jsError', {
        message: e.message,
        stack: e.stack,
        timestamp: Date.now()
      });
    }
  },

  // 测试网络请求错误
  testHttpError() {
    console.log('[SDK Test] Testing HTTP Error...');
    if (typeof wx !== 'undefined' && wx.request) {
      if (typeof wx !== 'undefined') {
        wx.request({
          url: 'https://httpbin.org/status/500',
          fail: () => {
            console.log('[SDK Test] HTTP Error triggered');
          }
        });
      }
    } else {
      console.log('[SDK Test] wx.request not available');
    }
  },

  // 测试慢请求
  testSlowRequest() {
    console.log('[SDK Test] Testing Slow Request...');
    if (typeof wx !== 'undefined' && wx.request) {
      if (typeof wx !== 'undefined') {
        wx.request({
          url: 'https://httpbin.org/delay/6',
          success: () => {
            console.log('[SDK Test] Slow request completed');
          }
        });
      }
    } else {
      console.log('[SDK Test] wx.request not available');
    }
  },

  // 测试Promise错误
  testPromiseError() {
    console.log('[SDK Test] Testing Promise Error...');
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Test Promise Rejection'));
      }, 100);
    }).catch(error => {
      // 手动触发Promise错误事件
      monitor.emit('unHandleRejection', {
        reason: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    });
  },

  // 测试性能监控
  testPerformance() {
    console.log('[SDK Test] Testing Performance Monitoring...');
    // 性能监控已在初始化时启用
    console.log('[SDK Test] Performance monitoring enabled');
  },

  // 运行所有测试
  runAllTests() {
    console.log('[SDK Test] Starting all tests...');
    
    setTimeout(() => this.testJsError(), 1000);
    setTimeout(() => this.testPromiseError(), 2000);
    setTimeout(() => this.testHttpError(), 3000);
    setTimeout(() => this.testSlowRequest(), 4000);
    setTimeout(() => this.testPerformance(), 5000);
    
    console.log('[SDK Test] All tests scheduled');
  }
};

// 导出测试函数
module.exports = {
  monitor,
  testFunctions
};

// 如果直接运行此文件，执行所有测试
if (typeof module !== 'undefined' && require.main === module) {
  testFunctions.runAllTests();
}