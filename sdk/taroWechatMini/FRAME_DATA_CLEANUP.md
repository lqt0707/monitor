# FrameData 清理功能说明

## 功能概述

在数据上报过程中，系统会自动清理所有层级的 `frameData` 字段，避免敏感信息泄露或数据过大。

## 清理规则

1. **字段识别**：不区分大小写，匹配所有可能的变体：
   - `frameData`
   - `FrameData`
   - `framedata`
   - `FRAMEDATA`
   - 任何包含 `frame` 和 `data` 组合的字段名

2. **深度清理**：递归处理所有嵌套层级，包括：
   - 对象属性
   - 数组元素
   - 深层嵌套结构

3. **数据保护**：清理过程不会影响其他重要字段，只移除指定的敏感字段。

## 使用方式

无需手动调用，系统会在数据上报前自动执行清理：

```typescript
import { Reporter } from './reporter';

const reporter = new Reporter({
  serverUrl: 'http://your-server.com',
  projectId: 'your-project-id'
});

// 上报数据时自动清理frameData
reporter.addData({
  type: 'jsError',
  message: '错误信息',
  stack: '错误堆栈',
  frameData: {
    // 这个字段会被自动清理
    url: 'http://example.com',
    line: 123
  },
  otherData: {
    // 这个字段会保留
    userId: 12345
  }
});
```

## 验证方法

运行测试文件验证清理功能：

```bash
# 运行测试
node src/test-frame-data-cleanup.ts
```

## 注意事项

- 清理操作是不可逆的，原始数据中的frameData会被永久移除
- 如果需要在本地保留frameData用于调试，请在调用addData之前自行保存
- 清理功能默认启用，无法通过配置关闭