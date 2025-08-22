import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorAggregation } from '../../monitor/entities/error-aggregation.entity';
import { AiDiagnosisService } from '../../../services/ai-diagnosis.service';
import { SourceMapService } from '../../sourcemap/services/sourcemap.service';
import { QUEUE_NAMES, JOB_TYPES } from '../../../config/queue.config';

/**
 * AI诊断队列处理器
 * 处理错误的AI分析和诊断任务
 */
@Processor(QUEUE_NAMES.AI_DIAGNOSIS)
export class AiDiagnosisProcessor {
  private readonly logger = new Logger(AiDiagnosisProcessor.name);

  constructor(
    @InjectRepository(ErrorAggregation)
    private errorAggregationRepository: Repository<ErrorAggregation>,
    private aiDiagnosisService: AiDiagnosisService,
    private sourcemapService: SourceMapService,
  ) {}

  /**
   * 分析错误并生成AI诊断
   * @param job 任务
   */
  @Process(JOB_TYPES.ANALYZE_ERROR)
  async analyzeError(job: Job<{ errorAggregationId: number }>): Promise<void> {
    const { errorAggregationId } = job.data;
    
    try {
      this.logger.log(`开始AI诊断: ${errorAggregationId}`);
      
      // 获取错误聚合信息
      const errorAggregation = await this.errorAggregationRepository.findOne({
        where: { id: errorAggregationId },
      });
      
      if (!errorAggregation) {
        this.logger.warn(`错误聚合不存在: ${errorAggregationId}`);
        return;
      }
      
      // 尝试获取源代码位置信息
      let sourceLocation = null;
      if (errorAggregation.sourceFile && errorAggregation.sourceLine && errorAggregation.sourceColumn) {
        try {
          // 需要从项目配置中获取sourcemap路径
          // 这里暂时使用默认路径，实际应该从项目配置获取
          const sourcemapPath = '/path/to/sourcemap'; // TODO: 从项目配置获取
          sourceLocation = await this.sourcemapService.parseErrorLocation(
            errorAggregation.projectId,
            errorAggregation.sourceFile,
            errorAggregation.sourceLine,
            errorAggregation.sourceColumn,
            sourcemapPath
          );
        } catch (error) {
          this.logger.warn(`获取源代码位置失败: ${error.message}`);
        }
      }
      
      // 执行AI诊断
      const diagnosisResult = await this.aiDiagnosisService.diagnoseError(
        errorAggregation,
        sourceLocation
      );
      
      if (diagnosisResult) {
        // 更新错误聚合的AI诊断结果
        errorAggregation.aiDiagnosis = diagnosisResult.analysis;
        errorAggregation.aiFixSuggestion = diagnosisResult.fixSuggestions.join('\n');
        
        await this.errorAggregationRepository.save(errorAggregation);
        
        this.logger.log(`AI诊断完成: ${errorAggregationId}`);
      } else {
        this.logger.warn(`AI诊断失败: ${errorAggregationId}`);
      }
    } catch (error) {
      this.logger.error(`AI诊断处理失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量分析错误
   * @param job 任务
   */
  @Process('batch-analyze')
  async batchAnalyze(job: Job<{ errorAggregationIds: number[] }>): Promise<void> {
    const { errorAggregationIds } = job.data;
    
    try {
      this.logger.log(`开始批量AI诊断: ${errorAggregationIds.length}个错误`);
      
      for (const errorAggregationId of errorAggregationIds) {
        try {
          // 为每个错误创建单独的分析任务
          await this.analyzeError({
            data: { errorAggregationId },
          } as Job<{ errorAggregationId: number }>);
          
          // 添加延迟以避免API限制
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          this.logger.error(`批量诊断中单个错误处理失败: ${errorAggregationId}`, error.stack);
          // 继续处理其他错误
        }
      }
      
      this.logger.log(`批量AI诊断完成: ${errorAggregationIds.length}个错误`);
    } catch (error) {
      this.logger.error(`批量AI诊断失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 重新分析错误（用于重试或更新诊断）
   * @param job 任务
   */
  @Process('reanalyze-error')
  async reanalyzeError(job: Job<{ errorAggregationId: number; force?: boolean }>): Promise<void> {
    const { errorAggregationId, force = false } = job.data;
    
    try {
      this.logger.log(`重新AI诊断: ${errorAggregationId}`);
      
      // 获取错误聚合信息
      const errorAggregation = await this.errorAggregationRepository.findOne({
        where: { id: errorAggregationId },
      });
      
      if (!errorAggregation) {
        this.logger.warn(`错误聚合不存在: ${errorAggregationId}`);
        return;
      }
      
      // 如果不是强制重新分析，且已有诊断结果，则跳过
      if (!force && errorAggregation.aiDiagnosis) {
        this.logger.log(`错误已有诊断结果，跳过: ${errorAggregationId}`);
        return;
      }
      
      // 清除现有诊断结果
      errorAggregation.aiDiagnosis = null;
      errorAggregation.aiFixSuggestion = null;
      
      // 执行分析
      await this.analyzeError({
        data: { errorAggregationId },
      } as Job<{ errorAggregationId: number }>);
      
      this.logger.log(`重新AI诊断完成: ${errorAggregationId}`);
    } catch (error) {
      this.logger.error(`重新AI诊断失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}