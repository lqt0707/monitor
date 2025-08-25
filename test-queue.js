// 测试队列处理功能的简单脚本
// 注意：此脚本需要在实际的NestJS应用上下文中运行
// 以下导入路径仅供参考，实际使用时需要根据构建后的路径调整
console.log('=== 监控服务队列处理测试 ===');

console.log('=== 监控服务队列处理测试 ===');

// 模拟监控数据
const testData = {
  projectId: 'test-project-123',
  type: 'jsError',
  errorMessage: 'Test error message',
  errorStack: 'Error: Test error\n    at testFunction (test.js:10:5)',
  pageUrl: 'https://example.com/test',
  userId: 'user-123',
  userAgent: 'Mozilla/5.0 (Test Browser)',
  deviceInfo: {},
  networkInfo: {},
  performanceData: {},
  timestamp: new Date().toISOString()
};

console.log('测试数据:', JSON.stringify(testData, null, 2));

// 测试流程
async function testQueueProcessing() {
  try {
    console.log('\n1. 初始化服务...');
    // 这里需要实际的NestJS应用上下文来测试
    
    console.log('2. 调用saveMonitorData方法...');
    console.log('3. 预期结果: 数据应该被添加到监控处理队列');
    console.log('4. 监控处理器应该处理数据并保存到数据库');
    console.log('5. JavaScript错误应该被转换为错误日志');
    
    console.log('\n✅ 测试完成 - 请运行实际应用验证队列功能');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testQueueProcessing();