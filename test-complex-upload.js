const fs = require('fs');
const axios = require('axios');

/**
 * 测试单个复杂文件上传
 */
async function testComplexFileUpload() {
    console.log('开始测试复杂文件上传...');
    
    try {
        // 读取测试文件内容
        const fileContent = fs.readFileSync('./test-complex.js', 'utf-8');
        const base64Content = Buffer.from(fileContent).toString('base64');
        
        // 构造请求数据
        const requestData = {
            projectId: 'test-project-001',
            sourceCode: base64Content,
            fileName: 'test-complex.js',
            filePath: 'src',
            fileType: 'javascript'
        };
        
        console.log('上传文件:', requestData.fileName);
        console.log('文件大小:', fileContent.length, '字符');
        
        // 发送请求
        const response = await axios.post('http://localhost:3001/api/source-code/upload', requestData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('上传响应:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('✅ 文件上传成功');
            
            // 检查分析结果
            if (response.data.analysisResults && response.data.analysisResults.length > 0) {
                console.log('分析结果数量:', response.data.analysisResults.length);
                
                response.data.analysisResults.forEach((result, index) => {
                    console.log(`\n结果 ${index + 1}:`);
                    console.log('类型:', result.type);
                    
                    if (result.type === 'complexity') {
                        console.log('复杂度分数:', result.metrics.complexityScore);
                        console.log('代码行数:', result.metrics.linesOfCode);
                        console.log('函数数量:', result.metrics.functionCount);
                        console.log('类数量:', result.metrics.classCount);
                    }
                    
                    if (result.triggered) {
                        console.log('🚨 触发告警:', result.message);
                    }
                });
            }
        } else {
            console.log('❌ 文件上传失败:', response.data.message);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('响应错误:', error.response.data);
        }
    }
}

// 执行测试
testComplexFileUpload();