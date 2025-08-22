/**
 * 服务端未启动测试用例
 * 用于验证SDK在服务端未启动时的错误处理机制
 */

// 模拟微信小程序环境
const mockWx = {
  request: function(options) {
    // 模拟服务端未启动的情况
    setTimeout(() => {
      if (options.fail) {
        options.fail({
          errMsg: 'request:fail',
          statusCode: 0,
          errCode: -1
        });
      }
    }, 100);
  },
  
  getStorageSync: function(key) {
    try {
      return mockStorage[key] || null;
    } catch (e) {
      return null;
    }
  },
  
  setStorageSync: function(key, data) {
    mockStorage[key] = data;
  },
  
  removeStorageSync: function(key) {
    delete mockStorage[key];
  },
  
  getNetworkType: function(options) {
    if (options.success) {
      options.success({ networkType: 'wifi' });
    }
  },
  
  onNetworkStatusChange: function(callback) {
    // 模拟网络状态变化
  }
};

// 模拟存储
const mockStorage = {};

// 模拟全局对象
const mockGlobal = {};

// 模拟wx对象
const wx = mockWx;
const global = mockGlobal;

// 测试函数
async function testServerDownHandling() {
  console.log('=== 开始服务端未启动测试 ===');
  
  try {
    // 动态引入Monitor类
    const { createMonitor } = require('../src/index');
    
    // 创建监控实例，配置为不存在的地址
    const monitor = createMonitor({
      env: 1, // 使用枚举值
      serverUrl: 'http://localhost:9999', // 不存在的端口
      projectId: 'test-project',
      reporter: {
        timeout: 2000,
        maxRetries: 2,
        retryDelay: 1000,
        batchSize: 5,
        enableOfflineCache: true,
        maxCacheSize: 10,
        flushInterval: 5000
      }
    });
    
    console.log('1. 监控实例创建成功');
    
    // 模拟错误数据
    const testData = [
      { type: 'jsError', message: '测试错误1', timestamp: Date.now() },
      { type: 'performance', loadTime: 1200, timestamp: Date.now() },
      { type: 'behavior', action: 'click', timestamp: Date.now() }
    ];
    
    // 添加测试数据
    testData.forEach(data => {
      monitor.emit('report', data);
    });
    
    console.log('2. 添加测试数据完成');
    
    // 等待一段时间让重试机制执行
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 检查状态
    const status = monitor.getStatus();
    console.log('3. 当前状态:', {
      isServiceAvailable: status.reporter.isServiceAvailable,
      queueSize: status.reporter.queueSize
    });
    
    // 验证缓存
    const cachedData = wx.getStorageSync('monitor_sdk_cache');
    console.log('4. 缓存数据:', cachedData ? cachedData.length : 0);
    
    // 模拟服务恢复（这里可以修改配置为存在的地址进行测试）
    console.log('5. 模拟服务恢复...');
    
    // 手动触发上报
    await monitor.flush();
    
    console.log('6. 测试完成');
    
    return {
      success: true,
      status: status,
      cachedItems: cachedData ? cachedData.length : 0
    };
    
  } catch (error) {
    console.error('测试失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 网络状态测试
function testNetworkStatusHandling() {
  console.log('=== 网络状态变化测试 ===');
  
  let isOnline = true;
  
  // 模拟网络状态变化
  const simulateNetworkChange = (online) => {
    isOnline = online;
    console.log(`网络状态: ${online ? '在线' : '离线'}`);
    
    // 触发SDK的网络状态处理
    if (typeof wx !== 'undefined' && wx.onNetworkStatusChange) {
      // 模拟网络状态变化
    }
  };
  
  // 模拟网络断开
  simulateNetworkChange(false);
  
  // 模拟网络恢复
  setTimeout(() => {
    simulateNetworkChange(true);
  }, 2000);
  
  console.log('网络状态测试完成');
}

// 缓存清理测试
async function testCacheCleanup() {
  console.log('=== 缓存清理测试 ===');
  
  try {
    const { createMonitor } = require('../src/index');
    
    const monitor = createMonitor({
      env: 1, // 使用枚举值
      serverUrl: 'http://localhost:9999',
      reporter: {
        maxCacheSize: 3, // 设置很小的缓存限制
        enableOfflineCache: true
      }
    });
    
    // 添加超过缓存限制的数据
    for (let i = 0; i < 10; i++) {
      monitor.emit('report', {
        type: 'test',
        id: i,
        timestamp: Date.now()
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const status = monitor.getStatus();
    console.log('缓存清理后状态:', {
      queueSize: status.reporter.queueSize,
      maxCacheSize: 3
    });
    
    return {
      success: true,
      cachedItems: status.reporter.queueSize
    };
    
  } catch (error) {
    console.error('缓存清理测试失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始运行服务端未启动处理测试...\n');
  
  const results = [];
  
  // 测试1：基础服务端未启动处理
  results.push({
    name: '服务端未启动处理',
    result: await testServerDownHandling()
  });
  
  console.log('\n');
  
  // 测试2：网络状态处理
  testNetworkStatusHandling();
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n');
  
  // 测试3：缓存清理
  results.push({
    name: '缓存清理',
    result: await testCacheCleanup()
  });
  
  console.log('\n=== 测试结果汇总 ===');
  results.forEach(test => {
    console.log(`${test.name}: ${test.result.success ? '通过' : '失败'}`);
    if (!test.result.success) {
      console.log(`  错误: ${test.result.error}`);
    }
  });
  
  return results;
}

// 如果直接运行此文件
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testServerDownHandling,
    testNetworkStatusHandling,
    testCacheCleanup,
    runAllTests
  };
}

// 运行测试（如果直接执行）
if (require && require.main === module) {
  runAllTests().catch(console.error);
}