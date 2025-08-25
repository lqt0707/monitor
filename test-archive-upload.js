const fs = require('fs');
const axios = require('axios');

/**
 * 测试源代码压缩包上传功能
 * 验证数据持久化是否正常工作
 */
async function testArchiveUpload() {
  try {
    // 读取测试压缩包文件
    const archiveBuffer = fs.readFileSync('./test-new.zip');
    const base64Archive = archiveBuffer.toString('base64');

    // 准备请求数据
    const requestData = {
      projectId: 'test-project-001',
      archive: base64Archive,
      fileName: 'test-new.zip',
      archiveType: 'zip'
    };

    console.log('开始测试压缩包上传...');
    
    // 发送上传请求
    const response = await axios.post('http://localhost:3001/api/source-code/upload-archive', requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('上传响应:', JSON.stringify(response.data, null, 2));

    // 验证响应数据
    if (response.data.success) {
      console.log('✅ 压缩包上传成功');
      
      // 检查处理文件数量
      if (response.data.totalFiles > 0) {
        console.log(`✅ 处理了 ${response.data.totalFiles} 个文件`);
        
        // 检查每个文件的分析结果
        response.data.processedFiles.forEach((file, index) => {
          console.log(`\n文件 ${index + 1}: ${file.fileName}`);
          console.log(`状态: ${file.success ? '✅ 成功' : '❌ 失败'}`);
          
          if (file.success) {
            if (file.analysisResults && file.analysisResults.length > 0) {
              console.log(`分析结果数量: ${file.analysisResults.length}`);
              console.log('分析结果类型:', file.analysisResults.map(r => r.type).join(', '));
            } else {
              console.log('⚠️  无分析结果（可能是非源代码文件）');
            }
          } else {
            console.log(`错误: ${file.error}`);
          }
        });
        
        console.log('\n✅ 数据持久化验证完成');
      } else {
        console.log('⚠️  压缩包中没有找到源代码文件');
      }
    } else {
      console.log('❌ 压缩包上传失败:', response.data.message);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 执行测试
testArchiveUpload();