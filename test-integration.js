/**
 * 管理后台与服务端联调测试脚本
 * 测试前端管理系统与后端API的连接和数据交互
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// 测试配置
const testConfig = {
  adminUrl: 'http://localhost:5173',
  serverUrl: 'http://localhost:3001',
  testProjectId: 'test-project-001',
  healthEndpoint: '/api/health',
  monitorEndpoint: '/api/monitor/report',
  errorLogEndpoint: '/api/error-logs'
};

/**
 * 发送HTTP请求的工具函数
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @param {string} data - 请求数据
 * @returns {Promise} 请求结果
 */
function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    let jsonData = '';
    if (data && typeof data === 'object') {
      jsonData = JSON.stringify(data);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          };
          
          if (res.headers['content-type']?.includes('application/json')) {
            try {
              result.data = JSON.parse(responseData);
            } catch (e) {
              // 保持原始数据
            }
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (jsonData) {
      req.write(jsonData);
    }
    
    req.end();
  });
}

/**
 * 测试服务端健康检查
 */
async function testServerHealth() {
  console.log('\n=== 测试服务端健康检查 ===');
  try {
    const response = await makeRequest(`${testConfig.serverUrl}${testConfig.healthEndpoint}`);
    if (response.statusCode === 200) {
      console.log('✓ 服务端健康检查通过');
      console.log('  响应数据:', response.data);
      return true;
    } else {
      console.log('✗ 服务端健康检查失败，状态码:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('✗ 服务端健康检查失败:', error.message);
    return false;
  }
}

/**
 * 测试监控数据上报API
 */
async function testMonitorReport() {
  console.log('\n=== 测试监控数据上报API ===');
  
  const testData = {
    projectId: testConfig.testProjectId,
    type: 'jsError',
    errorMessage: 'Test error from integration test',
    errorStack: 'Error\n    at testFunction\n    at integration-test.js:1:1',
    pageUrl: '/test-page',
    userAgent: 'Node.js Integration Test',
    deviceInfo: JSON.stringify({
      platform: 'test',
      version: '1.0.0'
    }),
    networkInfo: JSON.stringify({
      type: 'test'
    }),
    extraData: JSON.stringify({
      testFlag: true
    })
  };

  try {
    const response = await makeRequest(
      `${testConfig.serverUrl}${testConfig.monitorEndpoint}`,
      { method: 'POST' },
      testData
    );
    
    if (response.statusCode === 201 || response.statusCode === 200) {
      console.log('✓ 监控数据上报成功');
      console.log('  响应数据:', response.data);
      return true;
    } else {
      console.log('✗ 监控数据上报失败，状态码:', response.statusCode);
      console.log('  响应数据:', response.data);
      return false;
    }
  } catch (error) {
    console.log('✗ 监控数据上报失败:', error.message);
    return false;
  }
}

/**
 * 测试错误日志查询API
 */
async function testErrorLogsQuery() {
  console.log('\n=== 测试错误日志查询API ===');
  
  try {
    const response = await makeRequest(
      `${testConfig.serverUrl}${testConfig.errorLogEndpoint}?projectId=${testConfig.testProjectId}&page=1&limit=10`
    );
    
    if (response.statusCode === 200) {
      console.log('✓ 错误日志查询成功');
      console.log('  数据条数:', response.data?.data?.length || 0);
      return true;
    } else {
      console.log('✗ 错误日志查询失败，状态码:', response.statusCode);
      console.log('  响应数据:', response.data);
      return false;
    }
  } catch (error) {
    console.log('✗ 错误日志查询失败:', error.message);
    return false;
  }
}

/**
 * 测试管理后台静态资源
 */
async function testAdminStatic() {
  console.log('\n=== 测试管理后台静态资源 ===');
  
  try {
    // 使用适合HTML页面的请求头
    const response = await makeRequest(testConfig.adminUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Node.js Test Client'
      }
    });
    
    if (response.statusCode === 200) {
      console.log('✓ 管理后台页面访问成功');
      console.log('  内容类型:', response.headers['content-type']);
      return true;
    } else {
      console.log('✗ 管理后台页面访问失败，状态码:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('✗ 管理后台页面访问失败:', error.message);
    return false;
  }
}

/**
 * 执行完整的联调测试
 */
async function runIntegrationTest() {
  console.log('=== 管理后台与服务端联调测试开始 ===');
  console.log('管理后台地址:', testConfig.adminUrl);
  console.log('服务端地址:', testConfig.serverUrl);
  
  const results = {
    serverHealth: false,
    adminStatic: false,
    monitorReport: false,
    errorLogsQuery: false
  };
  
  // 测试服务端健康检查
  results.serverHealth = await testServerHealth();
  
  // 测试管理后台静态资源
  results.adminStatic = await testAdminStatic();
  
  // 测试监控数据上报
  results.monitorReport = await testMonitorReport();
  
  // 等待一下让数据处理完成
  console.log('\n等待数据处理...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试错误日志查询
  results.errorLogsQuery = await testErrorLogsQuery();
  
  // 输出测试结果
  console.log('\n=== 联调测试结果汇总 ===');
  console.log('服务端健康检查:', results.serverHealth ? '✓ 通过' : '✗ 失败');
  console.log('管理后台访问:', results.adminStatic ? '✓ 通过' : '✗ 失败');
  console.log('监控数据上报:', results.monitorReport ? '✓ 通过' : '✗ 失败');
  console.log('错误日志查询:', results.errorLogsQuery ? '✓ 通过' : '✗ 失败');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n测试通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有联调测试通过！管理后台与服务端连接正常。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查服务配置和网络连接。');
  }
  
  return results;
}

// 执行测试
if (require.main === module) {
  runIntegrationTest().catch(console.error);
}

module.exports = {
  runIntegrationTest,
  testConfig
};