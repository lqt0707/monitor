## Admin 后台文档

本目录提供管理后台的概览、启动与构建说明，并链接到项目根目录下更完整的说明文档。

### 概览

- 技术栈：Vite + React + TypeScript
- 主要功能：
  - 错误列表与详情、AI 诊断、综合分析
  - Sourcemap/源码关联跳转
  - 版本、项目等基础配置管理

### 快速开始

1. 进入目录并安装依赖：
   - `cd ../../admin && npm install`
2. 开发调试：
   - `npm run dev`
3. 生产构建：
   - `npm run build`

### 关联文档

- 根目录后台说明：`../../admin/README.md`
- 综合分析与交互说明：
  - `../后台综合分析功能实现说明.md`
  - `../后台综合分析功能实现完成总结.md`
  - `../前端诊断交互逻辑优化说明.md`

### 与服务端/SDK 的协同

- SDK 集成与上报：参考 `../sdk/README.md`
- Server 启动与 API：参考 `../server/README.md`
