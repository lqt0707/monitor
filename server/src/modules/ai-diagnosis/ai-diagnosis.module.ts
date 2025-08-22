import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiDiagnosisService } from './services/ai-diagnosis.service';
import { AiDiagnosisProcessor } from './processors/ai-diagnosis.processor';
import { ErrorAggregation } from '../monitor/entities/error-aggregation.entity';
import { QUEUE_NAMES } from '../../config/queue.config';

/**
 * AI诊断模块
 * 提供错误的AI分析和诊断功能
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.AI_DIAGNOSIS },
    ),
    TypeOrmModule.forFeature([ErrorAggregation]),
  ],
  providers: [AiDiagnosisService, AiDiagnosisProcessor],
  exports: [AiDiagnosisService],
})
export class AiDiagnosisModule {}