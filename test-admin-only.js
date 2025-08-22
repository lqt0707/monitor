const http = require('http');
const { URL } = require('url');

/**
 * 简化的HTTP请求函数
 * @param {string} url - 请求URL
 * @returns {Promise} 请求结果
 */
function makeSimpleRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Node.js Test Client'
      }
    };

    console.log('请求配置:', requestOptions);

    const req = http.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData.substring(0, 200) + '...'
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

/**
 * 测试管理后台访问
 */
async function testAdminAccess() {
  console.log('=== 测试管理后台访问 ===');
  
  try {
    const response = await makeSimpleRequest('http://localhost:5173');
    console.log('状态码:', response.statusCode);
    console.log('响应头:', response.headers);
    console.log('响应内容预览:', response.data);
    
    if (response.statusCode === 200) {
      console.log('✓ 管理后台访问成功');
    } else {
      console.log('✗ 管理后台访问失败');
    }
  } catch (error) {
    console.log('✗ 请求失败:', error.message);
  }
}

// 运行测试
testAdminAccess().catch(console.error);