import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ErrorLog } from "../entities/error-log.entity";
import { ErrorAggregation } from "../entities/error-aggregation.entity";
import { ProjectConfig } from "../../project-config/entities/project-config.entity";
import { ErrorHashService } from "../services/error-hash.service";
import { QueueService } from "../services/queue.service";
import { AlertProcessor } from "../../email/processors/alert.processor";
import { AlertRuleService } from "../../alert/services/alert-rule.service";
import { AlertHistoryService } from "../../alert/services/alert-history.service";
import { QUEUE_NAMES, JOB_TYPES } from "../../../config/queue.config";

/**
 * 错误处理队列处理器
 * 处理错误日志的基础处理任务
 */
@Processor(QUEUE_NAMES.ERROR_PROCESSING)
export class ErrorProcessingProcessor {
  private readonly logger = new Logger(ErrorProcessingProcessor.name);

  constructor(
    @InjectRepository(ErrorLog)
    private errorLogRepository: Repository<ErrorLog>,
    @InjectRepository(ErrorAggregation)
    private errorAggregationRepository: Repository<ErrorAggregation>,
    @InjectRepository(ProjectConfig)
    private projectConfigRepository: Repository<ProjectConfig>,
    private errorHashService: ErrorHashService,
    private queueService: QueueService,
    private alertProcessor: AlertProcessor,
    private alertRuleService: AlertRuleService,
    private alertHistoryService: AlertHistoryService
  ) {}

  /**
   * 处理错误日志
   * @param job 任务
   */
  @Process(JOB_TYPES.PROCESS_ERROR)
  async processError(job: Job<{ errorLog: ErrorLog }>): Promise<void> {
    const { errorLog } = job.data;

    try {
      this.logger.log(`开始处理错误: ${errorLog.id}`);

      // 1. 计算错误哈希
      const errorHash = this.errorHashService.calculateMinHash(
        errorLog.errorStack || "",
        errorLog.errorMessage || "",
        errorLog.sourceFile
      );
      errorLog.errorHash = errorHash;

      // 2. 保存错误日志
      await this.errorLogRepository.save(errorLog);

      // 3. 获取项目配置
      const projectConfig = await this.projectConfigRepository.findOne({
        where: { projectId: errorLog.projectId },
      });

      if (!projectConfig) {
        this.logger.warn(`项目配置不存在: ${errorLog.projectId}`);
        return;
      }

      // 4. 添加错误聚合任务
      await this.queueService.addErrorAggregationJob(errorLog);

      // 5. 如果启用了SourceMap，添加SourceMap处理任务
      if (
        projectConfig.enableSourcemap &&
        errorLog.sourceFile &&
        errorLog.sourceLine &&
        errorLog.sourceColumn
      ) {
        await this.queueService.addSourcemapProcessingJob(errorLog);
      }

      this.logger.log(`错误处理完成: ${errorLog.id}`);
    } catch (error) {
      this.logger.error(`错误处理失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 计算错误哈希
   * @param job 任务
   */
  @Process(JOB_TYPES.CALCULATE_ERROR_HASH)
  async calculateErrorHash(job: Job<{ errorLog: ErrorLog }>): Promise<string> {
    const { errorLog } = job.data;

    try {
      this.logger.log(`计算错误哈希: ${errorLog.id}`);

      const errorHash = this.errorHashService.calculateMinHash(
        errorLog.errorStack || "",
        errorLog.errorMessage || "",
        errorLog.sourceFile
      );

      // 更新错误日志的哈希值
      await this.errorLogRepository.update(errorLog.id, { errorHash });

      this.logger.log(`错误哈希计算完成: ${errorLog.id} -> ${errorHash}`);
      return errorHash;
    } catch (error) {
      this.logger.error(`错误哈希计算失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新错误聚合信息
   * @param job 任务
   */
  @Process(JOB_TYPES.UPDATE_AGGREGATION)
  async updateAggregation(
    job: Job<{ errorLog: ErrorLog; errorHash: string }>
  ): Promise<void> {
    const { errorLog, errorHash } = job.data;

    try {
      this.logger.log(`更新错误聚合: ${errorHash}`);

      // 查找现有的错误聚合
      let errorAggregation = await this.errorAggregationRepository.findOne({
        where: {
          projectId: errorLog.projectId,
          errorHash: errorHash,
        },
      });

      if (errorAggregation) {
        // 更新现有聚合
        errorAggregation.occurrenceCount += 1;
        errorAggregation.lastSeen = new Date();

        // 更新影响用户数（如果有用户信息）
        if (errorLog.userId) {
          // 这里简化处理，实际应该维护用户ID列表
          errorAggregation.affectedUsers += 1;
        }
      } else {
        // 创建新的聚合
        errorAggregation = this.errorAggregationRepository.create({
          projectId: errorLog.projectId,
          errorHash: errorHash,
          type: errorLog.type,
          errorMessage: errorLog.errorMessage,
          errorStack: errorLog.errorStack,
          sourceFile: errorLog.sourceFile,
          sourceLine: errorLog.sourceLine,
          sourceColumn: errorLog.sourceColumn,
          occurrenceCount: 1,
          affectedUsers: errorLog.userId ? 1 : 0,
          firstSeen: new Date(),
          lastSeen: new Date(),
          errorLevel: this.determineErrorLevel(errorLog),
          status: 1, // 1表示新错误
        });
      }

      await this.errorAggregationRepository.save(errorAggregation);

      // 检查是否需要发送告警
      await this.checkAndSendAlert(errorAggregation);

      this.logger.log(`错误聚合更新完成: ${errorHash}`);
    } catch (error) {
      this.logger.error(`错误聚合更新失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 确定错误级别
   * @param errorLog 错误日志
   * @returns 错误级别
   */
  private determineErrorLevel(errorLog: ErrorLog): number {
    // 根据错误类型和消息确定级别
    const errorMessage = errorLog.errorMessage?.toLowerCase() || "";
    const errorType = errorLog.type?.toLowerCase() || "";

    // 关键错误 (4)
    if (
      errorType.includes("syntaxerror") ||
      errorType.includes("referenceerror") ||
      errorMessage.includes("is not defined") ||
      errorMessage.includes("cannot read property") ||
      errorMessage.includes("cannot read properties")
    ) {
      return 4;
    }

    // 高级错误 (3)
    if (
      errorType.includes("typeerror") ||
      errorType.includes("rangeerror") ||
      errorMessage.includes("network error") ||
      errorMessage.includes("failed to fetch")
    ) {
      return 3;
    }

    // 中级错误 (2)
    if (errorType.includes("error") || errorMessage.includes("warning")) {
      return 2;
    }

    // 默认低级 (1)
    return 1;
  }

  /**
   * 检查并发送告警
   * @param errorAggregation 错误聚合
   */
  private async checkAndSendAlert(
    errorAggregation: ErrorAggregation
  ): Promise<void> {
    try {
      // 获取项目配置
      const projectConfig = await this.projectConfigRepository.findOne({
        where: { projectId: errorAggregation.projectId },
      });

      if (!projectConfig || !projectConfig.alertEmail) {
        return;
      }

      // 检查告警条件
      const shouldAlert = this.shouldSendAlert(errorAggregation, projectConfig);

      if (shouldAlert) {
        // 检查告警规则
        const triggeredRules = await this.alertRuleService.checkErrorCountAlerts(
          errorAggregation.projectId,
          errorAggregation.occurrenceCount
        );

        // 如果有触发的告警规则，发送告警
      if (triggeredRules.length > 0) {
        // 直接调用AlertProcessor发送紧急告警
        const errorData = {
          projectId: errorAggregation.projectId,
          message: errorAggregation.errorMessage,
          source: errorAggregation.sourceFile,
          line: errorAggregation.sourceLine,
          column: errorAggregation.sourceColumn,
          level: errorAggregation.errorLevel,
          triggeredRules: triggeredRules,
        };

        // 记录告警历史
        for (const rule of triggeredRules) {
          await this.alertHistoryService.createAlertHistory(
            rule,
            projectConfig,
            errorAggregation.occurrenceCount,
            errorData.message,
            errorData.level
          );
        }

        await this.alertProcessor.handleUrgentAlert(errorData);

        this.logger.log(`紧急告警已处理: ${errorAggregation.errorHash}, 触发规则: ${triggeredRules.length}条`);
      }
      }
    } catch (error) {
      this.logger.error(`检查告警失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 判断是否应该发送告警
   * @param errorAggregation 错误聚合
   * @param projectConfig 项目配置
   * @returns 是否发送告警
   */
  private shouldSendAlert(
    errorAggregation: ErrorAggregation,
    projectConfig: ProjectConfig
  ): boolean {
    // 如果已经发送过告警，不再发送
    if (errorAggregation.alertSent) {
      return false;
    }

    // 检查错误级别是否达到告警阈值
    const alertLevel = projectConfig.alertLevel || 2;
    if (errorAggregation.errorLevel < alertLevel) {
      return false;
    }

    // 检查发生次数是否达到阈值（可配置）
    const occurrenceThreshold = 1; // 可以从配置中读取
    if (errorAggregation.occurrenceCount < occurrenceThreshold) {
      return false;
    }

    return true;
  }
}
