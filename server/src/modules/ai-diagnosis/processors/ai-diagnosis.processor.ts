import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ErrorAggregation } from "../../monitor/entities/error-aggregation.entity";
import { AiDiagnosisService } from "../../../services/ai-diagnosis.service";
import { SourceMapService } from "../../sourcemap/services/sourcemap.service";
import { QUEUE_NAMES, JOB_TYPES } from "../../../config/queue.config";

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
    private sourcemapService: SourceMapService
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
      if (
        errorAggregation.sourceFile &&
        errorAggregation.sourceLine &&
        errorAggregation.sourceColumn
      ) {
        try {
          // 需要从项目配置中获取sourcemap路径
          // 这里暂时使用默认路径，实际应该从项目配置获取
          const sourcemapPath = "/path/to/sourcemap"; // TODO: 从项目配置获取
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
        // 保存历史诊断记录
        const historyEntry = {
          timestamp: new Date(),
          analysis: errorAggregation.aiDiagnosis,
          fixSuggestion: errorAggregation.aiFixSuggestion,
        };

        // 解析现有历史记录或创建新数组
        let history = [];
        if (errorAggregation.aiDiagnosisHistory) {
          try {
            history = JSON.parse(errorAggregation.aiDiagnosisHistory);
          } catch (e) {
            this.logger.warn(`解析历史诊断记录失败: ${e.message}`);
          }
        }

        // 只保存有实际内容的记录
        if (historyEntry.analysis || historyEntry.fixSuggestion) {
          history.push(historyEntry);
          // 限制历史记录数量，保留最近10条
          if (history.length > 10) {
            history = history.slice(-10);
          }
          errorAggregation.aiDiagnosisHistory = JSON.stringify(history);
        }

        // 更新错误聚合的AI诊断结果
        errorAggregation.aiDiagnosis = diagnosisResult.analysis;
        errorAggregation.aiFixSuggestion =
          diagnosisResult.fixSuggestions.join("\n");

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
  @Process("batch-analyze")
  async batchAnalyze(
    job: Job<{ errorAggregationIds: number[] }>
  ): Promise<void> {
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
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          this.logger.error(
            `批量诊断中单个错误处理失败: ${errorAggregationId}`,
            error.stack
          );
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
  @Process("reanalyze-error")
  async reanalyzeError(
    job: Job<{ errorAggregationId: number; force?: boolean }>
  ): Promise<void> {
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

      // 执行分析（不再清除现有结果，analyzeError方法会自动保存历史记录）
      await this.analyzeError({
        data: { errorAggregationId },
      } as Job<{ errorAggregationId: number }>);

      this.logger.log(`重新AI诊断完成: ${errorAggregationId}`);
    } catch (error) {
      this.logger.error(`重新AI诊断失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 生成综合分析报告（优化版）
   * 合并诊断和分析为单次AI调用，提高效率
   * @param job 任务
   */
  @Process("comprehensive-analysis")
  async generateComprehensiveAnalysis(
    job: Job<{
      errorId: number;
      errorMessage: string;
      errorStack: string;
      sourceFile: string;
      sourceLine: number;
      projectVersion: string;
      aiDiagnosis: any;
      sourceCode: any;
      timestamp: string;
    }>
  ): Promise<void> {
    const analysisData = job.data;

    try {
      this.logger.log(`开始生成综合分析报告: ${analysisData.errorId}`);

      // 调用AI诊断服务生成综合分析报告（单次AI调用完成所有工作）
      const comprehensiveReport =
        await this.aiDiagnosisService.generateComprehensiveAnalysis(
          analysisData
        );

      if (comprehensiveReport) {
        this.logger.log(`综合分析报告生成成功: ${analysisData.errorId}`);

        // 这里可以将报告保存到数据库或发送通知
        // 目前先记录日志，后续可以根据需要扩展
        this.logger.log(
          `综合分析报告内容: ${JSON.stringify(comprehensiveReport, null, 2)}`
        );
      } else {
        this.logger.warn(`综合分析报告生成失败: ${analysisData.errorId}`);
      }
    } catch (error) {
      this.logger.error(`生成综合分析报告失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 统一错误分析处理器（优化版）
   * 合并多种分析任务，减少重复代码和AI调用
   * @param job 任务
   */
  @Process("unified-error-analysis")
  async unifiedErrorAnalysis(
    job: Job<{
      errorId: number;
      projectId: string;
      sourceFile: string;
      sourceLine: number;
      sourceColumn: number;
      errorStack: string;
      errorMessage: string;
      projectVersion?: string;
      aiDiagnosis?: any;
      sourceCode?: any;
      timestamp?: string;
    }>
  ): Promise<void> {
    const {
      errorId,
      projectId,
      sourceFile,
      sourceLine,
      sourceColumn,
      errorStack,
      errorMessage,
      projectVersion,
      aiDiagnosis,
      sourceCode,
      timestamp,
    } = job.data;

    try {
      this.logger.log(`开始统一错误分析: ${errorId}`);

      // 获取源代码位置信息
      let enhancedSourceCode = sourceCode;
      if (sourceFile && sourceLine) {
        try {
          // 从项目配置中获取sourcemap路径
          const sourcemapPath = `/storage/sourcemaps/${projectId}`; // 根据项目ID构建路径
          const sourceLocation = await this.sourcemapService.parseErrorLocation(
            projectId,
            sourceFile,
            sourceLine,
            sourceColumn,
            sourcemapPath
          );

          if (sourceLocation) {
            enhancedSourceCode = {
              ...sourceCode,
              filePath: sourceFile,
              lineNumber: sourceLine,
              columnNumber: sourceColumn,
              codeContent: sourceLocation.sourceContent,
              sourcemap: {
                originalFile: sourceLocation.source,
                originalLine: sourceLocation.line,
                originalColumn: sourceLocation.column,
                originalName: sourceLocation.name,
              },
            };

            this.logger.log(
              `获取源代码位置成功: ${sourceLocation.source}:${sourceLocation.line}`
            );
          }
        } catch (error) {
          this.logger.warn(`获取源代码位置失败: ${error.message}`);
        }
      }

      // 构建完整的分析数据
      const analysisData = {
        errorId,
        errorMessage,
        errorStack,
        sourceFile,
        sourceLine,
        projectVersion: projectVersion || "未知",
        aiDiagnosis: aiDiagnosis || null,
        sourceCode: enhancedSourceCode || null,
        timestamp: timestamp || new Date().toISOString(),
      };

      // 直接调用综合分析服务，单次AI调用完成所有工作
      const comprehensiveReport =
        await this.aiDiagnosisService.generateComprehensiveAnalysis(
          analysisData
        );

      if (comprehensiveReport) {
        this.logger.log(`统一错误分析完成: ${errorId}`);

        // 这里可以将诊断结果保存到数据库
        // 目前先记录日志，后续可以根据需要扩展
        this.logger.log(
          `分析结果: ${JSON.stringify(comprehensiveReport, null, 2)}`
        );
      } else {
        this.logger.warn(`统一错误分析失败: ${errorId}`);
      }
    } catch (error) {
      this.logger.error(`统一错误分析失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
