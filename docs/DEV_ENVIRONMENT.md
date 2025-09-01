# 监控系统开发环境一键启动

本项目提供了多种启动测试环境的方式，满足不同的开发需求。

## 🚀 快速开始

### 方式一：高级启动脚本（推荐）

```bash
# 启动完整开发环境
npm start
# 或
node start.js

# 仅启动服务端
npm run server

# 仅启动管理后台
npm run admin

# 构建所有项目
npm run build

# 运行测试
npm test
```

### 方式二：简单启动脚本

```bash
# 使用 Node.js 脚本
npm run dev:simple
# 或
node start-dev-env.js
```

### 方式三：Bash 脚本

```bash
# 使用 Bash 脚本
npm run dev:bash
# 或
./start-dev-env.sh
```

## 📦 依赖管理

使用包管理脚本来管理项目各模块的依赖：

```bash
# 查看所有模块状态
node package-manager.js status

# 安装所有模块依赖
node package-manager.js install

# 更新所有模块依赖
node package-manager.js update

# 清理所有 node_modules
node package-manager.js clean

# 构建所有模块
node package-manager.js build

# 查看帮助
node package-manager.js help
```

## 🎯 启动流程说明

启动脚本会按以下顺序执行：

1. **检查端口占用** - 确保 3001 和 5173 端口可用
2. **检查和安装依赖** - 自动安装各模块的 npm 依赖
3. **构建 SDK** - 构建 Taro 小程序 SDK
4. **启动服务端** - 启动后端 API 服务（端口 3001）
5. **运行数据格式测试** - 验证数据上报格式是否正确
6. **启动管理后台** - 启动前端管理界面（端口 5173）
7. **显示服务状态** - 显示各服务的运行状态

## 🌐 服务地址

启动成功后，您可以访问以下地址：

- **📊 管理后台**: http://localhost:5173
- **🔌 服务端 API**: http://localhost:3001
- **📚 API 文档**: http://localhost:3001/api-docs
- **🔍 健康检查**: http://localhost:3001/api/health

## 🧪 测试命令

启动环境后，您可以运行以下测试命令：

```bash
# 数据格式测试
npm run test:format

# 网络错误测试
npm run test:network

# 集成测试
npm run test:integration

# 管理员功能测试
npm run test:admin
```

## 🛠 功能特性

### 自动化检查

- ✅ 端口占用检查
- ✅ 依赖安装检查
- ✅ 服务健康检查
- ✅ 定期状态监控

### 智能启动

- ✅ 自动构建 SDK
- ✅ 等待服务就绪
- ✅ 数据格式验证
- ✅ 优雅退出处理

### 日志输出

- ✅ 彩色日志显示
- ✅ 时间戳标记
- ✅ 进程状态跟踪
- ✅ 错误信息提示

## 🔧 故障排除

### 端口被占用

```bash
# 查看端口占用情况
lsof -i :3001
lsof -i :5173

# 结束占用进程
kill -9 <PID>
```

### 依赖安装失败

```bash
# 清理并重新安装
node package-manager.js clean
node package-manager.js install
```

### 服务启动失败

```bash
# 查看日志文件
cat server.log
cat admin.log
```

### SDK 构建失败

```bash
# 手动构建 SDK
cd sdk/taroWechatMini
npm run build
```

## 📝 日志文件

启动脚本会生成以下日志文件：

- `server.log` - 服务端日志
- `admin.log` - 管理后台日志

## ⚡ 快捷命令

为了更方便使用，建议在项目根目录的 `package.json` 中添加以下脚本：

```json
{
  "scripts": {
    "dev": "node start-dev-env.js",
    "dev:bash": "./start-dev-env.sh",
    "deps:install": "node package-manager.js install",
    "deps:clean": "node package-manager.js clean",
    "deps:status": "node package-manager.js status",
    "test:format": "node test-data-format.js",
    "test:integration": "node test-integration.js"
  }
}
```

然后可以使用：

```bash
npm run dev          # 启动开发环境
npm run deps:install # 安装依赖
npm run test:format  # 测试数据格式
```

## 🛑 停止服务

按 `Ctrl+C` 停止所有服务，脚本会自动进行清理工作。

---

## 📋 系统要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- curl（用于健康检查）
- 可用的 3001 和 5173 端口
