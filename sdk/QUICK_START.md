# Monitor SDK 快速开始指南

## 🚀 30秒快速开始

### 1. 选择合适的包

```bash
# 如果你的项目只使用Web平台
npm install @monitor/web-sdk

# 如果你的项目只使用Taro/小程序
npm install @monitor/taro-sdk

# 如果你需要多平台支持或不确定用哪个
npm install @monitor/sdk
```

### 2. 快速集成

#### Web项目（推荐使用 @monitor/web-sdk）

```javascript
import Monitor from "@monitor/web-sdk";

// 最简单的配置
Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",
});
```

#### Taro项目（推荐使用 @monitor/taro-sdk）

```javascript
import Monitor from "@monitor/taro-sdk";

Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",
});
```

#### 多平台项目（使用 @monitor/sdk）

```javascript
import Monitor from "@monitor/sdk";

// 自动检测环境并使用对应的SDK
Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",
});
```

## 📦 包说明

| 包名                | 体积  | 适用场景        | 说明                         |
| ------------------- | ----- | --------------- | ---------------------------- |
| `@monitor/web-sdk`  | ~15KB | 纯Web应用       | 只包含Web相关代码，体积最小  |
| `@monitor/taro-sdk` | ~12KB | Taro/小程序应用 | 只包含小程序相关代码         |
| `@monitor/sdk`      | ~20KB | 多平台/不确定   | 包含所有平台，自动检测环境   |
| `@monitor/core`     | ~8KB  | 自定义开发      | 只包含核心功能，用于二次开发 |

## 🎯 使用场景推荐

### 场景1：纯Web应用（React、Vue、Angular等）

**推荐：** `@monitor/web-sdk`

```bash
npm install @monitor/web-sdk
```

```javascript
import Monitor, { Templates } from "@monitor/web-sdk";

// 使用预设模板快速配置
const config = Templates.createConfig(Templates.WebBasic, {
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",
});

Monitor.init(config);
```

### 场景2：Taro应用

**推荐：** `@monitor/taro-sdk`

```bash
npm install @monitor/taro-sdk
```

```javascript
import Monitor, { Templates } from "@monitor/taro-sdk";

const config = Templates.createConfig(Templates.TaroBasic, {
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",
});

Monitor.init(config);
```

### 场景3：同时支持Web和小程序的项目

**推荐：** `@monitor/sdk`

```bash
npm install @monitor/sdk
```

```javascript
import Monitor from "@monitor/sdk";

// 在不同平台会自动使用对应的SDK
Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",
});
```

### 场景4：自定义开发

**推荐：** `@monitor/core` + 自定义适配器

```bash
npm install @monitor/core
```

```javascript
import { BaseManager } from "@monitor/core";
import { MyCustomAdapter } from "./my-adapter";

const monitor = new BaseManager(config, new MyCustomAdapter());
```

## 🔧 常用配置模板

### 开发环境

```javascript
import { Templates } from "@monitor/sdk";

const devConfig = Templates.createConfig(Templates.Development, {
  projectId: "your-project-id",
  serverUrl: "https://dev-api.com",
});
```

### 生产环境

```javascript
import { Templates } from "@monitor/sdk";

const prodConfig = Templates.createConfig(Templates.Production, {
  projectId: "your-project-id",
  serverUrl: "https://api.com",
});
```

### 电商应用

```javascript
import { Templates } from "@monitor/sdk";

const ecomConfig = Templates.createConfig(Templates.ECommerce, {
  projectId: "your-project-id",
  serverUrl: "https://api.com",
});
```

## 🛠️ 高级用法

### 条件性初始化

```javascript
import Monitor from "@monitor/sdk";

// 只在生产环境启用
if (process.env.NODE_ENV === "production") {
  Monitor.init({
    projectId: "your-project-id",
    serverUrl: "https://api.com",
  });
}
```

### 自定义配置

```javascript
import Monitor from "@monitor/sdk";

Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://api.com",

  // 错误监控配置
  error: {
    enabled: true,
    captureConsole: true,
    filters: [
      // 过滤掉特定错误
      (error) => !error.message.includes("Script error"),
    ],
  },

  // 性能监控配置
  performance: {
    enabled: true,
    captureNavigation: true,
    thresholds: {
      lcp: 2500, // LCP阈值
      fcp: 1800, // FCP阈值
    },
  },

  // 行为监控配置
  behavior: {
    enabled: true,
    captureClicks: true,
    sampleRate: 0.1, // 10%采样率
  },
});
```

### 手动上报

```javascript
import Monitor from "@monitor/sdk";

// 手动捕获错误
Monitor.captureError(new Error("Something went wrong"), {
  userId: "12345",
  extra: { context: "checkout" },
});

// 手动记录性能指标
Monitor.recordPerformance("api_call", {
  duration: 1200,
  success: true,
});

// 手动记录用户行为
Monitor.recordBehavior("button_click", {
  buttonId: "submit",
  page: "/checkout",
});
```

## 🔍 调试和监控

### 启用调试模式

```javascript
Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://api.com",
  debug: true, // 启用调试日志
});
```

### 检查SDK状态

```javascript
const status = Monitor.getStatus();
console.log("SDK状态:", status);
```

### 监听事件

```javascript
Monitor.on("error", (errorData) => {
  console.log("捕获到错误:", errorData);
});

Monitor.on("performance", (perfData) => {
  console.log("性能数据:", perfData);
});
```

## 🚨 常见问题

### Q: 我应该选择哪个包？

A:

- 纯Web应用 → `@monitor/web-sdk`
- 纯Taro/小程序 → `@monitor/taro-sdk`
- 多平台或不确定 → `@monitor/sdk`

### Q: 如何减少包体积？

A: 选择平台特定的包（web-sdk或taro-sdk）而不是主包

### Q: 如何在开发环境禁用监控？

A:

```javascript
if (process.env.NODE_ENV === "production") {
  Monitor.init(config);
}
```

### Q: 如何自定义上报频率？

A:

```javascript
Monitor.init({
  // ...其他配置
  report: {
    interval: 30000, // 30秒上报一次
    batchSize: 50, // 每次最多上报50条
  },
});
```

## 📝 更多资源

- [完整API文档](./API.md)
- [配置选项详解](./CONFIG.md)
- [平台适配指南](./PLATFORMS.md)
- [最佳实践](./BEST_PRACTICES.md)
- [故障排除](./TROUBLESHOOTING.md)
