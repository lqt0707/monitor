# Taro微信小程序错误捕获验证指南

## 问题分析

在Taro微信小程序环境中，JavaScript错误无法被自动捕获的主要原因：

1. **React错误边界机制**：Taro 3.x使用React，错误会被React的错误边界捕获，不会冒泡到全局
2. **开发模式行为**：Taro开发模式下，React DevTools会拦截错误显示，阻止错误到达全局处理器
3. **Taro编译差异**：Taro编译后的代码结构与原生小程序不同，需要特定的错误捕获机制

## 解决方案

### 1. React错误边界 (已实现)

在`app.ts`中添加了React错误边界组件：

```typescript
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 捕获React组件错误并传递给监控SDK
    monitor.handleErrorEvent(TrackerEvents.jsError, {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      type: "React Error Boundary"
    });
  }
}
```

### 2. 多重错误捕获机制 (已增强)

在`rewriteApp.ts`中实现了多层错误捕获：

- ✅ **Taro useError Hook**：使用`useError` Hook进行全局错误监听（Taro 3.6+推荐）
- ✅ **页面级错误边界**：使用`createErrorBoundary` HOC包装页面组件
- ✅ **Taro全局错误监听**：`Taro.onError()`
- ✅ **微信小程序原生错误监听**：`wx.onError()`
- ✅ **Promise错误监听**：`Taro.onUnhandledRejection()`
- ✅ **控制台错误拦截**：重写`console.error`

### 3. 测试验证方法

#### 测试用例1：React组件错误
```typescript
// 在组件中故意触发错误
const testJSError = () => {
  const obj: any = null;
  obj.someProperty.test = "error";
};
```

#### 测试用例2：Promise拒绝
```typescript
const testPromiseError = () => {
  new Promise((resolve, reject) => {
    reject(new Error("测试Promise拒绝"));
  });
};
```

#### 测试用例3：直接抛出错误
```typescript
const testThrowError = () => {
  throw new Error("测试直接抛出的错误");
};
```

## 验证步骤

### 1. 启动测试环境
```bash
# 进入示例项目目录
cd /Users/lqt/Desktop/package/monitor/sdk/taroWechatMini/example/taroMini

# 启动开发服务器
npm run dev:weapp
```

### 2. 使用微信开发者工具
1. 打开微信开发者工具
2. 导入项目：选择`dist`目录
3. 确保使用真机调试模式（重要！）

### 3. 验证错误捕获

#### 控制台验证
打开微信开发者工具控制台，应该看到：
```
App launched.
Monitor SDK initialized
Page loaded.
触发JS错误测试...
全局捕获到JS错误: [错误详情]
React错误边界捕获到错误: [错误详情]
```

#### 事件监听验证
在页面加载时设置的事件监听器应该触发：
```typescript
monitor.on(TrackerEvents.jsError, (data) => {
  console.log("捕获到JS错误:", data);
});
```

### 4. 真机测试（关键步骤）

**重要**：Taro开发模式下的模拟器可能无法完全模拟真机行为

1. 使用微信开发者工具的"预览"功能
2. 扫描二维码在真机上测试
3. 在真机上点击测试按钮验证错误捕获

## 常见问题排查

### 问题1：开发模式下不触发
- **原因**：Taro开发模式使用React DevTools
- **解决**：使用真机测试或使用生产模式构建

### 问题2：错误信息不完整
- **原因**：Taro编译优化导致栈信息丢失
- **解决**：在`config/index.ts`中配置sourceMap

### 问题3：Promise错误未捕获
- **原因**：React 18的并发模式可能影响
- **解决**：确保使用`componentDidCatch`捕获

## 最佳实践

### 生产环境配置
```typescript
// app.ts中的生产配置
Monitor.init({
  env: Env.Production,
  error: {
    random: 1,        // 100%捕获
    filters: []       // 不过滤任何错误
  }
});
```

### 错误边界使用
```typescript
// 在关键页面添加错误边界
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 调试建议
1. **使用真机调试**：确保在真机上测试
2. **检查sourceMap**：确保错误栈信息完整
3. **监控控制台输出**：观察所有错误捕获点的输出

## 验证成功标志

当错误捕获机制正常工作时，你应该看到：

1. **控制台输出**：`捕获到JS错误:` 后面跟着详细的错误信息
2. **事件触发**：`TrackerEvents.jsError`事件被触发
3. **数据上报**：错误数据被发送到监控服务器
4. **真机验证**：在真机上测试时错误被正确捕获

通过以上步骤，你应该能够成功验证Taro微信小程序的JavaScript错误捕获功能。