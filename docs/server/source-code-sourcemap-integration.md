# 源代码与Sourcemap集成功能

## 概述

本功能实现了源代码和sourcemap压缩包的上传、解析和关联，为AI诊断、错误代码定位和RAG分析提供基础支持。

## 功能特性

- ✅ **双压缩包上传**: 支持源代码和sourcemap压缩包同时上传
- ✅ **自动关联**: 自动建立源代码版本与sourcemap文件的关联关系
- ✅ **错误定位**: 根据错误信息定位到具体的源代码位置
- ✅ **AI诊断支持**: 为AI诊断提供完整的源代码上下文
- ✅ **版本管理**: 支持多版本源代码和sourcemap的管理

## API接口

### 1. 上传源代码和sourcemap压缩包

**端点**: `POST /api/monitor/source-code-sourcemap/upload`

**请求格式**: `multipart/form-data`

**参数**:
- `projectId` (string): 项目ID
- `version` (string): 版本号
- `sourceCodeArchive` (file): 源代码压缩包（ZIP格式）
- `sourcemapArchive` (file): Sourcemap压缩包（ZIP格式）
- `buildId` (string, optional): 构建ID
- `branchName` (string, optional): 分支名称
- `commitMessage` (string, optional): 提交信息
- `description` (string, optional): 描述信息
- `setAsActive` (boolean, optional): 是否设置为活跃版本

**响应**:
```json
{
  "success": true,
  "message": "上传成功",
  "sourceCodeVersionId": 1,
  "sourceCodeFileCount": 150,
  "sourcemapProcessedCount": 20,
  "sourcemapErrorCount": 0
}
```

### 2. 获取关联信息

**端点**: `GET /api/monitor/source-code-sourcemap/association/:projectId/:version`

**响应**:
```json
{
  "success": true,
  "sourceCodeVersion": {
    "id": 1,
    "projectId": "test-project",
    "version": "1.0.0",
    "hasSourcemap": true,
    "sourcemapVersion": "1.0.0",
    "sourcemapAssociatedAt": "2024-01-01T00:00:00.000Z"
  },
  "sourcemapFiles": [
    {
      "filename": "main.js.map",
      "size": 10240,
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3. 错误定位

**端点**: `POST /api/monitor/source-code-sourcemap/locate`

**请求**:
```json
{
  "projectId": "test-project",
  "version": "1.0.0",
  "errorInfo": {
    "filename": "main.js",
    "line": 25,
    "column": 10,
    "errorMessage": "Cannot read property 'name' of undefined"
  }
}
```

**响应**:
```json
{
  "success": true,
  "sourceCode": {
    "filename": "src/main.js",
    "content": "console.log('Hello World');",
    "line": 25,
    "column": 10,
    "context": {
      "before": ["line 23", "line 24"],
      "current": "line 25",
      "after": ["line 26", "line 27"]
    }
  }
}
```

### 4. AI诊断上下文准备

**端点**: `POST /api/monitor/source-code-sourcemap/ai-context`

**请求**:
```json
{
  "projectId": "test-project",
  "version": "1.0.0",
  "errorContext": {
    "errorFiles": ["src/main.js", "src/utils.js"],
    "maxContextLines": 10
  }
}
```

**响应**:
```json
{
  "success": true,
  "context": {
    "files": [
      {
        "filename": "src/main.js",
        "content": "...",
        "lines": 50
      },
      {
        "filename": "src/utils.js",
        "content": "...",
        "lines": 30
      }
    ],
    "totalLines": 80
  }
}
```

## CLI工具使用

### 安装依赖
```bash
cd server
npm install
```

### 运行CLI工具
```bash
# 上传源代码和sourcemap压缩包
ts-node scripts/upload-source-code-sourcemap.ts <project-id> <version> <source-code-zip> <sourcemap-zip>

# 示例
ts-node scripts/upload-source-code-sourcemap.ts test-project 1.0.0 ./dist.zip ./sourcemaps.zip
```

### 输出示例
```
🚀 开始上传源代码和sourcemap压缩包...

📦 项目ID: test-project
🏷️  版本号: 1.0.0
📁 源代码压缩包: dist.zip (2.1 MB)
🗺️  Sourcemap压缩包: sourcemaps.zip (1.5 MB)

✅ 上传结果:
   - 状态: 成功
   - 消息: 上传成功
   - 源代码版本ID: 1
   - 源代码文件数: 150
   - Sourcemap处理成功数: 20
   - Sourcemap处理失败数: 0

🔗 关联信息:
   - 源代码版本: 1.0.0
   - 是否关联sourcemap: 是
   - Sourcemap文件数: 20

🎉 上传完成！
```

## 存储结构

### 源代码存储
```
./storage/source-code/
└── {project-id}/
    └── {version}/
        ├── original.zip          # 原始压缩包
        ├── manifest.json         # 元数据文件
        └── files/                # 解压后的文件
            ├── src/
            │   ├── main.js
            │   └── utils.js
            └── package.json
```

### Sourcemap存储
```
/data/sourcemaps/
└── {project-id}/
    └── {version}/
        ├── main.js.map
        ├── vendor.js.map
        └── runtime.js.map
```

## 数据库结构

### SourceCodeVersion 实体新增字段
```typescript
@Column({ name: "has_sourcemap", default: false })
hasSourcemap: boolean;

@Column({ name: "sourcemap_version", length: 50, nullable: true })
sourcemapVersion?: string;

@Column({ name: "sourcemap_associated_at", type: "timestamp", nullable: true })
sourcemapAssociatedAt?: Date;
```

## 错误处理

### 常见错误代码
- `SOURCE_CODE_UPLOAD_FAILED`: 源代码上传失败
- `SOURCEMAP_UPLOAD_FAILED`: Sourcemap上传失败
- `VERSION_ALREADY_EXISTS`: 版本已存在
- `PROJECT_NOT_FOUND`: 项目不存在
- `INVALID_ARCHIVE_FORMAT`: 无效的压缩包格式

## 性能优化

1. **流式处理**: 支持大文件流式上传和处理
2. **并行处理**: 多个文件并行解析
3. **缓存机制**: 频繁访问的源代码内容缓存
4. **懒加载**: 按需加载源代码内容

## 安全考虑

1. **文件类型验证**: 严格验证上传文件类型
2. **路径遍历防护**: 防止目录遍历攻击
3. **大小限制**: 单个文件大小限制（默认200KB）
4. **权限控制**: 基于项目的访问权限控制

## 监控指标

- `source_code_upload_duration`: 源代码上传耗时
- `sourcemap_upload_duration`: Sourcemap上传耗时
- `source_code_file_count`: 源代码文件数量
- `sourcemap_file_count`: Sourcemap文件数量
- `association_success_rate`: 关联成功率

## 后续扩展

1. **增量上传**: 支持增量源代码和sourcemap上传
2. **版本对比**: 不同版本源代码对比功能
3. **自动关联**: 根据构建信息自动关联版本
4. **批量操作**: 支持批量上传和管理
5. **Web界面**: 图形化上传和管理界面