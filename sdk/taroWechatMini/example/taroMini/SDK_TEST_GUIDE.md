# Taro微信小程序监控SDK测试指南

## 测试环境准备

### 1. 启动开发服务器
```bash
npm run dev:weapp
```

### 2. 使用微信开发者工具
1. 打开微信开发者工具
2. 导入项目：选择 `dist` 目录作为项目根目录
3. 项目配置会自动加载（appid: touristappid）

## SDK功能测试

### 已集成的监控功能

#### 1. 自动监控功能
- ✅ **网络请求监控**: 自动拦截所有 `Taro.request` 调用
- ✅ **JavaScript错误监控**: 自动捕获未处理的异常
- ✅ **系统信息收集**: 自动收集设备和环境信息
- ✅ **性能监控**: 监控页面加载和渲染性能

#### 2. 手动测试功能
在首页提供了以下测试按钮：

**错误监控测试**
- 点击「触发JS错误」按钮
- 会故意触发一个空指针异常
- 查看控制台输出：`捕获到JS错误: [错误详情]`

**网络监控测试**
- 点击「发起网络请求」按钮
- 发起正常的API请求到 `jsonplaceholder.typicode.com`
- 成功时显示Toast提示
- 所有请求都会被SDK自动监控

**慢请求测试**
- 点击「测试慢请求」按钮
- 请求会超时（3秒延迟，1秒超时）
- 查看控制台输出：`捕获到慢请求: [请求详情]`

### 3. SDK配置

当前SDK配置（在 `app.ts` 中）：
```typescript
Monitor.init({
  httpTimeout: 5000,        // HTTP请求超时时间
  isNetwork: true,          // 启用网络监控
  isSystemInfo: true,       // 启用系统信息收集
  error: {
    filters: [],            // 错误过滤器
    random: 1               // 错误采样率（1=100%）
  },
  behavior: {
    isFilterConsole: false, // 不过滤console日志
    queueLimit: 20,         // 行为队列限制
    methodWhiteList: [],    // 方法白名单
    methodBlackList: []     // 方法黑名单
  },
  performance: {
    watch: true,            // 启用性能监控
    queueLimit: 100         // 性能数据队列限制
  },
  env: Env.Dev              // 开发环境
})
```

### 4. 自定义数据设置

SDK会自动设置以下自定义数据：
```typescript
{
  userId: 'test-user-123',
  pageId: 'index',
  version: '1.0.0'
}
```

## 监控数据查看

### 控制台输出
在微信开发者工具的控制台中，你可以看到：
- `App launched.` - 应用启动
- `Monitor SDK initialized` - SDK初始化完成
- `Page loaded.` - 页面加载完成
- `捕获到JS错误: [数据]` - JavaScript错误事件
- `捕获到请求错误: [数据]` - 网络请求错误事件
- `捕获到慢请求: [数据]` - 慢请求事件

### 事件监听
SDK支持以下事件监听：
- `TrackerEvents.jsError` - JavaScript错误
- `TrackerEvents.reqError` - 请求错误
- `TrackerEvents.slowHttpRequest` - 慢请求

## 测试步骤建议

1. **启动项目**: 运行 `npm run dev:weapp`
2. **打开开发者工具**: 导入 `dist` 目录
3. **查看初始化**: 确认控制台显示SDK初始化成功
4. **测试错误监控**: 点击「触发JS错误」按钮
5. **测试网络监控**: 点击「发起网络请求」按钮
6. **测试慢请求**: 点击「测试慢请求」按钮
7. **查看控制台**: 确认所有事件都被正确捕获和输出

## 注意事项

- 确保网络连接正常，以便测试网络请求功能
- 某些功能可能需要真机测试才能完全验证
- 生产环境使用时，建议调整 `env` 为 `Env.Production`
- 可以根据需要调整各种配置参数

## 故障排除

如果遇到问题：
1. 检查控制台是否有错误信息
2. 确认SDK是否正确初始化
3. 验证网络连接是否正常
4. 检查微信开发者工具版本是否支持