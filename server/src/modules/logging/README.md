# 日志系统完善文档

## 概述

本次完善了日志系统，增加了多项高级功能，提升了日志系统的可用性、性能和安全性。

## 新增功能

### 1. 性能监控服务 (LogPerformanceService)

- **文件**: `services/log-performance.service.ts`
- **功能**:
  - 记录和分析日志操作性能
  - 提供性能指标统计
  - 支持性能阈值监控
  - 内存使用情况监控

### 2. HTTP请求日志拦截器 (HttpLoggingInterceptor)

- **文件**: `interceptors/http-logging.interceptor.ts`
- **功能**:
  - 自动记录HTTP请求和响应
  - 支持敏感数据脱敏
  - 可配置跳过特定路径
  - 记录请求耗时和状态码

### 3. 日志工具类 (LogUtils)

- **文件**: `utils/log.utils.ts`
- **功能**:
  - 数据脱敏工具
  - 日志格式化工具
  - 错误堆栈清理
  - 性能计时器

### 4. 查询和分页功能

- **文件**: `dto/query-logs.dto.ts`, `dto/log-response.dto.ts`
- **功能**:
  - 支持多条件查询
  - 分页和排序
  - 日期范围过滤
  - 日志级别筛选

## 配置增强

### 新增配置选项

```typescript
interface LoggingConfig {
  // 文件配置
  fileDir?: string; // 日志文件目录
  maxFiles?: string; // 最大保留文件数

  // 数据库配置
  databaseRetentionDays?: number; // 数据库日志保留天数

  // 性能监控
  performanceEnabled?: boolean; // 启用性能监控
  performanceMaxSamples?: number; // 最大性能样本数

  // HTTP日志
  httpEnabled?: boolean; // 启用HTTP日志
  httpIncludeBody?: boolean; // 记录请求体
  httpIncludeResponse?: boolean; // 记录响应体
  httpSkipPatterns?: string[]; // 跳过的路径模式

  // 结构化日志
  structuredEnabled?: boolean; // 启用结构化日志
  format?: "json" | "simple" | "combined";

  // 异步处理
  asyncEnabled?: boolean; // 启用异步日志
  asyncQueueSize?: number; // 异步队列大小
  batchSize?: number; // 批量写入大小
  batchInterval?: number; // 批量写入间隔

  // 数据安全
  sensitiveFields?: string[]; // 敏感字段列表
  dataMaskingEnabled?: boolean; // 启用数据脱敏
  maskingChar?: string; // 脱敏字符

  // 其他
  debugMode?: boolean; // 调试模式
  colorsEnabled?: boolean; // 启用颜色
}
```

### 环境变量配置

参考 `.env.logging.example` 文件中的完整配置选项。

## API接口增强

### 新增控制器接口

- `GET /logs` - 查询日志（支持分页和过滤）
- `GET /logs/config` - 获取日志配置
- `PUT /logs/config` - 更新日志配置
- `GET /logs/performance` - 获取性能指标
- `POST /logs/cleanup` - 手动清理日志
- `GET /logs/stats` - 获取日志统计信息

## 服务增强

### LoggingService 增强

- 集成性能监控
- 支持异步日志处理
- 增加批量操作
- 改进错误处理

### DatabaseLoggerService 增强

- 添加查询和分页功能
- 支持复杂条件查询
- 优化数据库操作性能
- 增加统计功能

### WinstonLoggerService 修复

- 修复语法错误
- 改进配置管理
- 增强错误处理
- 优化性能

## 安全增强

### 数据脱敏

- 自动识别敏感字段
- 可配置脱敏规则
- 支持多种脱敏策略
- 保护用户隐私

### 访问控制

- API接口权限控制
- 配置修改权限验证
- 日志查看权限管理

## 性能优化

### 异步处理

- 支持异步日志写入
- 批量处理机制
- 队列管理
- 内存优化

### 存储优化

- 日志文件轮转
- 压缩存储
- 自动清理
- 存储空间监控

## 使用指南

### 1. 基本配置

```bash
# 复制配置文件
cp .env.logging.example .env

# 修改配置
vim .env
```

### 2. 启用HTTP日志拦截器

```typescript
// 在 app.module.ts 中
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

### 3. 使用日志工具

```typescript
import { LogUtils } from "./modules/logging/utils/log.utils";

// 数据脱敏
const maskedData = LogUtils.maskSensitiveData(data, ["password", "token"]);

// 格式化日志
const formattedLog = LogUtils.formatLogMessage("info", "User login", {
  userId: 123,
});
```

### 4. 查询日志

```typescript
// 通过API查询
GET /logs?level=error&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20

// 通过服务查询
const logs = await this.databaseLoggerService.queryLogs({
  level: 'error',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  page: 1,
  limit: 20
});
```

## 监控和维护

### 性能监控

- 查看日志操作性能指标
- 监控内存使用情况
- 分析慢查询
- 优化配置参数

### 日志清理

- 自动清理过期日志
- 手动触发清理
- 监控存储空间
- 配置保留策略

## 故障排除

### 常见问题

1. **日志文件过大**: 调整 `maxFileSize` 和 `maxFiles` 配置
2. **性能问题**: 启用异步处理和批量写入
3. **存储空间不足**: 配置自动清理策略
4. **敏感数据泄露**: 启用数据脱敏功能

### 调试模式

启用 `debugMode` 可以获得更详细的日志信息，帮助排查问题。

## 最佳实践

1. **合理配置日志级别**: 生产环境建议使用 `info` 或 `warn`
2. **启用数据脱敏**: 保护用户隐私和敏感信息
3. **配置日志轮转**: 避免单个文件过大
4. **监控性能指标**: 及时发现和解决性能问题
5. **定期清理日志**: 避免存储空间不足
6. **使用结构化日志**: 便于后续分析和处理

## 版本更新

### v2.0.0 (当前版本)

- 新增性能监控服务
- 新增HTTP请求日志拦截器
- 新增日志查询和分页功能
- 增强数据安全和脱敏功能
- 优化异步处理和批量操作
- 修复已知问题和语法错误

## 技术栈

- **NestJS**: 框架
- **Winston**: 日志库
- **TypeORM**: 数据库ORM
- **RxJS**: 响应式编程
- **Node.js**: 运行时环境

## 贡献指南

欢迎提交问题和改进建议。在提交代码前，请确保：

1. 通过所有测试
2. 遵循代码规范
3. 更新相关文档
4. 添加必要的测试用例
