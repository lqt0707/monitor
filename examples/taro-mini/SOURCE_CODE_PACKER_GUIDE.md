# Taro 小程序源代码打包工具 - 完整指南

## 📦 工具概述

本项目提供了三个版本的源代码打包工具，用于将 Taro 小程序项目的源代码打包上传到监控系统，实现精确的错误定位功能。

## 🛠️ 可用工具

### 1. 基础版 (`pack-source-code.js`)

- **特点**: 简单易用，基本功能完整
- **适用场景**: 快速打包，基本需求
- **命令**: `npm run pack:source`

### 2. 优化版 (`pack-source-code-optimized.js`) ⭐ 推荐

- **特点**: 符合平台要求，标准 manifest.json 格式
- **适用场景**: 生产环境，标准化打包
- **命令**: `npm run pack:source:optimized`

### 3. 高级版 (`pack-source-advanced.js`)

- **特点**: 配置文件支持，高度可定制
- **适用场景**: 复杂项目，定制化需求
- **命令**: `npm run pack:source:advanced`

## 🚀 快速开始

### 推荐使用优化版

```bash
# 进入项目目录
cd examples/taro-mini

# 运行优化版打包脚本
npm run pack:source:optimized
```

### 使用高级版（支持配置）

```bash
# 使用默认配置
npm run pack:source:advanced

# 使用自定义配置文件
npm run pack:source:config

# 启用详细输出
npm run pack:source:verbose
```

## 📋 主要优化改进

### 1. 符合平台要求的 manifest.json 格式

```json
{
  "projectId": "taroMini",
  "version": "1.0.0",
  "buildId": "build-1724601234567",
  "branch": "main",
  "commit": "abc123def456",
  "generatedAt": "2025-08-26T00:00:00.000Z",
  "files": [
    {
      "path": "src/app.ts",
      "size": 1024,
      "md5": "d41d8cd98f00b204e9800998ecf8427e",
      "type": "typescript",
      "text": true,
      "modified": "2025-08-26T00:00:00.000Z"
    }
  ],
  "packager": {
    "name": "taro-mini-source-packer",
    "version": "2.0.0",
    "optimized": true
  }
}
```

### 2. 精确的文件类型识别

- **JavaScript**: `.js`, `.jsx`
- **TypeScript**: `.ts`, `.tsx`
- **Vue**: `.vue`
- **样式文件**: `.css`, `.scss`, `.less`, `.sass`
- **配置文件**: `.json`, `.xml`, `.yaml`, `.yml`
- **文档**: `.md`, `.txt`

### 3. 完整的构建信息

- 构建 ID 和时间戳
- Git 分支和提交信息
- 环境信息（Node.js 版本、平台等）
- 文件完整性校验（MD5/SHA256）

### 4. 优化的压缩包结构

```
taroMini-1.0.0-build123.zip
└── taroMini-1.0.0/
    ├── manifest.json          # 标准清单文件
    ├── file-list.txt         # 文件清单
    ├── src/                  # 源代码目录
    │   ├── app.ts
    │   ├── pages/
    │   └── utils/
    ├── config/               # 配置文件
    └── types/                # 类型定义
```

## ⚙️ 配置文件说明

高级版支持 `pack-source-config.json` 配置文件：

```json
{
  "fileTypes": {
    "javascript": [".js", ".jsx"],
    "typescript": [".ts", ".tsx"]
  },
  "includePatterns": ["src/**/*", "config/**/*", "*.json"],
  "excludePatterns": ["node_modules/**/*", "dist/**/*", "*.log"],
  "compression": {
    "enabled": true,
    "level": 6
  },
  "validation": {
    "maxFileSize": 52428800,
    "maxTotalSize": 104857600
  }
}
```

## 📊 输出示例

### 优化版输出

```
🚀 开始打包 Taro 小程序源代码（优化版）...

📋 获取项目信息...
   项目名称: taroMini
   项目版本: 1.0.0
   构建ID: build-1724601234567
   分支: main
   提交: abc123de

📁 扫描源代码文件...
✅ 找到 45 个源代码文件

📄 生成 manifest.json...
🔍 验证打包结果...

📦 创建打包结构...

📊 打包统计:
   文件数量: 45
   总大小: 156.78 KB
   文件类型: typescript, javascript, css, json
   输出目录: /path/to/source-code-package/taroMini-1.0.0

📈 文件类型分布:
   typescript: 28 个文件
   javascript: 8 个文件
   css: 6 个文件
   json: 3 个文件

🗜️  创建压缩包...
✅ 压缩包创建成功: taroMini-1.0.0-build123.zip
   压缩包大小: 45.23 KB
   压缩率: 71.2%

🎉 打包完成！
```

## 🔧 错误定位功能

### 1. 精确的源码映射

- 完整的文件路径保持
- 原始目录结构维护
- 文件内容完整性校验

### 2. 构建信息关联

- Git 提交哈希关联
- 构建时间戳记录
- 分支信息保存

### 3. 平台集成

上传后，监控系统可以：

- 根据错误堆栈定位到具体文件
- 显示错误发生的源代码行
- 提供完整的上下文信息
- 支持多版本源码管理

## 📋 上传步骤

1. **运行打包脚本**

   ```bash
   npm run pack:source:optimized
   ```

2. **打开监控系统管理界面**
   访问 http://localhost:3000

3. **进入项目配置**

   - 选择对应的项目
   - 进入"源代码分析"选项卡

4. **上传压缩包**

   - 选择生成的 `.zip` 文件
   - 系统自动解析 manifest.json
   - 建立文件索引和映射关系

5. **验证上传结果**
   - 检查文件列表
   - 确认版本信息
   - 测试错误定位功能

## 🔍 故障排除

### 常见问题

1. **打包失败**

   - 检查 Node.js 版本（需要 12+）
   - 确保有足够的磁盘空间
   - 检查文件权限

2. **文件过大**

   - 调整配置文件中的 `maxFileSize`
   - 检查是否包含了不必要的文件
   - 使用排除模式过滤大文件

3. **上传失败**

   - 检查网络连接
   - 确认监控服务正常运行
   - 验证压缩包格式

4. **错误定位不准确**
   - 确保源码版本与线上版本一致
   - 检查文件路径映射
   - 验证 manifest.json 格式

### 调试模式

使用高级版的详细输出模式：

```bash
npm run pack:source:verbose
```

## 🎯 最佳实践

1. **版本管理**

   - 每次发布前重新打包源码
   - 使用 Git 标签管理版本
   - 保持源码与构建产物的对应关系

2. **文件过滤**

   - 排除敏感配置文件
   - 过滤第三方依赖
   - 只包含必要的源代码文件

3. **自动化集成**

   - 集成到 CI/CD 流程
   - 自动上传到监控系统
   - 建立版本发布检查点

4. **安全考虑**
   - 检查敏感信息泄露
   - 使用环境变量管理密钥
   - 定期清理旧版本源码

## 📞 技术支持

如有问题，请参考：

- [监控系统文档](../../README.md)
- [源代码分析功能说明](../../admin/README.md)
- [SDK 集成指南](../../sdk/README.md)

---

**最后更新**: 2025-08-26  
**版本**: 3.0.0  
**维护者**: Monitor Team
