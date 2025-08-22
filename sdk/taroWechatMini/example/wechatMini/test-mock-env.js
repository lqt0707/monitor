/**
 * SDK模拟环境测试脚本
 * 模拟小程序环境来测试SDK功能
 */

console.log('[Test] 开始模拟环境测试...');

// 模拟小程序全局对象
global.wx = {
  getSystemInfo: (options) => {
    console.log('[Mock] wx.getSystemInfo called');
    if (options && options.success) {
      options.success({
        platform: 'devtools',
        version: '8.0.5',
        SDKVersion: '2.19.4',
        system: 'macOS 10.15.7',
        model: 'mac',
        pixelRatio: 2,
        windowWidth: 375,
        windowHeight: 667
      });
    }
  },
  getNetworkType: (options) => {
    console.log('[Mock] wx.getNetworkType called');
    if (options && options.success) {
      options.success({
        networkType: 'wifi'
      });
    }
  },
  onNetworkStatusChange: (callback) => {
    console.log('[Mock] wx.onNetworkStatusChange called');
  },
  request: (options) => {
    console.log('[Mock] wx.request called with:', options.url);
    // 模拟成功响应
    setTimeout(() => {
      if (options.success) {
        options.success({
          data: { message: 'mock response' },
          statusCode: 200,
          header: {}
        });
      }
    }, 100);
  }
};

// 模拟getApp函数
global.getApp = () => {
  return {
    globalData: {
      userInfo: { nickname: 'test' },
      appVersion: '1.0.0'
    }
  };
};

// 模拟getCurrentPages函数
global.getCurrentPages = () => {
  return [{
    route: 'pages/index/index',
    options: {}
  }];
};

// 模拟Page函数
global.Page = (options) => {
  console.log('[Mock] Page called with options:', Object.keys(options));
  return options;
};

// 模拟App函数
global.App = (options) => {
  console.log('[Mock] App called with options:', Object.keys(options));
  return options;
};

try {
  const { Monitor } = require('@monitor/taro-wechat-mini-sdk');
  
  console.log('[Test] ✅ SDK导入成功');
  
  // 初始化监控SDK
  const monitor = Monitor.init({
    httpTimeout: 3000,
    enablePerformance: true,
    enableError: true,
    enableHttp: true,
    isSystemInfo: true,
    isNetwork: true,
    env: 'test'
  });
  
  console.log('[Test] ✅ Monitor初始化成功');
  
  // 设置自定义数据
  monitor.setCustomData('testKey', 'testValue');
  console.log('[Test] ✅ 设置自定义数据成功');
  
  // 监听事件
  monitor.on('event', (eventName, data) => {
    console.log(`[Test] 收到事件: ${eventName}`, data);
  });
  
  console.log('[Test] ✅ 事件监听设置成功');
  
  // 测试网络请求监控
  console.log('[Test] 测试网络请求监控...');
  wx.request({
    url: 'https://api.example.com/test',
    method: 'GET',
    success: (res) => {
      console.log('[Test] ✅ 模拟请求成功');
    }
  });
  
  // 等待一段时间让异步操作完成
  setTimeout(() => {
    console.log('[Test] 🎉 模拟环境测试完成');
  }, 500);
  
} catch (error) {
  console.error('[Test] ❌ 测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}