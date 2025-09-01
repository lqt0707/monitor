const axios = require('axios');

// 测试版本关联功能
async function testVersionAssociation() {
  const baseURL = 'http://localhost:3001';
  
  try {
    // 1. 测试获取项目列表
    console.log('1. 测试获取项目列表...');
    // 使用项目配置接口
    const projectsResponse = await axios.get(`${baseURL}/api/project-config`);
    console.log('项目列表:', projectsResponse.data);
    
    if (!projectsResponse.data || projectsResponse.data.length === 0) {
      console.log('没有找到项目，请先创建项目');
      return;
    }
    
    const projectId = projectsResponse.data.data[0].id;
    console.log(`使用项目ID: ${projectId}`);
    
    // 2. 测试获取关联信息
    console.log('\n2. 测试获取关联信息...');
    const associationResponse = await axios.get(`${baseURL}/api/source-code-sourcemap-integration/association/${projectId}`);
    console.log('关联信息:', associationResponse.data);
    
    console.log('\n版本关联功能测试完成');
  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testVersionAssociation();