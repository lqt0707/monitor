/**
 * Monitor SDK Taro 使用示例
 * 
 * 📦 安装：
 *   npm install @monitor/taro-sdk
 * 
 * 🚀 快速开始：
 *   import Monitor from '@monitor/taro-sdk'
 *   Monitor.init(config)
 */

import Taro from '@tarojs/taro';
import Monitor, { Templates } from '@monitor/taro-sdk';

// =============================================================================
// 示例1: 快速开始 - 推荐方式
// =============================================================================

export function quickStartExample() {
    // 最简单的使用方式
    const monitor = Monitor.quickStart.taro('your-project-id', 'https://your-api.com');

    console.log('🚀 Taro Monitor SDK 初始化完成');
    return monitor;
}

// =============================================================================
// 示例2: 使用配置模板
// =============================================================================

export function templateExample() {
    // 使用预设的Taro基础模板
    const config = Templates.createConfig(Templates.TaroBasic, {
        projectId: 'taro-demo-project',
        serverUrl: 'https://api.example.com',

        // 自定义覆盖配置
        debug: true,  // 开发环境启用调试
        tags: {
            version: '1.0.0',
            platform: 'miniprogram'
        }
    });

    const monitor = Monitor.init(config);

    console.log('📱 使用模板配置初始化完成');
    return monitor;
}

// =============================================================================
// 示例3: 完整自定义配置
// =============================================================================

export function customConfigExample() {
    const config = {
        projectId: 'taro-custom-project',
        serverUrl: 'https://api.example.com',

        // 错误监控配置
        error: {
            enabled: true,
            captureConsole: true,  // 捕获console错误
            maxErrors: 50,         // 小程序内存限制，减少队列大小
            filters: [
                // 过滤掉网络相关错误
                error => !error.message.includes('request:fail'),
                // 过滤掉Taro框架内部错误
                error => !error.stack?.includes('@tarojs')
            ]
        },

        // 性能监控配置
        performance: {
            enabled: true,
            capturePageLoad: true,     // 捕获页面加载性能
            captureNetworkTiming: true, // 捕获网络请求性能
            thresholds: {
                pageLoad: 3000,  // 页面加载时间阈值
                apiCall: 2000    // API调用时间阈值
            }
        },

        // 行为监控配置
        behavior: {
            enabled: true,
            capturePageViews: true,    // 页面访问
            captureTaps: true,         // 点击事件
            captureRouteChange: true,  // 路由变化
            captureShareAppMessage: true, // 分享行为
            sampleRate: 1.0  // 100%采样（小程序用户相对较少）
        },

        // 上报配置（针对小程序优化）
        report: {
            interval: 15000,  // 15秒上报一次（网络限制）
            batchSize: 10,    // 每次最多10条（减少包大小）
            maxRetries: 2,    // 最多重试2次
            timeout: 8000     // 8秒超时
        },

        // 自定义标签
        tags: {
            miniprogram: 'wechat',
            version: '2.1.0',
            channel: 'organic'
        }
    };

    const monitor = Monitor.init(config);

    console.log('🔧 使用自定义配置初始化完成');
    return monitor;
}

// =============================================================================
// 示例4: 在Taro App中集成
// =============================================================================

export class AppExample {

    // 在App.js中初始化
    componentDidMount() {
        this.initMonitor();
    }

    // 初始化监控
    async initMonitor() {
        try {
            // 只在正式环境启用
            if (process.env.NODE_ENV === 'production') {
                const config = Templates.createConfig(Templates.Production, {
                    projectId: 'my-miniprogram',
                    serverUrl: 'https://monitor-api.myapp.com'
                });

                const monitor = Monitor.init(config);

                // 监听SDK事件
                monitor.on('error', (errorData) => {
                    console.log('捕获到错误:', errorData);
                });

                monitor.on('performance', (perfData) => {
                    console.log('性能数据:', perfData);
                });

                console.log('✅ 监控SDK初始化成功');
            } else {
                console.log('🔧 开发环境，跳过监控初始化');
            }
        } catch (error) {
            console.error('❌ 监控SDK初始化失败:', error);
        }
    }
}

// =============================================================================
// 示例5: 在页面中使用
// =============================================================================

export class PageExample {

    componentDidShow() {
        // 记录页面访问
        this.trackPageView();
    }

    // 页面访问埋点
    trackPageView() {
        const monitor = Monitor.getInstance();
        if (monitor) {
            monitor.recordBehavior('page_view', {
                page: 'home',
                timestamp: Date.now(),
                source: 'navigation'
            });
        }
    }

    // 按钮点击埋点
    handleButtonTap = (e) => {
        const monitor = Monitor.getInstance();
        if (monitor) {
            monitor.recordBehavior('button_tap', {
                buttonId: e.currentTarget.id,
                page: 'home',
                position: { x: e.detail.x, y: e.detail.y }
            });
        }

        // 原有的业务逻辑
        this.doSomething();
    }

    // 异步操作性能监控
    async doAsyncOperation() {
        const startTime = Date.now();
        const monitor = Monitor.getInstance();

        try {
            // 执行异步操作
            const result = await this.callAPI();

            // 记录成功的性能数据
            if (monitor) {
                monitor.recordPerformance('api_call', {
                    duration: Date.now() - startTime,
                    success: true,
                    api: 'getUserInfo'
                });
            }

            return result;
        } catch (error) {
            // 记录失败的性能数据
            if (monitor) {
                monitor.recordPerformance('api_call', {
                    duration: Date.now() - startTime,
                    success: false,
                    api: 'getUserInfo',
                    error: error.message
                });

                // 同时捕获错误
                monitor.captureError(error, {
                    context: 'async_operation',
                    api: 'getUserInfo'
                });
            }

            throw error;
        }
    }

    // 模拟API调用
    async callAPI() {
        return new Promise((resolve, reject) => {
            Taro.request({
                url: 'https://api.example.com/user',
                success: resolve,
                fail: reject
            });
        });
    }
}

// =============================================================================
// 示例6: 手动埋点和监控
// =============================================================================

export class ManualTrackingExample {

    // 手动捕获错误
    captureCustomError() {
        const monitor = Monitor.getInstance();

        try {
            // 可能出错的代码
            this.riskyOperation();
        } catch (error) {
            // 手动捕获并添加上下文信息
            if (monitor) {
                monitor.captureError(error, {
                    userId: this.getUserId(),
                    page: 'profile',
                    action: 'update_avatar',
                    extra: {
                        deviceInfo: Taro.getSystemInfoSync(),
                        networkType: this.getNetworkType()
                    }
                });
            }
        }
    }

    // 记录自定义性能指标
    recordCustomPerformance() {
        const monitor = Monitor.getInstance();

        if (monitor) {
            monitor.recordPerformance('image_upload', {
                duration: 2300,
                fileSize: 1024 * 500, // 500KB
                success: true,
                uploadSpeed: 217.4 // KB/s
            });
        }
    }

    // 记录用户行为轨迹
    recordUserBehavior() {
        const monitor = Monitor.getInstance();

        if (monitor) {
            monitor.recordBehavior('user_interaction', {
                type: 'swipe',
                direction: 'left',
                page: 'product_list',
                itemIndex: 3,
                timestamp: Date.now()
            });
        }
    }

    // 批量上报
    async flushData() {
        const monitor = Monitor.getInstance();

        if (monitor) {
            try {
                await monitor.flush();
                console.log('✅ 数据上报成功');
            } catch (error) {
                console.error('❌ 数据上报失败:', error);
            }
        }
    }

    // 获取SDK状态
    getSDKStatus() {
        const monitor = Monitor.getInstance();

        if (monitor) {
            const status = monitor.getStatus();
            console.log('📊 SDK状态:', status);
            return status;
        }

        return null;
    }

    // 工具方法
    getUserId() {
        return Taro.getStorageSync('userId') || 'anonymous';
    }

    getNetworkType() {
        return Taro.getNetworkType().networkType;
    }

    riskyOperation() {
        // 模拟可能出错的操作
        throw new Error('模拟业务错误');
    }
}

// =============================================================================
// 示例7: 环境区分和条件初始化
// =============================================================================

export function conditionalInit() {
    // 根据不同环境使用不同配置
    const isDev = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        // 生产环境：完整监控
        const config = Templates.createConfig(Templates.Production, {
            projectId: 'prod-miniprogram',
            serverUrl: 'https://monitor-api.myapp.com'
        });

        Monitor.init(config);
        console.log('🚀 生产环境监控已启用');

    } else if (isDev) {
        // 开发环境：只监控错误，启用调试
        const config = Templates.createConfig(Templates.Development, {
            projectId: 'dev-miniprogram',
            serverUrl: 'https://dev-monitor-api.myapp.com'
        });

        Monitor.init(config);
        console.log('🔧 开发环境监控已启用');

    } else {
        console.log('⏭️  测试环境，跳过监控');
    }
}

// =============================================================================
// 示例8: 错误处理和降级策略
// =============================================================================

export function robustInit() {
    try {
        const config = {
            projectId: 'robust-example',
            serverUrl: 'https://api.example.com',

            // 启用错误上报，但设置合理的限制
            error: {
                enabled: true,
                maxErrors: 20,  // 限制错误数量
                throttle: 1000  // 错误节流：1秒内相同错误只记录一次
            },

            // 性能监控采样
            performance: {
                enabled: true,
                sampleRate: 0.1  // 10%采样率，减少性能影响
            },

            // 保守的上报策略
            report: {
                interval: 30000,  // 30秒上报一次
                batchSize: 5,     // 小批量上报
                maxRetries: 1,    // 减少重试次数
                timeout: 5000     // 5秒超时
            }
        };

        const monitor = Monitor.init(config);

        // 监听初始化错误
        monitor.on('error', (error) => {
            // 可以在这里实现错误降级策略
            console.warn('监控系统错误:', error);
        });

        return monitor;

    } catch (error) {
        console.error('监控SDK初始化失败，将继续运行业务逻辑:', error);

        // 返回一个空的监控对象，避免业务代码出错
        return {
            captureError: () => { },
            recordPerformance: () => { },
            recordBehavior: () => { },
            flush: () => Promise.resolve(),
            getStatus: () => ({ initialized: false })
        };
    }
}

// =============================================================================
// 导出所有示例
// =============================================================================

export default {
    quickStartExample,
    templateExample,
    customConfigExample,
    AppExample,
    PageExample,
    ManualTrackingExample,
    conditionalInit,
    robustInit
};