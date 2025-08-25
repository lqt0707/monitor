/**
 * Sourcemap上传功能测试脚本
 * 用于验证新创建的Sourcemap上传API是否正常工作
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001';

/**
 * 测试单个Sourcemap文件上传
 */
async function testSingleUpload() {
  try {
    console.log('测试单个Sourcemap文件上传...');
    
    // 读取一个示例的sourcemap文件（base64编码）
    const sourcemapPath = path.join(__dirname, 'example-sourcemap.js.map');
    const sourcemapContent = fs.readFileSync(sourcemapPath, 'base64');
    
    const response = await axios.post(`${API_BASE_URL}/api/sourcemap-upload/upload`, {
      projectId: 'test-project-123',
      sourcemap: sourcemapContent,
      fileName: 'example-sourcemap.js.map'
    });
    
    console.log('✅ 单个文件上传成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 单个文件上传失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试Sourcemap压缩包上传
 */
async function testArchiveUpload() {
  try {
    console.log('测试Sourcemap压缩包上传...');
    
    // 这里需要有一个实际的压缩包文件进行测试
    // 由于没有实际文件，我们先测试API端点是否存在
    const response = await axios.post(`${API_BASE_URL}/api/sourcemap-upload/upload-archive`, {
      projectId: 'test-project-123',
      archive: 'dGVzdCBjb250ZW50', // 简单的测试base64内容
      fileName: 'test-archive.zip',
      archiveType: 'zip'
    });
    
    console.log('✅ 压缩包上传成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 压缩包上传失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试批量Sourcemap文件上传
 */
async function testBatchUpload() {
  try {
    console.log('测试批量Sourcemap文件上传...');
    
    const response = await axios.post(`${API_BASE_URL}/api/sourcemap-upload/batch-upload`, {
      projectId: 'test-project-123',
      files: [
        {
          sourcemap: 'dGVzdCBmaWxlIDE=', // 测试文件1
          fileName: 'file1.js.map'
        },
        {
          sourcemap: 'dGVzdCBmaWxlIDI=', // 测试文件2
          fileName: 'file2.js.map'
        }
      ]
    });
    
    console.log('✅ 批量上传成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 批量上传失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始测试Sourcemap上传功能...\n');
  
  // 测试API端点是否可达
  try {
    await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✅ API服务器连接正常');
  } catch (error) {
    console.log('⚠️  API服务器可能未启动，但继续测试...');
  }
  
  console.log('\n--- 测试开始 ---');
  
  const results = await Promise.allSettled([
    testSingleUpload(),
    testArchiveUpload(), 
    testBatchUpload()
  ]);
  
  console.log('\n--- 测试结果 ---');
  const passed = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const total = results.length;
  
  console.log(`📊 测试通过: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！Sourcemap上传功能正常工作');
  } else {
    console.log('❌ 部分测试失败，请检查服务器日志');
  }
}

// 运行测试
main().catch(console.error);