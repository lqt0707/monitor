import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ErrorLog } from "../../monitor/entities/error-log.entity";
import { ErrorAggregation } from "../../monitor/entities/error-aggregation.entity";
import { ProjectConfig } from "../../project-config/entities/project-config.entity";
import { SourceMapService } from "../services/sourcemap.service";
import { QueueService } from "../../monitor/services/queue.service";
import { ProjectConfigService } from "../../project-config/project-config.service";
import { QUEUE_NAMES, JOB_TYPES } from "../../../config/queue.config";

/**
 * SourceMap处理器
 * 负责处理错误的源码定位任务
 */
@Injectable()
@Processor(QUEUE_NAMES.SOURCEMAP_PROCESSING)
export class SourcemapProcessingProcessor {
  private readonly logger = new Logger(SourcemapProcessingProcessor.name);

  constructor(
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
    @InjectRepository(ErrorAggregation)
    private readonly errorAggregationRepository: Repository<ErrorAggregation>,
    @InjectRepository(ProjectConfig)
    private readonly projectConfigRepository: Repository<ProjectConfig>,
    private readonly sourcemapService: SourceMapService,
    private readonly queueService: QueueService,
    private readonly projectConfigService: ProjectConfigService
  ) {}

  /**
   * 处理错误源码定位
   * @param job 任务
   */
  @Process("process-sourcemap")
  async processSourcemap(
    job: Job<{ errorLogId: string; projectId: string }>
  ): Promise<void> {
    const { errorLogId, projectId } = job.data;

    try {
      this.logger.log(`开始处理错误源码定位: ${errorLogId}`);

      // 获取错误日志
      const errorLog = await this.errorLogRepository.findOne({
        where: { id: parseInt(errorLogId) },
      });

      if (!errorLog) {
        this.logger.warn(`错误日志不存在: ${errorLogId}`);
        return;
      }

      // 获取项目的SourceMap配置
      const projectConfig = await this.projectConfigRepository.findOne({
        where: { projectId }
      });
      if (!projectConfig) {
        this.logger.warn(`项目配置不存在: ${projectId}`);
        return;
      }
      const sourcemapConfig =
        await this.projectConfigService.getSourcemapConfig(projectConfig.projectId);
      if (
        !sourcemapConfig ||
        !sourcemapConfig.enableSourcemap ||
        !sourcemapConfig.sourcemapPath
      ) {
        this.logger.warn(`项目SourceMap配置无效: ${projectId}`);
        return;
      }

      // 解析源码位置
      const originalPosition = await this.sourcemapService.parseErrorLocation(
        projectId,
        errorLog.sourceFile || "",
        errorLog.sourceLine || 0,
        errorLog.sourceColumn || 0,
        sourcemapConfig.sourcemapPath
      );

      if (originalPosition) {
        // 更新错误日志的源码信息
        await this.errorLogRepository.update(parseInt(errorLogId), {
          sourceFile: originalPosition.source,
          sourceLine: originalPosition.line,
          sourceColumn: originalPosition.column,
        });

        // 更新相关的错误聚合信息
        await this.updateErrorAggregation(errorLog, originalPosition);

        this.logger.log(`源码定位完成: ${errorLogId}`);
      } else {
        this.logger.warn(`无法解析源码位置: ${errorLogId}`);
      }
    } catch (error) {
      this.logger.error(`处理源码定位失败: ${errorLogId}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量处理SourceMap
   * @param job 任务
   */
  @Process("batch-process-sourcemap")
  async batchProcessSourcemap(
    job: Job<{ projectId: string; errorLogIds: string[] }>
  ): Promise<void> {
    const { projectId, errorLogIds } = job.data;

    try {
      this.logger.log(`开始批量处理SourceMap: ${errorLogIds.length}个错误`);

      for (const errorLogId of errorLogIds) {
        // 添加单个处理任务到队列
        const errorLog = await this.errorLogRepository.findOne({
          where: { id: parseInt(errorLogId) },
        });

        if (errorLog) {
          await this.queueService.addSourcemapProcessingJob(errorLog);
        }
      }

      this.logger.log(`批量SourceMap任务已添加到队列`);
    } catch (error) {
      this.logger.error(`批量处理SourceMap失败`, error.stack);
      throw error;
    }
  }

  /**
   * 清理过期的SourceMap缓存
   * @param job 任务
   */
  @Process("cleanup-sourcemap-cache")
  async cleanupSourcemapCache(job: Job<{ projectId?: string }>): Promise<void> {
    const { projectId } = job.data;

    try {
      this.logger.log(`开始清理SourceMap缓存: ${projectId || "全部项目"}`);

      // TODO: 实现SourceMap缓存清理逻辑
      // 可以根据项目ID清理特定项目的缓存，或清理所有过期缓存

      this.logger.log(`SourceMap缓存清理完成`);
    } catch (error) {
      this.logger.error(`清理SourceMap缓存失败`, error.stack);
      throw error;
    }
  }

  /**
   * 更新错误聚合的源码信息
   * @param errorLog 错误日志
   * @param originalPosition 原始位置信息
   */
  private async updateErrorAggregation(
    errorLog: ErrorLog,
    originalPosition: {
      source: string;
      line: number;
      column: number;
      name?: string;
    }
  ): Promise<void> {
    try {
      // 查找相关的错误聚合
      const errorAggregations = await this.errorAggregationRepository.find({
        where: {
          projectId: errorLog.projectId,
          errorHash: errorLog.errorHash,
        },
      });

      // 更新错误聚合的源码信息
      for (const aggregation of errorAggregations) {
        await this.errorAggregationRepository.update(aggregation.id, {
          sourceFile: originalPosition.source,
          sourceLine: originalPosition.line,
          sourceColumn: originalPosition.column,
        });
      }
    } catch (error) {
      this.logger.error(`更新错误聚合源码信息失败`, error.stack);
    }
  }
}
