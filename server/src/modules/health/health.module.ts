import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { ClickHouseModule } from '../clickhouse/clickhouse.module';

/**
 * 健康检查模块
 */
@Module({
  imports: [ClickHouseModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}