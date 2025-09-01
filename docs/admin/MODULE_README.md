# Admin 管理后台（Vite + React + TypeScript）

本模块为智能前端监控系统的管理后台，提供错误与聚合列表、AI 智能诊断、源码与 Sourcemap 关联、项目配置与统计报表等功能。

## 功能概述

- 错误监控：错误列表、详情、聚合、趋势统计
- AI 诊断：错误复诊、诊断任务状态、诊断结果展示
- 源码与 Sourcemap：上传、关联、活跃版本设置、错误定位
- 项目与系统：项目配置、用户与权限、系统设置与邮件测试

## 技术栈

- 构建与开发：Vite 7、TypeScript 5、React 19
- UI 组件：Ant Design 5、Pro Components、ECharts
- 状态管理：Redux Toolkit

环境要求：Node.js 18 及以上

## 快速开始

1. 安装依赖

```bash
cd admin
npm install
```

2. 配置后端 API 地址（可选）
   在 `admin` 目录创建 `.env.local`，设置后端地址（默认 `http://localhost:3001`）：

```bash
VITE_API_BASE_URL=http://localhost:3001
```

3. 本地启动

```bash
npm run dev
```

默认通过 Vite 本地开发服务器访问（通常为 `http://localhost:5173`）。

4. 生产构建与预览

```bash
npm run build     # 产物输出到 admin/dist
npm run preview   # 本地预览构建产物（默认 4173 端口）
```

5. 代码检查

```bash
npm run lint
```

## 运行脚本

- `npm run dev`：启动开发服务（HMR）
- `npm run build`：类型检查并构建生产包（`tsc -b && vite build`）
- `npm run preview`：本地预览构建结果
- `npm run lint`：运行 ESLint 代码检查

## 环境变量与请求说明

- API 基础地址读取自 `VITE_API_BASE_URL`，定义于 `src/services/api.ts`：
  - 默认值：`http://localhost:3001`
  - 可通过 `.env` / `.env.local` 覆盖
- 认证与拦截器：
  - 登录接口：`/api/auth/login`，令牌保存于 `localStorage.token`
  - 401 会清除令牌并跳转 `/login`
  - 网络/服务器错误会通过 `antd` 的 `message` 提示

## 主要页面与模块

- 登录与权限：`src/pages/auth/Login.tsx`、`src/pages/PermissionManagement.tsx`
- 仪表盘与统计：`src/pages/dashboard/*`、`src/pages/StatisticsReport.tsx`
- 错误与聚合：
  - 列表/详情：`src/pages/errors/ErrorLogs.tsx`、`src/pages/errors/ErrorDetail.tsx`
  - 聚合：`src/pages/errors/ErrorAggregations.tsx`
- 源码/Sourcemap 管理：
  - 源码管理：`src/pages/source-code/SourceCodeManager.tsx`
  - 一体化集成：`src/pages/source-code-sourcemap-integration/SourceCodeSourcemapIntegration.tsx`
- 项目配置：`src/pages/projects/ProjectManagement.tsx`、`src/pages/ProjectConfig.tsx`
- 系统设置：`src/pages/SystemSettings.tsx`

服务封装：`src/services/`（统一经 `api.ts` 管理；含 AI 诊断、源码定位、集成上传等接口）

## 与服务端协作

- 服务端部署与说明：见 `docs/server/README.md`
- 联调要点：
  - 确保浏览器访问的域名与后端 CORS 设置一致或允许跨域
  - 配置 `VITE_API_BASE_URL` 指向后端地址
  - 登录成功后令牌由拦截器注入 `Authorization`

## 部署建议

1. 生成构建产物

```bash
npm run build
```

2. 将 `admin/dist` 发布至静态服务器（Nginx/Apache/静态托管等）
3. 通过环境变量或 `.env.production` 写入正确的 `VITE_API_BASE_URL`

Nginx 典型配置（示例）：

```nginx
location / {
  try_files $uri /index.html;
}
proxy_set_header   X-Forwarded-Proto $scheme;
proxy_set_header   X-Forwarded-For   $remote_addr;
```

## 常见问题（FAQ）

- 访问空白或 404：构建后需开启 SPA 回退到 `index.html`
- 401 自动跳转登录：检查后端登录接口与 Token 是否有效
- 网络错误：确认 `VITE_API_BASE_URL` 是否正确、后端是否可达
- 图表不显示：检查 ECharts 及数据接口是否返回有效数据

## 相关文档

- 管理后台文档首页：`docs/admin/README.md`
- 项目总索引：`docs/index.md`
- 服务端文档：`docs/server/README.md`
- SDK 文档：`docs/sdk/README.md`
