import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorProcessingProcessor } from '../modules/monitor/processors/error-processing.processor';
import { AiDiagnosisProcessor } from './ai-diagnosis.processor';
import { EmailNotificationProcessor } from '../modules/email/processors/email-notification.processor';
import { SourcemapProcessingProcessor } from '../modules/sourcemap/processors/sourcemap-processing.processor';
import { ErrorAggregationProcessor } from '../modules/monitor/processors/error-aggregation.processor';
import { AlertProcessor } from '../modules/email/processors/alert.processor';
import { ErrorLog } from '../modules/monitor/entities/error-log.entity';
import { ErrorAggregation } from '../modules/monitor/entities/error-aggregation.entity';
import { ProjectConfig } from '../modules/project-config/entities/project-config.entity';
import { ErrorHashService } from '../modules/monitor/services/error-hash.service';
import { QueueService } from '../modules/monitor/services/queue.service';
import { ProjectConfigModule } from '../modules/project-config/project-config.module';
import { ServicesModule } from '../services/services.module';
import { QUEUE_NAMES } from '../config/queue.config';

/**
 * 处理器模块
 * 注册所有队列处理器和相关依赖
 */
@Module({
  imports: [
    // 注册所有队列
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ERROR_PROCESSING },
      { name: QUEUE_NAMES.AI_DIAGNOSIS },
      { name: QUEUE_NAMES.EMAIL_NOTIFICATION },
      { name: QUEUE_NAMES.SOURCEMAP_PROCESSING },
      { name: QUEUE_NAMES.ERROR_AGGREGATION },
    ),
    // 注册实体
    TypeOrmModule.forFeature([
      ErrorLog,
      ErrorAggregation,
      ProjectConfig,
    ]),
    // 导入项目配置模块
    ProjectConfigModule,
    // 导入服务模块
    ServicesModule,
  ],
  providers: [
    ErrorProcessingProcessor,
    AiDiagnosisProcessor,
    EmailNotificationProcessor,
    SourcemapProcessingProcessor,
    ErrorAggregationProcessor,
    AlertProcessor,
    ErrorHashService,
    QueueService,
  ],
  exports: [
    ErrorProcessingProcessor,
    AiDiagnosisProcessor,
    EmailNotificationProcessor,
    SourcemapProcessingProcessor,
    ErrorAggregationProcessor,
    AlertProcessor,
  ],
})
export class ProcessorsModule {}