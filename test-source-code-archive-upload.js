const fs = require('fs');
const axios = require('axios');

/**
 * 测试源代码压缩包上传功能
 * 验证压缩包格式是否符合后端解析要求
 */
async function testSourceCodeArchiveUpload() {
    console.log('🚀 开始测试源代码压缩包上传...\n');
    
    try {
        // 读取压缩包文件内容
        const zipFilePath = '/Users/lqt/Desktop/package/monitor/examples/taro-mini/taro-mini-source-2025-08-25.zip';
        const fileContent = fs.readFileSync(zipFilePath);
        const base64Content = fileContent.toString('base64');
        
        // 获取文件统计信息
        const fileStats = fs.statSync(zipFilePath);
        const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
        
        console.log('📦 压缩包信息:');
        console.log('   文件路径:', zipFilePath);
        console.log('   文件大小:', fileSizeMB, 'MB');
        console.log('   文件格式: ZIP');
        
        // 构造请求数据 - 符合UploadSourceCodeArchiveDto格式
        const requestData = {
            projectId: 'test-project-001',
            archive: base64Content,
            fileName: 'taro-mini-source-2025-08-25.zip',
            archiveType: 'zip'
        };
        
        console.log('\n📤 准备上传压缩包...');
        console.log('   项目ID:', requestData.projectId);
        console.log('   压缩包类型:', requestData.archiveType);
        
        // 发送请求到源代码上传接口
        const response = await axios.post('http://localhost:3001/api/source-code/upload-archive', requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30秒超时
        });
        
        console.log('\n✅ 上传响应:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('🎉 压缩包上传成功！');
            
            // 检查分析结果
            if (response.data.processedFiles && response.data.processedFiles.length > 0) {
                console.log('\n📊 分析结果统计:');
                console.log('   总文件数:', response.data.totalFiles || '未知');
                console.log('   成功文件数:', response.data.processedFiles.filter(f => f.success).length);
                console.log('   失败文件数:', response.data.processedFiles.filter(f => !f.success).length);
                
                // 显示每个文件的分析结果
                console.log('\n🔍 详细分析结果:');
                response.data.processedFiles.forEach((fileResult, index) => {
                    if (fileResult.success && fileResult.analysisResults && fileResult.analysisResults.length > 0) {
                        console.log(`\n   📄 文件 ${index + 1}: ${fileResult.fileName}`);
                        
                        fileResult.analysisResults.forEach((analysis, analysisIndex) => {
                            console.log(`     分析 ${analysisIndex + 1}: ${analysis.type}`);
                            
                            if (analysis.type === 'complexity') {
                                console.log('       复杂度分数:', analysis.metrics?.complexityScore || '未知');
                                console.log('       代码行数:', analysis.metrics?.linesOfCode || '未知');
                                console.log('       函数数量:', analysis.metrics?.functionCount || '未知');
                            }
                            
                            if (analysis.type === 'code_style' && analysis.issues && analysis.issues.length > 0) {
                                console.log('       代码规范问题:', analysis.issues.length);
                                analysis.issues.forEach(issue => {
                                    console.log(`       ⚠️  ${issue.type}: ${issue.description}`);
                                });
                            }
                            
                            if (analysis.type === 'dependencies' && analysis.dependencies && analysis.dependencies.length > 0) {
                                console.log('       依赖项:', analysis.dependencies.join(', '));
                            }
                        });
                    } else if (!fileResult.success) {
                        console.log(`\n   ❌ 文件 ${index + 1}: ${fileResult.fileName} - 处理失败: ${fileResult.error}`);
                    }
                });
            }
        } else {
            console.log('❌ 压缩包上传失败:', response.data.message);
        }
        
    } catch (error) {
        console.error('\n❌ 测试失败:');
        console.error('   错误信息:', error.message);
        
        if (error.response) {
            console.error('   响应状态:', error.response.status);
            console.error('   响应数据:', JSON.stringify(error.response.data, null, 2));
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.error('   后端服务未启动，请确保服务器正在运行');
        }
    }
}

// 执行测试
if (require.main === module) {
    testSourceCodeArchiveUpload();
}