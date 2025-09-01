# 日志模块使用说明

## 概述

本日志模块为系统提供了完整的持久化日志解决方案，支持文件日志和数据库日志两种存储方式，并包含自动清理功能。

## 功能特性

- ✅ 多级别日志记录 (error, warn, info, debug, verbose)
- ✅ 文件日志存储，支持文件轮转
- ✅ 数据库日志存储 (MySQL)
- ✅ 自动清理过期日志文件
- ✅ 自动清理过期数据库日志
- ✅ 日志压缩归档
- ✅ 控制台输出
- ✅ RESTful API 管理接口
- ✅ 定时任务自动清理

## 快速开始

### 1. 安装依赖

```bash
npm install winston winston-daily-rotate-file compressing dayjs
```

### 2. 环境配置

复制 `.env.logging.example` 到 `.env` 文件，并根据需要修改配置：

```bash
# 基本配置
LOG_LEVEL=info
LOG_CONSOLE_ENABLED=true

# 文件日志配置
LOG_FILE_ENABLED=true
LOG_FILE_PATH=logs/app.log
LOG_MAX_FILE_SIZE=10
LOG_RETAIN_DAYS=30
LOG_COMPRESSION_ENABLED=true
LOG_COMPRESSION_FORMAT=zip

# 数据库日志配置
LOG_DATABASE_ENABLED=true
LOG_DATABASE_TABLE=system_logs
LOG_DATABASE_RETAIN_DAYS=90

# 清理配置
LOG_CLEANUP_SCHEDULE=0 2 * * *
```

### 3. 使用日志服务

在需要记录日志的服务中注入 `LoggingService`：

```typescript
import { Injectable } from '@nestjs/common';
import { LoggingService } from './modules/logging/services/logging.service';

@Injectable()
export class YourService {
  constructor(private readonly loggingService: LoggingService) {}

  async yourMethod() {
    // 记录不同级别的日志
    this.loggingService.error('错误信息', { context: 'YourService', error: new Error('示例错误') });
    this.loggingService.warn('警告信息', { context: 'YourService' });
    this.loggingService.info('信息日志', { context: 'YourService', data: { key: 'value' } });
    this.loggingService.debug('调试信息', { context: 'YourService' });
    this.loggingService.verbose('详细日志', { context: 'YourService' });
  }
}
```

## API 接口

### 获取日志统计信息
```
GET /logging/stats
```

### 手动清理日志
```
POST /logging/cleanup
```

### 获取清理配置
```
GET /logging/cleanup/config
```

### 获取清理状态
```
GET /logging/cleanup/status
```

### 获取环境变量说明
```
GET /logging/config/env
```

### 获取默认配置
```
GET /logging/config/default
```

### 获取支持的日志级别
```
GET /logging/config/levels
```

### 获取支持的压缩格式
```
GET /logging/config/compression-formats
```

## 配置说明

### 日志级别
- `error` - 错误级别
- `warn` - 警告级别  
- `info` - 信息级别
- `debug` - 调试级别
- `verbose` - 详细级别

### 压缩格式
- `zip` - ZIP 压缩
- `tar` - TAR 压缩
- `gzip` - GZIP 压缩

### 自动清理计划
使用 cron 格式配置自动清理时间，默认每天凌晨2点执行：
```
0 2 * * *
```

## 数据库表结构

日志模块会自动创建以下数据库表：

```sql
CREATE TABLE system_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  context VARCHAR(255),
  timestamp DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level (level),
  INDEX idx_timestamp (timestamp),
  INDEX idx_context (context)
);
```

## 文件存储结构

```
logs/
├── app.log         # 当前日志文件
├── app.log.2024-01-01.zip  # 压缩的归档日志
├── app.log.2024-01-02.zip
└── ...
```

## 注意事项

1. 确保 logs 目录有写入权限
2. 数据库日志功能需要 MySQL 数据库连接正常
3. 自动清理功能依赖 @nestjs/schedule 模块
4. 文件压缩功能需要足够的磁盘空间

## 故障排除

### 日志文件无法创建
- 检查 logs 目录权限
- 检查磁盘空间

### 数据库日志写入失败
- 检查数据库连接
- 检查表是否存在

### 自动清理不工作
- 检查定时任务配置
- 检查系统时间设置

## 版本历史

- v1.0.0 - 初始版本，包含基本日志功能和自动清理

## 技术支持

如有问题请联系系统管理员或查看 NestJS 官方文档。