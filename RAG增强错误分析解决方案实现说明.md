# RAG 增强错误分析解决方案实现说明

## 功能概述

基于 RAG（检索增强生成）的解决方案，使 AI 能够访问用户上传的源码和 sourcemap 文件，实现类似代码代理的详细错误分析功能。该方案结合了源码解析、向量数据库和 AI 生成，为前端项目提供智能错误诊断。

## 系统架构

### 1. 整体架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端项目      │    │   源码解析器     │    │   数据库存储     │
│  (JS/TS)       │───▶│  (AST解析)      │───▶│  (MySQL)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   SourceMap     │              │
         │              │   解析器        │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   错误监控      │    │   代码索引器     │    │   RAG引擎       │
│   (SDK)        │    │  (Chunking)     │    │  (检索+生成)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   AI诊断服务     │              │
         │              │  (DeepSeek)     │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   诊断报告      │    │   错误上下文     │    │   修复建议      │
│   (前端展示)    │    │   (代码位置)     │    │   (代码示例)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. 核心组件

- **源码解析器**: 解析 JavaScript/TypeScript 项目结构
- **SourceMap 解析器**: 还原错误堆栈的原始位置
- **代码索引器**: 将源码转换为可搜索的代码块
- **RAG 引擎**: 结合检索和生成功能
- **AI 诊断服务**: 基于 DeepSeek 的智能分析

## 核心功能实现

### 1. 源码解析器 (SourceCodeParserService)

**功能特性**:

- 支持 JavaScript/TypeScript 项目结构分析
- 自动检测前端框架（Taro/React/Vue/Angular）
- 解析函数、类、模块和组件
- 提取导入/导出依赖关系
- 递归解析项目目录结构

**核心方法**:

```typescript
// 解析项目结构
async parseProject(projectPath: string): Promise<ProjectStructure>

// 解析单个文件
async parseFile(filePath: string): Promise<ParsedFile>

// 检测前端框架
private detectFramework(projectPath: string): string
```

**支持的文件类型**:

- `.js`, `.jsx` - JavaScript 文件
- `.ts`, `.tsx` - TypeScript 文件
- `.vue` - Vue 单文件组件

### 2. SourceMap 解析器 (SourceMapParserService)

**功能特性**:

- 解析错误堆栈信息
- 支持多种堆栈格式（Chrome/Node.js/Firefox）
- 通过 SourceMap 还原原始代码位置
- 缓存 SourceMap 数据提高性能

**核心方法**:

```typescript
// 解析错误堆栈
async parseStackTrace(
  stackTrace: string,
  projectPath: string,
  sourceMapDir?: string
): Promise<StackTraceLocation[]>

// 通过SourceMap解析原始位置
async resolveSourceMap(
  filePath: string,
  line: number,
  column: number,
  sourceMapDir: string
): Promise<SourceMapInfo | null>
```

**堆栈格式支持**:

- `at FunctionName (file:line:column)` - Chrome/Node.js 格式
- `FunctionName@file:line:column` - Firefox 格式
- `file:line:column` - 简化格式

### 3. 代码索引器 (CodeIndexerService)

**功能特性**:

- 将源码分割为可搜索的代码块
- 支持按函数、类、模块分割
- 智能文本分块算法
- 基于相似度的代码搜索
- 支持框架和语言过滤

**核心方法**:

```typescript
// 索引项目代码
async indexProject(projectStructure: any): Promise<void>

// 语义搜索代码
async searchCode(
  query: string,
  filters?: Record<string, any>,
  limit: number = 10
): Promise<SearchResult[]>

// 创建代码块
private async createCodeChunks(parsedFile: any): Promise<CodeChunk[]>
```

**搜索算法**:

- 基于关键词匹配的相似度评分
- 支持框架和语言过滤
- 智能上下文提取
- 结果去重和排序

### 4. RAG 引擎 (RAGEngineService)

**功能特性**:

- 结合源码检索和 AI 生成
- 智能提示词构建
- 多维度错误分析
- 框架特定建议生成

**核心方法**:

```typescript
// 执行RAG分析
async analyzeError(context: RAGContext): Promise<RAGAnalysisResult>

// 搜索相关代码
private async searchRelevantCode(
  context: RAGContext,
  stackLocations: StackTraceLocation[]
): Promise<SearchResult[]>

// 构建RAG提示词
private buildRAGPrompt(
  context: RAGContext,
  stackLocations: StackTraceLocation[],
  searchResults: SearchResult[]
): string
```

**分析维度**:

1. **错误上下文分析**: 位置、函数、SourceMap 映射
2. **可能原因分析**: 基于代码上下文的智能分析
3. **代码上下文分析**: 相关代码、依赖、执行流程
4. **修复建议**: 立即修复、长期解决方案、代码示例
5. **框架特定建议**: 最佳实践、常见模式、调试建议

## 数据库设计

### 1. 代码块表 (source_code_chunks)

```sql
CREATE TABLE source_code_chunks (
  id VARCHAR(255) PRIMARY KEY,
  file_path VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  function_name VARCHAR(255) NULL,
  start_line INT NOT NULL,
  end_line INT NOT NULL,
  language VARCHAR(50) NOT NULL,
  framework VARCHAR(50) NULL,
  imports JSON NULL,
  exports JSON NULL,
  chunk_type ENUM('function', 'class', 'module', 'component') NOT NULL,
  project_index_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_file_path (file_path),
  INDEX idx_language (language),
  INDEX idx_framework (framework),
  INDEX idx_chunk_type (chunk_type),
  INDEX idx_project_index_id (project_index_id)
);
```

### 2. 项目索引表 (project_indexes)

```sql
CREATE TABLE project_indexes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_path VARCHAR(500) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  framework VARCHAR(50) NULL,
  total_files INT DEFAULT 0,
  total_chunks INT DEFAULT 0,
  last_indexed_at TIMESTAMP NULL,
  index_status ENUM('pending', 'indexing', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_project_path (project_path),
  INDEX idx_framework (framework),
  INDEX idx_status (index_status)
);
```

### 3. 错误日志表扩展

```sql
-- 为错误日志表添加RAG分析相关字段
ALTER TABLE error_logs
ADD COLUMN rag_analysis_result TEXT NULL COMMENT 'RAG分析结果（JSON格式）',
ADD COLUMN rag_analysis_generated_at DATETIME NULL COMMENT 'RAG分析生成时间';

-- 为错误聚合表添加RAG分析相关字段
ALTER TABLE error_aggregations
ADD COLUMN rag_analysis_result TEXT NULL COMMENT 'RAG分析结果（JSON格式）',
ADD COLUMN rag_analysis_generated_at DATETIME NULL COMMENT 'RAG分析生成时间';
```

## API 接口设计

### 1. 源码管理接口

**索引项目源码**:

```http
POST /api/source-code/index
Content-Type: application/json

{
  "projectPath": "/path/to/project"
}
```

**搜索源码**:

```http
GET /api/source-code/search?query=error&framework=React&limit=10
```

**获取项目状态**:

```http
GET /api/source-code/project/:projectPath/status
```

**删除项目索引**:

```http
DELETE /api/source-code/project/:projectPath
```

**解析项目结构**:

```http
POST /api/source-code/parse
Content-Type: application/json

{
  "projectPath": "/path/to/project"
}
```

### 2. RAG 分析接口

**执行 RAG 错误分析**:

```http
POST /api/ai-diagnosis/rag-analysis
Content-Type: application/json

{
  "errorId": 151,
  "errorContext": {
    "errorMessage": "TypeError: Cannot read property 'length' of undefined",
    "stackTrace": "at renderUserList (UserList.tsx:45:12)",
    "projectPath": "/path/to/project",
    "sourceMapDir": "/path/to/sourcemaps",
    "framework": "React"
  }
}
```

## 前端集成

### 1. RAG 分析报告组件

**组件特性**:

- 展示基于源码检索的增强错误分析
- 支持 SourceMap 原始位置显示
- 代码上下文和依赖关系展示
- 分层的修复建议展示
- 框架特定建议和最佳实践

**主要功能区域**:

1. **错误上下文**: 文件路径、行号、列号、函数名、SourceMap 映射
2. **可能原因分析**: 基于代码上下文的智能分析
3. **代码上下文**: 相关代码、导入依赖、项目依赖
4. **修复建议**: 立即修复、长期解决方案、代码示例
5. **框架特定建议**: 最佳实践、常见模式
6. **分析置信度**: 可视化置信度评分

### 2. 集成到错误详情页

```typescript
// 在ErrorDetail.tsx中集成RAG分析
import RAGAnalysisReport from "../components/RAGAnalysisReport";

// 添加RAG分析状态
const [ragResult, setRagResult] = useState(null);
const [ragLoading, setRagLoading] = useState(false);

// 执行RAG分析
const performRAGAnalysis = async () => {
  if (!error || !error.id) return;

  setRagLoading(true);
  try {
    const response = await fetch(`/api/ai-diagnosis/rag-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        errorId: error.id,
        errorContext: {
          errorMessage: error.errorMessage,
          stackTrace: error.errorStack,
          projectPath: error.projectPath,
          sourceMapDir: error.sourceMapDir,
          framework: error.framework,
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      setRagResult(result);
    }
  } catch (error) {
    console.error("RAG分析失败:", error);
  } finally {
    setRagLoading(false);
  }
};

// 在JSX中渲染RAG分析报告
<RAGAnalysisReport ragResult={ragResult} loading={ragLoading} />;
```

## 使用流程

### 1. 项目源码索引

1. **上传项目**: 用户上传 JavaScript/TypeScript 项目
2. **自动解析**: 系统自动解析项目结构和依赖关系
3. **代码分块**: 将源码分割为可搜索的代码块
4. **存储索引**: 将代码块存储到数据库

### 2. 错误监控和 RAG 分析

1. **错误捕获**: SDK 捕获前端错误和堆栈信息
2. **源码检索**: 基于错误信息检索相关源码
3. **SourceMap 映射**: 通过 SourceMap 还原原始位置
4. **AI 分析**: 结合检索结果进行智能分析
5. **报告生成**: 生成包含代码上下文的详细报告

### 3. 结果展示和修复

1. **报告展示**: 前端展示 RAG 分析报告
2. **代码定位**: 精确定位错误位置和上下文
3. **修复建议**: 提供具体的修复方案和代码示例
4. **最佳实践**: 基于框架的最佳实践建议

## 技术优势

### 1. 智能源码检索

- **语义搜索**: 基于相似度的智能代码检索
- **上下文理解**: 结合错误信息和代码结构
- **框架感知**: 自动识别和适配不同前端框架

### 2. 精确错误定位

- **SourceMap 支持**: 准确还原压缩后的代码位置
- **堆栈解析**: 支持多种错误堆栈格式
- **原始位置**: 显示未压缩前的源代码位置

### 3. 增强 AI 分析

- **代码上下文**: 基于实际源码的智能分析
- **依赖关系**: 分析导入/导出和项目依赖
- **框架特定**: 针对不同框架的专门建议

### 4. 高效存储和检索

- **智能分块**: 优化的代码分块算法
- **索引优化**: 高效的数据库索引设计
- **缓存机制**: SourceMap 和解析结果缓存

## 部署和配置

### 1. 环境要求

- **Node.js**: >= 16.0.0
- **数据库**: MySQL 8.0+
- **内存**: 建议 >= 4GB
- **存储**: 根据项目源码量确定

### 2. 配置参数

```typescript
// 源码解析配置
SOURCE_CODE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedExtensions: [".js", ".jsx", ".ts", ".tsx", ".vue"],
  excludePatterns: ["node_modules", ".git", "dist", "build"],
  chunkSize: 1000, // 代码块大小
  chunkOverlap: 200, // 代码块重叠
};

// 搜索配置
SEARCH_CONFIG = {
  maxResults: 50,
  minScore: 0.1,
  defaultLimit: 10,
};
```

### 3. 性能优化

- **异步处理**: 源码解析和索引异步执行
- **批量操作**: 数据库批量插入和更新
- **缓存策略**: 多级缓存提高响应速度
- **连接池**: 数据库连接池管理

## 监控和日志

### 1. 性能监控

- **索引性能**: 监控源码索引的执行时间
- **搜索性能**: 监控代码搜索的响应时间
- **AI 分析性能**: 监控 RAG 分析的执行时间
- **存储性能**: 监控数据库操作的性能指标

### 2. 错误监控

- **解析错误**: 监控源码解析失败的情况
- **索引错误**: 监控代码索引失败的情况
- **搜索错误**: 监控代码搜索失败的情况
- **AI 分析错误**: 监控 RAG 分析失败的情况

### 3. 详细日志

- **操作日志**: 记录所有源码管理操作
- **性能日志**: 记录关键操作的性能指标
- **错误日志**: 记录详细的错误信息和堆栈
- **审计日志**: 记录用户操作和系统变更

## 总结

通过实现基于 RAG 的增强错误分析解决方案，系统现在能够：

### 🎯 核心功能

1. **智能源码解析**: 自动解析 JavaScript/TypeScript 项目结构
2. **精确错误定位**: 通过 SourceMap 还原原始代码位置
3. **语义代码检索**: 基于相似度的智能代码搜索
4. **增强 AI 分析**: 结合源码上下文的智能诊断
5. **框架特定建议**: 针对不同前端框架的专门建议

### 🚀 技术优势

- **RAG 架构**: 检索增强生成，提高 AI 分析准确性
- **源码感知**: 基于实际源码的智能分析
- **SourceMap 支持**: 精确的代码位置映射
- **框架适配**: 自动识别和适配不同前端框架
- **高效存储**: 优化的数据库设计和索引策略

### 💡 用户体验

- **智能诊断**: 基于源码的准确错误分析
- **代码上下文**: 完整的错误上下文信息
- **具体建议**: 可操作的修复方案和代码示例
- **框架最佳实践**: 针对特定框架的建议
- **可视化展示**: 直观的分析报告和置信度评分

这个解决方案为前端项目提供了企业级的错误诊断能力，结合了源码分析、智能检索和 AI 生成，实现了类似代码代理的详细错误分析功能。

## 相关文档

- [AI 诊断功能优化说明](./AI诊断功能优化说明.md)
- [综合分析报告自动生成优化说明](./综合分析报告自动生成优化说明.md)
- [诊断结果数据库存储功能实现说明](./诊断结果数据库存储功能实现说明.md)
- [前端诊断交互逻辑优化说明](./前端诊断交互逻辑优化说明.md)
