# 监控系统部署指南

## 概述

本监控系统是一个基于 Docker 的完整错误监控解决方案，支持 DeepSeek AI 错误分析和源代码定位功能。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin前端     │    │   Server后端    │    │   数据库层      │
│   (React + Vite)│◄──►│  (NestJS)      │◄──►│  MySQL + ClickHouse
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Redis缓存     │
                       │   (队列+缓存)   │
                       └─────────────────┘
```

## 环境要求

- **操作系统**: macOS 10.15+ 或 Linux (Ubuntu 18.04+)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 至少 4GB (推荐 8GB+)
- **磁盘**: 至少 10GB 可用空间
- **网络**: 需要访问外网下载镜像

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd monitor
```

### 2. 配置环境变量

```bash
cd deploy
cp env.example .env
# 编辑.env文件，配置必要的参数
```

**重要配置项：**

- `DEEPSEEK_API_KEY`: DeepSeek API 密钥
- `JWT_SECRET`: JWT 密钥（生产环境必须修改）
- `MYSQL_PASSWORD`: MySQL 密码
- `CLICKHOUSE_PASSWORD`: ClickHouse 密码

### 3. 一键部署

```bash
./deploy.sh
```

部署脚本会自动：

- 检查系统环境
- 构建 Docker 镜像
- 启动所有服务
- 执行数据库迁移
- 进行健康检查

### 4. 访问系统

- **管理后台**: http://localhost:3001
- **API 文档**: http://localhost:3000/api/docs
- **Redis 管理**: http://localhost:8081 (admin/admin123)

## 部署选项

### 基础部署

```bash
./deploy.sh
```

### 包含监控工具的完整部署

```bash
docker-compose --profile monitoring up -d
```

这将额外启动：

- Prometheus (端口 9090)
- Grafana (端口 3002, admin/admin123)

### 开发环境部署

```bash
NODE_ENV=development ./deploy.sh
```

## 管理命令

### 查看服务状态

```bash
./deploy.sh status
```

### 查看日志

```bash
./deploy.sh logs                    # 查看所有日志
./deploy.sh logs server            # 查看server日志
./deploy.sh logs mysql             # 查看MySQL日志
```

### 重启服务

```bash
./deploy.sh restart
```

### 更新系统

```bash
./deploy.sh update
```

### 备份数据

```bash
./deploy.sh backup
```

### 清理资源

```bash
./deploy.sh cleanup
```

## 配置说明

### 环境变量

所有配置通过`.env`文件管理，主要分类：

- **基础配置**: 环境、时区等
- **数据库配置**: MySQL、ClickHouse、Redis 连接信息
- **应用配置**: 端口、JWT 密钥等
- **AI 服务配置**: DeepSeek API 密钥、Ollama 配置
- **邮件配置**: SMTP 设置
- **存储配置**: 文件上传限制、存储路径
- **安全配置**: CORS、限流等

### 端口配置

| 服务            | 端口      | 说明           |
| --------------- | --------- | -------------- |
| MySQL           | 3306      | 数据库服务     |
| ClickHouse      | 8123/9000 | 时序数据库     |
| Redis           | 6379      | 缓存和队列     |
| Server          | 3000      | 后端 API 服务  |
| Admin           | 3001      | 管理后台       |
| Redis Commander | 8081      | Redis 管理界面 |
| Prometheus      | 9090      | 监控指标       |
| Grafana         | 3002      | 可视化面板     |

### 资源限制

Docker Compose 配置了合理的资源限制：

- **MySQL**: 内存限制 1GB
- **ClickHouse**: 内存限制 2GB
- **Redis**: 内存限制 512MB
- **Server**: 内存限制 2GB
- **Admin**: 内存限制 512MB

## 监控和日志

### 健康检查

所有服务都配置了健康检查，确保服务正常运行。

### 日志管理

- 部署日志: `deploy/deploy.log`
- 应用日志: `logs/` 目录
- Docker 日志: `docker-compose logs`

### 性能监控

使用 Prometheus + Grafana 进行系统监控：

- 应用性能指标
- 数据库性能
- 系统资源使用
- 自定义业务指标

## 故障排除

### 常见问题

1. **端口被占用**

   ```bash
   lsof -i :3000  # 检查端口占用
   ./deploy.sh cleanup  # 清理后重新部署
   ```

2. **内存不足**

   - 检查系统内存使用
   - 调整 Docker 资源限制
   - 关闭不必要的服务

3. **数据库连接失败**

   - 检查数据库服务状态
   - 验证环境变量配置
   - 查看数据库日志

4. **镜像构建失败**
   - 检查网络连接
   - 清理 Docker 缓存
   - 验证 Dockerfile 语法

### 调试模式

```bash
# 查看详细日志
docker-compose logs -f

# 进入容器调试
docker-compose exec server sh
docker-compose exec mysql mysql -u root -p

# 检查网络
docker network ls
docker network inspect monitor_monitor-network
```

## 生产环境部署

### 安全建议

1. **修改默认密码**

   - 数据库密码
   - JWT 密钥
   - Redis 密码

2. **网络安全**

   - 使用防火墙限制端口访问
   - 配置 HTTPS
   - 设置 VPN 访问

3. **数据备份**
   - 定期备份数据库
   - 备份配置文件
   - 测试恢复流程

### 性能优化

1. **数据库优化**

   - 调整 MySQL 配置
   - 优化 ClickHouse 查询
   - 配置 Redis 持久化

2. **应用优化**

   - 启用 Gzip 压缩
   - 配置 CDN
   - 优化静态资源

3. **监控告警**
   - 配置 Prometheus 告警规则
   - 设置邮件/短信通知
   - 监控关键指标

## 扩展功能

### 添加新服务

1. 在`docker-compose.yml`中添加服务定义
2. 配置环境变量和依赖关系
3. 更新部署脚本

### 自定义监控

1. 在应用中添加 Prometheus 指标
2. 创建 Grafana 仪表板
3. 配置告警规则

### 集成 CI/CD

1. 自动化构建和测试
2. 自动部署到不同环境
3. 回滚机制

## 技术支持

- 查看项目文档: `docs/` 目录
- 提交 Issue: GitHub Issues
- 联系开发团队

## 更新日志

查看 `CHANGELOG.md` 了解版本更新内容。
