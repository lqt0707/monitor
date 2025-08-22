/**
 * Node.js环境下的SDK连调测试
 */

// 模拟wx对象
global.wx = {
  request: function(options) {
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    const parsedUrl = url.parse(options.url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(options.data);
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...options.header
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            data: JSON.parse(data)
          };
          if (options.success) {
            options.success(result);
          }
        } catch (error) {
          if (options.fail) {
            options.fail(error);
          }
        }
        if (options.complete) {
          options.complete();
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      if (options.fail) {
        options.fail(error);
      }
      if (options.complete) {
        options.complete();
      }
    });
    
    req.write(postData);
    req.end();
  }
};

// 引入测试模块
const { runConnectionTest } = require('./test-connection.js');

// 运行测试
console.log('=== Node.js环境下的SDK连调测试 ===');
runConnectionTest().catch(console.error);