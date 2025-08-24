# @monitor/taro-sdk

专为Taro小程序设计的前端监控SDK，完美适配小程序环境。

## 🚀 快速开始

### 安装

```bash
npm install @monitor/taro-sdk
```

### 基础使用

```javascript
import Monitor from "@monitor/taro-sdk";

// 在app.js中初始化
class App extends Component {
  onLaunch() {
    const monitor = Monitor.init({
      projectId: "your-project-id",
      serverUrl: "https://your-api.com",
    });
  }
}
```

### 页面中使用

```javascript
import Taro from "@tarojs/taro";
import Monitor from "@monitor/taro-sdk";

class Index extends Component {
  componentDidMount() {
    // 记录页面访问
    const monitor = Monitor.getInstance();
    monitor?.recordBehavior("page_view", {
      page: "pages/index/index",
      title: "首页",
    });
  }

  handleClick = () => {
    try {
      // 业务逻辑
    } catch (error) {
      // 手动捕获错误
      Monitor.getInstance()?.captureError(error);
    }
  };
}
```

## 📊 特性

- ✅ **小程序优化**: 专为小程序环境优化
- ✅ **轻量级**: 压缩后仅 3KB (gzip)
- ✅ **Taro适配**: 完美兼容Taro框架
- ✅ **TypeScript**: 完整的类型定义
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
    maxPerformance: 100, // 最大性能数据数量
  },

  // 行为监控配置
  behavior: {
    enabled: true, // 是否启用行为监控
    autoTrackClick: true, // 是否自动追踪点击
    autoTrackPageView: true, // 是否自动追踪页面访问
    maxBehaviors: 200, // 最大行为数据数量
  },
});
```

## 📝 API文档

### 错误监控

```javascript
// 手动捕获错误
const monitor = Monitor.getInstance();
monitor?.captureError("Error message");
monitor?.captureError(new Error("Something wrong"));
monitor?.captureError("Error", { level: "warning", page: "index" });
```

### 性能监控

```javascript
// 记录性能数据
monitor?.recordPerformance("api_call", {
  duration: 500,
  success: 1,
  api: "/api/user",
});

// 记录页面性能
monitor?.recordPerformance("page_load", {
  duration: 1200,
  size: 150,
});
```

### 行为监控

```javascript
// 记录用户行为
monitor?.recordBehavior("button_click", {
  button: "submit",
  page: "pages/form/form",
});

monitor?.recordBehavior("page_view", {
  page: "pages/detail/detail",
  title: "详情页",
  from: "pages/list/list",
});
```

## 🎯 最佳实践

### 全局错误监控

```javascript
// app.js
import Monitor from "@monitor/taro-sdk";

class App extends Component {
  onLaunch() {
    // 初始化监控
    Monitor.init({
      projectId: "your-project-id",
      serverUrl: "https://your-api.com",
    });

    // 全局错误处理
    Taro.onError((error) => {
      Monitor.getInstance()?.captureError(error);
    });

    // 全局未处理的Promise拒绝
    Taro.onUnhandledRejection((res) => {
      Monitor.getInstance()?.captureError(res.reason);
    });
  }
}
```

### 页面性能监控

```javascript
// 页面组件
import { Component } from "react";
import Monitor from "@monitor/taro-sdk";

class PageComponent extends Component {
  componentDidMount() {
    const startTime = Date.now();

    // 页面加载完成后记录性能
    setTimeout(() => {
      const loadTime = Date.now() - startTime;
      Monitor.getInstance()?.recordPerformance("page_load", {
        page: this.$router.path,
        duration: loadTime,
      });
    }, 0);
  }
}
```

### API调用监控

```javascript
import Taro from "@tarojs/taro";
import Monitor from "@monitor/taro-sdk";

// 封装API调用
export const request = async (options) => {
  const startTime = Date.now();
  const monitor = Monitor.getInstance();

  try {
    const result = await Taro.request(options);

    // 记录成功的API调用
    monitor?.recordPerformance("api_call", {
      url: options.url,
      method: options.method || "GET",
      duration: Date.now() - startTime,
      status: result.statusCode,
    });

    return result;
  } catch (error) {
    // 记录失败的API调用
    monitor?.captureError(error, {
      type: "api_error",
      url: options.url,
      method: options.method || "GET",
      duration: Date.now() - startTime,
    });

    throw error;
  }
};
```

### 用户行为追踪

```javascript
// 自动追踪页面访问
class PageComponent extends Component {
  componentDidShow() {
    Monitor.getInstance()?.recordBehavior("page_view", {
      page: this.$router.path,
      scene: this.$router.scene,
      timestamp: Date.now(),
    });
  }

  // 追踪用户交互
  handleButtonClick = (e) => {
    Monitor.getInstance()?.recordBehavior("button_click", {
      page: this.$router.path,
      element: e.currentTarget.dataset.name,
      timestamp: Date.now(),
    });
  };
}
```

## 🔧 Taro版本支持

- Taro 3.x ✅
- Taro 2.x ⚠️ (部分功能受限)

## 🏠 小程序平台支持

- 微信小程序 ✅
- 支付宝小程序 ✅
- 百度小程序 ✅
- 字节跳动小程序 ✅
- QQ小程序 ✅

## 📄 许可证

MIT License
