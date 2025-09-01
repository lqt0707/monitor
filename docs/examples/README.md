# Monitor SDK 示例项目

这个目录包含了 Monitor SDK 在不同平台的完整集成示例，展示了如何在实际项目中使用监控SDK进行错误监控、性能监控和用户行为追踪。

## 📁 目录结构

```
examples/
├── web-basic/          # Web基础集成示例
├── web-react/          # React应用集成示例  
├── taro-mini/          # Taro小程序示例
└── wechat-mini-native/ # 微信原生小程序示例
```

## 🚀 快速开始

### 前置条件

1. **启动后端服务**
   ```bash
   # 在项目根目录
   npm run server
   ```

2. **构建SDK**
   ```bash
   # 构建Web SDK
   cd sdk/web && npm run build
   
   # 构建Taro SDK
   cd sdk/taroWechatMini && npm run build
   ```

### 运行示例

#### 1. Web基础示例

最简单的Web集成方式，适合快速了解SDK基本功能。

```bash
cd examples/web-basic
npm install
npm run dev
```

**功能特点:**
- ✅ JavaScript错误监控
- ✅ Promise错误捕获
- ✅ HTTP请求错误监控
- ✅ 用户行为追踪
- ✅ 性能监控
- ✅ 实时状态面板

**访问地址:** http://localhost:5173

#### 2. React应用示例

展示在React应用中的完整集成方案，包含错误边界和Hook的使用。

```bash
cd examples/web-react
npm install
npm run dev
```

**功能特点:**
- ✅ React错误边界集成
- ✅ 自定义监控Hook
- ✅ 组件级错误捕获
- ✅ 路由变化追踪
- ✅ 性能监控Hook
- ✅ 实时监控仪表板

**访问地址:** http://localhost:5174

#### 3. Taro小程序示例

Taro框架开发的小程序监控集成示例。

```bash
cd examples/taro-mini/taroMini
npm install

# 微信小程序
npm run dev:weapp

# H5版本
npm run dev:h5
```

**功能特点:**
- ✅ 小程序错误监控
- ✅ 网络请求监控
- ✅ 性能监控
- ✅ 用户行为追踪
- ✅ 跨平台兼容

#### 4. 微信原生小程序示例

使用微信原生开发的小程序监控示例。

```bash
# 使用微信开发者工具打开
# examples/wechat-mini-native
```

**功能特点:**
- ✅ 原生小程序API集成
- ✅ 自动错误捕获
- ✅ 请求拦截监控
- ✅ 页面性能监控

## 🧪 测试功能

### 自动化测试

项目提供了完整的自动化测试脚本：

```bash
# 集成测试（测试所有示例项目）
node test-integration.js

# 错误上报测试（测试错误监控功能）
node test-errors.js

# 网络错误测试
npm run test:network

# 数据格式测试
node test-data-format.js
```

### 手动测试指南

#### Web平台测试

1. **JavaScript错误测试**
   - 点击"触发JS错误"按钮
   - 观察控制台和监控面板
   - 检查服务端是否收到错误数据

2. **Promise错误测试**
   - 点击"触发Promise错误"按钮
   - 验证未处理的Promise拒绝被捕获

3. **HTTP错误测试**
   - 点击"测试HTTP错误"按钮
   - 验证网络请求错误被监控

4. **性能监控测试**
   - 点击"性能测试"按钮
   - 查看性能数据上报情况

#### 小程序平台测试

1. **错误监控测试**
   - 在小程序中触发各种错误
   - 检查错误是否被正确捕获和上报

2. **网络监控测试**
   - 发起网络请求
   - 验证请求性能和错误监控

## 🔧 配置说明

### SDK配置

所有示例都使用类似的基础配置：

```javascript
const config = {
  projectId: 'your-project-id',
  serverUrl: 'http://localhost:3001/api/monitor',
  enableErrorMonitor: true,
  enablePerformanceMonitor: true,
  enableBehaviorMonitor: true,
  sampleRate: 1,
  maxErrors: 100,
  reportInterval: 5000,
  enableInDev: true
};
```

### 平台特定配置

#### Web平台
```javascript
import MonitorSDK from '@monitor/web-sdk';
MonitorSDK.init(config);
```

#### React平台
```javascript
import { MonitorProvider } from './hooks/useMonitor';
// 使用Provider包装应用
```

#### Taro小程序
```javascript
import Monitor from '@monitor/taro-wechat-mini-sdk';
Monitor.init(config);
```

#### 微信原生小程序
```javascript
const { Monitor } = require('./lib/monitor-sdk/index.js');
const monitor = Monitor.init(config);
```

## 📊 监控数据

### 错误监控数据格式
```json
{
  "projectId": "your-project",
  "type": "jsError",
  "errorMessage": "Error message",
  "errorStack": "Error stack trace",
  "pageUrl": "https://example.com",
  "userAgent": "Browser info",
  "timestamp": 1640995200000
}
```

### 性能监控数据格式
```json
{
  "projectId": "your-project",
  "type": "performance",
  "performanceData": "{\"FCP\":1200,\"LCP\":2000}",
  "pageUrl": "https://example.com",
  "timestamp": 1640995200000
}
```

### 用户行为数据格式
```json
{
  "projectId": "your-project",
  "type": "behavior",
  "behaviorData": "{\"event\":\"click\",\"target\":\"button\"}",
  "pageUrl": "https://example.com",
  "timestamp": 1640995200000
}
```

## 🎯 最佳实践

### 1. 错误边界设置
- 在React应用的根级别设置错误边界
- 为关键组件单独设置错误边界
- 提供友好的错误回退UI

### 2. 性能监控
- 监控关键性能指标（FCP、LCP、FID、CLS）
- 设置合理的性能阈值
- 监控慢查询和长任务

### 3. 用户行为追踪
- 追踪关键用户操作
- 设置合理的数据采样率
- 保护用户隐私，避免敏感信息上报

### 4. 数据上报策略
- 使用批量上报减少网络请求
- 设置合理的重试机制
- 在网络异常时进行本地缓存

## 🔍 故障排查

### 常见问题

#### 1. SDK初始化失败
```
解决方案:
- 检查projectId和serverUrl配置
- 确认服务器已启动
- 检查网络连接
```

#### 2. 数据上报失败
```
解决方案:
- 检查服务器API是否正常
- 验证数据格式是否正确
- 查看浏览器网络面板
```

#### 3. 错误未被捕获
```
解决方案:
- 检查错误监控是否启用
- 验证错误边界设置
- 确认错误类型是否支持
```

#### 4. 小程序集成问题
```
解决方案:
- 检查SDK文件路径
- 验证小程序权限配置
- 确认网络请求域名配置
```

### 调试模式

启用调试模式获取更多信息：

```javascript
const config = {
  // ... 其他配置
  enableInDev: true,  // 开发环境启用
  debug: true         // 启用调试日志
};
```

## 📚 相关文档

- [Monitor SDK API文档](../sdk/web/README.md)
- [Taro SDK使用指南](../sdk/taroWechatMini/README.md)
- [服务端API文档](../server/README.md)
- [部署指南](../DEPLOYMENT.md)

## 🤝 贡献指南

欢迎提交新的示例或改进现有示例：

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 📄 许可证

MIT License - 查看 [LICENSE](../LICENSE) 文件了解详情。