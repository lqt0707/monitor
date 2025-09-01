# 变更日志

本文件记录了 Monitor SDK 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 🚀 新功能

- GitHub Actions 自动发布流程
- 版本检测和自动发布
- 自动生成变更日志

### 🔧 改进

- 构建流程优化
- 测试覆盖率提升
- 文档完善

### 🐛 修复

- 修复构建脚本问题
- 优化依赖管理
- 修复TypeScript类型错误

---

## [1.0.0] - 2025-01-01

### 🚀 新功能

- 完整的监控SDK框架
- 支持Web和Taro小程序平台
- 错误监控、性能监控、行为监控
- 源代码映射支持
- 多平台适配器

### 🔧 技术特性

- TypeScript支持
- 模块化架构
- 可扩展的插件系统
- 完整的类型定义
- 构建优化

### 📦 包含模块

- `@error-monitor/sdk` - 主包
- `@error-monitor/core` - 核心模块
- `@error-monitor/web-sdk` - Web专用包
- `@error-monitor/taro-sdk` - Taro专用包

### 🛠️ 开发工具

- 自动化构建脚本
- 源代码打包工具
- Taro项目自动配置
- 完整的测试套件

---

## 版本说明

### 版本号规则

- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 发布流程

1. 修改 `package.json` 中的版本号
2. 提交代码到 `main` 分支
3. GitHub Actions 自动检测版本变化
4. 自动构建、测试和发布到npm
5. 自动创建GitHub Release
6. 自动更新变更日志

### 安装方式

```bash
# 完整功能包
npm install @error-monitor/sdk

# Web专用包
npm install @error-monitor/web-sdk

# Taro专用包
npm install @error-monitor/taro-sdk

# 核心包
npm install @error-monitor/core
```

### 相关链接

- [文档](https://github.com/your-org/monitor/tree/main/sdk)
- [快速开始](https://github.com/your-org/monitor/tree/main/sdk/QUICK_START.md)
- [问题反馈](https://github.com/your-org/monitor/issues)
