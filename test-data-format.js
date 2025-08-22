/**
 * 测试数据上报格式修复
 * 验证前端发送的数据是否符合后端DTO格式要求
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
 * 测试单条数据上报 - ReportDataDto格式
 */
async function testSingleReport() {
    console.log('=== 测试单条数据上报 (ReportDataDto格式) ===');

    const testData = {
        projectId: config.projectId,
        type: 'jsError',
        errorMessage: 'Test error message',
        errorStack: 'Error stack trace',
        pageUrl: '/pages/index/index',
        userAgent: 'WeChat/8.0.0',
        deviceInfo: JSON.stringify({
            model: 'iPhone 12',
            system: 'iOS 15.0',
            platform: 'ios'
        }),
        networkInfo: JSON.stringify({
            networkType: 'wifi',
            isConnected: true
        }),
        performanceData: JSON.stringify([
            {
                entryType: 'script',
                name: 'evaluateScript',
                startTime: Date.now(),
                duration: 100
            }
        ]),
        extraData: JSON.stringify({
            customData: { test: 'value' },
            behavior: [],
            env: 1,
            sdkVersion: '1.0.0-taro'
        })
    };

    try {
        const response = await makeRequest(
            `${config.serverUrl}/api/monitor/report`,
            { method: 'POST' },
            testData
        );

        console.log('Response status:', response.statusCode);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.statusCode === 200) {
            console.log('✅ 单条数据上报成功');
            return { success: true };
        } else {
            console.log('❌ 单条数据上报失败');
            return { success: false, error: response.data };
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试批量数据上报 - ErrorLogDto格式
 */
async function testBatchReport() {
    console.log('\n=== 测试批量数据上报 (ErrorLogDto格式) ===');

    const testData = [
        {
            projectId: config.projectId,
            type: 'jsError',
            errorMessage: 'Batch test error 1',
            errorStack: 'Error stack trace 1',
            pageUrl: '/pages/index/index',
            userAgent: 'WeChat/8.0.0',
            deviceInfo: {
                model: 'iPhone 12',
                system: 'iOS 15.0',
                platform: 'ios'
            },
            networkInfo: {
                networkType: 'wifi',
                isConnected: true
            },
            breadcrumbs: [
                {
                    timestamp: Date.now(),
                    type: 'user',
                    category: 'ui',
                    message: 'User clicked button',
                    data: { buttonId: 'submit' }
                }
            ],
            extraData: {
                customData: { test: 'value1' },
                env: 1,
                sdkVersion: '1.0.0-taro'
            },
            timestamp: Date.now()
        },
        {
            projectId: config.projectId,
            type: 'httpError',
            errorMessage: 'Batch test error 2',
            requestUrl: 'https://api.example.com/data',
            requestMethod: 'GET',
            responseStatus: 500,
            duration: 3000,
            pageUrl: '/pages/list/list',
            userAgent: 'WeChat/8.0.0',
            deviceInfo: {
                model: 'iPhone 12',
                system: 'iOS 15.0',
                platform: 'ios'
            },
            networkInfo: {
                networkType: '4g',
                isConnected: true
            },
            extraData: {
                customData: { test: 'value2' },
                env: 1,
                sdkVersion: '1.0.0-taro'
            },
            timestamp: Date.now()
        }
    ];

    try {
        const response = await makeRequest(
            `${config.serverUrl}/api/error-logs/batch`,
            { method: 'POST' },
            testData
        );

        console.log('Response status:', response.statusCode);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.statusCode === 201 || response.statusCode === 200) {
            console.log('✅ 批量数据上报成功');
            return { success: true };
        } else {
            console.log('❌ 批量数据上报失败');
            return { success: false, error: response.data };
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试网络请求错误上报 - 单条数据 (ReportDataDto格式)
 */
async function testNetworkErrorSingleReport() {
    console.log('\n=== 测试网络请求错误上报 - 单条数据 (ReportDataDto格式) ===');

    const testData = {
        projectId: config.projectId,
        type: 'httpError',
        errorMessage: 'Network request failed: timeout of 5000ms exceeded',
        pageUrl: '/pages/order/order',
        userAgent: 'WeChat/8.0.0',
        requestUrl: 'https://api.example.com/orders',
        requestMethod: 'POST',
        responseStatus: 0, // 网络错误时状态码为0
        duration: 5000,
        deviceInfo: JSON.stringify({
            model: 'iPhone 13',
            system: 'iOS 16.0',
            platform: 'ios'
        }),
        networkInfo: JSON.stringify({
            networkType: '4g',
            isConnected: false // 网络连接异常
        }),
        extraData: JSON.stringify({
            customData: {
                userId: 'user_123',
                requestData: { orderId: '12345' }
            },
            behavior: [
                {
                    type: 'click',
                    time: Date.now() - 1000,
                    data: { element: 'submit-order-btn' }
                }
            ],
            env: 1,
            sdkVersion: '1.0.0-taro'
        })
    };

    try {
        const response = await makeRequest(
            `${config.serverUrl}/api/monitor/report`,
            { method: 'POST' },
            testData
        );

        console.log('Response status:', response.statusCode);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.statusCode === 200) {
            console.log('✅ 网络请求错误单条上报成功');
            return { success: true };
        } else {
            console.log('❌ 网络请求错误单条上报失败');
            return { success: false, error: response.data };
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试网络请求错误上报 - 批量数据 (ErrorLogDto格式)
 */
async function testNetworkErrorBatchReport() {
    console.log('\n=== 测试网络请求错误上报 - 批量数据 (ErrorLogDto格式) ===');

    const testData = [
        {
            projectId: config.projectId,
            type: 'httpError',
            errorMessage: 'Request failed with status 404',
            pageUrl: '/pages/product/detail',
            userAgent: 'WeChat/8.0.0',
            requestUrl: 'https://api.example.com/products/999',
            requestMethod: 'GET',
            responseStatus: 404,
            duration: 1200,
            deviceInfo: {
                model: 'Huawei P30',
                system: 'Android 10',
                platform: 'android'
            },
            networkInfo: {
                networkType: 'wifi',
                isConnected: true
            },
            breadcrumbs: [
                {
                    timestamp: Date.now() - 2000,
                    type: 'navigation',
                    category: 'route',
                    message: 'Navigate to product detail',
                    data: { from: '/pages/index', to: '/pages/product/detail' }
                },
                {
                    timestamp: Date.now() - 1000,
                    type: 'http',
                    category: 'request',
                    message: 'HTTP GET /products/999',
                    data: { url: 'https://api.example.com/products/999', method: 'GET' }
                }
            ],
            extraData: {
                customData: { productId: '999' },
                env: 1,
                sdkVersion: '1.0.0-taro'
            },
            timestamp: Date.now()
        },
        {
            projectId: config.projectId,
            type: 'httpError',
            errorMessage: 'Network timeout: ETIMEDOUT',
            pageUrl: '/pages/user/profile',
            userAgent: 'WeChat/8.0.0',
            requestUrl: 'https://api.example.com/user/profile',
            requestMethod: 'GET',
            responseStatus: 0, // 超时错误
            duration: 10000,
            deviceInfo: {
                model: 'iPhone 12 mini',
                system: 'iOS 15.2',
                platform: 'ios'
            },
            networkInfo: {
                networkType: '3g',
                isConnected: true
            },
            breadcrumbs: [
                {
                    timestamp: Date.now() - 5000,
                    type: 'user',
                    category: 'ui',
                    message: 'User tapped profile tab',
                    data: { tabIndex: 3 }
                },
                {
                    timestamp: Date.now() - 1000,
                    type: 'http',
                    category: 'request',
                    message: 'HTTP GET /user/profile',
                    data: { url: 'https://api.example.com/user/profile', timeout: 10000 }
                }
            ],
            extraData: {
                customData: {
                    userId: 'user_456',
                    retry_count: 2
                },
                env: 1,
                sdkVersion: '1.0.0-taro'
            },
            timestamp: Date.now()
        },
        {
            projectId: config.projectId,
            type: 'httpError',
            errorMessage: 'Server error: Internal Server Error',
            pageUrl: '/pages/payment/result',
            userAgent: 'WeChat/8.0.0',
            requestUrl: 'https://api.example.com/payment/confirm',
            requestMethod: 'POST',
            responseStatus: 500,
            duration: 3500,
            deviceInfo: {
                model: 'Xiaomi Mi 11',
                system: 'Android 11',
                platform: 'android'
            },
            networkInfo: {
                networkType: 'wifi',
                isConnected: true
            },
            breadcrumbs: [
                {
                    timestamp: Date.now() - 10000,
                    type: 'user',
                    category: 'ui',
                    message: 'User initiated payment',
                    data: { amount: 99.99, paymentMethod: 'wechat' }
                },
                {
                    timestamp: Date.now() - 5000,
                    type: 'http',
                    category: 'request',
                    message: 'HTTP POST /payment/create',
                    data: { url: 'https://api.example.com/payment/create', status: 200 }
                },
                {
                    timestamp: Date.now() - 1000,
                    type: 'http',
                    category: 'request',
                    message: 'HTTP POST /payment/confirm',
                    data: { url: 'https://api.example.com/payment/confirm' }
                }
            ],
            extraData: {
                customData: {
                    orderId: 'order_789',
                    paymentId: 'pay_123',
                    critical: true
                },
                env: 1,
                sdkVersion: '1.0.0-taro'
            },
            timestamp: Date.now()
        }
    ];

    try {
        const response = await makeRequest(
            `${config.serverUrl}/api/error-logs/batch`,
            { method: 'POST' },
            testData
        );

        console.log('Response status:', response.statusCode);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.statusCode === 201 || response.statusCode === 200) {
            console.log('✅ 网络请求错误批量上报成功');
            return { success: true };
        } else {
            console.log('❌ 网络请求错误批量上报失败');
            return { success: false, error: response.data };
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 测试各种类型的网络错误
 */
async function testVariousNetworkErrors() {
    console.log('\n=== 测试各种类型的网络错误 ===');

    const errorTypes = [
        {
            name: '连接超时',
            errorMessage: 'Connection timeout',
            responseStatus: 0,
            duration: 30000
        },
        {
            name: '连接被拒绝',
            errorMessage: 'Connection refused',
            responseStatus: 0,
            duration: 100
        },
        {
            name: '域名解析失败',
            errorMessage: 'DNS resolution failed',
            responseStatus: 0,
            duration: 5000
        },
        {
            name: '服务器错误',
            errorMessage: 'Internal Server Error',
            responseStatus: 500,
            duration: 2000
        },
        {
            name: '网关超时',
            errorMessage: 'Gateway Timeout',
            responseStatus: 504,
            duration: 60000
        }
    ];

    const results = [];

    for (const errorType of errorTypes) {
        const testData = {
            projectId: config.projectId,
            type: 'httpError',
            errorMessage: errorType.errorMessage,
            pageUrl: '/pages/test/network',
            userAgent: 'WeChat/8.0.0',
            requestUrl: 'https://api.example.com/test',
            requestMethod: 'GET',
            responseStatus: errorType.responseStatus,
            duration: errorType.duration,
            deviceInfo: JSON.stringify({
                model: 'Test Device',
                system: 'Test OS',
                platform: 'test'
            }),
            networkInfo: JSON.stringify({
                networkType: 'wifi',
                isConnected: true
            }),
            extraData: JSON.stringify({
                customData: { testType: errorType.name },
                behavior: [],
                env: 1,
                sdkVersion: '1.0.0-taro'
            })
        };

        try {
            const response = await makeRequest(
                `${config.serverUrl}/api/monitor/report`,
                { method: 'POST' },
                testData
            );

            if (response.statusCode === 200) {
                console.log(`✅ ${errorType.name} 错误上报成功`);
                results.push({ name: errorType.name, success: true });
            } else {
                console.log(`❌ ${errorType.name} 错误上报失败`);
                results.push({ name: errorType.name, success: false, error: response.data });
            }
        } catch (error) {
            console.log(`❌ ${errorType.name} 错误上报异常:`, error.message);
            results.push({ name: errorType.name, success: false, error: error.message });
        }
    }

    return results;
}

// 运行测试
if (require.main === module) {
    runTests().catch(error => {
        console.error('测试运行失败:', error);
        process.exit(1);
    });
}

module.exports = {
    testSingleReport,
    testBatchReport,
    testNetworkErrorSingleReport,
    testNetworkErrorBatchReport,
    testVariousNetworkErrors,
    runTests
};

/**
 * 运行所有测试
 */
async function runTests() {
    console.log('开始测试数据上报格式修复...\n');

    const results = [];

    // 测试单条上报
    const singleResult = await testSingleReport();
    results.push({ name: '单条数据上报', ...singleResult });

    // 测试批量上报
    const batchResult = await testBatchReport();
    results.push({ name: '批量数据上报', ...batchResult });

    // 测试网络请求错误 - 单条上报
    const networkSingleResult = await testNetworkErrorSingleReport();
    results.push({ name: '网络请求错误单条上报', ...networkSingleResult });

    // 测试网络请求错误 - 批量上报
    const networkBatchResult = await testNetworkErrorBatchReport();
    results.push({ name: '网络请求错误批量上报', ...networkBatchResult });

    // 测试各种类型的网络错误
    const variousNetworkResults = await testVariousNetworkErrors();
    results.push(...variousNetworkResults);

    // 总结
    console.log('\n=== 测试总结 ===');
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.success ? '成功' : '失败'}`);
        if (!result.success && result.error) {
            console.log(`   错误信息:`, result.error);
        }
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`\n总共 ${results.length} 项测试，成功 ${successCount} 项，失败 ${results.length - successCount} 项`);

    // 显示网络错误测试统计
    const networkErrorTests = results.filter(r => r.name.includes('网络') || r.name.includes('超时') || r.name.includes('连接') || r.name.includes('服务器') || r.name.includes('网关'));
    const networkSuccessCount = networkErrorTests.filter(r => r.success).length;
    console.log(`\n网络错误测试: ${networkSuccessCount}/${networkErrorTests.length} 项成功`);

    return results;
}