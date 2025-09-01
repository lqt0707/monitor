# @monitor/web-sdk

专为Web平台设计的前端监控SDK，体积小巧，性能优越。

## 🚀 快速开始

### 安装

```bash
npm install @monitor/web-sdk
```

### 基础使用

```javascript
import Monitor from "@monitor/web-sdk";

// 初始化
const monitor = Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",
});

// 手动捕获错误
monitor.captureError("Something went wrong");

// 记录性能数据
monitor.recordPerformance("api_call", {
  duration: 100,
  success: 1,
});

// 记录用户行为
monitor.recordBehavior("button_click", {
  buttonId: "submit-btn",
});
```

### CDN引入

```html
<script src="https://unpkg.com/@monitor/web-sdk@latest/dist/index.umd.js"></script>
<script>
  const monitor = MonitorSDK.init({
    projectId: "your-project-id",
    serverUrl: "https://your-api.com",
  });
</script>
```

## 📊 特性

- ✅ **轻量级**: 压缩后仅 5KB (gzip)
- ✅ **零依赖**: 无任何外部依赖
- ✅ **TypeScript**: 完整的类型定义
- ✅ **现代浏览器**: 支持 ES2018+
- ✅ **自动监控**: 自动捕获错误和性能数据
- ✅ **手动上报**: 支持自定义数据上报

## 🔧 配置选项

```javascript
Monitor.init({
  projectId: "your-project-id", // 必填：项目ID
  serverUrl: "https://api.com", // 必填：上报地址
  userId: "user123", // 可选：用户ID
  enableInDev: false, // 可选：开发环境是否启用
  sampleRate: 1, // 可选：采样率 (0-1)

  // 错误监控配置
  error: {
    enabled: true, // 是否启用错误监控
    maxErrors: 100, // 最大错误数量
    sampleRate: 1, // 错误采样率
  },

  // 性能监控配置
  performance: {
    enabled: true, // 是否启用性能监控
    enableResourceTiming: true, // 是否启用资源性能监控
    enableUserTiming: true, // 是否启用用户性能监控
  },

  // 行为监控配置
  behavior: {
    enabled: true, // 是否启用行为监控
    autoTrackClick: true, // 是否自动追踪点击
    autoTrackPageView: true, // 是否自动追踪页面访问
  },
});
```

## 📝 API文档

### 错误监控

```javascript
// 手动捕获错误
monitor.captureError("Error message");
monitor.captureError(new Error("Something wrong"));
monitor.captureError("Error", { level: "warning", extra: "data" });
```

### 性能监控

```javascript
// 记录性能数据
monitor.recordPerformance("page_load", {
  duration: 1500,
  fcp: 800,
  lcp: 1200,
});
```

### 行为监控

```javascript
// 记录用户行为
monitor.recordBehavior("click", { element: "button", page: "/home" });
monitor.recordBehavior("page_view", { url: "/about", title: "About" });
```

### 数据上报

```javascript
// 立即上报所有数据
await monitor.flush();

// 获取SDK状态
const status = monitor.getStatus();
console.log(status.queue.size); // 当前队列大小
```

## 🎯 最佳实践

### React集成

```jsx
import React, { useEffect } from "react";
import Monitor from "@monitor/web-sdk";

function App() {
  useEffect(() => {
    const monitor = Monitor.init({
      projectId: "your-project-id",
      serverUrl: "https://your-api.com",
    });

    // 监听路由变化
    const unlisten = history.listen((location) => {
      monitor.recordBehavior("page_view", {
        url: location.pathname,
        title: document.title,
      });
    });

    return () => {
      unlisten();
      monitor.destroy();
    };
  }, []);

  return <div>Your App</div>;
}
```

### Vue集成

```javascript
import { createApp } from "vue";
import Monitor from "@monitor/web-sdk";

const app = createApp(App);

// 全局错误处理
app.config.errorHandler = (error, vm, info) => {
  Monitor.getInstance()?.captureError(error, {
    component: vm?.$options.name,
    info,
  });
};

// 初始化监控
Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",
});
```

## 🌐 浏览器支持

- Chrome >= 63
- Firefox >= 67
- Safari >= 12
- Edge >= 79

## 📄 许可证

MIT License
