/**
 * 网络请求错误测试脚本
 * 专门测试各种网络请求错误情况的数据上报
 */

const http = require('http');

// 测试配置
const config = {
    serverUrl: 'http://localhost:3001',
    projectId: 'taromini',
};

/**
 * 发送HTTP请求的工具函数
 */
function makeRequest(url, options = {}, data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        };

        let jsonData = '';
        if (data && typeof data === 'object') {
            jsonData = JSON.stringify(data);
            requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

        const req = http.request(requestOptions, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (jsonData) {
            req.write(jsonData);
        }

        req.end();
    });
}

/**
 * 生成网络错误测试数据
 */
function generateNetworkErrorData(errorType, options = {}) {
    const baseData = {
        projectId: config.projectId,
        type: 'httpError',
        pageUrl: options.pageUrl || '/pages/test/network',
        userAgent: 'WeChat/8.0.0',
        requestUrl: options.requestUrl || 'https://api.example.com/test',
        requestMethod: options.requestMethod || 'GET',
        deviceInfo: {
            model: 'iPhone 13',
            system: 'iOS 16.0',
            platform: 'ios'
        },
        networkInfo: {
            networkType: options.networkType || 'wifi',
            isConnected: options.isConnected !== undefined ? options.isConnected : true
        },
        timestamp: Date.now()
    };

    switch (errorType) {
        case 'timeout':
            return {
                ...baseData,
                errorMessage: 'Request timeout: ETIMEDOUT',
                responseStatus: 0,
                duration: options.duration || 30000,
                breadcrumbs: [
                    {
                        timestamp: Date.now() - 30000,
                        type: 'http',
                        category: 'request',
                        message: 'HTTP request started',
                        data: { url: baseData.requestUrl, timeout: 30000 }
                    },
                    {
                        timestamp: Date.now() - 1000,
                        type: 'error',
                        category: 'network',
                        message: 'Request timeout',
                        data: { duration: 30000 }
                    }
                ],
                extraData: {
                    customData: { errorType: 'timeout', retryCount: 0 },
                    env: 1,
                    sdkVersion: '1.0.0-taro'
                }
            };

        case 'connection_refused':
            return {
                ...baseData,
                errorMessage: 'Connection refused: ECONNREFUSED',
                responseStatus: 0,
                duration: 100,
                breadcrumbs: [
                    {
                        timestamp: Date.now() - 1000,
                        type: 'http',
                        category: 'request',
                        message: 'HTTP request started',
                        data: { url: baseData.requestUrl }
                    },
                    {
                        timestamp: Date.now() - 100,
                        type: 'error',
                        category: 'network',
                        message: 'Connection refused',
                        data: { code: 'ECONNREFUSED' }
                    }
                ],
                extraData: {
                    customData: { errorType: 'connection_refused' },
                    env: 1,
                    sdkVersion: '1.0.0-taro'
                }
            };

        case 'dns_error':
            return {
                ...baseData,
                errorMessage: 'DNS resolution failed: ENOTFOUND',
                responseStatus: 0,
                duration: 5000,
                breadcrumbs: [
                    {
                        timestamp: Date.now() - 5000,
                        type: 'http',
                        category: 'request',
                        message: 'HTTP request started',
                        data: { url: baseData.requestUrl }
                    },
                    {
                        timestamp: Date.now() - 1000,
                        type: 'error',
                        category: 'network',
                        message: 'DNS resolution failed',
                        data: { code: 'ENOTFOUND', hostname: 'nonexistent.example.com' }
                    }
                ],
                extraData: {
                    customData: { errorType: 'dns_error' },
                    env: 1,
                    sdkVersion: '1.0.0-taro'
                }
            };

        case 'server_error':
            return {
                ...baseData,
                errorMessage: 'Internal Server Error',
                responseStatus: 500,
                duration: 2000,
                breadcrumbs: [
                    {
                        timestamp: Date.now() - 2000,
                        type: 'http',
                        category: 'request',
                        message: 'HTTP request started',
                        data: { url: baseData.requestUrl }
                    },
                    {
                        timestamp: Date.now() - 100,
                        type: 'http',
                        category: 'response',
                        message: 'HTTP response received',
                        data: { status: 500, statusText: 'Internal Server Error' }
                    }
                ],
                extraData: {
                    customData: { errorType: 'server_error' },
                    env: 1,
                    sdkVersion: '1.0.0-taro'
                }
            };

        case 'bad_gateway':
            return {
                ...baseData,
                errorMessage: 'Bad Gateway',
                responseStatus: 502,
                duration: 15000,
                breadcrumbs: [
                    {
                        timestamp: Date.now() - 15000,
                        type: 'http',
                        category: 'request',
                        message: 'HTTP request started',
                        data: { url: baseData.requestUrl }
                    },
                    {
                        timestamp: Date.now() - 100,
                        type: 'http',
                        category: 'response',
                        message: 'HTTP response received',
                        data: { status: 502, statusText: 'Bad Gateway' }
                    }
                ],
                extraData: {
                    customData: { errorType: 'bad_gateway' },
                    env: 1,
                    sdkVersion: '1.0.0-taro'
                }
            };

        case 'gateway_timeout':
            return {
                ...baseData,
                errorMessage: 'Gateway Timeout',
                responseStatus: 504,
                duration: 60000,
                breadcrumbs: [
                    {
                        timestamp: Date.now() - 60000,
                        type: 'http',
                        category: 'request',
                        message: 'HTTP request started',
                        data: { url: baseData.requestUrl, timeout: 60000 }
                    },
                    {
                        timestamp: Date.now() - 100,
                        type: 'http',
                        category: 'response',
                        message: 'HTTP response received',
                        data: { status: 504, statusText: 'Gateway Timeout' }
                    }
                ],
                extraData: {
                    customData: { errorType: 'gateway_timeout' },
                    env: 1,
                    sdkVersion: '1.0.0-taro'
                }
            };

        case 'network_offline':
            return {
                ...baseData,
                errorMessage: 'Network is offline',
                responseStatus: 0,
                duration: 0,
                networkInfo: {
                    networkType: 'none',
                    isConnected: false
                },
                breadcrumbs: [
                    {
                        timestamp: Date.now() - 1000,
                        type: 'network',
                        category: 'state',
                        message: 'Network state changed',
                        data: { isConnected: false, networkType: 'none' }
                    },
                    {
                        timestamp: Date.now() - 500,
                        type: 'http',
                        category: 'request',
                        message: 'HTTP request attempted',
                        data: { url: baseData.requestUrl }
                    },
                    {
                        timestamp: Date.now() - 100,
                        type: 'error',
                        category: 'network',
                        message: 'Network offline error',
                        data: { code: 'NETWORK_OFFLINE' }
                    }
                ],
                extraData: {
                    customData: { errorType: 'network_offline' },
                    env: 1,
                    sdkVersion: '1.0.0-taro'
                }
            };

        default:
            throw new Error(`Unknown error type: ${errorType}`);
    }
}

/**
 * 测试单个网络错误类型
 */
async function testNetworkErrorType(errorType, options = {}) {
    console.log(`\n--- 测试 ${errorType} 错误 ---`);

    const testData = generateNetworkErrorData(errorType, options);

    // 转换为 ReportDataDto 格式（单条上报）
    const reportData = {
        projectId: testData.projectId,
        type: testData.type,
        errorMessage: testData.errorMessage,
        pageUrl: testData.pageUrl,
        userAgent: testData.userAgent,
        requestUrl: testData.requestUrl,
        requestMethod: testData.requestMethod,
        responseStatus: testData.responseStatus,
        duration: testData.duration,
        deviceInfo: JSON.stringify(testData.deviceInfo),
        networkInfo: JSON.stringify(testData.networkInfo),
        extraData: JSON.stringify({
            breadcrumbs: testData.breadcrumbs,
            ...testData.extraData
        })
    };

    try {
        const response = await makeRequest(
            `${config.serverUrl}/api/monitor/report`,
            { method: 'POST' },
            reportData
        );

        if (response.statusCode === 200) {
            console.log(`✅ ${errorType} 错误上报成功`);
            return { success: true, errorType };
        } else {
            console.log(`❌ ${errorType} 错误上报失败:`, response.data);
            return { success: false, errorType, error: response.data };
        }
    } catch (error) {
        console.log(`❌ ${errorType} 错误上报异常:`, error.message);
        return { success: false, errorType, error: error.message };
    }
}

/**
 * 测试批量网络错误上报
 */
async function testBatchNetworkErrors() {
    console.log('\n=== 测试批量网络错误上报 ===');

    const errorTypes = [
        'timeout',
        'connection_refused',
        'server_error',
        'gateway_timeout'
    ];

    const testData = errorTypes.map(errorType =>
        generateNetworkErrorData(errorType, {
            pageUrl: `/pages/batch-test/${errorType}`,
            requestUrl: `https://api.example.com/batch-test/${errorType}`
        })
    );

    try {
        const response = await makeRequest(
            `${config.serverUrl}/api/error-logs/batch`,
            { method: 'POST' },
            testData
        );

        if (response.statusCode === 201 || response.statusCode === 200) {
            console.log('✅ 批量网络错误上报成功');
            return { success: true };
        } else {
            console.log('❌ 批量网络错误上报失败:', response.data);
            return { success: false, error: response.data };
        }
    } catch (error) {
        console.log('❌ 批量网络错误上报异常:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试不同网络环境下的错误
 */
async function testNetworkEnvironments() {
    console.log('\n=== 测试不同网络环境下的错误 ===');

    const environments = [
        { networkType: 'wifi', scenario: 'WiFi环境超时' },
        { networkType: '4g', scenario: '4G网络错误' },
        { networkType: '3g', scenario: '3G慢网络' },
        { networkType: '2g', scenario: '2G极慢网络' },
        { networkType: 'none', isConnected: false, scenario: '无网络连接' }
    ];

    const results = [];

    for (const env of environments) {
        const result = await testNetworkErrorType('timeout', {
            networkType: env.networkType,
            isConnected: env.isConnected,
            duration: env.networkType === '2g' ? 45000 : 30000,
            pageUrl: `/pages/network-test/${env.networkType}`,
            requestUrl: `https://api.example.com/test/${env.networkType}`
        });

        result.scenario = env.scenario;
        results.push(result);
    }

    return results;
}

/**
 * 测试业务场景中的网络错误
 */
async function testBusinessScenarioErrors() {
    console.log('\n=== 测试业务场景中的网络错误 ===');

    const scenarios = [
        {
            name: '用户登录',
            errorType: 'server_error',
            options: {
                pageUrl: '/pages/login/login',
                requestUrl: 'https://api.example.com/auth/login',
                requestMethod: 'POST'
            }
        },
        {
            name: '商品详情加载',
            errorType: 'timeout',
            options: {
                pageUrl: '/pages/product/detail',
                requestUrl: 'https://api.example.com/products/12345',
                requestMethod: 'GET'
            }
        },
        {
            name: '支付确认',
            errorType: 'gateway_timeout',
            options: {
                pageUrl: '/pages/payment/confirm',
                requestUrl: 'https://api.example.com/payment/confirm',
                requestMethod: 'POST'
            }
        },
        {
            name: '订单提交',
            errorType: 'bad_gateway',
            options: {
                pageUrl: '/pages/order/create',
                requestUrl: 'https://api.example.com/orders',
                requestMethod: 'POST'
            }
        },
        {
            name: '图片上传',
            errorType: 'connection_refused',
            options: {
                pageUrl: '/pages/upload/image',
                requestUrl: 'https://upload.example.com/images',
                requestMethod: 'POST'
            }
        }
    ];

    const results = [];

    for (const scenario of scenarios) {
        console.log(`\n--- 测试业务场景: ${scenario.name} ---`);
        const result = await testNetworkErrorType(scenario.errorType, scenario.options);
        result.scenario = scenario.name;
        results.push(result);
    }

    return results;
}

/**
 * 运行所有网络错误测试
 */
async function runAllNetworkErrorTests() {
    console.log('🌐 开始网络请求错误测试...\n');

    const allResults = [];

    // 基础网络错误类型测试
    console.log('=== 基础网络错误类型测试 ===');
    const basicErrorTypes = [
        'timeout',
        'connection_refused',
        'dns_error',
        'server_error',
        'bad_gateway',
        'gateway_timeout',
        'network_offline'
    ];

    for (const errorType of basicErrorTypes) {
        const result = await testNetworkErrorType(errorType);
        allResults.push(result);
    }

    // 批量网络错误测试
    const batchResult = await testBatchNetworkErrors();
    allResults.push({ ...batchResult, errorType: 'batch_errors' });

    // 不同网络环境测试
    const envResults = await testNetworkEnvironments();
    allResults.push(...envResults);

    // 业务场景测试
    const businessResults = await testBusinessScenarioErrors();
    allResults.push(...businessResults);

    // 显示总结
    console.log('\n=== 网络错误测试总结 ===');
    const successCount = allResults.filter(r => r.success).length;
    console.log(`总共 ${allResults.length} 项测试，成功 ${successCount} 项，失败 ${allResults.length - successCount} 项\n`);

    // 按类别显示结果
    console.log('📊 测试结果详情:');
    allResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const scenario = result.scenario || result.errorType;
        console.log(`${status} ${scenario}`);
        if (!result.success && result.error) {
            console.log(`   错误: ${JSON.stringify(result.error)}`);
        }
    });

    // 分类统计
    const basicTests = allResults.filter(r => basicErrorTypes.includes(r.errorType));
    const businessTests = allResults.filter(r => r.scenario && !r.scenario.includes('环境'));
    const environmentTests = allResults.filter(r => r.scenario && r.scenario.includes('环境'));

    console.log('\n📈 分类统计:');
    console.log(`基础错误类型: ${basicTests.filter(r => r.success).length}/${basicTests.length} 成功`);
    console.log(`业务场景: ${businessTests.filter(r => r.success).length}/${businessTests.length} 成功`);
    console.log(`网络环境: ${environmentTests.filter(r => r.success).length}/${environmentTests.length} 成功`);

    return allResults;
}

// 运行测试
if (require.main === module) {
    runAllNetworkErrorTests().catch(error => {
        console.error('网络错误测试运行失败:', error);
        process.exit(1);
    });
}

module.exports = {
    generateNetworkErrorData,
    testNetworkErrorType,
    testBatchNetworkErrors,
    testNetworkEnvironments,
    testBusinessScenarioErrors,
    runAllNetworkErrorTests
};