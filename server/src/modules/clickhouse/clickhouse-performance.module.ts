import { Module } from '@nestjs/common';
import { ClickHouseModule } from './clickhouse.module';
import { ClickHousePerformanceController } from './controllers/clickhouse-performance.controller';

/**
 * ClickHouse性能监控模块
 * 提供性能监控和查询优化的功能模块
 */
@Module({
  imports: [ClickHouseModule],
  controllers: [ClickHousePerformanceController],
})
export class ClickHousePerformanceModule {}