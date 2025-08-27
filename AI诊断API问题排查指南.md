# AI 诊断 API 问题排查指南

## 问题描述

当前遇到的问题是：触发 AI 诊断时出现错误：

```
触发AI诊断失败: TypeError: Cannot destructure property 'taskId' of '(intermediate value)' as it is undefined.
```

## 问题分析

这个错误表明：

1. API 调用本身可能成功了
2. 但是返回的数据结构不符合预期
3. 无法从`undefined`中解构出`taskId`属性

## 排查步骤

### 1. 检查 API 基础配置

首先确认前端 API 基础 URL 配置是否正确：

```typescript
// 检查环境变量
console.log("API基础URL:", import.meta.env.VITE_API_BASE_URL || "http://localhost:3001");

// 默认应该是
VITE_API_BASE_URL=http://localhost:3001
```

### 2. 检查后端服务状态

确认后端服务是否正常运行：

```bash
# 检查后端服务状态
curl http://localhost:3001/api/health

# 检查AI诊断模块状态
curl http://localhost:3001/api/ai-diagnosis/error/1/analyze -X POST
```

### 3. 检查 API 路径

确认前端调用的 API 路径与后端定义一致：

**后端路径（NestJS）：**

```typescript
@Post("error/:errorId/analyze")
@Controller("ai-diagnosis")
```

**前端调用路径：**

```typescript
// 完整路径应该是
POST /api/ai-diagnosis/error/${errorId}/analyze
```

### 4. 检查认证和权限

确认请求是否包含正确的认证信息：

```typescript
// 检查请求头
const token = localStorage.getItem("token");
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### 5. 检查网络请求

使用浏览器开发者工具检查网络请求：

1. 打开开发者工具（F12）
2. 切换到 Network 标签
3. 触发 AI 诊断
4. 查看请求详情和响应

## 调试工具

### 1. 测试 API 连接按钮

在 AI 诊断页面添加了"测试 API 连接"按钮，点击后会：

```typescript
const testApiConnection = async () => {
  try {
    console.log("测试API连接...");
    console.log(
      "API基础URL:",
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
    );

    // 测试基本连接
    const testResponse = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
      }/api/health`
    );
    console.log("健康检查响应:", testResponse);

    // 测试AI诊断端点
    const testDiagnosisResponse = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
      }/api/ai-diagnosis/error/1/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("AI诊断测试响应:", testDiagnosisResponse);

    if (testDiagnosisResponse.ok) {
      const testData = await testDiagnosisResponse.json();
      console.log("AI诊断测试数据:", testData);
    }
  } catch (err) {
    console.error("API连接测试失败:", err);
  }
};
```

### 2. 控制台日志

在触发 AI 诊断时会输出详细的调试信息：

```typescript
console.log("开始触发AI诊断，错误ID:", error.id);
console.log("AI诊断API响应:", response);
console.log("诊断任务ID:", taskId);
```

## 常见问题及解决方案

### 1. 后端服务未启动

**症状：** 网络请求失败，连接被拒绝
**解决：** 启动后端服务

```bash
cd server
npm run start:dev
```

### 2. API 路径不匹配

**症状：** 404 错误
**解决：** 检查前端 API 路径配置，确保与后端一致

### 3. 认证失败

**症状：** 401 或 403 错误
**解决：** 检查用户登录状态和 token 有效性

### 4. 数据库连接问题

**症状：** 500 内部服务器错误
**解决：** 检查数据库连接配置和状态

### 5. AI 服务不可用

**症状：** AI 诊断服务返回错误
**解决：** 检查 DeepSeek 等服务配置

## 修复后的代码

### 1. 改进的错误处理

```typescript
// 触发诊断
const response = await apiClient.aiDiagnosis.triggerDiagnosis(Number(error.id));

console.log("AI诊断API响应:", response);

// 检查响应是否有效
if (!response || typeof response !== "object") {
  throw new Error(`API响应无效: ${JSON.stringify(response)}`);
}

if (!response.taskId) {
  throw new Error(`API响应缺少taskId: ${JSON.stringify(response)}`);
}

const { taskId } = response;
```

### 2. 详细的错误信息

```typescript
} catch (err) {
  console.error("触发AI诊断失败:", err);

  // 提供更详细的错误信息
  let errorMessage = "无法启动AI诊断，请稍后重试";
  if (err instanceof Error) {
    errorMessage = err.message;
  } else if (typeof err === 'string') {
    errorMessage = err;
  }

  notification.error({
    message: "启动诊断失败",
    description: errorMessage,
    duration: 8,
    placement: "topRight",
  });
}
```

## 测试步骤

### 1. 基本连接测试

1. 点击"测试 API 连接"按钮
2. 查看控制台输出
3. 确认 API 基础 URL 正确
4. 确认健康检查通过

### 2. AI 诊断端点测试

1. 确认 AI 诊断端点可访问
2. 检查响应状态码
3. 验证响应数据结构

### 3. 完整流程测试

1. 触发 AI 诊断
2. 观察进度指示器
3. 检查任务状态更新
4. 验证诊断结果

## 监控和日志

### 1. 前端日志

- 控制台错误日志
- 网络请求日志
- 状态变化日志

### 2. 后端日志

- 服务器启动日志
- API 调用日志
- 错误处理日志

### 3. 数据库日志

- 连接状态日志
- 查询执行日志
- 事务处理日志

## 预防措施

### 1. 开发环境

- 使用环境变量配置 API 地址
- 实现 API 健康检查
- 添加详细的错误日志

### 2. 生产环境

- 监控 API 响应时间
- 实现自动重试机制
- 设置错误告警

### 3. 测试环境

- 自动化 API 测试
- 集成测试覆盖
- 性能压力测试

## 总结

通过以上排查步骤和调试工具，应该能够快速定位和解决 AI 诊断 API 调用失败的问题。关键是要：

1. **确认配置正确**：API 基础 URL、路径、认证等
2. **检查服务状态**：后端服务、数据库、AI 服务等
3. **分析错误信息**：网络请求、响应数据、错误日志等
4. **使用调试工具**：测试按钮、控制台日志、网络面板等

如果问题仍然存在，请提供详细的错误日志和网络请求信息，以便进一步分析。
