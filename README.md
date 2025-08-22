# 前端监控系统 (Frontend Monitoring System)

一个完整的前端监控解决方案，包含错误监控、性能监控、用户行为追踪等功能。支持 Web、小程序等多种前端环境。

## 📋 项目概述

### 🚀 主要功能

- **错误监控**: JavaScript 错误、Promise 异常、网络请求错误等
- **性能监控**: 页面加载时间、资源加载性能、用户交互响应时间
- **用户行为追踪**: 点击、页面跳转、自定义事件等
- **实时数据上报**: 支持单条和批量数据上报
- **多端支持**: Web、Taro 小程序、原生小程序
- **管理后台**: 完整的数据可视化和管理界面

### 🏗️ 项目架构

```
monitor/
├── server/              # 后端服务 (NestJS)
├── admin/               # 管理后台 (React + TypeScript)
├── sdk/
│   ├── web/            # Web端SDK
│   └── taroWechatMini/ # Taro微信小程序SDK
├── example/            # 示例项目
└── docs/               # 文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- 可用的 3001 和 5173 端口

### 一键启动

```bash
# 克隆项目
git clone <repository-url>
cd monitor

# 启动完整开发环境
npm start
```

### 分步启动

```bash
# 1. 安装依赖
npm run deps:install

# 2. 构建SDK
npm run deps:build

# 3. 启动服务端
npm run server

# 4. 启动管理后台
npm run admin
```

### 其他启动方式

```bash
# 使用简单启动脚本
npm run dev:simple

# 使用Bash脚本
npm run dev:bash
```

## 📦 项目模块

### 后端服务 (server/)

基于 NestJS 构建的后端 API 服务：

- **监控数据接口**: 接收和存储前端上报的监控数据
- **数据查询接口**: 提供数据查询和统计功能
- **用户管理**: 用户认证和权限管理
- **数据可视化**: 为管理后台提供数据接口

```bash
# 启动开发服务器
cd server
npm run start:dev
```

### 管理后台 (admin/)

基于 React + TypeScript 的管理界面：

- **实时监控**: 实时查看错误和性能数据
- **数据分析**: 错误趋势、性能报告等
- **用户管理**: 用户和权限管理
- **系统设置**: 监控配置和告警设置

```bash
# 启动开发服务器
cd admin
npm run dev
```

### SDK

#### Web SDK (sdk/web/)

适用于普通 Web 应用的监控 SDK：

```javascript
import { createMonitor } from "@monitor/web-sdk";

const monitor = createMonitor({
  projectId: "your-project-id",
  serverUrl: "http://localhost:3001",
});

// 自动监控开始工作
```

#### Taro 小程序 SDK (sdk/taroWechatMini/)

适用于 Taro 开发的微信小程序：

```javascript
import { createMonitor } from "@monitor/taro-wechat-mini-sdk";

const monitor = createMonitor({
  projectId: "your-project-id",
  serverUrl: "http://localhost:3001",
});
```

## 🧪 测试

项目包含完整的测试套件：

```bash
# 运行所有测试
npm test

# 数据格式测试
npm run test:format

# 网络错误测试
npm run test:network

# 集成测试
npm run test:integration

# 管理员功能测试
npm run test:admin
```

## 📊 监控能力

### 错误监控

- **JavaScript 错误**: 自动捕获和上报 JS 运行时错误
- **Promise 异常**: 捕获未处理的 Promise rejection
- **网络请求错误**: HTTP 请求失败、超时等
- **资源加载错误**: 图片、脚本等资源加载失败

### 性能监控

- **页面性能**: 首屏时间、白屏时间、资源加载时间
- **用户体验指标**: FCP、LCP、FID、CLS 等 Core Web Vitals
- **网络性能**: 请求耗时、成功率等

### 用户行为

- **页面访问**: PV、UV 统计
- **用户操作**: 点击、滚动、表单提交等
- **自定义事件**: 业务相关的自定义事件追踪

## 🔧 配置

### 环境变量

创建 `.env` 文件配置环境变量：

```bash
# 服务端配置
SERVER_PORT=3001
DATABASE_URL=mysql://user:password@localhost:3306/monitor

# 管理后台配置
ADMIN_PORT=5173

# Redis配置 (可选)
REDIS_URL=redis://localhost:6379
```

### 监控配置

```javascript
const monitor = createMonitor({
  projectId: "your-project-id",
  serverUrl: "http://localhost:3001",

  // 错误监控配置
  error: {
    filters: [/Script error/], // 过滤规则
    random: 1.0, // 采样率
    ignoreMonitorEndpointErrors: true,
  },

  // 性能监控配置
  performance: {
    watch: true,
    queueLimit: 20,
  },

  // 行为监控配置
  behavior: {
    queueLimit: 20,
    isFilterConsole: false,
  },
});
```

## 🛠️ 开发

### 添加新功能

1. **后端 API**: 在 `server/src/modules/` 下添加新模块
2. **前端界面**: 在 `admin/src/pages/` 下添加新页面
3. **SDK 功能**: 在相应的 SDK 目录下扩展功能

### 构建部署

```bash
# 构建所有模块
npm run build

# 构建特定模块
npm run sdk:taro:build
npm run admin:build
```

## 📚 API 文档

启动服务后，访问 http://localhost:3001/api-docs 查看完整的 API 文档。

## 🤝 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

- 📧 邮箱: support@monitor-system.com
- 📖 文档: [项目文档](docs/)
- 🐛 问题反馈: [GitHub Issues](issues/)

## 🏆 特性

- ✅ **类型安全**: 全面的 TypeScript 支持
- ✅ **高性能**: 优化的数据上报和处理
- ✅ **易集成**: 简单的 SDK 集成方式
- ✅ **可扩展**: 模块化的架构设计
- ✅ **实时监控**: 实时数据上报和展示
- ✅ **多端支持**: 支持多种前端环境

---

如有任何问题或建议，欢迎提交 Issue 或 Pull Request！
