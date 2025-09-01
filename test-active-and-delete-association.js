const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 测试设置活跃关联和删除关联功能
async function testActiveAndDeleteAssociation() {
  const baseURL = 'http://localhost:3001';
  
  try {
    // 1. 获取项目列表
    console.log('1. 获取项目列表...');
    const projectsResponse = await axios.get(`${baseURL}/api/project-config`);
    console.log('项目列表:', projectsResponse.data);
    
    if (!projectsResponse.data || projectsResponse.data.data.length === 0) {
      console.log('没有找到项目，请先创建项目');
      return;
    }
    
    const projectId = projectsResponse.data.data[0].projectId;
    console.log(`使用项目ID: ${projectId}`);
    
    // 2. 上传源代码和sourcemap压缩包
    console.log('\n2. 上传源代码和sourcemap压缩包...');
    
    // 读取示例文件
    const sourceCodePath = path.join(__dirname, 'examples', 'taro-mini', 'taromini-1.0.0-source-1756397633.zip');
    const sourcemapPath = path.join(__dirname, 'examples', 'taro-mini', 'taromini-1.0.0-sourcemap-1756397634.zip');
    
    if (!fs.existsSync(sourceCodePath) || !fs.existsSync(sourcemapPath)) {
      console.log('测试文件不存在，请检查examples/taro-mini目录');
      return;
    }
    
    const sourceCodeBuffer = fs.readFileSync(sourceCodePath);
    const sourcemapBuffer = fs.readFileSync(sourcemapPath);
    
    // 创建FormData
    const form = new FormData();
    form.append('projectId', projectId);
    form.append('version', '1.0.1');
    form.append('sourceCodeArchive', sourceCodeBuffer, {
      filename: 'source-code.zip',
      contentType: 'application/zip'
    });
    form.append('sourcemapArchive', sourcemapBuffer, {
      filename: 'sourcemap.zip',
      contentType: 'application/zip'
    });
    
    // 发送上传请求
    const uploadResponse = await axios.post(
      `${baseURL}/api/source-code-sourcemap-integration/upload`,
      form,
      {
        headers: {
          ...form.getHeaders()
        }
      }
    );
    
    console.log('上传结果:', uploadResponse.data);
    
    if (!uploadResponse.data.success) {
      console.log('上传失败:', uploadResponse.data.message);
      return;
    }
    
    const versionId = uploadResponse.data.sourceCodeVersionId;
    console.log(`上传的版本ID: ${versionId}`);
    
    // 3. 获取关联信息
    console.log('\n3. 获取关联信息...');
    const associationResponse = await axios.get(`${baseURL}/api/source-code-sourcemap-integration/association/${projectId}`);
    console.log('关联信息:', associationResponse.data);
    
    // 4. 设置活跃关联
    console.log('\n4. 设置活跃关联...');
    const setActiveResponse = await axios.post(
      `${baseURL}/api/source-code-sourcemap-integration/set-active/${projectId}/${versionId}`
    );
    console.log('设置活跃关联结果:', setActiveResponse.data);
    
    // 5. 再次获取关联信息，验证活跃状态
    console.log('\n5. 验证活跃状态...');
    const verifyResponse = await axios.get(`${baseURL}/api/source-code-sourcemap-integration/association/${projectId}`);
    console.log('验证结果:', verifyResponse.data);
    
    // 6. 删除关联
    console.log('\n6. 删除关联...');
    const deleteResponse = await axios.delete(
      `${baseURL}/api/source-code-sourcemap-integration/association/${projectId}/${versionId}`
    );
    console.log('删除关联结果:', deleteResponse.data);
    
    console.log('\n活跃关联和删除功能测试完成');
  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testActiveAndDeleteAssociation();