# Sourcemap 持久化存储实现

## 概述

本文档介绍了 Sourcemap 文件的持久化存储实现，解决了之前只能使用临时目录的问题。现在 Sourcemap 文件会被永久保存到指定目录，支持错误重放和长期分析。

## 功能特性

### 1. 持久化存储
- Sourcemap 文件现在会保存到配置的存储路径中
- 每个项目有独立的目录结构
- 文件名包含时间戳确保唯一性

### 2. 自动清理
- 支持配置文件存活时间（TTL）
- 每天凌晨2点自动清理过期文件
- 可手动触发清理任务

### 3. 存储管理
- 提供存储使用情况查询API
- 支持自定义存储路径
- 自动创建存储目录

## 配置说明

### 环境变量

在 `.env` 文件中添加以下配置：

```env
# Sourcemap Storage Configuration
SOURCEMAP_STORAGE_PATH=/data/sourcemaps
SOURCEMAP_STORAGE_TTL=2592000
```

- `SOURCEMAP_STORAGE_PATH`: 存储根目录，默认为 `/data/sourcemaps`
- `SOURCEMAP_STORAGE_TTL`: 文件存活时间（秒），默认为 2592000（30天）

### 项目配置

每个项目可以在数据库的 `project_config` 表中配置独立的存储路径：

```sql
UPDATE project_config SET sourcemap_path = '/custom/path/project1' WHERE project_id = 'your-project-id';
```

如果项目未配置 `sourcemap_path`，则使用环境变量中的默认路径。

## 目录结构

存储目录的组织方式：

```
/data/sourcemaps/
├── project-id-1/
│   ├── bundle_1737811200000.map
│   ├── chunk_1737811300000.map
│   └── ...
├── project-id-2/
│   ├── app_1737811400000.map
│   └── ...
└── ...
```

## API 接口

### 1. 手动清理

```http
POST /sourcemap/cleanup/manual
```

可选参数：
- `storagePath`: 自定义存储路径
- `ttl`: 自定义存活时间（秒）

### 2. 存储使用情况

```http
GET /sourcemap/cleanup/usage
```

可选参数：
- `storagePath`: 自定义存储路径

### 3. 清理配置

```http
GET /sourcemap/cleanup/config
```

## 定时任务

### 每日清理
- 时间：每天凌晨 2:00
- 任务：清理所有过期的 Sourcemap 文件
- 日志：在应用日志中查看执行结果

### 每周报告
- 时间：每周一凌晨 3:00
- 任务：生成存储使用情况报告
- 日志：在应用日志中查看报告详情

## 文件命名规则

Sourcemap 文件命名格式：

```
{original-filename}_{timestamp}.map
```

示例：
- `bundle_1737811200000.map`
- `chunk_1737811300000.map`
- `app_1737811400000.map`

## 错误处理

### 存储目录不存在
- 系统会自动创建存储目录
- 如果创建失败会记录警告日志

### 文件保存失败
- 会抛出 `InternalServerErrorException`
- 错误信息包含具体失败原因

### 清理任务失败
- 会记录错误日志但不会中断应用
- 可以手动重试清理任务

## 监控和日志

### 日志级别
- `DEBUG`: 文件删除详情
- `INFO`: 任务执行摘要
- `WARN`: 目录创建失败
- `ERROR`: 任务执行失败

### 监控指标
- 总文件数量
- 已使用存储空间
- 清理文件数量
- 释放空间大小

## 最佳实践

### 1. 存储路径选择
- 使用高速存储设备提高读写性能
- 确保有足够的磁盘空间
- 定期监控存储使用情况

### 2. TTL 配置
- 生产环境：30-90天
- 测试环境：7-14天
- 开发环境：1-3天

### 3. 备份策略
- 定期备份重要的 Sourcemap 文件
- 使用版本控制系统管理重要版本

## 故障排除

### 常见问题

1. **磁盘空间不足**
   - 调整 TTL 配置缩短文件保存时间
   - 手动触发清理任务释放空间
   - 扩展磁盘容量

2. **权限问题**
   - 确保应用有存储目录的读写权限
   - 检查 SELinux/AppArmor 配置

3. **性能问题**
   - 使用 SSD 存储提高IO性能
   - 分散存储到多个磁盘

### 日志分析

查看应用日志了解存储相关操作：

```bash
grep -i "sourcemap\|storage\|cleanup" /var/log/application.log
```

## 版本历史

- **v1.0.0** (2024-01-25): 初始版本，实现基本持久化存储
- **v1.1.0** (2024-01-26): 添加自动清理和监控功能

## 支持

如有问题请联系开发团队或查看详细日志信息。