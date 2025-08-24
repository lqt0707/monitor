/**
 * Monitor SDK 快速开始配置模板
 * 提供常见场景的预设配置，让用户快速上手
 */

/**
 * 基础Web应用配置模板
 */
export const WebBasicTemplate = {
    // 基础配置
    projectId: '',  // 用户需要填入
    serverUrl: '',  // 用户需要填入

    // 推荐的Web配置
    error: {
        enabled: true,
        captureConsole: true,
        captureUnhandledRejection: true,
        maxErrors: 100
    },
    performance: {
        enabled: true,
        captureNavigation: true,
        captureResourceTiming: true,
        captureLCP: true,
        captureFCP: true
    },
    behavior: {
        enabled: true,
        captureClicks: true,
        capturePageViews: true,
        captureFormSubmits: true
    },
    report: {
        interval: 10000,
        batchSize: 20,
        maxRetries: 3
    }
};

/**
 * 电商应用配置模板
 */
export const ECommerceTemplate = {
    ...WebBasicTemplate,
    behavior: {
        enabled: true,
        captureClicks: true,
        capturePageViews: true,
        captureFormSubmits: true,
        // 电商特有的行为追踪
        customEvents: [
            'product_view',
            'add_to_cart',
            'checkout_start',
            'purchase_complete'
        ]
    },
    performance: {
        ...WebBasicTemplate.performance,
        // 电商应用更关注加载性能
        captureResourceTiming: true,
        captureNavigationTiming: true
    }
};

/**
 * Taro小程序配置模板
 */
export const TaroBasicTemplate = {
    projectId: '',
    serverUrl: '',

    error: {
        enabled: true,
        captureConsole: true,
        maxErrors: 50  // 小程序内存限制，减少队列大小
    },
    performance: {
        enabled: true,
        capturePageLoad: true,
        captureNetworkTiming: true
    },
    behavior: {
        enabled: true,
        capturePageViews: true,
        captureTaps: true,
        captureRouteChange: true
    },
    report: {
        interval: 15000,  // 小程序网络限制，增加上报间隔
        batchSize: 10,
        maxRetries: 2
    }
};

/**
 * 开发环境配置模板
 */
export const DevelopmentTemplate = {
    ...WebBasicTemplate,
    // 开发环境配置
    debug: true,
    error: {
        ...WebBasicTemplate.error,
        captureConsole: true,
        logLevel: 'debug'
    },
    report: {
        interval: 5000,  // 更频繁的上报用于调试
        batchSize: 5,
        maxRetries: 1
    }
};

/**
 * 生产环境配置模板
 */
export const ProductionTemplate = {
    ...WebBasicTemplate,
    // 生产环境配置
    debug: false,
    error: {
        ...WebBasicTemplate.error,
        logLevel: 'error'
    },
    report: {
        interval: 30000,  // 生产环境减少上报频率
        batchSize: 50,
        maxRetries: 5
    }
};

/**
 * 创建配置的辅助函数
 * @param template 配置模板
 * @param overrides 自定义覆盖配置
 * @returns 最终配置
 */
export function createConfig(template, overrides = {}) {
    return {
        ...template,
        ...overrides,
        // 深度合并对象配置
        error: { ...template.error, ...overrides.error },
        performance: { ...template.performance, ...overrides.performance },
        behavior: { ...template.behavior, ...overrides.behavior },
        report: { ...template.report, ...overrides.report }
    };
}

/**
 * 验证配置是否完整
 * @param config 配置对象
 * @returns 验证结果
 */
export function validateConfig(config) {
    const errors = [];

    if (!config.projectId) {
        errors.push('projectId is required');
    }

    if (!config.serverUrl) {
        errors.push('serverUrl is required');
    }

    if (config.serverUrl && !config.serverUrl.startsWith('http')) {
        errors.push('serverUrl must be a valid HTTP/HTTPS URL');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// 导出所有模板
export const Templates = {
    WebBasic: WebBasicTemplate,
    ECommerce: ECommerceTemplate,
    TaroBasic: TaroBasicTemplate,
    Development: DevelopmentTemplate,
    Production: ProductionTemplate
};

export default Templates;