# Web监控SDK

一个功能完整的Web前端监控SDK，支持错误监控、性能监控和用户行为跟踪。

## 功能特性

### 🚨 错误监控
- JavaScript运行时错误捕获
- Promise未处理异常捕获
- 资源加载错误监控
- HTTP请求错误跟踪
- 自定义错误上报
- 错误去重和聚合

### ⚡ 性能监控
- 页面加载性能指标
- Web Vitals指标 (LCP, FID, CLS)
- HTTP请求性能监控
- 资源加载性能跟踪
- 自定义性能指标

### 👤 用户行为跟踪
- 页面访问跟踪
- 用户点击行为
- 表单提交监控
- 路由变化跟踪
- 自定义行为事件

### 🔧 其他特性
- 支持多种构建格式 (UMD, ESM, CommonJS)
- TypeScript类型支持
- 插件系统 (Vue, React等框架支持)
- 数据批量上报和重试机制
- 离线数据缓存
- 采样率控制
- 开发环境友好

## 快速开始

### 安装

```bash
npm install @monitor/web-sdk
```

或者直接使用CDN:

```html
<script src="https://unpkg.com/@monitor/web-sdk/dist/monitor-sdk.umd.js"></script>
```

### 基础使用

```javascript
// ES模块方式
import MonitorSDK from '@monitor/web-sdk';

// 或者UMD方式
const MonitorSDK = window.MonitorSDK;

// 初始化SDK
MonitorSDK.init({
  projectId: 'your-project-id',
  serverUrl: 'https://your-server.com/api/monitor',
  enableErrorMonitor: true,
  enablePerformanceMonitor: true,
  enableBehaviorMonitor: true,
  userId: 'user-123',
  tags: {
    version: '1.0.0',
    environment: 'production'
  }
});
```

## 配置选项

```typescript
interface MonitorConfig {
  // 必需配置
  projectId: string;              // 项目ID
  serverUrl: string;              // 数据上报服务器地址
  
  // 功能开关
  enableErrorMonitor?: boolean;    // 启用错误监控 (默认: true)
  enablePerformanceMonitor?: boolean; // 启用性能监控 (默认: true)
  enableBehaviorMonitor?: boolean; // 启用行为监控 (默认: true)
  enableInDev?: boolean;          // 开发环境是否启用 (默认: false)
  
  // 用户信息
  userId?: string;                // 用户ID
  userInfo?: Record<string, any>; // 用户信息
  
  // 数据上报配置
  reportInterval?: number;        // 上报间隔(ms) (默认: 10000)
  maxErrors?: number;            // 最大错误数量 (默认: 20)
  maxPerformance?: number;       // 最大性能数据数量 (默认: 20)
  maxBehaviors?: number;         // 最大行为数据数量 (默认: 50)
  sampleRate?: number;           // 采样率 0-1 (默认: 1)
  
  // 其他配置
  tags?: Record<string, string>; // 自定义标签
  beforeSend?: (data: ReportData) => ReportData | null; // 数据发送前处理
  plugins?: MonitorPlugin[];     // 插件列表
}
```

## API文档

### 错误监控

```javascript
// 手动捕获错误
MonitorSDK.captureError('错误信息', {
  level: 'error',
  tags: { module: 'user' },
  extra: { userId: '123' }
});

// 捕获HTTP错误
MonitorSDK.captureHttpError(
  'https://api.example.com/users',
  'GET',
  404,
  'Not Found',
  { error: 'User not found' }
);
```

### 性能监控

```javascript
// 自定义性能指标
const start = performance.now();
// ... 执行操作
const duration = performance.now() - start;

MonitorSDK.trackPerformance('custom_operation', {
  duration,
  success: true,
  metadata: { operationType: 'data_processing' }
});
```

### 行为跟踪

```javascript
// 跟踪页面访问
MonitorSDK.trackPageView({
  title: '首页',
  url: '/home',
  referrer: document.referrer
});

// 跟踪自定义行为
MonitorSDK.trackBehavior('button_click', {
  buttonName: '提交按钮',
  formId: 'user-form',
  timestamp: Date.now()
});
```

### 用户信息

```javascript
// 设置用户信息
MonitorSDK.setUser({
  id: 'user-123',
  name: '张三',
  email: 'zhangsan@example.com',
  role: 'admin'
});

// 设置自定义标签
MonitorSDK.setTags({
  version: '2.0.0',
  feature: 'new-ui'
});
```

### 数据管理

```javascript
// 立即上报数据
MonitorSDK.flush().then(() => {
  console.log('数据上报完成');
});

// 获取SDK状态
const status = MonitorSDK.getStatus();
console.log('错误数量:', status.errorCount);
console.log('性能数据数量:', status.performanceCount);

// 销毁SDK
MonitorSDK.destroy();
```

## 框架集成

### Vue.js集成

```javascript
import MonitorSDK from '@monitor/web-sdk';
import { VueErrorPlugin } from '@monitor/web-sdk/plugins';

// 初始化SDK
MonitorSDK.init({
  projectId: 'vue-project',
  serverUrl: 'https://api.example.com/monitor',
  plugins: [new VueErrorPlugin()]
});

// Vue应用配置
const app = createApp(App);

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  MonitorSDK.captureError('Vue错误', {
    error: err.message,
    stack: err.stack,
    info,
    component: vm?.$options?.name
  });
};
```

### React集成

```javascript
import MonitorSDK from '@monitor/web-sdk';
import { ReactErrorPlugin } from '@monitor/web-sdk/plugins';

// 初始化SDK
MonitorSDK.init({
  projectId: 'react-project',
  serverUrl: 'https://api.example.com/monitor',
  plugins: [new ReactErrorPlugin()]
});

// 错误边界组件
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    MonitorSDK.captureError('React组件错误', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }
  
  render() {
    // 错误UI渲染逻辑
  }
}
```

## 构建和开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

## 示例

项目包含多个使用示例:

- `examples/basic.html` - 基础使用示例
- `examples/vue-example.html` - Vue.js集成示例
- `examples/react-example.html` - React集成示例

运行示例:

```bash
# 构建SDK
npm run build

# 启动本地服务器
npx http-server . -p 8080

# 访问示例
# http://localhost:8080/examples/basic.html
# http://localhost:8080/examples/vue-example.html
# http://localhost:8080/examples/react-example.html
```

## 服务端集成

### 数据接收接口

SDK会向配置的`serverUrl`发送POST请求，数据格式如下:

```typescript
interface ReportData {
  projectId: string;
  sessionId: string;
  userId?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  tags?: Record<string, string>;
  errors?: ErrorData[];
  performance?: PerformanceData[];
  behaviors?: BehaviorData[];
}
```

### Node.js/Express示例

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// 监控数据接收接口
app.post('/api/monitor', (req, res) => {
  const data = req.body;
  
  // 处理错误数据
  if (data.errors && data.errors.length > 0) {
    data.errors.forEach(error => {
      console.log('收到错误:', error.message);
      // 存储到数据库或发送告警
    });
  }
  
  // 处理性能数据
  if (data.performance && data.performance.length > 0) {
    data.performance.forEach(perf => {
      console.log('收到性能数据:', perf.type, perf.value);
      // 存储性能指标
    });
  }
  
  // 处理行为数据
  if (data.behaviors && data.behaviors.length > 0) {
    data.behaviors.forEach(behavior => {
      console.log('收到行为数据:', behavior.event);
      // 分析用户行为
    });
  }
  
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('监控服务器启动在端口 3000');
});
```

## 最佳实践

### 1. 合理设置采样率

```javascript
MonitorSDK.init({
  // 生产环境使用较低采样率
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  // ...
});
```

### 2. 过滤敏感信息

```javascript
MonitorSDK.init({
  beforeSend: (data) => {
    // 过滤敏感信息
    if (data.errors) {
      data.errors.forEach(error => {
        if (error.message.includes('password')) {
          error.message = '[敏感信息已过滤]';
        }
      });
    }
    return data;
  },
  // ...
});
```

### 3. 设置合理的上报间隔

```javascript
MonitorSDK.init({
  // 根据业务需求调整上报间隔
  reportInterval: 30000, // 30秒
  maxErrors: 10,         // 限制错误数量
  // ...
});
```

### 4. 使用标签分类数据

```javascript
MonitorSDK.setTags({
  module: 'user-management',
  version: '1.2.3',
  environment: 'production',
  region: 'us-east-1'
});
```

## 故障排除

### 常见问题

1. **SDK未初始化**
   - 确保在使用前调用`MonitorSDK.init()`
   - 检查配置参数是否正确

2. **数据未上报**
   - 检查网络连接和服务器地址
   - 查看浏览器控制台是否有错误信息
   - 确认采样率设置

3. **性能影响**
   - 调整上报间隔和数据量限制
   - 使用合适的采样率
   - 在生产环境禁用详细日志

### 调试模式

```javascript
MonitorSDK.init({
  enableInDev: true,
  // 开启详细日志
  debug: true,
  // ...
});
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持错误监控、性能监控和行为跟踪
- 提供Vue和React插件
- 完整的TypeScript类型支持