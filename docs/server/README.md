## Server 文档

本目录汇总服务端（NestJS）相关的部署、功能与扩展说明，并链接到更完整的专题文档。

### 快速启动（Docker Compose）

1. 在项目根目录执行：`docker-compose up -d`
2. 首次启动后，检查服务日志与数据库连接状态。

### 关键专题

- Sourcemap/源码关联存储：`../../server/SOURCEMAP_STORAGE_README.md`
- 源码与 Sourcemap 集成指南：`../../server/docs/source-code-sourcemap-integration.md`
- 日志规范与配置：`../../server/LOGGING_README.md`
- 本地大模型（Ollama）集成：`../../server/OLLAMA_INTEGRATION_GUIDE.md`
- 架构重构计划与循环依赖：
  - `../../server/REFACTOR_PLAN.md`
  - `../../server/SOLVING_CIRCULAR_DEPENDENCIES.md`

### 与前端/SDK 协同

- SDK 集成与上报：`../sdk/README.md`
- 后台使用说明：`../admin/README.md`
