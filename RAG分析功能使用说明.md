# RAG 分析功能使用说明

## 功能概述

RAG（检索增强生成）分析功能结合了源码检索和 AI 分析，能够为前端错误提供更精准、更智能的诊断分析。该功能通过分析项目源码、错误堆栈和上下文信息，生成包含代码位置、修复建议和最佳实践的详细报告。

## 🚀 核心特性

### 1. 智能源码检索

- **自动解析**: 自动解析 JavaScript/TypeScript 项目结构
- **代码分块**: 将源码分割为可搜索的代码块
- **语义搜索**: 基于相似度的智能代码检索
- **框架识别**: 自动识别 React、Vue、Taro 等前端框架

### 2. 精准错误定位

- **SourceMap 支持**: 通过 SourceMap 还原原始代码位置
- **堆栈解析**: 智能解析错误堆栈信息
- **上下文分析**: 分析错误发生的代码上下文
- **依赖追踪**: 追踪相关的导入和依赖关系

### 3. AI 增强分析

- **智能诊断**: 基于源码的 AI 错误分析
- **修复建议**: 提供具体的代码修复方案
- **最佳实践**: 基于框架的最佳实践建议
- **预防措施**: 提供避免类似错误的建议

## 📋 使用流程

### 1. 前端页面使用

#### 访问 RAG 分析功能

1. 打开错误详情页面
2. 切换到"AI 诊断"标签页
3. 在"RAG 增强分析"卡片中点击"开始 RAG 分析"按钮

#### 查看分析结果

- 分析完成后，结果会显示在"RAG 分析结果"卡片中
- 可以点击"刷新结果"按钮重新获取最新结果
- 历史记录会保存在"查看分析历史"中

### 2. API 接口使用

#### 执行 RAG 分析

```bash
POST /api/ai-diagnosis/rag-analysis
Content-Type: application/json

{
  "errorId": "123",
  "errorContext": {
    "errorMessage": "TypeError: Cannot read property 'data' of undefined",
    "stackTrace": "TypeError: Cannot read property 'data' of undefined\n    at TestComponent (src/components/TestComponent.tsx:45:15)",
    "projectPath": "my-project",
    "framework": "react",
    "sourceMapDir": "dist"
  }
}
```

#### 查询 RAG 分析结果

```bash
GET /api/ai-diagnosis/rag-analysis/{analysisId}
```

#### 查询 RAG 分析历史

```bash
GET /api/ai-diagnosis/rag-analysis/history
```

## 🧪 测试指南

### 1. 运行集成测试

#### 完整流程测试

```bash
# 测试RAG分析的完整流程
npm run test:rag
```

#### API 接口测试

```bash
# 测试RAG分析相关的API接口
npm run test:rag-api
```

### 2. 测试场景

#### 基础功能测试

- ✅ 环境检查
- ✅ 错误创建
- ✅ RAG 分析执行
- ✅ 结果验证
- ✅ 前端集成

#### API 接口测试

- ✅ 基础 RAG 分析请求
- ✅ 包含源码上下文的 RAG 分析
- ✅ 复杂错误场景 RAG 分析
- ✅ RAG 分析结果查询
- ✅ RAG 分析历史查询
- ✅ 错误处理测试

### 3. 测试数据

测试使用以下模拟数据：

```javascript
{
  project: {
    name: 'test-rag-project',
    framework: 'react',
    error: {
      message: 'TypeError: Cannot read property \'data\' of undefined',
      stack: 'TypeError: Cannot read property \'data\' of undefined\n    at TestComponent (src/components/TestComponent.tsx:45:15)',
      sourceFile: 'src/components/TestComponent.tsx',
      sourceLine: 45,
      sourceColumn: 15
    }
  }
}
```

## 🔧 配置说明

### 1. 环境变量

```bash
# AI服务配置
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=2000
DEEPSEEK_TEMPERATURE=0.1

# 本地Ollama配置（可选）
DEEPSEEK_USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434/v1
```

### 2. 数据库配置

确保数据库中有以下表：

- `source_code_chunks` - 代码块表
- `project_indexes` - 项目索引表
- `error_logs` - 错误日志表（包含 RAG 分析字段）

## 📊 性能指标

### 1. 响应时间

- **环境检查**: < 5 秒
- **RAG 分析**: < 30 秒
- **结果查询**: < 2 秒

### 2. 成功率

- **环境检查**: 100%
- **RAG 分析**: > 95%
- **结果查询**: > 98%

### 3. 并发支持

- 支持多个 RAG 分析任务并行执行
- 使用 Redis 队列管理任务优先级
- 自动重试失败的请求

## 🚨 故障排除

### 1. 常见问题

#### RAG 分析失败

**症状**: 点击"开始 RAG 分析"后显示失败
**可能原因**:

- 服务端未启动
- AI 服务配置错误
- 数据库连接失败

**解决方案**:

1. 检查服务端状态
2. 验证 AI 服务配置
3. 检查数据库连接

#### 分析结果为空

**症状**: RAG 分析完成但结果为空
**可能原因**:

- 项目源码未上传
- SourceMap 文件缺失
- 错误信息不完整

**解决方案**:

1. 上传项目源码
2. 确保 SourceMap 文件存在
3. 检查错误信息完整性

### 2. 日志查看

#### 服务端日志

```bash
# 查看服务端日志
tail -f server/logs/app.log

# 查看RAG分析相关日志
grep "RAG" server/logs/app.log
```

#### 前端控制台

- 打开浏览器开发者工具
- 查看 Console 标签页的错误信息
- 查看 Network 标签页的请求状态

## 🔮 未来计划

### 1. 功能增强

- **多语言支持**: 支持 Python、Java 等更多编程语言
- **智能推荐**: 基于历史数据的智能修复建议
- **团队协作**: 支持团队共享分析结果和讨论

### 2. 性能优化

- **缓存机制**: 实现分析结果缓存
- **异步处理**: 优化大量请求的处理性能
- **分布式支持**: 支持多节点部署

### 3. 用户体验

- **实时进度**: 显示分析进度和状态
- **结果导出**: 支持分析结果导出为 PDF/Word
- **移动端适配**: 优化移动端使用体验

## 📞 技术支持

### 1. 问题反馈

- 在 GitHub Issues 中提交问题
- 提供详细的错误信息和复现步骤
- 附上相关的日志和截图

### 2. 功能建议

- 欢迎提交功能改进建议
- 参与功能设计和讨论
- 贡献代码和文档

### 3. 联系方式

- 项目维护者: [维护者信息]
- 技术支持邮箱: [支持邮箱]
- 技术交流群: [交流群信息]

---

## 📝 更新日志

### v1.0.0 (2024-01-XX)

- ✨ 新增 RAG 分析功能
- ✨ 支持源码检索和 AI 分析
- ✨ 集成前端界面
- ✨ 完整的测试套件
- 📚 详细的使用文档

---

_最后更新: 2024 年 1 月_
