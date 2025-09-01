# Taro小程序自动化配置指南

## 🚀 概述

本指南介绍如何使用Monitor SDK的自动化配置工具，快速为Taro小程序项目配置监控功能，避免重复的手动配置工作。

## 📋 前置依赖

在使用自动化配置工具前，请确保满足以下构建依赖要求：

### Node.js 版本要求
- **最低版本**: Node.js 16.x
- **推荐版本**: Node.js 18.x 或 20.x
- **包管理器**: npm 8.x+ 或 yarn 1.22+

### 构建工具依赖
自动化配置工具依赖以下构建工具，请确保已全局安装或项目依赖中包含：

```bash
# 必需的核心构建工具
npm install -g rollup@^3.0.0
npm install -g typescript@^5.0.0

# 可选的开发工具（推荐安装）
npm install -g @rollup/plugin-node-resolve@^15.0.0
npm install -g @rollup/plugin-commonjs@^25.0.0
npm install -g @rollup/plugin-typescript@^11.0.0
npm install -g rollup-plugin-terser@^7.0.0

# 或者通过项目依赖安装
npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-typescript rollup-plugin-terser typescript
```

### 环境检查
运行以下命令验证构建环境：

```bash
# 检查Node.js版本
node --version

# 检查npm版本  
npm --version

# 检查TypeScript版本
tsc --version

# 检查Rollup版本（如果已安装）
rollup --version
```

### 构建问题排查
如果遇到构建错误，请检查：

1. **权限问题**: 确保对项目目录有读写权限
2. **磁盘空间**: 确保有足够的磁盘空间进行构建
3. **网络连接**: 确保能够访问npm registry下载依赖
4. **版本兼容性**: 检查Node.js和npm版本兼容性

### 快速修复
如果构建失败，可以尝试：

```bash
# 清理缓存和重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 重新构建所有模块
npm run build
```

## 📦 自动化配置工具

### 1. 智能检测工具

```bash
# 在Taro项目根目录运行
npx @monitor/sdk auto-detect-taro
```

**功能**:

- 自动检测项目类型（Taro + React/Vue）
- 检查现有配置状态
- 生成配置建议和评分
- 提供自动化配置命令

### 2. 一键配置工具

```bash
# 在Taro项目根目录运行
npx @monitor/sdk auto-config-taro
```

**注意**: 如果 `@monitor/sdk` 尚未发布到npm，可以使用本地路径运行：
```bash
# 使用相对路径（推荐）
node ../sdk/scripts/auto-config-taro.cjs

# 或者使用绝对路径
node /path/to/monitor/sdk/scripts/auto-config-taro.cjs
```

**功能**:

- 自动创建Taro构建配置文件
- 配置sourcemap生成
- 添加构建脚本
- 更新package.json脚本
- 检查SDK依赖

## 🎯 配置流程

### 步骤1: 项目检测

运行检测命令查看当前配置状态：

```bash
cd your-taro-project
npx @monitor/sdk auto-detect-taro
```

输出示例：

```
📊 项目检测报告
===============

项目信息:
↳ Taro项目: 是
↳ 框架: react
↳ TypeScript: 是
↳ 监控SDK: 未安装
↳ 构建配置: 未配置
↳ Sourcemap: 未启用
↳ 构建脚本: 未配置

配置建议:
🔴 [CONFIG] 缺少Taro构建配置文件
  建议: 需要创建config目录和配置文件
🔴 [SOURCEMAP] 未配置sourcemap生成
  建议: 需要在webpack配置中添加devtool: source-map
🟡 [SCRIPT] 缺少自动化构建脚本
  建议: 需要创建build-with-sourcemap.sh脚本
🟡 [SDK] 未安装监控SDK
  建议: 需要安装@monitor/sdk依赖（主包包含所有功能）

配置完整度:
↳ 评分: 25/100 ❌
```

### 步骤2: 执行自动化配置

根据检测建议，运行配置命令：

```bash
npx @monitor/sdk auto-config-taro
```

输出示例：

```
🚀 Taro小程序自动化配置工具
============================

ℹ 正在检测Taro项目...
✓ 检测到Taro项目
ℹ 正在配置Taro构建...
✓ 创建config/index.ts配置文件
✓ 创建config/dev.ts配置文件
✓ 创建config/prod.ts配置文件
ℹ 正在配置构建脚本...
✓ 复制构建脚本并设置执行权限
ℹ 正在配置package.json脚本...
✓ 添加build:monitor脚本
✓ 添加build:sourcemap脚本
ℹ 正在检查监控SDK依赖...
⚠ 未找到监控SDK依赖，请手动安装: npm install @monitor/sdk

✓ 自动化配置完成！

📋 下一步操作:
1. 安装监控SDK: npm install @monitor/sdk
2. 在src/app.ts中引入监控SDK
3. 运行构建: npm run build:monitor
4. 上传生成的ZIP包到监控平台

💡 提示:
- 构建脚本: ./build-with-sourcemap.sh
- 配置文件: config/index.ts, config/dev.ts, config/prod.ts
```

### 步骤3: 安装SDK和初始化

```bash
# 安装监控SDK
npm install @monitor/sdk

# 在src/app.ts中初始化SDK
import { initMonitor } from '@monitor/sdk';

initMonitor({
  projectId: 'your-project-id',
  serverUrl: 'https://your-monitor-server.com',
  // 其他配置...
});
```

### 步骤4: 构建和上传

```bash
# 执行监控构建
npm run build:monitor

# 或者直接运行脚本
./build-with-sourcemap.sh
```

## 📁 生成的文件结构

配置完成后，项目结构如下：

```
your-taro-project/
├── config/
│   ├── index.ts          # Taro主配置文件
│   ├── dev.ts           # 开发环境配置
│   └── prod.ts          # 生产环境配置
├── build-with-sourcemap.sh # 自动化构建脚本
├── package.json         # 已添加构建脚本
└── src/
    └── app.ts           # SDK初始化文件
```

## ⚙️ 配置文件详情

### config/index.ts

自动配置的Taro主配置文件，包含：

- 基础项目配置
- 多端适配设置
- **自动启用sourcemap生成**
- Webpack chain配置

### config/dev.ts & config/prod.ts

环境特定的配置：

- 开发环境：详细日志输出
- 生产环境：优化配置和sourcemap

### build-with-sourcemap.sh

智能构建脚本，功能包括：

- ✅ 依赖智能检查（避免重复安装）
- ✅ 内存优化处理
- ✅ 性能监控和计时
- ✅ Sourcemap自动收集
- ✅ 上传包生成
- ✅ 跨平台兼容（支持macOS/Linux）

## 🎨 自定义配置

### 修改项目信息

在 `build-with-sourcemap.sh` 中修改：

```bash
# 配置参数
PROJECT_ID="your-project-id"
VERSION="1.0.0"
```

### 调整构建选项

在 `config/index.ts` 中自定义：

```typescript
// 修改webpack配置
webpackChain(chain) {
  chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin)
  // 修改sourcemap类型
  chain.devtool('hidden-source-map')
}
```

## 🔧 高级用法

### 集成到CI/CD

```yaml
# GitHub Actions 示例
name: Build and Upload
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Build with sourcemap
      run: ./build-with-sourcemap.sh
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: sourcemap-package
        path: *.zip
```

### 环境变量配置

```bash
# 使用环境变量覆盖配置
export PROJECT_ID="prod-project"
export VERSION="2.0.0"
./build-with-sourcemap.sh
```

## 🐛 故障排除

### 常见问题

1. **权限错误**

   ```bash
   chmod +x build-with-sourcemap.sh
   ```

2. **依赖安装失败**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Sourcemap未生成**
   - 检查config/index.ts中的devtool配置
   - 确认Taro版本支持sourcemap

### 获取帮助

```bash
# 查看详细帮助
npx @monitor/sdk auto-detect-taro --help
npx @monitor/sdk auto-config-taro --help
```

## 📊 性能指标

配置完成后，构建脚本提供详细的性能监控：

- 🕐 总构建时间
- 💾 内存使用峰值
- 📦 处理的文件数量
- 🗺️ 生成的sourcemap数量

## 🚀 下一步

1. **测试构建**: 运行 `npm run build:monitor` 验证配置
2. **上传测试**: 将生成的ZIP包上传到监控平台
3. **错误验证**: 触发测试错误验证监控功能
4. **性能优化**: 根据监控数据优化应用性能

## 📝 更新日志

- **v1.0.0** (2024-01-20): 初始版本发布
  - 自动化项目检测
  - 一键配置文件生成
  - 智能构建脚本配置
  - 跨平台兼容支持

---

💡 **提示**: 定期运行 `npx @monitor/sdk auto-detect-taro` 检查配置状态，确保监控功能正常工作。
