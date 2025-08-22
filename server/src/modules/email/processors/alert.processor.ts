import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmailService } from "../services/email.service";
import { ErrorAggregation } from "../../monitor/entities/error-aggregation.entity";
import { ProjectConfig } from "../../project-config/entities/project-config.entity";
import { ProjectConfigService } from "../../project-config/project-config.service";

/**
 * 邮件告警处理器
 * 负责处理紧急错误告警和错误汇总报告
 */
@Injectable()
export class AlertProcessor {
  private readonly logger = new Logger(AlertProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly projectConfigService: ProjectConfigService,
    @InjectRepository(ErrorAggregation)
    private readonly errorAggregationRepository: Repository<ErrorAggregation>
  ) {}

  /**
   * 处理紧急错误告警
   * @param errorData 错误数据
   */
  async handleUrgentAlert(errorData: any): Promise<void> {
    try {
      const { projectId, message, source, line, column, level } = errorData;

      // 获取项目配置
      const projectConfig = await this.projectConfigService.findOne(
        parseInt(projectId)
      );

      if (!this.shouldSendUrgentAlert(projectConfig, level)) {
        return;
      }

      // 获取或创建错误聚合对象
      const errorAggregation = await this.getOrCreateErrorAggregation(
        projectId,
        message,
        source,
        line,
        column,
        level
      );

      // 发送紧急告警邮件
      await this.emailService.sendErrorAlert(errorAggregation, projectConfig);

      this.logger.log(
        `已发送紧急错误告警邮件: 项目=${projectConfig.name}, 错误=${message}`
      );
    } catch (error) {
      this.logger.error(`处理紧急错误告警失败: ${error.message}`);
    }
  }

  /**
   * 处理错误汇总告警
   * @param projectId 项目ID
   */
  async handleSummaryAlert(projectId: string): Promise<void> {
    try {
      const projectConfig = await this.projectConfigService.findOne(
        parseInt(projectId)
      );

      if (!projectConfig.alertEmail) {
        return;
      }

      // 获取最近24小时的错误统计
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const errors = await this.errorAggregationRepository
        .createQueryBuilder("error")
        .where("error.projectId = :projectId", { projectId })
        .andWhere("error.lastSeen >= :yesterday", { yesterday })
        .orderBy("error.occurrenceCount", "DESC")
        .limit(10)
        .getMany();

      if (errors.length === 0) {
        return;
      }

      // 构建错误摘要数据
      const errorSummary = {
        totalErrors: errors.length,
        newErrors: errors.filter((e) => e.firstSeen >= yesterday).length,
        resolvedErrors: 0,
        topErrors: errors,
      };

      // 发送汇总邮件
      await this.emailService.sendErrorSummary(projectConfig, errorSummary);

      this.logger.log(
        `已发送错误汇总邮件: 项目=${projectConfig.name}, 错误数=${errors.length}`
      );
    } catch (error) {
      this.logger.error(`处理错误汇总告警失败: ${error.message}`);
    }
  }

  /**
   * 判断是否应该发送紧急告警
   * @param projectConfig 项目配置
   * @param errorLevel 错误级别
   * @returns 是否发送告警
   */
  private shouldSendUrgentAlert(
    projectConfig: ProjectConfig,
    errorLevel: number
  ): boolean {
    // 检查是否配置了告警邮箱
    if (!projectConfig.alertEmail) {
      return false;
    }

    // 检查错误级别是否达到告警阈值
    const alertThreshold = projectConfig.alertLevel || 3; // 使用alertLevel字段
    if (errorLevel < alertThreshold) {
      return false;
    }

    return true;
  }

  /**
   * 获取或创建错误聚合信息
   * @param projectId 项目ID
   * @param message 错误消息
   * @param source 错误源文件
   * @param line 错误行号
   * @param column 错误列号
   * @param level 错误级别
   * @returns 错误聚合对象
   */
  private async getOrCreateErrorAggregation(
    projectId: string,
    message: string,
    source: string,
    line: number,
    column: number,
    level: number
  ): Promise<ErrorAggregation> {
    let errorAgg = await this.errorAggregationRepository.findOne({
      where: {
        projectId,
        errorMessage: message,
        sourceFile: source,
        sourceLine: line,
        sourceColumn: column,
      },
    });

    if (errorAgg) {
      // 更新现有聚合记录
      errorAgg.occurrenceCount += 1;
      errorAgg.lastSeen = new Date();
      errorAgg.errorLevel = Math.max(errorAgg.errorLevel, level);
      errorAgg.alertSent = true;
      errorAgg.alertSentAt = new Date();
    } else {
      // 创建新的聚合记录
      const errorHash = `${projectId}-${message}-${source}-${line}-${column}`;
      errorAgg = this.errorAggregationRepository.create({
        projectId,
        errorHash,
        type: "runtime",
        errorMessage: message,
        sourceFile: source,
        sourceLine: line,
        sourceColumn: column,
        errorLevel: level,
        occurrenceCount: 1,
        affectedUsers: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        alertSent: true,
        alertSentAt: new Date(),
      });
    }

    await this.errorAggregationRepository.save(errorAgg);
    return errorAgg;
  }
}
