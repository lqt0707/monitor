/**
 * Monitor SDK - 多平台前端监控SDK统一入口
 * 
 * 📦 推荐使用方式：
 * 
 * Web项目（推荐）：
 *   npm install @monitor/web-sdk
 *   import Monitor from '@monitor/web-sdk'
 * 
 * Taro项目（推荐）：
 *   npm install @monitor/taro-sdk  
 *   import Monitor from '@monitor/taro-sdk'
 * 
 * 多平台项目：
 *   npm install @monitor/sdk
 *   import Monitor from '@monitor/sdk'
 *   Monitor.init(config) // 自动检测环境
 * 
 * 🚀 快速开始：
 *   import Monitor, { Templates } from '@monitor/sdk'
 *   const config = Templates.createConfig(Templates.WebBasic, {
 *     projectId: 'your-project-id',
 *     serverUrl: 'https://your-api.com'
 *   })
 *   Monitor.init(config)
 */

// 导入配置模板
export * from './templates.js';

// 导入各平台SDK
let WebMonitorSDK, TaroMonitorSDK;

// 延迟加载以避免不必要的依赖
function loadWebSDK() {
  if (!WebMonitorSDK) {
    try {
      WebMonitorSDK = require('./web-core').WebMonitorSDK;
    } catch (error) {
      const message = `
🚨 Web SDK加载失败！

建议解决方案：
1. 如果你只需要Web功能，推荐使用：
   npm uninstall @monitor/sdk
   npm install @monitor/web-sdk
   
2. 或者确保当前包完整安装：
   npm install @monitor/sdk --force
   
📚 查看完整文档：./QUICK_START.md
`;
      console.error(message);
      throw new Error('Web SDK not available. ' + error.message);
    }
  }
  return WebMonitorSDK;
}

function loadTaroSDK() {
  if (!TaroMonitorSDK) {
    try {
      TaroMonitorSDK = require('./taro-core').TaroMonitorSDK;
    } catch (error) {
      const message = `
🚨 Taro SDK加载失败！

建议解决方案：
1. 如果你只需要Taro功能，推荐使用：
   npm uninstall @monitor/sdk
   npm install @monitor/taro-sdk
   
2. 或者确保当前包完整安装：
   npm install @monitor/sdk --force
   
📚 查看完整文档：./QUICK_START.md
`;
      console.error(message);
      throw new Error('Taro SDK not available. ' + error.message);
    }
  }
  return TaroMonitorSDK;
}

// 环境检测工具
export const Environment = {
  isWeb: () => typeof window !== 'undefined' && typeof document !== 'undefined',
  isTaro: () => typeof globalThis !== 'undefined' && globalThis.Taro,
  isMiniProgram: () =>
    typeof wx !== 'undefined' ||
    typeof my !== 'undefined' ||
    typeof swan !== 'undefined',
  isNode: () =>
    typeof process !== 'undefined' && process.versions && process.versions.node,
};

// 自动检测环境并返回对应的SDK
function autoDetectSDK(config) {
  // 配置验证
  if (!config) {
    throw new Error('❌ 配置对象不能为空。请查看 ./QUICK_START.md 获取帮助。');
  }

  if (!config.projectId) {
    throw new Error('❌ projectId 是必需的。请在配置中添加 projectId。');
  }

  if (!config.serverUrl) {
    throw new Error('❌ serverUrl 是必需的。请在配置中添加 serverUrl。');
  }

  console.log('🚀 Monitor SDK 正在初始化...');

  if (Environment.isTaro()) {
    console.log('📱 检测到 Taro 环境');
    const SDK = loadTaroSDK();
    return SDK.init(config);
  }

  if (Environment.isWeb()) {
    console.log('🌐 检测到 Web 环境');
    const SDK = loadWebSDK();
    return SDK.init(config);
  }

  const envInfo = {
    hasWindow: typeof window !== 'undefined',
    hasDocument: typeof document !== 'undefined',
    hasTaro: typeof globalThis !== 'undefined' && globalThis.Taro,
    hasWx: typeof wx !== 'undefined',
    hasProcess: typeof process !== 'undefined'
  };

  const message = `
❌ 不支持的运行环境！

当前环境信息：
${JSON.stringify(envInfo, null, 2)}

建议解决方案：
1. Web 环境：使用 @monitor/web-sdk
2. Taro 环境：使用 @monitor/taro-sdk
3. 自定义环境：使用 @monitor/core

📚 查看完整文档：./QUICK_START.md
`;

  console.error(message);
  throw new Error('Unsupported environment.');
}

// 平台特定的SDK接口
const web = {
  init: (config) => {
    const SDK = loadWebSDK();
    return SDK.init(config);
  },
  getInstance: () => {
    const SDK = loadWebSDK();
    return SDK.getInstance();
  },
  destroy: () => {
    const SDK = loadWebSDK();
    return SDK.destroy();
  }
};

const taro = {
  init: (config) => {
    const SDK = loadTaroSDK();
    return SDK.init(config);
  },
  getInstance: () => {
    const SDK = loadTaroSDK();
    return SDK.getInstance();
  },
  destroy: () => {
    const SDK = loadTaroSDK();
    return SDK.destroy();
  }
};

// 兼容性检查
export function checkCompatibility() {
  const issues = [];

  if (Environment.isWeb()) {
    if (!window.Promise) {
      issues.push('Promise is required for Web SDK');
    }
    if (!window.fetch && !window.XMLHttpRequest) {
      issues.push('fetch or XMLHttpRequest is required for Web SDK');
    }
  }

  if (Environment.isTaro()) {
    try {
      const Taro = globalThis.Taro;
      if (!Taro.request) {
        issues.push('Taro.request is required for Taro SDK');
      }
    } catch {
      issues.push('Taro is not properly initialized');
    }
  }

  return {
    compatible: issues.length === 0,
    issues,
  };
}

// 便捷方法
const quickStart = {
  /**
   * Web应用快速开始
   * @param {string} projectId 项目ID
   * @param {string} serverUrl 服务器地址
   * @param {Object} options 额外配置
   * @returns SDK实例
   */
  web: (projectId, serverUrl, options = {}) => {
    const { Templates } = require('./templates.js');
    const config = Templates.createConfig(Templates.WebBasic, {
      projectId,
      serverUrl,
      ...options
    });
    return web.init(config);
  },

  /**
   * Taro应用快速开始
   * @param {string} projectId 项目ID
   * @param {string} serverUrl 服务器地址
   * @param {Object} options 额外配置
   * @returns SDK实例
   */
  taro: (projectId, serverUrl, options = {}) => {
    const { Templates } = require('./templates.js');
    const config = Templates.createConfig(Templates.TaroBasic, {
      projectId,
      serverUrl,
      ...options
    });
    return taro.init(config);
  }
};

// 主要API
const Monitor = {
  // 自动检测环境初始化
  init: autoDetectSDK,

  // 快速开始方法
  quickStart,

  // 平台特定接口
  web,
  taro,

  // 工具函数
  Environment,
  checkCompatibility,

  // 版本信息
  version: '__VERSION__',

  // 帮助信息
  help: () => {
    console.log(`
📚 Monitor SDK 帮助信息

🚀 快速开始：
  Monitor.quickStart.web('项目ID', 'https://api.com')
  Monitor.quickStart.taro('项目ID', 'https://api.com')

📦 推荐包选择：
  Web项目：npm install @monitor/web-sdk
  Taro项目：npm install @monitor/taro-sdk

📖 完整文档：./QUICK_START.md
🐛 问题反馈：https://github.com/your-org/monitor/issues
`);
  }
};

// 按需导出（支持树摇优化）
export const WebSDK = {
  init: web.init,
  getInstance: web.getInstance,
  destroy: web.destroy
};

export const TaroSDK = {
  init: taro.init,
  getInstance: taro.getInstance,
  destroy: taro.destroy
};

// 兼容性导出
export const createMonitorSDK = autoDetectSDK;
export const version = '__VERSION__';

// 默认导出
export default Monitor;