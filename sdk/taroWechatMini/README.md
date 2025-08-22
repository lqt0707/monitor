# @monitor/taro-wechat-mini-sdk

[![npm version](https://badge.fury.io/js/%40monitor%2Ftaro-wechat-mini-sdk.svg)](https://badge.fury.io/js/%40monitor%2Ftaro-wechat-mini-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

专为Taro框架和原生微信小程序设计的全功能监控SDK，提供错误追踪、性能监控、行为分析等完整的监控解决方案。

## ✨ 特性

- 🔄 **双环境兼容**: 同时支持Taro框架和原生微信小程序
- 📊 **性能监控**: 页面性能数据收集和分析
- 🌐 **网络监控**: HTTP请求拦截和慢请求检测
- 🐛 **错误监控**: JavaScript错误和未处理Promise拒绝捕获
- 👆 **行为监控**: 用户交互行为追踪
- 📱 **系统信息**: 设备和网络状态监控
- 🎯 **TypeScript支持**: 完整的类型定义
- 📦 **轻量级**: 打包后体积小，对应用性能影响最小

## 📦 安装

```bash
npm install @monitor/taro-wechat-mini-sdk
# 或
yarn add @monitor/taro-wechat-mini-sdk
# 或
pnpm add @monitor/taro-wechat-mini-sdk
```

## 🚀 快速开始

### Taro项目中使用

```typescript
import { initTaroMonitor, TrackerEvents } from '@monitor/taro-wechat-mini-sdk';

// 在app.tsx中初始化
const monitor = initTaroMonitor({
  env: 'dev', // 'dev' | 'sandbox' | 'production'
  httpTimeout: 5000, // 慢请求阈值(ms)
  error: {
    random: 1, // 错误采样率 0-1
    filters: [/ignore-error/] // 错误过滤规则
  },
  behavior: {
    queueLimit: 20, // 行为队列限制
    methodWhiteList: [], // 方法白名单
    methodBlackList: [] // 方法黑名单
  },
  performance: {
    watch: true, // 是否监控性能
    queueLimit: 20 // 性能数据队列限制
  }
});

// 监听事件
monitor.on(TrackerEvents.jsError, (error) => {
  console.log('JavaScript错误:', error);
});

monitor.on(TrackerEvents.httpError, (error) => {
  console.log('HTTP错误:', error);
});

monitor.on(TrackerEvents.performanceInfo, (perf) => {
  console.log('性能数据:', perf);
});
```

### 原生微信小程序中使用

```javascript
// 在app.js中引入
const { Monitor, TrackerEvents } = require('@monitor/taro-wechat-mini-sdk');

// 初始化监控
const monitor = Monitor.init({
  env: 'production',
  httpTimeout: 3000,
  isSystemInfo: true,
  isNetwork: true
});

// 设置自定义数据
monitor.setCustomData({
  userId: '12345',
  version: '1.0.0'
});

// 监听所有事件
monitor.on('*', (eventType, data) => {
  // 发送到你的监控服务
  wx.request({
    url: 'https://your-monitor-api.com/report',
    method: 'POST',
    data: {
      type: eventType,
      data: data,
      timestamp: Date.now()
    }
  });
});
```

## 📋 API文档

### 初始化方法

#### `initTaroMonitor(options)` - Taro专用

为Taro项目优化的初始化方法，包含Taro环境的默认配置。

#### `Monitor.init(options)` - 通用方法

通用的初始化方法，适用于所有环境。

### 配置选项

```typescript
interface IMonitorOptions {
  env?: 'dev' | 'sandbox' | 'production'; // 环境
  httpTimeout?: number; // HTTP超时阈值(ms)
  isSystemInfo?: boolean; // 是否收集系统信息
  isNetwork?: boolean; // 是否监控网络状态
  
  // 错误监控配置
  error?: {
    filters?: RegExp[]; // 错误过滤规则
    random?: number; // 采样率 0-1
  };
  
  // 行为监控配置
  behavior?: {
    isFilterConsole?: boolean; // 是否过滤console
    queueLimit?: number; // 队列限制
    methodWhiteList?: string[]; // 方法白名单
    methodBlackList?: string[]; // 方法黑名单
  };
  
  // 性能监控配置
  performance?: {
    watch?: boolean; // 是否启用
    queueLimit?: number; // 队列限制
  };
}
```

### 事件类型

```typescript
enum TrackerEvents {
  jsError = 'jsError', // JavaScript错误
  reqError = 'reqError', // 请求错误
  httpError = 'httpError', // HTTP错误
  slowHttpRequest = 'slowHttpRequest', // 慢请求
  performanceInfo = 'performanceInfo', // 性能信息
  performanceInfoReady = 'performanceInfoReady', // 性能数据就绪
  behaviorInfo = 'behaviorInfo', // 行为信息
  systemInfo = 'systemInfo', // 系统信息
  networkInfo = 'networkInfo' // 网络信息
}
```

### 实例方法

#### `monitor.setCustomData(data: Record<string, any>)`

设置自定义数据，会附加到所有监控事件中。

```javascript
monitor.setCustomData({
  userId: '12345',
  version: '1.0.0',
  channel: 'wechat'
});
```

#### `monitor.on(event: string, callback: Function)`

监听特定事件。

```javascript
// 监听特定事件
monitor.on(TrackerEvents.jsError, (error) => {
  console.log('捕获到错误:', error);
});

// 监听所有事件
monitor.on('*', (eventType, data) => {
  console.log('事件类型:', eventType, '数据:', data);
});
```

#### `monitor.off(event: string, callback?: Function)`

取消事件监听。

```javascript
monitor.off(TrackerEvents.jsError); // 取消所有jsError监听
monitor.off(TrackerEvents.jsError, specificCallback); // 取消特定回调
```

## 🔧 高级用法

### 自定义错误过滤

```javascript
const monitor = Monitor.init({
  error: {
    filters: [
      /Script error/,
      /Non-Error promise rejection captured/,
      /ResizeObserver loop limit exceeded/
    ],
    random: 0.1 // 只采样10%的错误
  }
});
```

### 性能监控配置

```javascript
const monitor = Monitor.init({
  performance: {
    watch: true,
    queueLimit: 50 // 最多保存50条性能数据
  }
});
```

### 行为追踪配置

```javascript
const monitor = Monitor.init({
  behavior: {
    isFilterConsole: true, // 过滤console行为
    methodWhiteList: ['tap', 'input'], // 只追踪这些方法
    queueLimit: 100
  }
});
```

## 📊 监控数据格式

### 错误数据

```typescript
interface ErrorInfo {
  type: 'jsError' | 'httpError' | 'reqError';
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  url?: string;
  customData?: Record<string, any>;
}
```

### 性能数据

```typescript
interface PerformanceInfo {
  type: 'performanceInfo';
  pagePath: string;
  loadTime: number;
  renderTime: number;
  firstPaintTime?: number;
  timestamp: number;
  customData?: Record<string, any>;
}
```

### 行为数据

```typescript
interface BehaviorInfo {
  type: 'behaviorInfo';
  action: string;
  target?: string;
  data?: any;
  timestamp: number;
  customData?: Record<string, any>;
}
```

## 🛠️ 开发指南

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-org/monitor-sdk.git
cd monitor-sdk/sdk/taroWechatMini

# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build
```

### 构建产物

构建后会在 `dist/` 目录生成以下文件：

- `index.js` - CommonJS格式
- `index.esm.js` - ES Module格式
- `index.d.ts` - TypeScript类型定义
- `package.json` - 发布用的package.json

## 📝 更新日志

### v1.0.0

- ✨ 初始版本发布
- 🔄 支持Taro和原生微信小程序双环境
- 📊 完整的性能监控功能
- 🐛 JavaScript错误捕获
- 🌐 HTTP请求监控
- 👆 用户行为追踪

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

本项目采用 [MIT](https://opensource.org/licenses/MIT) 许可证。

## 🆘 支持

如果你在使用过程中遇到问题，可以通过以下方式获取帮助：

- 📋 [提交Issue](https://github.com/your-org/monitor-sdk/issues)
- 📧 发送邮件到 support@your-org.com
- 💬 加入我们的技术交流群

---

**Made with ❤️ by Monitor Team**