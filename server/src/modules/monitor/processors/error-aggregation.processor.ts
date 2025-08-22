import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan, Not } from "typeorm";
import { ErrorLog } from "../entities/error-log.entity";
import { ErrorAggregation } from "../entities/error-aggregation.entity";
import { ProjectConfig } from "../../project-config/entities/project-config.entity";
import { ErrorHashService, ErrorType } from "../services/error-hash.service";
import { QueueService } from "../services/queue.service";
import { QUEUE_NAMES, JOB_TYPES } from "../../../config/queue.config";

/**
 * 错误聚合处理器
 * 负责处理错误聚合和清理任务
 */
@Injectable()
@Processor(QUEUE_NAMES.ERROR_AGGREGATION)
export class ErrorAggregationProcessor {
  private readonly logger = new Logger(ErrorAggregationProcessor.name);

  constructor(
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
    @InjectRepository(ErrorAggregation)
    private readonly errorAggregationRepository: Repository<ErrorAggregation>,
    @InjectRepository(ProjectConfig)
    private readonly projectConfigRepository: Repository<ProjectConfig>,
    private readonly errorHashService: ErrorHashService,
    private readonly queueService: QueueService
  ) {}

  /**
   * 聚合相似错误
   * @param job 任务
   */
  @Process(JOB_TYPES.AGGREGATE_ERRORS)
  async aggregateErrors(
    job: Job<{ projectId: string; timeRange?: { start: Date; end: Date } }>
  ): Promise<void> {
    const { projectId, timeRange } = job.data;

    try {
      this.logger.log(`开始聚合错误: ${projectId}`);

      // 获取项目配置
      const projectConfig = await this.projectConfigRepository.findOne({
        where: { projectId },
      });

      if (!projectConfig) {
        this.logger.warn(`项目配置不存在: ${projectId}`);
        return;
      }

      if (!projectConfig.enableErrorAggregation) {
        this.logger.warn(`错误聚合未启用: ${projectId}`);
        return;
      }

      // 构建查询条件
      const whereCondition: any = {
        projectId,
        isProcessed: false,
      };

      if (timeRange) {
        whereCondition.createdAt = MoreThan(timeRange.start);
      }

      // 获取未处理的错误日志
      const errorLogs = await this.errorLogRepository.find({
        where: whereCondition,
        order: { createdAt: "DESC" },
        take: 1000, // 限制处理数量
      });

      this.logger.log(`查询到 ${errorLogs.length} 个未处理错误: ${projectId}`);
      if (errorLogs.length > 0) {
        this.logger.log(`错误ID列表: ${errorLogs.map((e) => e.id).join(", ")}`);
      }

      if (errorLogs.length === 0) {
        this.logger.log(`没有需要聚合的错误: ${projectId}`);
        return;
      }

      // 按错误哈希分组
      const errorGroups = this.groupErrorsByHash(errorLogs);

      // 处理每个错误组
      for (const [errorHash, errors] of errorGroups.entries()) {
        await this.processErrorGroup(projectId, errorHash, errors);
      }

      // 标记错误为已处理
      const errorIds = errorLogs.map((error) => error.id);
      if (errorIds.length > 0) {
        this.logger.log(
          `准备标记 ${errorIds.length} 个错误为已处理: ${errorIds.join(", ")}`
        );
        const updateResult = await this.errorLogRepository
          .createQueryBuilder()
          .update(ErrorLog)
          .set({ isProcessed: true })
          .where("id IN (:...ids)", { ids: errorIds })
          .execute();
        this.logger.log(`更新结果: affected=${updateResult.affected}`);
      }

      this.logger.log(
        `错误聚合完成: ${projectId}, 处理了 ${errorLogs.length} 个错误`
      );
    } catch (error) {
      this.logger.error(`聚合错误失败: ${projectId}`, error.stack);
      throw error;
    }
  }

  /**
   * 重新计算错误相似度
   * @param job 任务
   */
  @Process("recalculate-similarity")
  async recalculateSimilarity(
    job: Job<{ projectId: string; aggregationId?: string }>
  ): Promise<void> {
    const { projectId, aggregationId } = job.data;

    try {
      this.logger.log(`开始重新计算相似度: ${projectId}`);

      // 构建查询条件
      const whereCondition: any = { projectId };
      if (aggregationId) {
        whereCondition.id = aggregationId;
      }

      // 获取错误聚合
      const aggregations = await this.errorAggregationRepository.find({
        where: whereCondition,
        order: { createdAt: "DESC" },
      });

      // 重新计算每个聚合的相似度
      for (const aggregation of aggregations) {
        const similarAggregations = await this.findSimilarAggregations(
          aggregation,
          projectId
        );

        // 更新相似度信息（暂时跳过，因为实体中没有similarityScore字段）
        // await this.errorAggregationRepository.update(aggregation.id, {
        //   similarityScore: similarAggregations.length > 0 ?
        //     Math.max(...similarAggregations.map(a => a.similarity)) : 0,
        // });
      }

      this.logger.log(`相似度重新计算完成: ${projectId}`);
    } catch (error) {
      this.logger.error(`重新计算相似度失败: ${projectId}`, error.stack);
      throw error;
    }
  }

  /**
   * 清理过期的错误聚合
   * @param job 任务
   */
  @Process("cleanup-old-aggregations")
  async cleanupOldAggregations(
    job: Job<{ projectId?: string; daysToKeep?: number }>
  ): Promise<void> {
    const { projectId, daysToKeep = 30 } = job.data;

    try {
      this.logger.log(`开始清理过期错误聚合: ${projectId || "全部项目"}`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // 构建删除条件
      const whereCondition: any = {
        createdAt: { $lt: cutoffDate } as any,
        status: 3, // 已解决状态
      };

      if (projectId) {
        whereCondition.projectId = projectId;
      }

      // 删除过期的聚合
      const result =
        await this.errorAggregationRepository.delete(whereCondition);

      this.logger.log(`清理完成，删除了 ${result.affected} 个过期聚合`);
    } catch (error) {
      this.logger.error(`清理过期聚合失败`, error.stack);
      throw error;
    }
  }

  /**
   * 按错误哈希分组
   * @param errorLogs 错误日志列表
   * @returns 分组后的错误映射
   */
  private groupErrorsByHash(errorLogs: ErrorLog[]): Map<string, ErrorLog[]> {
    const groups = new Map<string, ErrorLog[]>();

    for (const error of errorLogs) {
      const hash = error.errorHash;
      if (!groups.has(hash)) {
        groups.set(hash, []);
      }
      groups.get(hash)!.push(error);
    }

    return groups;
  }

  /**
   * 处理错误组
   * @param projectId 项目ID
   * @param errorHash 错误哈希
   * @param errors 错误列表
   */
  private async processErrorGroup(
    projectId: string,
    errorHash: string,
    errors: ErrorLog[]
  ): Promise<void> {
    try {
      // 查找现有的聚合
      let aggregation = await this.errorAggregationRepository.findOne({
        where: { projectId, errorHash },
      });

      if (aggregation) {
        // 更新现有聚合
        await this.updateExistingAggregation(aggregation, errors);
      } else {
        // 检查是否存在相似的聚合
        const similarAggregation = await this.findMostSimilarAggregation(
          projectId,
          errorHash,
          errors[0]
        );

        if (similarAggregation) {
          // 合并到相似的聚合中
          await this.mergeIntoSimilarAggregation(
            similarAggregation,
            errors,
            errorHash
          );
        } else {
          // 创建新聚合
          await this.createNewAggregation(projectId, errorHash, errors);
        }
      }
    } catch (error) {
      this.logger.error(`处理错误组失败: ${errorHash}`, error.stack);
    }
  }

  /**
   * 更新现有聚合
   * @param aggregation 现有聚合
   * @param errors 新错误列表
   */
  private async updateExistingAggregation(
    aggregation: ErrorAggregation,
    errors: ErrorLog[]
  ): Promise<void> {
    const newOccurrences = aggregation.occurrenceCount + errors.length;
    const uniqueUsers = new Set(errors.map((e) => e.userId).filter(Boolean));
    const newAffectedUsers = aggregation.affectedUsers + uniqueUsers.size;

    await this.errorAggregationRepository.update(aggregation.id, {
      occurrenceCount: newOccurrences,
      affectedUsers: newAffectedUsers,
      lastSeen: new Date(),
      errorLevel: this.calculateErrorLevel(newOccurrences, newAffectedUsers),
    });
  }

  /**
   * 创建新聚合
   * @param projectId 项目ID
   * @param errorHash 错误哈希
   * @param errors 错误列表
   */
  private async createNewAggregation(
    projectId: string,
    errorHash: string,
    errors: ErrorLog[]
  ): Promise<void> {
    const firstError = errors[0];
    const affectedUsers = new Set(errors.map((e) => e.userId).filter(Boolean));

    // 检测错误类型
    const errorType = this.detectErrorType(firstError);

    const aggregation = this.errorAggregationRepository.create({
      projectId,
      errorHash,
      type: firstError.type,
      errorMessage: firstError.errorMessage,
      errorStack: firstError.errorStack,
      sourceFile: firstError.sourceFile,
      sourceLine: firstError.sourceLine,
      sourceColumn: firstError.sourceColumn,
      occurrenceCount: errors.length,
      affectedUsers: affectedUsers.size,
      errorLevel: this.calculateErrorLevel(errors.length, affectedUsers.size),
      status: 1, // 新错误
      firstSeen: firstError.createdAt,
      lastSeen: new Date(),
    });

    const savedAggregation =
      await this.errorAggregationRepository.save(aggregation);
    this.logger.log(
      `创建新错误聚合: ${savedAggregation.id}, 类型: ${errorType}, 哈希: ${errorHash}`
    );
  }

  /**
   * 检测错误类型
   * @param errorLog 错误日志
   * @returns 错误类型
   */
  private detectErrorType(errorLog: ErrorLog): string {
    const message = errorLog.errorMessage?.toLowerCase() || "";
    const stack = errorLog.errorStack?.toLowerCase() || "";
    const combined = `${message} ${stack}`;

    if (
      combined.includes("network") ||
      combined.includes("fetch") ||
      combined.includes("xhr") ||
      combined.includes("ajax") ||
      combined.includes("timeout")
    ) {
      return "NETWORK";
    }

    if (
      combined.includes("script") ||
      combined.includes("resource") ||
      combined.includes("load") ||
      combined.includes("404") ||
      combined.includes("not found")
    ) {
      return "RESOURCE";
    }

    if (
      combined.includes("promise") ||
      combined.includes("unhandled") ||
      combined.includes("rejection")
    ) {
      return "PROMISE";
    }

    return "JAVASCRIPT";
  }

  /**
   * 查找最相似的聚合
   * @param projectId 项目ID
   * @param errorHash 错误哈希
   * @param errorLog 错误日志
   * @returns 最相似的聚合或null
   */
  private async findMostSimilarAggregation(
    projectId: string,
    errorHash: string,
    errorLog: ErrorLog
  ): Promise<ErrorAggregation | null> {
    const allAggregations = await this.errorAggregationRepository.find({
      where: { projectId },
    });

    if (allAggregations.length === 0) {
      return null;
    }

    // 使用MinHash算法进行相似性检查
    const existingHashes = allAggregations.map((agg) => agg.errorHash);

    // 找到最相似的聚合
    let mostSimilarAggregation: ErrorAggregation | null = null;
    let highestSimilarity = 0;

    for (const aggregation of allAggregations) {
      const similarity = await this.errorHashService.calculateSimilarity(
        errorHash,
        aggregation.errorHash
      );

      if (similarity > 0.8 && similarity > highestSimilarity) {
        highestSimilarity = similarity;
        mostSimilarAggregation = aggregation;
      }
    }

    return mostSimilarAggregation;
  }

  /**
   * 合并到相似的聚合中
   * @param aggregation 目标聚合
   * @param errors 新错误列表
   * @param newErrorHash 新错误哈希
   */
  private async mergeIntoSimilarAggregation(
    aggregation: ErrorAggregation,
    errors: ErrorLog[],
    newErrorHash: string
  ): Promise<void> {
    const newOccurrences = aggregation.occurrenceCount + errors.length;
    const uniqueUsers = new Set(errors.map((e) => e.userId).filter(Boolean));
    const newAffectedUsers = aggregation.affectedUsers + uniqueUsers.size;

    await this.errorAggregationRepository.update(aggregation.id, {
      occurrenceCount: newOccurrences,
      affectedUsers: newAffectedUsers,
      lastSeen: new Date(),
      errorLevel: this.calculateErrorLevel(newOccurrences, newAffectedUsers),
    });

    this.logger.log(
      `合并错误到现有聚合: ${aggregation.id}, 新哈希: ${newErrorHash}`
    );
  }

  /**
   * 查找相似的聚合（保留原方法用于兼容性）
   * @param aggregation 当前聚合
   * @param projectId 项目ID
   * @returns 相似聚合列表
   */
  private async findSimilarAggregations(
    aggregation: ErrorAggregation,
    projectId: string
  ): Promise<Array<{ aggregation: ErrorAggregation; similarity: number }>> {
    const allAggregations = await this.errorAggregationRepository.find({
      where: {
        projectId,
        id: Not(aggregation.id),
      },
    });

    if (allAggregations.length === 0) {
      return [];
    }

    // 计算与其他聚合的相似性
    const hashes = allAggregations.map((agg) => agg.errorHash);

    const similarities: Array<{
      aggregation: ErrorAggregation;
      similarity: number;
    }> = [];

    // 逐个计算相似性
    for (const otherAggregation of allAggregations) {
      const similarity = await this.errorHashService.calculateSimilarity(
        aggregation.errorHash,
        otherAggregation.errorHash
      );

      if (similarity > 0.7) {
        // 相似度阈值
        similarities.push({
          aggregation: otherAggregation,
          similarity,
        });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 计算错误级别
   * @param occurrences 发生次数
   * @param affectedUsers 影响用户数
   * @returns 错误级别
   */
  private calculateErrorLevel(
    occurrences: number,
    affectedUsers: number
  ): number {
    if (occurrences >= 100 || affectedUsers >= 50) {
      return 4; // 严重
    } else if (occurrences >= 50 || affectedUsers >= 20) {
      return 3; // 高
    } else if (occurrences >= 10 || affectedUsers >= 5) {
      return 2; // 中
    } else {
      return 1; // 低
    }
  }
}
