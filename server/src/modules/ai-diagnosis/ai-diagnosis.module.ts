import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiDiagnosisService } from "../../services/ai-diagnosis.service";
import { AiDiagnosisProcessor } from "./processors/ai-diagnosis.processor";
import { AiDiagnosisController } from "./controllers/ai-diagnosis.controller";
import { ErrorAggregation } from "../monitor/entities/error-aggregation.entity";
import { ErrorLog } from "../monitor/entities/error-log.entity";
import { QUEUE_NAMES } from "../../config/queue.config";
import { DeepSeekModule } from "../deepseek/deepseek.module";
import { SourcemapModule } from "../sourcemap/sourcemap.module";
import { SourceCodeModule } from "../source-code/source-code.module";
import { RAGEngineService } from "./services/rag-engine.service";

/**
 * AI诊断模块
 * 提供错误的AI分析和诊断功能
 */
@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.AI_DIAGNOSIS }),
    TypeOrmModule.forFeature([ErrorAggregation, ErrorLog]),
    DeepSeekModule,
    SourcemapModule,
    SourceCodeModule,
  ],
  controllers: [AiDiagnosisController],
  providers: [AiDiagnosisService, AiDiagnosisProcessor, RAGEngineService],
  exports: [AiDiagnosisService, RAGEngineService],
})
export class AiDiagnosisModule {}
