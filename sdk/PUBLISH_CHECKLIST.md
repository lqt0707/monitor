# 📋 SDK发布检查清单

在发布SDK之前，请确保完成以下检查项目：

## 🔑 身份验证配置

- [ ] **npm账号设置**
  - [ ] 已登录npm: `npm whoami`
  - [ ] 有 `@error-monitor` 组织权限
  - [ ] 或者已创建自己的npm组织

- [ ] **GitHub Secrets配置**
  - [ ] 在仓库 `Settings > Secrets and variables > Actions` 中添加了 `NPM_TOKEN`
  - [ ] `NPM_TOKEN` 有 `publish` 权限

## 📦 包配置检查

- [ ] **包名称一致性**
  - [ ] 主包: `@error-monitor/sdk`
  - [ ] 核心包: `@error-monitor/core`
  - [ ] Web包: `@error-monitor/web-sdk`
  - [ ] Taro包: `@error-monitor/taro-sdk`

- [ ] **版本号一致性**
  - [ ] 所有包的版本号相同
  - [ ] 版本号格式正确 (如: `1.1.0`)

- [ ] **package.json配置**
  - [ ] `main`, `module`, `types` 字段正确
  - [ ] `files` 字段包含必要的构建产物
  - [ ] `exports` 字段配置正确

## 🔨 构建验证

- [ ] **构建产物检查**
  - [ ] `npm run build:prod` 执行成功
  - [ ] `core/dist/index.js` 存在
  - [ ] `web-core/dist/index.js` 存在
  - [ ] `taro-core/dist/index.js` 存在
  - [ ] `dist/index.js` 存在

- [ ] **类型检查**
  - [ ] `npm run test:types` 通过
  - [ ] 无TypeScript编译错误

- [ ] **测试通过**
  - [ ] `npm test` 执行成功
  - [ ] 构建测试通过

## ⚙️ GitHub Actions配置

- [ ] **工作流文件**
  - [ ] `.github/workflows/auto-publish.yml` 存在
  - [ ] `.github/workflows/build-and-publish.yml` 存在

- [ ] **触发条件**
  - [ ] 推送到 `main` 分支时触发
  - [ ] 修改 `sdk/` 目录时触发
  - [ ] 支持手动触发 (`workflow_dispatch`)

## 📚 文档准备

- [ ] **README文件**
  - [ ] 安装说明正确
  - [ ] 使用示例完整
  - [ ] API文档清晰

- [ ] **变更日志**
  - [ ] `CHANGELOG.md` 包含最新版本信息
  - [ ] 变更说明详细

## 🚀 发布流程

### 1. 更新版本号

```bash
cd sdk
npm run version:bump minor  # 或其他版本类型
```

### 2. 验证构建

```bash
npm run clean:all
npm run build:prod
npm test
```

### 3. 提交代码

```bash
git add .
git commit -m "🚀 发布版本 1.1.0"
git push origin main
```

### 4. 监控发布状态

- 访问 GitHub Actions 页面
- 检查工作流执行状态
- 验证npm包发布成功

## 🔍 发布后验证

- [ ] **npm包检查**
  - [ ] 主包 `@error-monitor/sdk` 可安装
  - [ ] 子包 `@error-monitor/core` 可安装
  - [ ] 子包 `@error-monitor/web-sdk` 可安装
  - [ ] 子包 `@error-monitor/taro-sdk` 可安装

- [ ] **GitHub Release**
  - [ ] 自动创建了版本发布
  - [ ] 发布说明完整
  - [ ] 变更日志已更新

## 🚨 常见问题

### 构建失败

- 检查TypeScript编译错误
- 验证依赖是否正确安装
- 查看构建日志中的具体错误

### 发布失败

- 确认 `NPM_TOKEN` 已正确配置
- 检查npm包名是否可用
- 验证版本号格式是否正确

### 版本检测失败

- 确保 `package.json` 中的版本号格式正确
- 检查Git提交历史是否完整

## 📞 紧急处理

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

---

**重要提醒**: 发布前请仔细检查所有项目，确保配置正确！
