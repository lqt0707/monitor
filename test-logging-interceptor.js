const axios = require('axios');

/**
 * 测试日志监控拦截器
 */
async function testLoggingInterceptor() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🚀 开始测试日志监控拦截器...\n');

  try {
    // 测试1: 健康检查接口
    console.log('📋 测试1: 健康检查接口');
    const healthResponse = await axios.get(`${baseUrl}/api/health`);
    console.log(`✅ 健康检查成功: ${healthResponse.status}`);
    console.log(`📊 响应数据: ${JSON.stringify(healthResponse.data)}\n`);

    // 测试2: 监控数据上报接口
    console.log('📋 测试2: 监控数据上报接口');
  try {
    const reportResponse = await axios.post(`${baseUrl}/api/monitor/report`, {
      projectId: 'test-project',
      type: 'jsError',
      errorMessage: '测试错误信息',
      errorStack: '测试错误堆栈',
      pageUrl: 'https://example.com/test',
      userId: 'test-user-123',
      userAgent: 'Mozilla/5.0 (测试浏览器)',
      deviceInfo: JSON.stringify({ platform: 'web', version: '1.0' }),
      requestUrl: 'https://api.example.com/test',
      requestMethod: 'GET',
      duration: 150
    });
    
    console.log(`✅ 监控数据上报成功: ${reportResponse.status}`);
    console.log(`📊 响应数据: ${JSON.stringify(reportResponse.data)}`);
    
    // 等待队列处理完成
    console.log('⏳ 等待3秒让队列处理完成...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log();
    
  } catch (error) {
    console.error(`❌ 监控数据上报失败: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📊 错误详情: ${JSON.stringify(error.response.data)}`);
    }
    console.log();
  }

    // 测试3: 模拟404错误
    console.log('📋 测试3: 模拟404错误');
    try {
      await axios.get(`${baseUrl}/api/non-existent-endpoint`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ 404错误正确捕获');
        console.log(`📊 错误状态码: ${error.response.status}`);
      } else {
        console.log('❌ 非预期错误:', error.message);
      }
    }
    console.log();

    // 测试4: 模拟慢请求
    console.log('📋 测试4: 模拟慢请求');
    const slowResponse = await axios.get(`${baseUrl}/api/health?delay=2000`);
    console.log(`✅ 慢请求完成: ${slowResponse.status}`);
    console.log(`📊 响应时间: 约2000ms\n`);

    console.log('🎉 所有测试完成！');
    console.log('📝 请查看服务器控制台输出，确认日志监控拦截器正常工作：');
    console.log('   - 请求开始日志');
    console.log('   - 请求完成日志');
    console.log('   - 性能指标日志');
    console.log('   - 错误日志（如适用）');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 响应状态:', error.response.status);
      console.error('📊 响应数据:', error.response.data);
    }
  }
}

// 运行测试
testLoggingInterceptor().catch(console.error);