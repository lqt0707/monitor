import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bull";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailService } from "../modules/email/services/email.service";
import { ErrorHashService } from "../modules/monitor/services/error-hash.service";
import { QueueService } from "../modules/monitor/services/queue.service";
import { SourceMapService } from "../modules/sourcemap/services/sourcemap.service";
import { ClickHouseService } from "../modules/clickhouse/services/clickhouse.service";
import { ClickHouseConfig } from "../config/database.config";
import { DeepSeekModule } from "../modules/deepseek/deepseek.module";
import { DeepSeekService } from "../modules/deepseek/deepseek.service";
import { SourceCodeModule } from "../modules/source-code/source-code.module";
import { QUEUE_NAMES } from "../config/queue.config";
import { ErrorLog } from "../modules/monitor/entities/error-log.entity";
import { ErrorAggregation } from "../modules/monitor/entities/error-aggregation.entity";

/**
 * 服务模块
 * 导出所有业务服务
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ErrorLog, ErrorAggregation]),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ERROR_PROCESSING },
      { name: QUEUE_NAMES.AI_DIAGNOSIS },
      { name: QUEUE_NAMES.EMAIL_NOTIFICATION },
      { name: QUEUE_NAMES.SOURCEMAP_PROCESSING },
      { name: QUEUE_NAMES.ERROR_AGGREGATION },
      { name: QUEUE_NAMES.MONITOR_PROCESSING }
    ),
    DeepSeekModule,
    SourceCodeModule,
  ],
  providers: [
    EmailService,
    ErrorHashService,
    QueueService,
    SourceMapService,
    ClickHouseService,
    ClickHouseConfig,
    DeepSeekService,
  ],
  exports: [
    EmailService,
    ErrorHashService,
    QueueService,
    SourceMapService,
    ClickHouseService,
    ClickHouseConfig,
    DeepSeekService,
    BullModule, // 导出BullModule以提供队列实例
  ],
})
export class ServicesModule {}
