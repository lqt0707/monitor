# Taro微信小程序监控SDK - 服务端未启动处理方案

## 概述

当服务端未启动或不可用时，Taro微信小程序监控SDK提供了健壮的错误处理机制，包括：

1. **智能服务检测**：自动检测服务端状态
2. **本地缓存**：将错误数据缓存到本地存储
3. **重试机制**：指数退避重试策略
4. **优雅降级**：在服务端不可用时继续收集数据
5. **网络感知**：监听网络状态变化，自动恢复上报

## 快速开始

### 1. 基础配置

```typescript
import { createMonitor } from 'monitor-sdk';

const monitor = createMonitor({
  env: 'production',
  reporter: {
    serverUrl: 'http://your-server.com', // 服务端地址
    projectId: 'your-project-id',
    apiKey: 'your-api-key',
    timeout: 5000,
    maxRetries: 3,
    retryDelay: 2000,
    batchSize: 10,
    flushInterval: 10000,
    enableOfflineCache: true, // 启用本地缓存
    maxCacheSize: 50,
    maxQueueSize: 100
  }
});
```

### 2. 服务端未启动时的行为

当服务端未启动时，SDK会自动：

- ✅ 继续收集错误和性能数据
- ✅ 将数据缓存到本地存储
- ✅ 定期检测服务端状态
- ✅ 服务恢复后自动上报缓存数据
- ✅ 提供详细的错误日志

### 3. 手动控制

```typescript
// 立即上报所有数据
await monitor.flush();

// 获取当前状态
const status = monitor.getStatus();
console.log('监控状态:', status);

// 停止监控
monitor.stop();

// 清空缓存
monitor.clear();
```

## 配置详解

### Reporter配置选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `serverUrl` | string | 'http://localhost:3000' | 服务端地址 |
| `projectId` | string | - | 项目ID |
| `apiKey` | string | - | API密钥 |
| `timeout` | number | 5000 | 请求超时时间(ms) |
| `maxRetries` | number | 3 | 最大重试次数 |
| `retryDelay` | number | 2000 | 重试延迟时间(ms) |
| `batchSize` | number | 10 | 批处理大小 |
| `flushInterval` | number | 10000 | 自动上报间隔(ms) |
| `maxQueueSize` | number | 100 | 队列最大长度 |
| `enableOfflineCache` | boolean | true | 是否启用本地缓存 |
| `maxCacheSize` | number | 50 | 缓存最大数量 |

## 错误处理

### 服务端错误码处理

SDK会处理以下服务端错误：

- **404**: 服务端接口不存在（可能未启动）
- **500-599**: 服务端内部错误
- **网络超时**: 连接超时
- **ECONNREFUSED**: 连接被拒绝（服务未启动）

### 本地缓存机制

缓存数据存储在小程序的本地存储中：

- 缓存键：`monitor_sdk_cache`
- 包含：错误数据、时间戳、重试次数
- 自动清理：服务恢复后自动清除
- 大小限制：可配置最大缓存数量

## 使用示例

### 示例1：基本使用

```typescript
// app.ts
import { createMonitor } from 'monitor-sdk';

App({
  onLaunch() {
    const monitor = createMonitor({
      env: 'production',
      reporter: {
        serverUrl: 'http://localhost:3000',
        enableOfflineCache: true
      }
    });

    // 全局挂载
    (global as any).monitor = monitor;
  }
});
```

### 示例2：手动上报

```typescript
// 在需要的地方手动上报错误
const monitor = (global as any).monitor;

// 捕获并上报错误
try {
  // 可能出错的代码
} catch (error) {
  monitor.emit('jsError', {
    error: error.message,
    stack: error.stack
  });
}
```

### 示例3：检查服务状态

```typescript
// 检查当前服务状态
const status = monitor.getStatus();

if (!status.reporter.isServiceAvailable) {
  console.warn('监控服务端当前不可用');
  console.log('缓存数据数量:', status.reporter.queueSize);
}
```

## 调试模式

在开发环境中，可以启用调试模式查看详细日志：

```typescript
const monitor = createMonitor({
  env: 'dev',
  reporter: {
    serverUrl: 'http://localhost:3000',
    enableOfflineCache: true
  }
});

// 控制台会输出：
// [Reporter] Service marked as unavailable, will retry in background
// [Reporter] Cached 5 items locally
// [Reporter] Service status changed: available
// [Reporter] Successfully flushed cached data
```

## 网络状态监听

SDK会自动监听网络状态变化：

- 网络恢复时自动尝试上报
- 网络断开时暂停上报
- 提供网络状态回调

## 最佳实践

### 1. 生产环境配置

```typescript
const monitor = createMonitor({
  env: 'production',
  reporter: {
    serverUrl: 'https://your-production-server.com',
    projectId: 'prod-project-123',
    apiKey: 'prod-api-key-xxx',
    timeout: 10000,
    maxRetries: 5,
    enableOfflineCache: true,
    maxCacheSize: 100,
    flushInterval: 30000 // 30秒上报一次
  }
});
```

### 2. 开发环境配置

```typescript
const monitor = createMonitor({
  env: 'dev',
  reporter: {
    serverUrl: 'http://localhost:3000',
    timeout: 5000,
    maxRetries: 2,
    enableOfflineCache: true,
    flushInterval: 5000 // 5秒上报一次，便于调试
  }
});
```

### 3. 错误处理增强

```typescript
// 在app.ts中全局处理
App({
  onError(error) {
    const monitor = (global as any).monitor;
    if (monitor) {
      monitor.emit('jsError', {
        error: error,
        type: 'app_error'
      });
    }
  },

  onUnhandledRejection(res) {
    const monitor = (global as any).monitor;
    if (monitor) {
      monitor.emit('unHandleRejection', {
        reason: res.reason,
        promise: res.promise
      });
    }
  }
});
```

## 常见问题

### Q: 服务端未启动时数据会丢失吗？
A: 不会，数据会被缓存到本地存储，服务恢复后自动上报。

### Q: 缓存数据有大小限制吗？
A: 有，可以通过`maxCacheSize`配置，默认50条。

### Q: 如何查看缓存的数据？
A: 使用`monitor.getStatus()`可以查看当前缓存数量。

### Q: 网络断开后数据会丢失吗？
A: 不会，网络恢复后会自动尝试上报缓存数据。

### Q: 如何清空缓存数据？
A: 使用`monitor.clear()`可以清空所有缓存和队列数据。