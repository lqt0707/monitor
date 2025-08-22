import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { ConfigService } from "@nestjs/config";
import {
  QUEUE_NAMES,
  JOB_TYPES,
  JOB_PRIORITIES,
  QUEUE_OPTIONS,
} from "../../../config/queue.config";
import { ErrorLog } from "../entities/error-log.entity";
import { ErrorAggregation } from "../entities/error-aggregation.entity";
import { ProjectConfig } from "../../project-config/entities/project-config.entity";

/**
 * 队列服务
 * 管理各种异步任务的队列处理
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.ERROR_PROCESSING)
    private errorProcessingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AI_DIAGNOSIS) private aiDiagnosisQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL_NOTIFICATION)
    private emailNotificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SOURCEMAP_PROCESSING)
    private sourcemapProcessingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ERROR_AGGREGATION)
    private errorAggregationQueue: Queue,
    private configService: ConfigService
  ) {}

  /**
   * 添加错误处理任务
   * @param errorLog 错误日志
   * @param priority 优先级
   */
  async addErrorProcessingJob(
    errorLog: ErrorLog,
    priority: number = JOB_PRIORITIES.NORMAL
  ): Promise<void> {
    try {
      await this.errorProcessingQueue.add(
        JOB_TYPES.PROCESS_ERROR,
        { errorLog },
        {
          priority,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 5,
        }
      );

      this.logger.log(`错误处理任务已添加到队列: ${errorLog.id}`);
    } catch (error) {
      this.logger.error(`添加错误处理任务失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 添加AI诊断任务
   * @param errorAggregation 错误聚合信息
   * @param priority 优先级
   */
  async addAiDiagnosisJob(
    errorAggregation: ErrorAggregation,
    priority: number = JOB_PRIORITIES.NORMAL
  ): Promise<void> {
    try {
      // 检查是否启用AI诊断
      const aiEnabled = this.configService.get<boolean>(
        "AI_DIAGNOSIS_ENABLED",
        false
      );
      if (!aiEnabled) {
        this.logger.debug("AI诊断功能未启用，跳过任务");
        return;
      }

      await this.aiDiagnosisQueue.add(
        JOB_TYPES.ANALYZE_ERROR,
        { errorAggregation },
        {
          priority,
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: 5,
          removeOnFail: 3,
          delay: 1000, // 延迟1秒执行，避免频繁调用AI API
        }
      );

      this.logger.log(`AI诊断任务已添加到队列: ${errorAggregation.errorHash}`);
    } catch (error) {
      this.logger.error(`添加AI诊断任务失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 添加邮件通知任务
   * @param type 通知类型
   * @param data 通知数据
   * @param priority 优先级
   */
  async addEmailNotificationJob(
    type: "error_alert" | "daily_summary",
    data: any,
    priority: number = JOB_PRIORITIES.HIGH
  ): Promise<void> {
    try {
      const jobType =
        type === "error_alert"
          ? JOB_TYPES.SEND_ALERT_EMAIL
          : JOB_TYPES.SEND_SUMMARY_EMAIL;

      await this.emailNotificationQueue.add(jobType, data, {
        priority,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
        removeOnComplete: 20,
        removeOnFail: 10,
      });

      this.logger.log(`邮件通知任务已添加到队列: ${type}`);
    } catch (error) {
      this.logger.error(`添加邮件通知任务失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 添加SourceMap处理任务
   * @param errorLog 错误日志
   * @param priority 优先级
   */
  async addSourcemapProcessingJob(
    errorLog: ErrorLog,
    priority: number = JOB_PRIORITIES.NORMAL
  ): Promise<void> {
    try {
      await this.sourcemapProcessingQueue.add(
        JOB_TYPES.PARSE_SOURCEMAP,
        { errorLog },
        {
          priority,
          attempts: 2,
          backoff: {
            type: "fixed",
            delay: 1000,
          },
          removeOnComplete: 15,
          removeOnFail: 5,
        }
      );

      this.logger.log(`SourceMap处理任务已添加到队列: ${errorLog.id}`);
    } catch (error) {
      this.logger.error(`添加SourceMap处理任务失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 添加错误聚合任务
   * @param errorLog 错误日志
   * @param priority 优先级
   */
  async addErrorAggregationJob(
    errorLog: ErrorLog,
    priority: number = JOB_PRIORITIES.NORMAL
  ): Promise<void> {
    try {
      await this.errorAggregationQueue.add(
        JOB_TYPES.AGGREGATE_ERRORS,
        { projectId: errorLog.projectId },
        {
          priority,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: 20,
          removeOnFail: 10,
        }
      );

      this.logger.log(`错误聚合任务已添加到队列: ${errorLog.projectId}`);
    } catch (error) {
      this.logger.error(`添加错误聚合任务失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 添加定时任务 - 每日错误摘要
   * @param projectConfigs 项目配置列表
   */
  async addDailySummaryJob(projectConfigs: ProjectConfig[]): Promise<void> {
    try {
      for (const config of projectConfigs) {
        if (config.alertEmail) {
          await this.addEmailNotificationJob(
            "daily_summary",
            { projectConfig: config },
            JOB_PRIORITIES.LOW
          );
        }
      }

      this.logger.log(`每日摘要任务已添加，项目数量: ${projectConfigs.length}`);
    } catch (error) {
      this.logger.error(`添加每日摘要任务失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取队列状态信息
   * @returns 队列状态
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      const stats: QueueStats = {
        errorProcessing: await this.getQueueInfo(this.errorProcessingQueue),
        aiDiagnosis: await this.getQueueInfo(this.aiDiagnosisQueue),
        emailNotification: await this.getQueueInfo(this.emailNotificationQueue),
        sourcemapProcessing: await this.getQueueInfo(
          this.sourcemapProcessingQueue
        ),
        errorAggregation: await this.getQueueInfo(this.errorAggregationQueue),
      };

      return stats;
    } catch (error) {
      this.logger.error(`获取队列状态失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取单个队列信息
   * @param queue 队列实例
   * @returns 队列信息
   */
  private async getQueueInfo(queue: Queue): Promise<QueueInfo> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * 清理队列中的已完成和失败任务
   * @param queueName 队列名称（可选，不指定则清理所有队列）
   */
  async cleanQueues(queueName?: string): Promise<void> {
    try {
      const queuesToClean = queueName
        ? [this.getQueueByName(queueName)]
        : [
            this.errorProcessingQueue,
            this.aiDiagnosisQueue,
            this.emailNotificationQueue,
            this.sourcemapProcessingQueue,
            this.errorAggregationQueue,
          ];

      for (const queue of queuesToClean) {
        if (queue) {
          await queue.clean(24 * 60 * 60 * 1000, "completed"); // 清理24小时前的已完成任务
          await queue.clean(7 * 24 * 60 * 60 * 1000, "failed"); // 清理7天前的失败任务
        }
      }

      this.logger.log("队列清理完成");
    } catch (error) {
      this.logger.error(`队列清理失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据名称获取队列实例
   * @param queueName 队列名称
   * @returns 队列实例
   */
  private getQueueByName(queueName: string): Queue | null {
    switch (queueName) {
      case QUEUE_NAMES.ERROR_PROCESSING:
        return this.errorProcessingQueue;
      case QUEUE_NAMES.AI_DIAGNOSIS:
        return this.aiDiagnosisQueue;
      case QUEUE_NAMES.EMAIL_NOTIFICATION:
        return this.emailNotificationQueue;
      case QUEUE_NAMES.SOURCEMAP_PROCESSING:
        return this.sourcemapProcessingQueue;
      case QUEUE_NAMES.ERROR_AGGREGATION:
        return this.errorAggregationQueue;
      default:
        return null;
    }
  }

  /**
   * 暂停队列
   * @param queueName 队列名称
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    if (queue) {
      await queue.pause();
      this.logger.log(`队列已暂停: ${queueName}`);
    }
  }

  /**
   * 恢复队列
   * @param queueName 队列名称
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    if (queue) {
      await queue.resume();
      this.logger.log(`队列已恢复: ${queueName}`);
    }
  }
}

/**
 * 队列信息接口
 */
export interface QueueInfo {
  waiting: number; // 等待中的任务数
  active: number; // 正在执行的任务数
  completed: number; // 已完成的任务数
  failed: number; // 失败的任务数
  delayed: number; // 延迟执行的任务数
}

/**
 * 队列状态接口
 */
export interface QueueStats {
  errorProcessing: QueueInfo;
  aiDiagnosis: QueueInfo;
  emailNotification: QueueInfo;
  sourcemapProcessing: QueueInfo;
  errorAggregation: QueueInfo;
}
