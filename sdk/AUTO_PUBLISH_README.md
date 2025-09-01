# 🚀 SDK 自动化发布流程

本文档介绍如何使用GitHub Actions自动发布SDK到npm。

## 📋 前置条件

### 1. npm 账号设置

确保你有 `@error-monitor` 组织的npm账号权限，或者创建自己的npm组织。

### 2. GitHub Secrets 配置

在GitHub仓库的 `Settings > Secrets and variables > Actions` 中添加以下密钥：

- `NPM_TOKEN`: 你的npm访问令牌
  - 获取方式：登录 [npmjs.com](https://www.npmjs.com) → `Access Tokens` → `Generate New Token`
  - 选择 `Automation` 类型，确保有 `publish` 权限

## 🔄 自动化流程

### 触发条件

- 推送到 `main` 分支
- 修改了 `sdk/` 目录下的文件
- 手动触发（workflow_dispatch）

### 工作流程

1. **版本检测** - 检测 `package.json` 中的版本变化
2. **构建测试** - 构建所有模块并运行测试
3. **发布到npm** - 自动发布所有包到npm
4. **创建Release** - 在GitHub上创建版本发布
5. **更新日志** - 自动更新 `CHANGELOG.md`

## 🛠️ 版本管理

### 使用版本管理脚本

```bash
# 显示当前版本
npm run version:show

# 自动递增版本号
npm run version:bump          # 补丁版本 1.0.0 -> 1.0.1
npm run version:bump minor    # 次要版本 1.0.0 -> 1.1.0
npm run version:bump major    # 主要版本 1.0.0 -> 2.0.0

# 更新到指定版本
npm run version:update 1.2.0
```

### 手动更新版本

直接编辑各个包的 `package.json` 文件中的 `version` 字段：

```json
{
  "name": "@error-monitor/sdk",
  "version": "1.1.0",  // 修改这里
  ...
}
```

**注意**: 所有子包的版本号应该保持一致！

## 📦 发布的包

| 包名                      | 描述       | 用途                  |
| ------------------------- | ---------- | --------------------- |
| `@error-monitor/sdk`      | 完整功能包 | 包含所有功能的完整SDK |
| `@error-monitor/core`     | 核心模块   | 跨平台监控基础能力    |
| `@error-monitor/web-sdk`  | Web专用包  | 专为Web平台设计       |
| `@error-monitor/taro-sdk` | Taro专用包 | 专为Taro小程序设计    |

## 🚀 发布步骤

### 1. 更新版本号

```bash
cd sdk
npm run version:bump minor  # 或其他版本类型
```

### 2. 提交代码

```bash
git add .
git commit -m "🚀 发布版本 1.1.0"
git push origin main
```

### 3. 自动发布

推送代码后，GitHub Actions会自动：

- 检测版本变化
- 构建和测试
- 发布到npm
- 创建GitHub Release
- 更新变更日志

## 📊 监控发布状态

### GitHub Actions 页面

访问 `https://github.com/{用户名}/{仓库名}/actions` 查看工作流执行状态。

### 工作流状态

- 🟢 **绿色**: 发布成功
- 🔴 **红色**: 发布失败
- 🟡 **黄色**: 正在执行

## 🔧 故障排除

### 常见问题

#### 1. 构建失败

- 检查TypeScript编译错误
- 验证依赖是否正确安装
- 查看构建日志中的具体错误

#### 2. 发布失败

- 确认 `NPM_TOKEN` 已正确配置
- 检查npm包名是否可用
- 验证版本号格式是否正确

#### 3. 版本检测失败

- 确保 `package.json` 中的版本号格式正确
- 检查Git提交历史是否完整

### 手动发布

如果自动发布失败，可以手动执行：

```bash
cd sdk
npm run build:prod
npm publish

cd core
npm publish

cd ../web-core
npm publish

cd ../taro-core
npm publish
```

## 📝 变更日志

每次发布后，`CHANGELOG.md` 会自动更新。你也可以手动编辑这个文件来添加更详细的变更说明。

## 🔒 安全注意事项

- 不要将 `NPM_TOKEN` 提交到代码仓库
- 定期轮换npm访问令牌
- 确保只有授权人员可以触发发布流程

## 📞 支持

如果遇到问题，请：

1. 检查GitHub Actions日志
2. 查看npm发布状态
3. 在仓库Issues中报告问题

---

**提示**: 首次使用前，建议先在测试分支上验证整个流程！
