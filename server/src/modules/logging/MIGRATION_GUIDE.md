# 日志系统迁移指南

## 概述

本指南帮助您从旧版本的日志系统迁移到新的完善版本。新版本包含了许多增强功能和改进，同时保持了向后兼容性。

## 版本对比

### 旧版本 (v1.x)

- 基础的文件和数据库日志
- 简单的配置选项
- 有限的查询功能
- 基本的错误处理

### 新版本 (v2.0)

- 性能监控和指标收集
- HTTP请求自动日志记录
- 数据脱敏和安全增强
- 异步处理和批量操作
- 高级查询和分页功能
- 结构化日志支持

## 迁移步骤

### 1. 备份现有数据

```bash
# 备份日志文件
cp -r ./logs ./logs_backup_$(date +%Y%m%d)

# 备份数据库日志表
mysqldump -u username -p database_name log_entries > logs_backup_$(date +%Y%m%d).sql
```

### 2. 更新配置文件

#### 旧配置 (.env)

```bash
LOGGING_FILE_ENABLED=true
LOGGING_FILE_PATH=./logs/app.log
LOGGING_MAX_FILE_SIZE=10
LOGGING_RETENTION_DAYS=30
LOGGING_LEVEL=info
LOGGING_DATABASE_ENABLED=true
LOGGING_CONSOLE_ENABLED=true
LOGGING_COMPRESSION_FORMAT=gzip
LOGGING_FILENAME_PATTERN=app-{date}-{level}.log
```

#### 新配置 (.env)

```bash
# 保留原有配置
LOGGING_FILE_ENABLED=true
LOGGING_FILE_PATH=./logs/app.log
LOGGING_MAX_FILE_SIZE=20
LOGGING_RETENTION_DAYS=30
LOGGING_LEVEL=info
LOGGING_DATABASE_ENABLED=true
LOGGING_CONSOLE_ENABLED=true
LOGGING_COMPRESSION_FORMAT=gzip
LOGGING_FILENAME_PATTERN=app-{date}-{level}.log

# 新增配置选项
LOGGING_FILE_DIR=./logs
LOGGING_MAX_FILES=14d
LOGGING_DATABASE_RETENTION_DAYS=90

# 性能监控
LOGGING_PERFORMANCE_ENABLED=true
LOGGING_PERFORMANCE_MAX_SAMPLES=1000

# HTTP日志
LOGGING_HTTP_ENABLED=true
LOGGING_HTTP_INCLUDE_BODY=true
LOGGING_HTTP_INCLUDE_RESPONSE=false
LOGGING_HTTP_SKIP_PATTERNS=/health,/metrics,/favicon.ico

# 结构化日志
LOGGING_STRUCTURED_ENABLED=true
LOGGING_FORMAT=json

# 异步处理
LOGGING_ASYNC_ENABLED=true
LOGGING_ASYNC_QUEUE_SIZE=1000
LOGGING_BATCH_SIZE=100
LOGGING_BATCH_INTERVAL=1000

# 数据安全
LOGGING_SENSITIVE_FIELDS=password,token,authorization,cookie,x-api-key,secret,key
LOGGING_DATA_MASKING_ENABLED=true
LOGGING_MASKING_CHAR=*

# 其他
LOGGING_DEBUG_MODE=false
LOGGING_COLORS_ENABLED=true
```

### 3. 更新代码引用

#### 旧代码

```typescript
import { LoggingService } from "./modules/logging/services/logging.service";

@Injectable()
export class MyService {
  constructor(private readonly loggingService: LoggingService) {}

  async doSomething() {
    this.loggingService.info("操作开始");
    // ... 业务逻辑
    this.loggingService.info("操作完成");
  }
}
```

#### 新代码（推荐）

```typescript
import { LoggingService } from "./modules/logging/services/logging.service";
import { LogUtils } from "./modules/logging/utils/log.utils";

@Injectable()
export class MyService {
  constructor(private readonly loggingService: LoggingService) {}

  async doSomething(userData: any) {
    const timer = LogUtils.createTimer();

    await this.loggingService.info("操作开始", {
      operation: "doSomething",
      userId: userData.id,
      timestamp: new Date().toISOString(),
    });

    try {
      // ... 业务逻辑
      const result = await this.performOperation(userData);

      await this.loggingService.info("操作完成", {
        operation: "doSomething",
        userId: userData.id,
        duration: timer.end(),
        success: true,
      });

      return result;
    } catch (error) {
      await this.loggingService.error("操作失败", error, {
        operation: "doSomething",
        userId: userData.id,
        duration: timer.end(),
        userData: LogUtils.maskSensitiveData(userData, ["password"]),
      });
      throw error;
    }
  }
}
```

### 4. 添加HTTP日志拦截器

```typescript
// app.module.ts
import { APP_INTERCEPTOR } from "@nestjs/core";
import { HttpLoggingInterceptor } from "./modules/logging/interceptors/http-logging.interceptor";

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

### 5. 更新日志模块导入

#### 旧模块导入

```typescript
import { LoggingModule } from "./modules/logging/logging.module";

@Module({
  imports: [LoggingModule],
})
export class AppModule {}
```

#### 新模块导入（无需更改）

```typescript
import { LoggingModule } from "./modules/logging/logging.module";

@Module({
  imports: [LoggingModule], // 自动包含所有新功能
})
export class AppModule {}
```

## 新功能使用指南

### 1. 性能监控

```typescript
import { LogPerformanceService } from "./modules/logging/services/log-performance.service";

@Injectable()
export class MyService {
  constructor(private readonly performanceService: LogPerformanceService) {}

  async monitoredOperation() {
    return await this.performanceService.measureOperation(
      "database-query",
      () => this.databaseQuery()
    );
  }
}
```

### 2. 数据脱敏

```typescript
import { LogUtils } from "./modules/logging/utils/log.utils";

// 自动脱敏敏感数据
const safeData = LogUtils.maskSensitiveData(userData, ["password", "email"]);
await this.loggingService.info("用户数据", safeData);
```

### 3. 结构化日志

```typescript
// 使用结构化格式记录日志
await this.loggingService.info("用户登录", {
  event: "user_login",
  userId: user.id,
  timestamp: new Date().toISOString(),
  metadata: {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
    sessionId: req.session.id,
  },
});
```

### 4. 日志查询

```typescript
// 通过API查询日志
GET /logs?level=error&startDate=2024-01-01&page=1&limit=20

// 通过服务查询日志
const logs = await this.databaseLoggerService.queryLogs({
  level: 'error',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  page: 1,
  limit: 20
});
```

## 兼容性说明

### 向后兼容

- 所有旧的API调用仍然有效
- 现有的配置选项继续工作
- 数据库表结构保持兼容

### 推荐升级

虽然旧代码仍然可以工作，但建议逐步采用新功能：

1. **立即可用**: 新配置选项会自动生效
2. **建议更新**: 使用新的日志格式和工具类
3. **可选升级**: 添加HTTP拦截器和性能监控

## 测试迁移

### 1. 运行测试套件

```bash
npm test -- --testPathPattern=logging
```

### 2. 验证配置

```typescript
import { LoggingConfigService } from "./modules/logging/services/logging-config.service";

// 验证配置是否正确加载
const config = this.configService.getConfig();
console.log("当前日志配置:", config);

// 验证配置有效性
const validation = this.configService.validateConfig(config);
if (!validation.valid) {
  console.error("配置错误:", validation.errors);
}
```

### 3. 测试新功能

```bash
# 测试HTTP日志
curl -X POST http://localhost:3000/api/test -d '{"test": "data"}'

# 查看日志文件
tail -f ./logs/app.log

# 测试日志查询API
curl "http://localhost:3000/logs?level=info&limit=10"
```

## 性能影响

### 新功能的性能开销

1. **HTTP拦截器**: 每个请求增加 ~1-2ms
2. **性能监控**: 每个操作增加 ~0.5ms
3. **数据脱敏**: 根据数据大小，增加 ~0.1-1ms
4. **异步处理**: 减少主线程阻塞，提升整体性能

### 优化建议

1. **生产环境**: 禁用调试模式和详细日志
2. **高并发场景**: 启用异步处理和批量写入
3. **存储优化**: 配置合适的日志轮转和清理策略

## 故障排除

### 常见迁移问题

1. **配置文件未更新**

   ```bash
   # 检查配置是否生效
   curl http://localhost:3000/logs/config
   ```

2. **权限问题**

   ```bash
   # 确保日志目录有写权限
   chmod 755 ./logs
   ```

3. **数据库连接问题**

   ```bash
   # 检查数据库日志表
   SHOW TABLES LIKE 'log_entries';
   ```

4. **内存使用过高**
   ```bash
   # 调整异步队列大小
   LOGGING_ASYNC_QUEUE_SIZE=500
   LOGGING_BATCH_SIZE=50
   ```

### 回滚计划

如果遇到问题需要回滚：

1. **恢复配置文件**

   ```bash
   cp .env.backup .env
   ```

2. **恢复日志文件**

   ```bash
   rm -rf ./logs
   mv ./logs_backup_* ./logs
   ```

3. **恢复数据库**
   ```bash
   mysql -u username -p database_name < logs_backup_*.sql
   ```

## 支持和帮助

如果在迁移过程中遇到问题：

1. 查看 [README.md](./README.md) 了解详细功能说明
2. 参考 [examples/usage-examples.ts](./examples/usage-examples.ts) 查看使用示例
3. 运行测试套件验证功能正常
4. 检查日志文件中的错误信息

## 迁移检查清单

- [ ] 备份现有日志数据
- [ ] 更新环境配置文件
- [ ] 测试基本日志功能
- [ ] 添加HTTP拦截器（可选）
- [ ] 更新代码使用新功能（推荐）
- [ ] 运行测试套件
- [ ] 验证性能影响
- [ ] 配置日志清理策略
- [ ] 更新监控和告警
- [ ] 培训团队使用新功能

完成以上步骤后，您的日志系统就成功迁移到新版本了！
