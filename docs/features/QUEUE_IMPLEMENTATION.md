# 监控服务队列处理改造说明

## 改造内容

本次改造将MonitorService的同步数据保存改为异步队列处理，实现了以下功能：

### 1. 新增队列配置
- 在 `queue.config.ts` 中添加了 `MONITOR_PROCESSING` 队列
- 新增了 `PROCESS_MONITOR_DATA` 任务类型
- 配置了队列选项：重试2次，指数退避策略，保留500个完成任务

### 2. 扩展QueueService
- 添加了 `addMonitorProcessingJob` 方法
- 注入并使用了新的监控处理队列
- 支持优先级设置和错误处理

### 3. 创建监控数据处理器
- 新增 `MonitorProcessingProcessor` 类
- 处理监控数据保存、错误转换、性能数据处理
- 支持JavaScript错误自动转换为错误日志

### 4. 改造MonitorService
- `saveMonitorData` 改为异步队列处理
- 新增 `saveMonitorDataDirectly` 方法用于内部调用
- 添加了详细的日志记录

### 5. 更新模块配置
- 在 `MonitorModule` 中注册了新的队列和处理器
- 确保QueueService正确导出和注入

## 使用方式

### 上报监控数据（SDK端）
```typescript
// 原有方式保持不变
const result = await monitorService.saveMonitorData(reportData);
// 现在返回 { id: string; message: string }
```

### 内部直接保存（如需同步操作）
```typescript
// 新增的直接保存方法
const savedData = await monitorService.saveMonitorDataDirectly(monitorData);
```

## 数据处理流程

1. **SDK上报** → MonitorController.reportData()
2. **队列添加** → MonitorService.saveMonitorData() → QueueService.addMonitorProcessingJob()
3. **异步处理** → MonitorProcessingProcessor.processMonitorData()
4. **数据保存** → 保存到数据库
5. **错误转换** → JavaScript错误自动转为ErrorLog
6. **后续处理** → SourceMap解析、错误聚合等

## 优势

1. **高并发处理**：队列缓冲，避免数据库压力
2. **异步解耦**：上报和处理分离，提高响应速度
3. **错误恢复**：自动重试机制，提高系统稳定性
4. **扩展性**：易于添加新的处理逻辑
5. **资源优化**：按优先级处理任务

## 测试验证

运行测试脚本：
```bash
node test-queue.js
```

启动应用后，监控数据将通过队列异步处理，可以在日志中查看处理状态。

## 注意事项

1. 确保Redis服务正常运行（Bull队列依赖Redis）
2. 监控队列积压情况，适时调整消费者数量
3. 错误处理逻辑需要完善监控和告警
4. 考虑添加死信队列处理长期失败的任务