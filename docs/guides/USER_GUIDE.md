# 🚀 Monitor SDK 源代码打包 - 用户指南

## 📦 最简单的使用方式

用户现在只需要**3个步骤**就能完成源代码打包：

### 步骤1: 安装SDK
```bash
npm install @monitor/sdk
```

### 步骤2: 运行打包命令
```bash
npx @monitor/sdk monitor-pack
```

### 步骤3: 上传生成的压缩包
将生成的 `monitor-source-package.zip` 上传到监控系统即可。

## 🎯 就是这么简单！

### 完整示例
```bash
# 在任何项目目录下
cd your-project

# 一键打包
npx @monitor/sdk monitor-pack

# 查看帮助
npx @monitor/sdk monitor-pack --help
```

## ✨ 智能特性

### 🔍 自动项目检测
- **Taro项目**: 自动检测 `project.config.json` 和 `config/index.ts`
- **React项目**: 自动检测React依赖
- **Vue项目**: 自动检测Vue依赖
- **Angular项目**: 自动检测Angular依赖

### ⚙️ 智能配置
- 根据项目类型自动应用最佳配置
- 智能过滤不需要的文件
- 自动创建压缩包

### 🛡️ 完善处理
- 友好的错误提示
- 详细的执行日志
- 完整的统计信息

## 🔧 高级选项

```bash
# 基础模式打包
npx @monitor/sdk monitor-pack --mode=basic

# 详细日志
npx @monitor/sdk monitor-pack --verbose

# 不创建压缩包
npx @monitor/sdk monitor-pack --no-zip

# 查看所有选项
npx @monitor/sdk monitor-pack --help
```

## 📊 输出示例

```
🚀 Monitor SDK 源代码打包工具

🔍 项目信息:
- 项目名称: my-taro-app
- 项目类型: Taro小程序

⚙️ 打包配置:
- 模式: advanced
- 详细日志: 否
- 创建压缩包: 是

🔄 开始打包...

✅ 打包成功！

📊 统计信息:
- 处理文件数: 158
- 总大小: 380.34 KB
- 耗时: 390 ms
- 输出目录: ./monitor-source-package
- 压缩包: ./my-taro-app-source-2025-08-26.zip

🎯 下一步操作:
1. 打开监控系统管理界面
2. 进入项目配置页面
3. 上传生成的源代码包
4. 开始享受完整的错误监控功能
```

## 🆚 对比传统方式

| 特性 | 传统方式 | 新SDK方式 |
|------|----------|-----------|
| **安装** | 复制多个脚本文件 | `npm install @monitor/sdk` |
| **配置** | 手动编写配置文件 | 自动智能配置 |
| **执行** | 选择不同脚本运行 | 一个命令搞定 |
| **维护** | 手动更新脚本 | 自动更新SDK |
| **错误处理** | 基础提示 | 完善友好提示 |
| **跨项目** | 每个项目都要配置 | 全局安装，到处使用 |

## 💡 最佳实践

### 1. 添加到package.json
```json
{
  "scripts": {
    "pack:source": "npx @monitor/sdk monitor-pack"
  }
}
```

### 2. CI/CD集成
```yaml
# GitHub Actions 示例
- name: Pack source code
  run: npx @monitor/sdk monitor-pack
```

### 3. 开发流程集成
```bash
# 构建完成后自动打包
npm run build && npx @monitor/sdk monitor-pack
```

## 🎉 总结

通过新的SDK命令行工具，用户体验得到了极大简化：

- **从复杂到简单**: 多个脚本 → 一个命令
- **从手动到自动**: 手动配置 → 智能检测
- **从局部到全局**: 项目特定 → 通用工具
- **从静态到动态**: 固定脚本 → 可更新SDK

现在用户只需要记住一个命令：`npx @monitor/sdk monitor-pack` 就能完成所有源代码打包工作！