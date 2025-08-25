import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorProcessingProcessor } from '../modules/monitor/processors/error-processing.processor';
import { MonitorProcessingProcessor } from '../modules/monitor/processors/monitor-processing.processor';
import { AiDiagnosisProcessor } from '../modules/ai-diagnosis/processors/ai-diagnosis.processor';
import { EmailNotificationProcessor } from '../modules/email/processors/email-notification.processor';
import { SourcemapProcessingProcessor } from '../modules/sourcemap/processors/sourcemap-processing.processor';
import { ErrorAggregationProcessor } from '../modules/monitor/processors/error-aggregation.processor';
import { AlertProcessor } from '../modules/email/processors/alert.processor';
import { ErrorLog } from '../modules/monitor/entities/error-log.entity';
import { ErrorAggregation } from '../modules/monitor/entities/error-aggregation.entity';
import { MonitorData } from '../modules/monitor/entities/monitor-data.entity';
import { ProjectConfig } from '../modules/project-config/entities/project-config.entity';
import { ErrorHashService } from '../modules/monitor/services/error-hash.service';
import { QueueService } from '../modules/monitor/services/queue.service';
import { ProjectConfigModule } from '../modules/project-config/project-config.module';
import { ServicesModule } from '../services/services.module';
import { MonitorModule } from '../modules/monitor/monitor.module';
import { AlertModule } from '../modules/alert/alert.module';
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
      { name: QUEUE_NAMES.MONITOR_PROCESSING },
    ),
    // 注册实体
    TypeOrmModule.forFeature([
      ErrorLog,
      ErrorAggregation,
      ProjectConfig,
      MonitorData,
    ]),
    // 导入项目配置模块
    ProjectConfigModule,
    // 导入服务模块
    ServicesModule,
    // 导入监控模块（提供ErrorLogService等）
    MonitorModule,
    // 导入告警模块（提供AlertRuleService等）
    forwardRef(() => AlertModule),
  ],
  providers: [
    ErrorProcessingProcessor,
    MonitorProcessingProcessor,
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