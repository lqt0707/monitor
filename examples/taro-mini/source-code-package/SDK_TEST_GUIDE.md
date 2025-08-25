# Taro 小程序监控SDK测试指南 - 新版本

## 📦 SDK版本

使用全新的 `@monitor/taro-sdk` 包，基于Core架构设计，提供更简洁的API和更好的用户体验。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install @monitor/taro-sdk
```

### 2. 在app.ts中初始化

```typescript
import Monitor from '@monitor/taro-sdk';

// 30秒快速开始
Monitor.quickStart.taro('your-project-id', 'http://localhost:3001');
```

### 3. 使用配置模板（可选）

```typescript
import Monitor, { Templates } from '@monitor/taro-sdk';

const config = Templates.createConfig(Templates.TaroBasic, {
  projectId: 'your-project-id',
  serverUrl: 'http://localhost:3001',
  debug: true,
  tags: {
    version: '1.0.0',
    environment: 'development'
  }
});

Monitor.init(config);
```

## 🧪 测试功能

### 错误监控

1. **JavaScript错误**
   - 点击"触发JS错误"按钮
   - 会自动捕获并上报错误
   - 也支持手动上报：`Monitor.captureError(error, context)`

2. **Promise错误**
   - 点击"触发Promise错误"
   - 测试未处理的Promise拒绝
   - 自动和手动上报都支持

3. **直接抛出错误**
   - 测试try-catch捕获的错误
   - 手动上报功能

### 性能监控

1. **网络请求性能**
   - 点击"发起网络请求"
   - 自动记录请求耗时
   - 手动记录：`Monitor.recordPerformance(name, metrics)`

2. **慢请求监控**
   - 点击"测试慢请求"
   - 模拟超时和慢响应

### 行为监控

1. **用户行为追踪**
   - 点击"记录用户行为"
   - 手动记录：`Monitor.recordBehavior(event, data)`

## 🔧 核心API

### 初始化

```typescript
// 快速开始
Monitor.quickStart.taro(projectId, serverUrl);

// 完整配置
Monitor.init(config);
```

### 手动上报

```typescript
// 错误上报
Monitor.captureError(error, context);

// 性能记录
Monitor.recordPerformance(name, metrics);

// 行为记录
Monitor.recordBehavior(event, data);
```

### 状态查询

```typescript
// 获取SDK状态
const status = Monitor.getStatus();

// 立即上报
Monitor.flush();
```

## 🌟 新版本优势

1. **更简单的API** - 30秒快速开始
2. **配置模板** - 预设常用配置
3. **统一架构** - 与Web SDK API一致
4. **更好的错误提示** - 友好的错误信息
5. **TypeScript支持** - 完整的类型定义

## 🔍 调试技巧

1. **启用调试模式**
   ```typescript
   Monitor.init({ debug: true, ... });
   ```

2. **查看控制台日志**
   - 所有上报操作都会在控制台显示
   - 错误会显示详细的上下文信息

3. **检查SDK状态**
   ```typescript
   console.log(Monitor.getStatus());
   ```

## 📱 小程序特殊考虑

1. **内存限制** - 队列大小默认较小
2. **网络限制** - 上报间隔较长
3. **平台兼容** - 自动适配不同小程序平台

## 🚨 常见问题

1. **SDK初始化失败**
   - 检查projectId和serverUrl是否正确
   - 查看控制台错误信息

2. **数据未上报**
   - 确认网络连接正常
   - 检查服务器地址是否可访问

3. **性能影响**
   - SDK已针对小程序优化
   - 可通过采样率控制性能影响

## 📋 测试清单

- [ ] SDK初始化成功
- [ ] JavaScript错误捕获
- [ ] Promise错误捕获
- [ ] 网络请求监控
- [ ] 用户行为记录
- [ ] 手动上报功能
- [ ] 数据成功发送到服务器

## 🏃‍♂️ 运行项目

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器

#### 微信小程序
```bash
npm run dev:weapp
```

#### H5
```bash
npm run dev:h5
```

### 3. 打开微信开发者工具
- 选择项目根目录
- 查看控制台输出，观察监控数据

## 📊 数据查看

1. 启动后端服务器 (localhost:3001)
2. 启动管理后台 (localhost:5173)  
3. 在管理后台查看上报的监控数据

## 💡 迁移说明

从旧版SDK迁移到新版本：

1. **更新依赖**
   ```bash
   npm uninstall @monitor/taro-wechat-mini-sdk
   npm install @monitor/taro-sdk
   ```

2. **更新导入**
   ```typescript
   // 旧版本
   import Monitor, { Env, TrackerEvents } from "@monitor/taro-wechat-mini-sdk";
   
   // 新版本
   import Monitor from "@monitor/taro-sdk";
   ```

3. **简化初始化**
   ```typescript
   // 旧版本（复杂配置）
   const monitor = Monitor.init({
     httpTimeout: 5000,
     isNetwork: true,
     // ... 很多配置
   });
   
   // 新版本（简单配置）
   Monitor.quickStart.taro('project-id', 'server-url');
   ```