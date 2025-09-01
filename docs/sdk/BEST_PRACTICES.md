# Monitor SDK 最佳实践指南

## 🎯 包选择策略

### 🥇 推荐方案

| 项目类型         | 推荐包              | 理由               | 体积  |
| ---------------- | ------------------- | ------------------ | ----- |
| **纯Web应用**    | `@monitor/web-sdk`  | 体积最小，功能专精 | ~15KB |
| **纯Taro小程序** | `@monitor/taro-sdk` | 针对小程序优化     | ~12KB |
| **多平台项目**   | `@monitor/sdk`      | 自动检测，统一API  | ~20KB |
| **自定义开发**   | `@monitor/core`     | 最大灵活性         | ~8KB  |

### 📊 决策流程图

```
你的项目类型？
├── 只有Web端
│   └── 选择 @monitor/web-sdk ✅
├── 只有小程序
│   └── 选择 @monitor/taro-sdk ✅
├── Web + 小程序
│   ├── 共用代码库 → @monitor/sdk
│   └── 分离代码库 → 各用专用包
└── 需要自定义适配器
    └── 选择 @monitor/core
```

## ⚙️ 配置最佳实践

### 🚀 快速开始配置

```javascript
// Web项目 - 30秒配置
import Monitor from "@monitor/web-sdk";

Monitor.quickStart.web("your-project-id", "https://your-api.com");
```

```javascript
// Taro项目 - 30秒配置
import Monitor from "@monitor/taro-sdk";

Monitor.quickStart.taro("your-project-id", "https://your-api.com");
```

### 📋 使用配置模板

```javascript
import Monitor, { Templates } from "@monitor/web-sdk";

// 根据环境选择模板
const template =
  process.env.NODE_ENV === "production"
    ? Templates.Production
    : Templates.Development;

const config = Templates.createConfig(template, {
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",

  // 自定义覆盖
  tags: {
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
  },
});

Monitor.init(config);
```

### 🎛️ 环境分离策略

```javascript
// config/monitor.js
const configs = {
  development: {
    projectId: "dev-project",
    serverUrl: "https://dev-api.com",
    debug: true,
    error: { maxErrors: 10 },
    report: { interval: 5000 },
  },

  staging: {
    projectId: "staging-project",
    serverUrl: "https://staging-api.com",
    debug: false,
    performance: { sampleRate: 0.5 },
  },

  production: {
    projectId: "prod-project",
    serverUrl: "https://api.com",
    debug: false,
    performance: { sampleRate: 0.1 },
    behavior: { sampleRate: 0.05 },
  },
};

export default configs[process.env.NODE_ENV] || configs.development;
```

## 🔧 初始化最佳实践

### ✅ 推荐的初始化方式

```javascript
// 1. 条件性初始化
if (process.env.NODE_ENV === "production") {
  Monitor.init(productionConfig);
}

// 2. 异步初始化（避免阻塞主线程）
setTimeout(() => {
  Monitor.init(config);
}, 100);

// 3. 错误处理
try {
  Monitor.init(config);
} catch (error) {
  console.warn("监控初始化失败，继续正常业务流程");
  // 不要让监控失败影响业务逻辑
}
```

### ❌ 不推荐的做法

```javascript
// ❌ 同步初始化可能阻塞页面
Monitor.init(config); // 直接在主线程执行

// ❌ 在所有环境都启用
Monitor.init(config); // 开发环境不需要完整监控

// ❌ 没有错误处理
Monitor.init(config); // 如果失败会影响业务
```

## 📊 性能优化

### 🎯 采样策略

```javascript
const config = {
  // 根据用户等级调整采样率
  performance: {
    enabled: true,
    sampleRate: isVipUser() ? 1.0 : 0.1, // VIP用户100%，普通用户10%
  },

  // 错误监控不采样（重要性高）
  error: {
    enabled: true,
    sampleRate: 1.0,
  },

  // 行为分析适度采样
  behavior: {
    enabled: true,
    sampleRate: 0.2, // 20%采样率
  },
};
```

### ⚡ 延迟加载策略

```javascript
// 页面关键内容加载完成后再初始化监控
window.addEventListener("load", () => {
  // 延迟1秒，确保页面稳定
  setTimeout(() => {
    Monitor.init(config);
  }, 1000);
});

// 或在用户首次交互后初始化
let monitorInitialized = false;
function initMonitorOnce() {
  if (!monitorInitialized) {
    Monitor.init(config);
    monitorInitialized = true;
  }
}

document.addEventListener("click", initMonitorOnce, { once: true });
document.addEventListener("scroll", initMonitorOnce, { once: true });
```

### 🔄 队列管理

```javascript
const config = {
  report: {
    // 根据网络状况调整
    interval: navigator.connection?.effectiveType === "4g" ? 10000 : 30000,

    // 限制队列大小防止内存泄漏
    maxQueueSize: 100,

    // 批量大小平衡性能和实时性
    batchSize: navigator.connection?.effectiveType === "4g" ? 20 : 5,

    // 合理的重试策略
    maxRetries: 3,
    timeout: 8000,
  },
};
```

## 🛡️ 错误处理最佳实践

### 🎯 智能过滤

```javascript
const config = {
  error: {
    enabled: true,
    filters: [
      // 过滤第三方脚本错误
      (error) => !error.message.includes("Script error"),

      // 过滤网络错误（通常不是代码问题）
      (error) => !error.message.includes("Network request failed"),

      // 过滤开发工具相关错误
      (error) => !error.stack?.includes("webpack"),
      (error) => !error.stack?.includes("chrome-extension"),

      // 过滤低价值错误
      (error) => error.message.length > 10, // 太短的错误信息通常无用

      // 频率限制：相同错误1分钟内只记录一次
      (() => {
        const errorCache = new Map();
        return (error) => {
          const key = error.message + error.stack?.substring(0, 100);
          const now = Date.now();
          const lastTime = errorCache.get(key);

          if (!lastTime || now - lastTime > 60000) {
            errorCache.set(key, now);
            return true;
          }
          return false;
        };
      })(),
    ],
  },
};
```

### 📝 增强错误信息

```javascript
// 自定义错误捕获
function captureEnhancedError(error, context = {}) {
  Monitor.captureError(error, {
    // 用户信息
    userId: getCurrentUserId(),
    userAgent: navigator.userAgent,

    // 页面信息
    url: window.location.href,
    referrer: document.referrer,
    timestamp: Date.now(),

    // 环境信息
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },

    // 业务上下文
    ...context,
  });
}

// 使用示例
try {
  riskyOperation();
} catch (error) {
  captureEnhancedError(error, {
    operation: "user_checkout",
    step: "payment_processing",
    amount: orderAmount,
  });
}
```

## 📈 性能监控最佳实践

### ⏱️ 关键性能指标

```javascript
const config = {
  performance: {
    enabled: true,

    // Web Vitals 阈值设置
    thresholds: {
      // 最大内容绘制时间
      lcp: 2500, // 好: <2.5s, 需改进: 2.5-4s, 差: >4s

      // 首次内容绘制
      fcp: 1800, // 好: <1.8s, 需改进: 1.8-3s, 差: >3s

      // 累积布局偏移
      cls: 0.1, // 好: <0.1, 需改进: 0.1-0.25, 差: >0.25

      // 首次输入延迟
      fid: 100, // 好: <100ms, 需改进: 100-300ms, 差: >300ms
    },

    // 自定义性能监控
    customMetrics: [
      "api_response_time",
      "component_render_time",
      "route_change_time",
    ],
  },
};

// 手动记录关键业务性能
async function trackApiCall(apiName, apiCall) {
  const startTime = performance.now();

  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;

    Monitor.recordPerformance("api_call", {
      name: apiName,
      duration,
      success: true,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    Monitor.recordPerformance("api_call", {
      name: apiName,
      duration,
      success: false,
      error: error.message,
      timestamp: Date.now(),
    });

    throw error;
  }
}
```

## 👤 用户行为分析

### 📊 智能埋点策略

```javascript
// 自动埋点装饰器
function autoTrack(eventName, getExtraData) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args) {
      const startTime = Date.now();
      const result = originalMethod.apply(this, args);

      // 记录行为
      Monitor.recordBehavior(eventName, {
        method: propertyKey,
        duration: Date.now() - startTime,
        args: args.length,
        ...getExtraData?.(),
      });

      return result;
    };

    return descriptor;
  };
}

// 使用示例
class ShoppingCart {
  @autoTrack("add_to_cart", () => ({ page: "product_detail" }))
  addItem(item) {
    // 业务逻辑
  }

  @autoTrack("checkout", () => ({ cart_value: this.getTotalValue() }))
  checkout() {
    // 业务逻辑
  }
}
```

### 🎯 页面访问追踪

```javascript
// 单页应用路由监听
function trackPageViews() {
  let currentPage = window.location.pathname;

  // 监听路由变化
  const observer = new MutationObserver(() => {
    const newPage = window.location.pathname;
    if (newPage !== currentPage) {
      Monitor.recordBehavior("page_view", {
        from: currentPage,
        to: newPage,
        timestamp: Date.now(),
        referrer: document.referrer,
      });
      currentPage = newPage;
    }
  });

  observer.observe(document, { childList: true, subtree: true });

  // 监听浏览器前进后退
  window.addEventListener("popstate", () => {
    Monitor.recordBehavior("page_view", {
      page: window.location.pathname,
      type: "navigation",
      timestamp: Date.now(),
    });
  });
}
```

## 🔒 隐私和安全

### 🛡️ 数据脱敏

```javascript
const config = {
  // 自动脱敏敏感数据
  dataProcessor: (data) => {
    // 移除敏感信息
    if (data.url) {
      data.url = data.url.replace(
        /([?&])(password|token|key)=[^&]*/gi,
        "$1$2=***"
      );
    }

    // 脱敏用户输入
    if (data.inputValue) {
      data.inputValue = data.inputValue.replace(/\d{4,}/g, "****");
    }

    return data;
  },

  // 设置用户ID哈希
  userId: hashUserId(realUserId), // 而不是直接使用真实ID

  // 限制错误堆栈信息
  error: {
    stackTraceLimit: 10, // 限制堆栈深度
    excludeSourceMaps: true, // 生产环境不包含源码映射
  },
};
```

### 🔐 安全传输

```javascript
const config = {
  // 使用HTTPS
  serverUrl: "https://api.com", // 而不是 http://

  // API密钥管理
  apiKey: process.env.MONITOR_API_KEY, // 从环境变量读取

  // 请求加密
  encryption: {
    enabled: true,
    algorithm: "AES-256-GCM",
  },
};
```

## 🧪 测试和调试

### 🔍 开发环境调试

```javascript
// 开发环境增强配置
const devConfig = {
  debug: true,

  // 详细日志
  logLevel: "debug",

  // 实时上报便于调试
  report: {
    interval: 1000,
    batchSize: 1,
  },

  // 监听所有事件
  onError: (error) => console.log("Error captured:", error),
  onPerformance: (perf) => console.log("Performance:", perf),
  onBehavior: (behavior) => console.log("Behavior:", behavior),
};

if (process.env.NODE_ENV === "development") {
  Monitor.init(devConfig);
}
```

### ✅ 功能验证

```javascript
// 验证监控功能
function validateMonitoring() {
  console.log("🧪 验证监控功能...");

  // 1. 测试错误捕获
  Monitor.captureError(new Error("测试错误"), { test: true });

  // 2. 测试性能记录
  Monitor.recordPerformance("test_metric", {
    duration: 100,
    test: true,
  });

  // 3. 测试行为记录
  Monitor.recordBehavior("test_behavior", {
    action: "validate",
    test: true,
  });

  // 4. 检查状态
  const status = Monitor.getStatus();
  console.log("监控状态:", status);

  // 5. 立即上报测试数据
  Monitor.flush().then(() => {
    console.log("✅ 监控功能验证完成");
  });
}

// 在开发环境自动验证
if (process.env.NODE_ENV === "development") {
  setTimeout(validateMonitoring, 2000);
}
```

## 📱 小程序特殊考虑

### 🎯 小程序优化配置

```javascript
// Taro小程序配置
const miniProgramConfig = {
  // 较小的队列大小（内存限制）
  report: {
    maxQueueSize: 50,
    batchSize: 5,
    interval: 15000, // 较长的上报间隔
  },

  // 减少错误数量限制
  error: {
    maxErrors: 20,
  },

  // 保守的性能监控
  performance: {
    sampleRate: 0.1,
    excludeResourceTiming: true, // 小程序资源时序API有限
  },

  // 针对小程序的行为追踪
  behavior: {
    capturePageViews: true,
    captureTaps: true,
    captureShareAppMessage: true,
    captureRouteChange: true,
  },
};
```

### 📡 网络适配

```javascript
// 小程序网络状况适配
function getNetworkOptimizedConfig() {
  return Taro.getNetworkType().then(({ networkType }) => {
    const baseConfig = {
      /* 基础配置 */
    };

    if (networkType === "wifi") {
      return {
        ...baseConfig,
        report: { interval: 10000, batchSize: 10 },
      };
    } else if (networkType === "4g") {
      return {
        ...baseConfig,
        report: { interval: 20000, batchSize: 5 },
      };
    } else {
      // 2g/3g或未知网络
      return {
        ...baseConfig,
        report: { interval: 60000, batchSize: 2 },
        performance: { enabled: false }, // 禁用性能监控节省流量
        behavior: { sampleRate: 0.1 },
      };
    }
  });
}

// 使用网络优化配置
getNetworkOptimizedConfig().then((config) => {
  Monitor.init(config);
});
```

## 📊 监控数据分析

### 📈 关键指标设置

```javascript
// 设置业务关键指标阈值
const businessMetrics = {
  // 页面性能阈值
  page_load_time: { good: 2000, warning: 5000 },

  // API响应时间阈值
  api_response_time: { good: 500, warning: 2000 },

  // 错误率阈值
  error_rate: { good: 0.01, warning: 0.05 }, // 1%和5%

  // 用户满意度指标
  user_satisfaction: { good: 0.95, warning: 0.85 },
};

// 自动告警
Monitor.on("performance", (data) => {
  const metric = businessMetrics[data.name];
  if (metric && data.duration > metric.warning) {
    // 发送告警
    sendAlert(`性能指标 ${data.name} 超出阈值: ${data.duration}ms`);
  }
});
```

## 🔄 升级和迁移

### 📦 包升级策略

```javascript
// 版本兼容性检查
if (Monitor.version < "2.0.0") {
  console.warn("建议升级到最新版本以获得更好的性能");
}

// 渐进式升级
const isNewVersion = semver.gte(Monitor.version, "2.0.0");

const config = {
  // 新版本特性
  ...(isNewVersion && {
    newFeature: {
      enabled: true,
    },
  }),

  // 向后兼容
  legacySupport: !isNewVersion,
};
```

---

## 🎯 总结

**核心原则：**

1. **选对包** - 优先使用平台专用包
2. **环境分离** - 不同环境使用不同配置
3. **性能优先** - 监控不应影响业务性能
4. **智能采样** - 平衡数据完整性和性能
5. **隐私安全** - 保护用户隐私数据
6. **错误降级** - 监控失败不影响业务

**快速检查清单：**

- [ ] 选择了合适的包
- [ ] 配置了环境分离
- [ ] 设置了合理的采样率
- [ ] 添加了错误过滤
- [ ] 实现了数据脱敏
- [ ] 验证了监控功能
- [ ] 设置了性能阈值
- [ ] 考虑了网络优化

遵循这些最佳实践，你将获得一个高效、安全、可靠的前端监控系统！
