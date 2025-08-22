/**
 * SDK与服务端连调测试文件
 * 用于验证数据上报功能
 */

const { Reporter } = require('./reporter.js');

/**
 * 测试配置
 */
const testConfig = {
  url: 'http://localhost:3001',
  projectId: 'test-project-001',
  batchSize: 5,
  flushInterval: 3000,
  maxRetries: 3
};

/**
 * 模拟监控数据
 */
const mockData = [
  {
    projectId: testConfig.projectId,
    type: 'jsError',
    errorMessage: 'TypeError: Cannot read property of undefined',
    errorStack: 'Error\n    at test.js:10:5\n    at Object.<anonymous>',
    pageUrl: '/pages/index/index',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    deviceInfo: JSON.stringify({
      brand: 'iPhone',
      model: 'iPhone 12',
      system: 'iOS 14.0',
      platform: 'ios'
    }),
    networkInfo: JSON.stringify({
      networkType: 'wifi',
      signal: 'strong'
    }),
    extraData: JSON.stringify({
      eventName: 'jsError',
      customData: { userId: '12345' },
      behavior: ['pageLoad', 'buttonClick']
    })
  },
  {
    projectId: testConfig.projectId,
    type: 'reqError',
    requestUrl: 'https://api.example.com/data',
    requestMethod: 'GET',
    responseStatus: 500,
    duration: 2500,
    pageUrl: '/pages/list/list',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    deviceInfo: JSON.stringify({}),
    networkInfo: JSON.stringify({}),
    extraData: JSON.stringify({
      eventName: 'reqError',
      errorMessage: 'Network request failed'
    })
  },
  {
    projectId: testConfig.projectId,
    type: 'performanceInfoReady',
    pageUrl: '/pages/home/home',
    performanceData: JSON.stringify({
      loadTime: 1200,
      renderTime: 800,
      firstPaint: 600
    }),
    deviceInfo: JSON.stringify({}),
    networkInfo: JSON.stringify({}),
    extraData: JSON.stringify({
      eventName: 'performanceInfoReady'
    })
  }
];

/**
 * 执行连调测试
 */
async function runConnectionTest() {
  console.log('=== SDK与服务端连调测试开始 ===');
  
  try {
    // 创建Reporter实例
    const reporter = new Reporter(testConfig);
    console.log('✓ Reporter实例创建成功');
    
    // 测试单条数据上报
    console.log('\n--- 测试单条数据上报 ---');
    await new Promise((resolve, reject) => {
      reporter.singleReport(mockData[0], resolve, reject);
    });
    console.log('✓ 单条数据上报完成');
    
    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试批量数据上报
    console.log('\n--- 测试批量数据上报 ---');
    mockData.forEach((data, index) => {
      // 模拟事件数据格式
      const extraData = JSON.parse(data.extraData);
      const eventData = {
        data: data,
        activePage: data.pageUrl,
        systemInfo: data.deviceInfo,
        customData: extraData.customData || {},
        behavior: extraData.behavior || []
      };
      reporter.addData(data.type, eventData);
    });
    
    // 手动触发上报
    await reporter.flushData();
    console.log('✓ 批量数据上报完成');
    
    console.log('\n=== 连调测试完成 ===');
    
  } catch (error) {
    console.error('✗ 连调测试失败:', error);
  }
}

/**
 * 启动测试
 */
// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runConnectionTest, testConfig, mockData };
}

// 自动运行测试（小程序环境）
if (typeof wx !== 'undefined') {
  console.log('检测到小程序环境，开始连调测试...');
  runConnectionTest();
}