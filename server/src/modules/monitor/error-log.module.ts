import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorLogController } from './error-log.controller';
import { ErrorLogService } from './error-log.service';
import { ErrorLog } from './entities/error-log.entity';
import { ServicesModule } from '../../services/services.module';
import { ClickHouseModule } from '../clickhouse/clickhouse.module';

/**
 * 错误日志模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ErrorLog]),
    ServicesModule,
    ClickHouseModule,
  ],
  controllers: [ErrorLogController],
  providers: [ErrorLogService],
  exports: [ErrorLogService],
})
export class ErrorLogModule {}