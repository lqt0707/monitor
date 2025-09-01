# Monitor SDK 故障排除指南

## 🚨 常见问题快速解决

### 1. 安装和引入问题

#### 问题：包安装失败

```bash
npm ERR! 404 Not Found - GET https://registry.npmjs.org/@monitor%2fsdk
```

**解决方案：**

```bash
# 确保包名正确
npm install @monitor/sdk

# 如果是私有包，配置registry
npm config set registry https://your-private-registry.com

# 清除缓存重试
npm cache clean --force
npm install
```

#### 问题：TypeScript类型错误

```typescript
// Error: Cannot find module '@monitor/sdk' or its corresponding type declarations
```

**解决方案：**

```typescript
// 1. 确保安装了类型定义
npm install @types/node

// 2. 在tsconfig.json中配置
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}

// 3. 使用明确的导入语法
import Monitor from '@monitor/sdk';
// 或
import * as Monitor from '@monitor/sdk';
```

#### 问题：模块解析错误

```javascript
// Error: Module not found: Can't resolve '@monitor/sdk'
```

**解决方案：**

```bash
# 1. 检查package.json中的依赖
"dependencies": {
  "@monitor/sdk": "^1.0.0"
}

# 2. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 3. 如果使用yarn
rm -rf node_modules yarn.lock
yarn install
```

### 2. 环境检测问题

#### 问题：环境检测失败

```
❌ 不支持的运行环境！
```

**解决方案：**

```javascript
// 1. 检查环境变量
console.log("Environment check:", {
  hasWindow: typeof window !== "undefined",
  hasDocument: typeof document !== "undefined",
  hasTaro: typeof globalThis !== "undefined" && globalThis.Taro,
  hasWx: typeof wx !== "undefined",
});

// 2. 使用平台特定的包
// Web环境
import Monitor from "@monitor/web-sdk";

// Taro环境
import Monitor from "@monitor/taro-sdk";

// 3. 手动指定平台
import Monitor from "@monitor/sdk";
Monitor.web.init(config); // 强制使用Web SDK
Monitor.taro.init(config); // 强制使用Taro SDK
```

#### 问题：Taro环境检测错误

```
Taro is not properly initialized
```

**解决方案：**

```javascript
// 1. 确保Taro已正确安装
npm install @tarojs/taro

// 2. 在Taro应用中使用
import Taro from '@tarojs/taro';
import Monitor from '@monitor/taro-sdk';

// 3. 检查Taro版本兼容性
// 支持Taro 3.0+
```

### 3. 初始化问题

#### 问题：配置验证失败

```
❌ projectId 是必需的
❌ serverUrl 是必需的
```

**解决方案：**

```javascript
// 确保提供必需的配置
Monitor.init({
  projectId: "your-project-id", // 必需
  serverUrl: "https://api.com", // 必需
  // ... 其他可选配置
});

// 使用配置验证
import { validateConfig } from "@monitor/sdk";

const config = {
  /* 你的配置 */
};
const validation = validateConfig(config);

if (!validation.valid) {
  console.error("配置错误:", validation.errors);
}
```

#### 问题：重复初始化

```
SDK already initialized, returning existing instance
```

**解决方案：**

```javascript
// 1. 检查是否已初始化
const instance = Monitor.getInstance();
if (!instance) {
  Monitor.init(config);
}

// 2. 或者先销毁再初始化
Monitor.destroy();
Monitor.init(newConfig);

// 3. 使用单例模式
let monitorInstance = null;

function getMonitor() {
  if (!monitorInstance) {
    monitorInstance = Monitor.init(config);
  }
  return monitorInstance;
}
```

### 4. 构建和打包问题

#### 问题：Webpack构建错误

```
Module parse failed: Unexpected token
```

**解决方案：**

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, "node_modules/@monitor")],
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
};
```

#### 问题：Rollup构建错误

```
'default' is not exported by node_modules/@monitor/sdk/index.js
```

**解决方案：**

```javascript
// rollup.config.js
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  plugins: [
    nodeResolve({
      preferBuiltins: false,
      browser: true,
    }),
    commonjs({
      include: ["node_modules/@monitor/**"],
    }),
  ],
};
```

#### 问题：Vite构建问题

```
Failed to resolve import "@monitor/sdk"
```

**解决方案：**

```javascript
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    include: ["@monitor/sdk"],
  },
  resolve: {
    alias: {
      "@monitor/sdk": "@monitor/sdk/dist/index.esm.js",
    },
  },
});
```

### 5. 运行时错误

#### 问题：网络请求失败

```
Failed to send data: Network error
```

**解决方案：**

```javascript
// 1. 检查服务器URL
const config = {
  serverUrl: "https://your-api.com", // 确保URL正确且可访问

  // 2. 配置重试和超时
  report: {
    maxRetries: 3,
    timeout: 10000,
    interval: 15000,
  },
};

// 3. 添加错误处理
Monitor.on("reportError", (error) => {
  console.error("上报失败:", error);
  // 可以实现降级策略
});
```

#### 问题：内存泄漏

```
Memory usage keeps growing
```

**解决方案：**

```javascript
// 1. 限制队列大小
Monitor.init({
  // ... 其他配置
  report: {
    maxQueueSize: 100, // 限制队列大小
    interval: 10000, // 及时上报
  },
});

// 2. 定期清理
setInterval(() => {
  Monitor.flush();
}, 30000);

// 3. 页面卸载时清理
window.addEventListener("beforeunload", () => {
  Monitor.destroy();
});
```

#### 问题：性能影响

```
监控SDK导致页面卡顿
```

**解决方案：**

```javascript
// 1. 启用采样
Monitor.init({
  performance: {
    enabled: true,
    sampleRate: 0.1, // 10%采样率
  },
  behavior: {
    enabled: true,
    sampleRate: 0.2, // 20%采样率
  },
});

// 2. 使用节流
Monitor.init({
  error: {
    enabled: true,
    throttle: 1000, // 1秒内相同错误只记录一次
  },
});

// 3. 延迟初始化
setTimeout(() => {
  Monitor.init(config);
}, 1000);
```

### 6. 小程序特有问题

#### 问题：小程序网络限制

```
request:fail 网络请求失败
```

**解决方案：**

```javascript
// 1. 配置服务器域名白名单
// 在小程序后台添加 request 合法域名

// 2. 调整上报策略
Monitor.init({
  report: {
    interval: 30000, // 延长上报间隔
    batchSize: 5, // 减少批量大小
    maxRetries: 1, // 减少重试次数
    timeout: 8000, // 适当的超时时间
  },
});

// 3. 错误降级
Monitor.on("reportError", (error) => {
  // 将数据存储到本地，稍后重试
  wx.setStorageSync("pending_monitor_data", data);
});
```

#### 问题：小程序包大小限制

```
小程序包大小超限
```

**解决方案：**

```bash
# 1. 使用Taro专用包
npm uninstall @monitor/sdk
npm install @monitor/taro-sdk

# 2. 启用代码分割
# 在webpack配置中
optimization: {
  splitChunks: {
    cacheGroups: {
      monitor: {
        test: /[\\/]node_modules[\\/]@monitor/,
        name: 'monitor',
        chunks: 'all'
      }
    }
  }
}
```

### 7. 调试技巧

#### 启用调试模式

```javascript
Monitor.init({
  debug: true, // 启用详细日志
  // ... 其他配置
});
```

#### 检查SDK状态

```javascript
// 获取详细状态信息
const status = Monitor.getStatus();
console.log("SDK状态:", status);

// 检查兼容性
const compatibility = Monitor.checkCompatibility();
console.log("兼容性检查:", compatibility);
```

#### 手动测试

```javascript
// 测试错误捕获
Monitor.captureError(new Error("测试错误"), {
  test: true,
});

// 测试性能记录
Monitor.recordPerformance("test_metric", {
  duration: 100,
  success: true,
});

// 测试行为记录
Monitor.recordBehavior("test_behavior", {
  action: "click",
  target: "button",
});

// 立即上报
Monitor.flush()
  .then(() => {
    console.log("数据上报成功");
  })
  .catch((error) => {
    console.error("数据上报失败:", error);
  });
```

## 🔧 高级调试

### 1. 网络请求调试

```javascript
// 监听所有网络事件
Monitor.on("reportStart", (data) => {
  console.log("开始上报:", data);
});

Monitor.on("reportSuccess", (data) => {
  console.log("上报成功:", data);
});

Monitor.on("reportError", (error) => {
  console.error("上报失败:", error);
});
```

### 2. 性能分析

```javascript
// 分析SDK性能影响
const startTime = performance.now();

Monitor.init(config);

const initTime = performance.now() - startTime;
console.log(`SDK初始化耗时: ${initTime}ms`);

// 监控队列大小
setInterval(() => {
  const status = Monitor.getStatus();
  if (status.queue.size > 50) {
    console.warn("队列大小过大:", status.queue.size);
  }
}, 5000);
```

### 3. 错误分析

```javascript
// 分析错误模式
let errorCount = 0;
let errorTypes = {};

Monitor.on("error", (errorData) => {
  errorCount++;
  const type = errorData.type || "unknown";
  errorTypes[type] = (errorTypes[type] || 0) + 1;

  console.log(`错误统计 - 总数: ${errorCount}, 类型分布:`, errorTypes);
});
```

## 📞 获取帮助

### 1. 在线资源

- [完整文档](./README.md)
- [API参考](./API.md)
- [最佳实践](./BEST_PRACTICES.md)
- [示例代码](./examples/)

### 2. 社区支持

- [GitHub Issues](https://github.com/your-org/monitor/issues)
- [讨论区](https://github.com/your-org/monitor/discussions)

### 3. 快速诊断

```bash
# 运行内置的帮助命令
npm run help

# 或在代码中调用
Monitor.help();
```

### 4. 联系我们

如果以上方案都无法解决你的问题，请通过以下方式联系我们：

- 📧 邮箱：monitor-support@yourcompany.com
- 💬 微信群：扫描README中的二维码
- 🐛 Bug反馈：[创建Issue](https://github.com/your-org/monitor/issues/new)

提交问题时，请包含以下信息：

- 使用的包名和版本
- 完整的错误信息
- 复现步骤
- 环境信息（浏览器、Node版本等）
- 相关配置代码
