const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    const formData = new FormData();
    
    // 添加测试文件（创建两个空的测试zip文件）
    const sourceCodeFile = path.join(__dirname, 'test-source.zip');
    const sourcemapFile = path.join(__dirname, 'test-sourcemap.zip');
    
    // 创建有效的zip文件（使用AdmZip创建真正的zip格式）
    const AdmZip = require('adm-zip');
    
    // 创建源代码zip文件
    const sourceZip = new AdmZip();
    sourceZip.addFile('test.js', Buffer.from('console.log("test source code");'));
    sourceZip.writeZip(sourceCodeFile);
    
    // 创建sourcemap zip文件
    const sourcemapZip = new AdmZip();
    sourcemapZip.addFile('test.js.map', Buffer.from('{"version":3,"sources":["test.js"],"names":[],"mappings":"AAAA"}'));
    sourcemapZip.writeZip(sourcemapFile);
    
    // 添加文件到formData（使用单独的字段名）
    formData.append('sourceCodeArchive', fs.createReadStream(sourceCodeFile));
    formData.append('sourcemapArchive', fs.createReadStream(sourcemapFile));
    
    // 添加其他参数
    formData.append('projectId', 'test-project');
    formData.append('version', '1.0.0');
    formData.append('setAsActive', 'true');
    
    console.log('开始测试上传接口...');
    // 手动记录添加的字段名
    const fieldNames = ['sourceCodeArchive', 'sourcemapArchive', 'projectId', 'version', 'setAsActive'];
    console.log('请求字段:', fieldNames);
    
    const response = await axios.post('http://localhost:3001/api/source-code-sourcemap-integration/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 10000,
      // 添加请求拦截器来调试请求内容
      transformRequest: [(data, headers) => {
        console.log('请求头:', headers);
        return data;
      }]
    });
    
    console.log('✅ 上传成功:', response.data);
    
    // 清理测试文件
    fs.unlinkSync(sourceCodeFile);
    fs.unlinkSync(sourcemapFile);
    
  } catch (error) {
    console.error('❌ 上传失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
      console.error('响应头:', error.response.headers);
    } else {
      console.error('错误:', error.message);
    }
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await axios.get('http://localhost:3001/api/health', { timeout: 3000 });
    console.log('✅ 服务器运行正常');
    return true;
  } catch (error) {
    console.log('❌ 服务器未启动，请先启动服务器');
    return false;
  }
}

async function main() {
  // 跳过健康检查，直接测试上传接口
  console.log('跳过健康检查，直接测试上传接口...');
  await testUpload();
}

main();