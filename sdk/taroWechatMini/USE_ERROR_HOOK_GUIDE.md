# Taro useError Hook 全局错误监听指南

## 🎯 推荐方案：使用 useError Hook

Taro 3.6+ 提供了专门的 `useError` Hook，这是实现全局错误监听的最佳实践。

### 📋 使用方法

#### 1. App级别全局监听（推荐）

```typescript
// app.tsx
import { useLaunch, useError } from '@tarojs/taro'
import Monitor from '@monitor/taro-wechat-mini-sdk'

export default function App({ children }) {
  useLaunch(() => {
    // 初始化监控SDK
    Monitor.init({
      projectId: "your-project-id",
      env: "development"
    })
  })

  // 使用 useError Hook 进行全局错误监听
  useError((error) => {
    console.log('全局错误捕获:', error)
    Monitor.instance?.handleErrorEvent('jsError', {
      message: error.message,
      stack: error.stack,
      type: 'useError Hook'
    })
  })

  return children
}
```

#### 2. 页面级错误边界（可选）

```typescript
// pages/index/index.tsx
import { createErrorBoundary } from '../../utils/errorBoundary'

function Index() {
  // 页面逻辑
  return <View>页面内容</View>
}

// 使用错误边界HOC包装页面
export default createErrorBoundary(Index)
```

#### 3. 自定义错误边界HOC

```typescript
// 自定义错误边界HOC
import { createErrorBoundary } from '../../utils/errorBoundary'

function MyPage() {
  // 页面组件逻辑
  return <View>My Page</View>
}

// 应用错误边界
export default createErrorBoundary(MyPage)
```

#### 2. 简化版本（最简洁）

```typescript
// app.tsx
import { useLaunch, useError } from '@tarojs/taro'
import Monitor from '@monitor/taro-wechat-mini-sdk'

export default function App({ children }) {
  useLaunch(() => Monitor.init({ projectId: "demo" }))
  
  useError(Monitor.instance?.handleErrorEvent.bind(Monitor.instance, 'jsError'))
  
  return children
}
```

### 🔍 优势对比

| 方法 | 优点 | 缺点 |
|------|------|------|
| useError Hook | ✅ Taro官方推荐<br>✅ 全局监听<br>✅ 自动集成<br>✅ 性能最佳 | 仅支持Taro 3.6+ |
| React错误边界 | ✅ React原生支持<br>✅ 组件级错误处理 | ❌ 只能捕获子组件错误<br>❌ 需要手动包装 |
| window事件监听 | ✅ 通用性强 | ❌ 在Taro中可能被拦截 |

### 🧪 测试验证

#### 测试组件
```typescript
// pages/index/index.tsx
export default function Index() {
  const handleError = () => {
    // 测试同步错误
    throw new Error('测试同步错误')
  }

  const handlePromiseError = () => {
    // 测试Promise错误
    Promise.reject(new Error('测试Promise错误'))
  }

  return (
    <View>
      <Button onClick={handleError}>触发同步错误</Button>
      <Button onClick={handlePromiseError}>触发Promise错误</Button>
    </View>
  )
}
```

#### 验证步骤

1. **启动开发环境**
   ```bash
   npm run dev:weapp
   ```

2. **真机测试**（重要）
   - 使用微信开发者工具"预览"功能
   - 扫描二维码在真机上测试
   - 模拟器可能不准确

3. **查看日志**
   - 微信开发者工具控制台
   - 真机调试日志

### 📊 错误类型支持

useError Hook 可以捕获以下错误类型：

- ✅ JavaScript运行时错误
- ✅ Promise未捕获拒绝
- ✅ 组件渲染错误
- ✅ 事件处理函数错误
- ✅ 生命周期函数错误
- ✅ 网络请求错误（部分）

### ⚠️ 注意事项

1. **版本要求**：需要 Taro 3.6.0+
2. **真机测试**：必须在真机上测试，模拟器可能不准确
3. **开发模式**：开发模式下React DevTools可能影响错误显示
4. **异步错误**：对于setTimeout等异步错误也能正常捕获

### 🚀 进阶用法

#### 自定义错误处理
```typescript
useError((error) => {
  // 过滤特定错误
  if (error.message.includes('ignore')) return
  
  // 添加自定义信息
  Monitor.instance?.handleErrorEvent('jsError', {
    message: error.message,
    stack: error.stack,
    customData: {
      userId: getCurrentUserId(),
      timestamp: Date.now()
    }
  })
})
```

#### 结合其他Hook使用
```typescript
import { useLaunch, useError, usePageNotFound } from '@tarojs/taro'

export default function App({ children }) {
  useLaunch(() => Monitor.init({ projectId: "demo" }))
  
  useError(handleError)
  usePageNotFound(handlePageNotFound)
  
  return children
}
```

### 📱 平台兼容性

| 平台 | 支持情况 |
|------|----------|
| 微信小程序 | ✅ 完全支持 |
| 支付宝小程序 | ✅ 完全支持 |
| 百度小程序 | ✅ 完全支持 |
| QQ小程序 | ✅ 完全支持 |
| H5 | ✅ 完全支持 |
| React Native | ✅ 完全支持 |