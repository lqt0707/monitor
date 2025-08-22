# Promise错误捕获调试指南

## 问题描述
在Taro微信小程序环境中，Promise拒绝错误（unhandledrejection）可能无法正确捕获和上报。

## 原因分析

### 1. 小程序环境的特殊性
- **微信小程序**：`onUnhandledRejection`钩子触发条件与Web环境不同
- **Taro框架**：对Promise错误的处理方式有差异
- **异步上下文**：setTimeout等异步操作可能影响错误捕获

### 2. 触发条件
- Promise.reject()必须没有被任何.catch()处理
- async/await函数抛出的错误必须没有被try/catch捕获
- 错误必须在全局作用域发生

## 解决方案

### ✅ 已实施的修复

#### 1. 增强Promise错误捕获
在`rewriteApp.ts`中添加了增强的Promise错误捕获机制：

```typescript
// 增强Promise错误捕获（兼容所有环境）
try {
  // 全局Promise错误捕获增强
  if (typeof Promise !== "undefined") {
    const originalThen = Promise.prototype.then;
    Promise.prototype.then = function(onResolve, onReject) {
      return originalThen.call(this, onResolve, function(error) {
        monitor.handleErrorEvent(TrackerEvents.unHandleRejection, new Error(String(error)));
        if (onReject && typeof onReject === 'function') {
          return onReject.call(this, error);
        }
      });
    };
  }
} catch (e) {
  console.warn("[Monitor] Failed to enhance Promise error capture:", e);
}
```

#### 2. 多重错误捕获机制
- **微信小程序原生**：`wx.onUnhandledRejection`
- **Taro框架**：`Taro.onUnhandledRejection`
- **Web环境**：`window.addEventListener('unhandledrejection')`
- **增强捕获**：Promise原型链重写

#### 3. 测试代码优化
修改了测试用例，使用多种方式触发Promise拒绝：

```typescript
const testPromiseError = () => {
  console.log("正在测试Promise拒绝错误捕获...");
  
  // 方式1：async/await未处理错误
  const asyncOperation = async () => {
    throw new Error("测试Promise拒绝 - async/await");
  };
  asyncOperation();
  
  // 方式2：Promise.reject直接拒绝
  Promise.reject(new Error("测试Promise拒绝 - 直接拒绝"));
  
  // 方式3：setTimeout中的Promise拒绝
  setTimeout(() => {
    Promise.reject(new Error("测试Promise拒绝 - setTimeout"));
  }, 0);
  
  // 方式4：网络请求错误
  Taro.request({
    url: "https://httpbin.org/status/500",
    method: "GET"
  }).then(response => {
    if (response.statusCode >= 400) {
      throw new Error(`HTTP错误: ${response.statusCode}`);
    }
  }).catch(err => {
    // 不处理错误，让它成为未处理的Promise拒绝
    console.log("网络请求失败，错误将上报:", err);
  });
};
```

## 验证方法

### 1. 开发环境测试
```bash
npm run dev:weapp
```

### 2. 在微信开发者工具中
1. 打开项目
2. 点击"触发Promise错误"按钮
3. 查看控制台输出确认事件捕获
4. 检查网络面板确认错误上报

### 3. 预期行为
- ✅ 控制台显示`[Monitor] unHandleRejection`相关日志
- ✅ 错误信息包含"测试Promise拒绝"文本
- ✅ 错误被正确分类为`promiseRejection`类型
- ✅ 错误数据被添加到上报队列

### 4. 调试技巧
```javascript
// 在控制台手动测试
Promise.reject(new Error("手动测试Promise拒绝"));

// 使用async函数测试
(async () => {
  throw new Error("手动async错误");
})();
```

## 注意事项

### 1. 小程序限制
- iOS设备上`onUnhandledRejection`可能不被支持
- 某些小程序版本可能不完全支持Promise错误捕获

### 2. 开发环境差异
- 微信开发者工具与实际设备可能有差异
- 建议在真机上进行最终验证

### 3. 错误过滤
确保错误没有被过滤规则排除：
```javascript
// 检查过滤配置
monitor.$options.error.filters
```

## 故障排查

如果Promise错误仍然无法捕获：

1. **检查SDK初始化**：确认monitor实例已正确初始化
2. **验证事件监听**：检查`TrackerEvents.unHandleRejection`事件是否被监听
3. **测试过滤规则**：确认错误没有被过滤
4. **环境兼容性**：测试不同设备和微信版本

### 调试命令
```javascript
// 在控制台执行
console.log('Monitor status:', Monitor.instance?.getStatus());

// 手动触发事件
Monitor.instance?.handleErrorEvent('unHandleRejection', new Error('测试错误'));
```