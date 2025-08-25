#!/usr/bin/env node

/**
 * 错误监控源代码关联系统完整流程测试
 * 测试从源代码上传到错误上报再到源代码关联的完整流程
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// 配置
const CONFIG = {
    serverUrl: 'http://localhost:3001',
    projectId: 'taro-mini',
    projectVersion: '1.0.0',
    buildId: `build-${new Date().toISOString().split('T')[0]}`,
    gitCommit: 'a1b2c3d4e5f6'
};

/**
 * 步骤1：上传源代码包
 */
async function uploadSourceCode() {
    console.log('🚀 步骤1：上传源代码包...\n');

    const sourceCodePath = path.join(__dirname, 'examples/taro-mini/taro-mini-source-2025-08-25.zip');

    if (!fs.existsSync(sourceCodePath)) {
        console.error('❌ 源代码包不存在:', sourceCodePath);
        console.log('请先运行: cd examples/taro-mini && node pack-source-code.js');
        return false;
    }

    try {
        // 读取压缩包文件并转换为 base64
        const fileBuffer = fs.readFileSync(sourceCodePath);
        const base64Content = fileBuffer.toString('base64');
        const fileName = path.basename(sourceCodePath);

        const uploadData = {
            projectId: CONFIG.projectId,
            version: CONFIG.projectVersion,
            buildId: CONFIG.buildId,
            branchName: 'main',
            commitMessage: 'Test source code upload',
            archiveContent: base64Content,
            archiveName: fileName,
            uploadedBy: 'test-user',
            description: '测试源代码上传',
            setAsActive: true
        };

        console.log('上传参数:', {
            projectId: uploadData.projectId,
            version: uploadData.version,
            buildId: uploadData.buildId,
            archiveName: uploadData.archiveName,
            archiveSize: Math.round(base64Content.length / 1024) + ' KB'
        });

        const response = await axios.post(
            `${CONFIG.serverUrl}/api/source-code-version/upload`,
            uploadData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ 源代码上传成功!');
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        return response.data;

    } catch (error) {
        console.error('❌ 源代码上传失败:', error.response?.data || error.message);
        return false;
    }
}

/**
 * 步骤2：模拟错误上报
 */
async function reportError() {
    console.log('\n🚀 步骤2：模拟错误上报...\n');

    const errorData = {
        message: '测试错误：无法读取未定义的属性',
        stack: `TypeError: Cannot read property 'name' of undefined
    at HomePage.handleClick (src/pages/index/index.tsx:25:18)
    at Object.onClick (src/pages/index/index.tsx:45:12)
    at HTMLButtonElement.<anonymous> (dist/common.js:1234:56)`,
        type: 'TypeError',
        filename: 'src/pages/index/index.tsx',
        lineno: 25,
        colno: 18,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        url: 'pages/index/index',
        userId: 'test-user-123',
        sessionId: 'session-' + Date.now(),
        timestamp: new Date().toISOString(),

        // 新增的版本信息字段
        projectVersion: CONFIG.projectVersion,
        buildId: CONFIG.buildId,
        gitCommit: CONFIG.gitCommit,
        buildTime: new Date().toISOString(),
        originalSourceFile: 'src/pages/index/index.tsx',
        originalSourceLine: 25,
        originalSourceColumn: 18,

        // 额外信息
        extra: {
            component: 'HomePage',
            action: 'handleClick',
            props: { title: '首页' }
        }
    };

    try {
        const response = await axios.post(
            `${CONFIG.serverUrl}/api/monitor/js-error`,
            errorData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        console.log('✅ 错误上报成功!');
        console.log('错误ID:', response.data.id);
        return response.data;

    } catch (error) {
        console.error('❌ 错误上报失败:', error.response?.data || error.message);
        return false;
    }
}

/**
 * 步骤3：测试错误定位功能
 */
async function testErrorLocation(errorId) {
    console.log('\n🚀 步骤3：测试错误定位功能...\n');

    try {
        // 获取错误对应的源代码
        const response = await axios.get(
            `${CONFIG.serverUrl}/api/error-location/error/${errorId}/source-code`,
            {
                timeout: 10000
            }
        );

        console.log('✅ 错误定位成功!');
        console.log('源代码信息:', JSON.stringify(response.data, null, 2));
        return response.data;

    } catch (error) {
        console.error('❌ 错误定位失败:', error.response?.data || error.message);
        return false;
    }
}

/**
 * 步骤4：测试批量错误解析
 */
async function testBatchResolve() {
    console.log('\n🚀 步骤4：测试批量错误解析...\n');

    const stackTraces = [
        {
            filename: 'src/pages/index/index.tsx',
            line: 25,
            column: 18
        },
        {
            filename: 'src/components/Header/index.tsx',
            line: 15,
            column: 10
        }
    ];

    try {
        const response = await axios.post(
            `${CONFIG.serverUrl}/api/error-location/batch-resolve`,
            {
                projectId: CONFIG.projectId,
                version: CONFIG.projectVersion,
                stackTraces
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        console.log('✅ 批量错误解析成功!');
        console.log('解析结果:', JSON.stringify(response.data, null, 2));
        return response.data;

    } catch (error) {
        console.error('❌ 批量错误解析失败:', error.response?.data || error.message);
        return false;
    }
}

/**
 * 步骤5：测试源代码查询
 */
async function testSourceCodeQuery() {
    console.log('\n🚀 步骤5：测试源代码查询...\n');

    try {
        // 查询版本列表
        const versionsResponse = await axios.get(
            `${CONFIG.serverUrl}/api/source-code-version/versions?projectId=${CONFIG.projectId}`,
            { timeout: 10000 }
        );

        console.log('✅ 版本列表查询成功!');
        console.log('版本数量:', versionsResponse.data.length);

        if (versionsResponse.data.length > 0) {
            const version = versionsResponse.data[0];

            // 查询文件列表
            const filesResponse = await axios.get(
                `${CONFIG.serverUrl}/api/source-code-version/files?projectId=${CONFIG.projectId}&version=${version.version}`,
                { timeout: 10000 }
            );

            console.log('✅ 文件列表查询成功!');
            console.log('文件数量:', filesResponse.data.length);

            if (filesResponse.data.length > 0) {
                const file = filesResponse.data.find(f => f.filePath.includes('index.tsx')) || filesResponse.data[0];

                // 查询文件内容
                const contentResponse = await axios.get(
                    `${CONFIG.serverUrl}/api/source-code-version/file-content/${CONFIG.projectId}/${version.version}?filePath=${encodeURIComponent(file.filePath)}`,
                    { timeout: 10000 }
                );

                console.log('✅ 文件内容查询成功!');
                console.log('文件路径:', file.filePath);
                console.log('文件大小:', contentResponse.data.content.length, '字符');
                console.log('文件内容预览:', contentResponse.data.content.substring(0, 200) + '...');
            }
        }

        return true;

    } catch (error) {
        console.error('❌ 源代码查询失败:', error.response?.data || error.message);
        return false;
    }
}

/**
 * 主测试函数
 */
async function runIntegrationTest() {
    console.log('🎯 错误监控源代码关联系统完整流程测试\n');
    console.log('配置信息:');
    console.log('  服务器地址:', CONFIG.serverUrl);
    console.log('  项目ID:', CONFIG.projectId);
    console.log('  项目版本:', CONFIG.projectVersion);
    console.log('  构建ID:', CONFIG.buildId);
    console.log('  Git提交:', CONFIG.gitCommit);
    console.log('='.repeat(60));

    let errorId = null;

    try {
        // 步骤1：上传源代码包
        const uploadResult = await uploadSourceCode();
        if (!uploadResult) {
            console.log('\n❌ 测试失败：源代码上传失败');
            return;
        }

        // 等待一下让服务器处理完成
        console.log('\n⏳ 等待服务器处理源代码...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 步骤2：模拟错误上报
        const errorResult = await reportError();
        if (!errorResult) {
            console.log('\n❌ 测试失败：错误上报失败');
            return;
        }
        errorId = errorResult.id;

        // 步骤3：测试错误定位功能
        const locationResult = await testErrorLocation(errorId);
        if (!locationResult) {
            console.log('\n❌ 测试失败：错误定位失败');
            return;
        }

        // 步骤4：测试批量错误解析
        const batchResult = await testBatchResolve();
        if (!batchResult) {
            console.log('\n❌ 测试失败：批量错误解析失败');
            return;
        }

        // 步骤5：测试源代码查询
        const queryResult = await testSourceCodeQuery();
        if (!queryResult) {
            console.log('\n❌ 测试失败：源代码查询失败');
            return;
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 所有测试通过！错误监控源代码关联系统运行正常！');
        console.log('\n📋 测试总结:');
        console.log('  ✅ 源代码上传功能正常');
        console.log('  ✅ 错误上报功能正常');
        console.log('  ✅ 错误定位功能正常');
        console.log('  ✅ 批量错误解析功能正常');
        console.log('  ✅ 源代码查询功能正常');

        console.log('\n🌐 管理后台访问地址:');
        console.log('  错误详情页面: http://localhost:3000/errors/' + errorId);
        console.log('  源代码管理页面: http://localhost:3000/source-code');

    } catch (error) {
        console.error('\n❌ 测试过程中出现未预期的错误:', error.message);
    }
}

// 执行测试
if (require.main === module) {
    runIntegrationTest().catch(console.error);
}

module.exports = {
    runIntegrationTest,
    uploadSourceCode,
    reportError,
    testErrorLocation,
    testBatchResolve,
    testSourceCodeQuery
};