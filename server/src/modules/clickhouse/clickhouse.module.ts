import { Module } from '@nestjs/common';
import { ClickHouseService } from './services/clickhouse.service';
import { ClickHouseConfig } from '../../config/database.config';

/**
 * ClickHouse模块
 * 提供ClickHouse数据库服务
 */
@Module({
  providers: [ClickHouseService, ClickHouseConfig],
  exports: [ClickHouseService, ClickHouseConfig],
})
export class ClickHouseModule {}