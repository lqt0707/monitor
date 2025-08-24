/**
 * 快速SDK连通性测试
 * 验证最基本的数据上报功能
 */

const { sendRequest, TEST_CONFIG } = require('./test-sdk-connection');

async function quickTest() {
  console.log('🚀 Quick SDK Connection Test');
  console.log('=' .repeat(40));
  
  // 测试数据
  const testData = {
    projectId: 'taromini',
    type: 'jsError',
    errorMessage: 'Quick test error',
    errorStack: 'at quickTest (test.js:1:1)',
    pageUrl: '/pages/index/index',
    userId: 'quick-test-user'
  };
  
  try {
    console.log('📤 Sending test error data...');
    
    const response = await sendRequest(
      'http://localhost:3001/api/monitor/report',
      'POST',
      testData
    );
    
    console.log(`📊 Response: ${response.statusCode}`);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ SUCCESS: SDK connection is working!');
      console.log('📋 Server response:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('❌ FAILED: Unexpected response');
      console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAILED: Connection error');
    console.log('🔍 Error details:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Tip: Make sure the server is running on http://localhost:3001');
    }
  }
}

quickTest();