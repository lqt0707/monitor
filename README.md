# 智能前端监控系统 (AI-Powered Frontend Monitoring System)

基于 LangChain.js 和 DeepSeek AI 的智能前端监控解决方案，包含 AI 错误分析、源代码定位、性能监控、用户行为追踪等功能。支持 Web、小程序等多种前端环境。

## 📋 项目概述

### 🚀 主要功能

- **AI 错误分析**: 集成 DeepSeek AI，自动分析 JavaScript/TypeScript 错误并提供修复建议
- **精确源码定位**: 结合源代码映射，精确定位错误位置和上下文
- **错误监控**: JavaScript 错误、Promise 异常、网络请求错误等
- **性能监控**: 页面加载时间、资源加载性能、用户交互响应时间
- **用户行为追踪**: 点击、页面跳转、自定义事件等
- **实时数据上报**: 支持单条和批量数据上报
- **多端支持**: Web、Taro 小程序、原生小程序
- **管理后台**: 完整的数据可视化和管理界面
- **向量化搜索**: 源代码向量化存储，支持相似代码搜索

### 🏗️ 项目架构

```
monitor/
├── server/              # 后端服务 (NestJS + DeepSeek AI)
├── admin/               # 管理后台 (React + TypeScript)
├── sdk/
│   ├── web/            # Web端SDK
│   └── taroWechatMini/ # Taro微信小程序SDK
├── example/            # 示例项目
├── docs/               # 文档
└── deploy/             # 部署配置

AI集成架构:
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   Web/Taro SDK   │    │   管理后台 React   │    │    NestJS Server    │
│   (错误收集)     │◄──►│   (数据可视化)    │◄──►│   (API服务)        │
└─────────────────┘    └──────────────────┘    └─────────┬──────────┘
                                                         │
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────▼──────────┐
│   DeepSeek AI   │    │  向量化搜索服务   │    │   数据库集群        │
│   (错误分析)    │◄──►│  (源代码检索)    │◄──►│  (MySQL+ClickHouse)│
└─────────────────┘    └──────────────────┘    └────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (开发环境)
- 可用的 3000、3001、3306、6379、8123、8081、9000 端口

### 一键部署

```bash
# 克隆项目
git clone <repository-url>
cd monitor

# 一键部署（推荐）
./deploy.sh

# 或者手动部署
cp .env.example .env
# 编辑.env文件配置API密钥
docker-compose up -d
```

### 开发环境启动

```bash
# 1. 安装依赖
npm run deps:install

# 2. 构建SDK
npm run deps:build

# 3. 启动服务端（包含AI功能）
npm run server

# 4. 启动管理后台
npm run admin
```

### AI 功能配置

在 `.env` 文件中配置 AI 服务：

```bash
# DeepSeek AI配置（主要服务）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=2000

# 本地Ollama配置（开发调试）
DEEPSEEK_USE_OLLAMA=false
OLLAMA_BASE_URL=http://localhost:11434/v1

# DeepSeek配置（主要AI服务）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**本地 Ollama 使用说明：**

1. 安装 Ollama: `brew install ollama`
2. 启动服务: `ollama serve`
3. 拉取模型: `ollama pull deepseek-coder`
4. 启用配置: 设置 `DEEPSEEK_USE_OLLAMA=true`

详细配置请参考 [DEEPSEEK_OLLAMA_GUIDE.md](./DEEPSEEK_OLLAMA_GUIDE.md)

## 📦 项目模块

### 后端服务 (server/)

基于 NestJS + DeepSeek AI 构建的智能后端 API 服务：

- **AI 错误分析**: 集成 DeepSeek AI 进行智能错误诊断和修复建议
- **源代码定位**: 精确错误位置定位和上下文提取
- **向量化搜索**: 源代码向量存储和相似代码检索
- **监控数据接口**: 接收和存储前端上报的监控数据
- **数据查询接口**: 提供数据查询和统计功能
- **用户管理**: 用户认证和权限管理
- **数据可视化**: 为管理后台提供数据接口

```bash
# 启动开发服务器（包含AI功能）
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

### AI 集成模块

#### DeepSeek 服务 (`server/src/modules/deepseek/`)

- DeepSeek AI 服务层和 RESTful API
- 支持错误分析和源代码检索
- 模块化设计，易于扩展

#### 源代码向量化 (`server/src/services/source-code-vector.service.ts`)

- 源代码分块和向量化处理
- 相似代码搜索和推荐
- 支持多种编程语言

#### AI 诊断服务 (`server/src/services/ai-diagnosis.service.ts`)

- 支持 DeepSeek 和 OpenAI 双模式
- 智能错误分析和修复建议生成
- 自动回退机制

### SDK

#### Web SDK (sdk/web/)

适用于普通 Web 应用的监控 SDK：

```javascript
import { createMonitor } from "@monitor/web-sdk";

const monitor = createMonitor({
  projectId: "your-project-id",
  serverUrl: "http://localhost:3000", // 注意端口改为3000
  enableAI: true, // 启用AI错误分析
});

// 自动监控开始工作，包含AI分析功能
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
