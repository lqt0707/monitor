import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLog } from '../../monitor/entities/error-log.entity';
import { ErrorAggregation } from '../../monitor/entities/error-aggregation.entity';
import { ProjectConfig } from '../../project-config/entities/project-config.entity';
import { EmailService } from '../services/email.service';
import { EmailTemplates } from '../templates/email-templates';
import { QUEUE_NAMES, JOB_TYPES } from '../../../config/queue.config';

/**
 * 邮件通知队列处理器
 * 处理错误告警和摘要邮件发送任务
 */
@Processor(QUEUE_NAMES.EMAIL_NOTIFICATION)
export class EmailNotificationProcessor {
  private readonly logger = new Logger(EmailNotificationProcessor.name);

  constructor(
    @InjectRepository(ErrorAggregation)
    private errorAggregationRepository: Repository<ErrorAggregation>,
    @InjectRepository(ProjectConfig)
    private projectConfigRepository: Repository<ProjectConfig>,
    private emailService: EmailService,
  ) {}

  /**
   * 发送错误告警邮件
   * @param job 任务
   */
  @Process('send-error-alert')
  async sendErrorAlert(job: Job<{ errorAggregation: ErrorAggregation; projectConfig: ProjectConfig }>): Promise<void> {
    const { errorAggregation, projectConfig } = job.data;
    
    try {
      this.logger.log(`发送错误告警邮件: ${errorAggregation.errorHash}`);
      
      const success = await this.emailService.sendErrorAlert(errorAggregation, projectConfig);
      
      if (success) {
        this.logger.log(`错误告警邮件发送成功: ${errorAggregation.errorHash}`);
      } else {
        this.logger.warn(`错误告警邮件发送失败: ${errorAggregation.errorHash}`);
        throw new Error('邮件发送失败');
      }
    } catch (error) {
      this.logger.error(`错误告警邮件处理失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 发送每日错误摘要邮件
   * @param job 任务
   */
  @Process('send-daily-summary')
  async sendDailySummary(job: Job<{ projectId: string; date: string }>): Promise<void> {
    const { projectId, date } = job.data;
    
    try {
      this.logger.log(`发送每日错误摘要: ${projectId} - ${date}`);
      
      // 获取项目配置
      const projectConfig = await this.projectConfigRepository.findOne({
        where: { projectId },
      });
      
      if (!projectConfig || !projectConfig.alertEmail) {
        this.logger.warn(`项目配置不存在或未设置告警邮箱: ${projectId}`);
        return;
      }
      
      // 获取当日的错误聚合数据
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      const errorAggregations = await this.errorAggregationRepository.find({
        where: {
          projectId,
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          } as any,
        },
        order: {
          occurrenceCount: 'DESC',
        },
        take: 20, // 最多显示20个错误
      });
      
      if (errorAggregations.length === 0) {
        this.logger.log(`${projectId} 在 ${date} 无错误数据，跳过摘要邮件`);
        return;
      }
      
      // 暂时使用错误告警方法发送摘要，后续可以扩展专门的摘要方法
      const success = await this.emailService.sendErrorAlert(
        errorAggregations[0], // 使用第一个错误作为代表
        projectConfig
      );
      
      if (success) {
        this.logger.log(`每日错误摘要发送成功: ${projectId} - ${date}`);
      } else {
        this.logger.warn(`每日错误摘要发送失败: ${projectId} - ${date}`);
        throw new Error('摘要邮件发送失败');
      }
    } catch (error) {
      this.logger.error(`每日错误摘要处理失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 发送批量错误告警
   * @param job 任务
   */
  @Process('send-batch-alert')
  async sendBatchAlert(job: Job<{ projectId: string; errorAggregationIds: number[] }>): Promise<void> {
    const { projectId, errorAggregationIds } = job.data;
    
    try {
      this.logger.log(`发送批量错误告警: ${projectId} - ${errorAggregationIds.length}个错误`);
      
      // 获取项目配置
      const projectConfig = await this.projectConfigRepository.findOne({
        where: { projectId },
      });
      
      if (!projectConfig || !projectConfig.alertEmail) {
        this.logger.warn(`项目配置不存在或未设置告警邮箱: ${projectId}`);
        return;
      }
      
      // 获取错误聚合数据
      const errorAggregations = await this.errorAggregationRepository.findByIds(errorAggregationIds);
      
      if (errorAggregations.length === 0) {
        this.logger.warn(`未找到错误聚合数据: ${errorAggregationIds}`);
        return;
      }
      
      // 逐个发送告警邮件
      let successCount = 0;
      for (const errorAggregation of errorAggregations) {
        try {
          const success = await this.emailService.sendErrorAlert(errorAggregation, projectConfig);
          if (success) {
            successCount++;
            
            // 更新告警发送状态
            errorAggregation.alertSent = true;
            errorAggregation.alertSentAt = new Date();
            await this.errorAggregationRepository.save(errorAggregation);
          }
          
          // 添加延迟以避免邮件服务器限制
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          this.logger.error(`单个错误告警发送失败: ${errorAggregation.errorHash}`, error.stack);
        }
      }
      
      this.logger.log(`批量错误告警完成: ${successCount}/${errorAggregations.length} 成功`);
    } catch (error) {
      this.logger.error(`批量错误告警处理失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 发送测试邮件
   * @param job 任务
   */
  @Process('send-test-email')
  async sendTestEmail(job: Job<{ projectId: string; testMessage?: string }>): Promise<void> {
    const { projectId, testMessage = '这是一封测试邮件' } = job.data;
    
    try {
      this.logger.log(`发送测试邮件: ${projectId}`);
      
      // 获取项目配置
      const projectConfig = await this.projectConfigRepository.findOne({
        where: { projectId },
      });
      
      if (!projectConfig || !projectConfig.alertEmail) {
        this.logger.warn(`项目配置不存在或未设置告警邮箱: ${projectId}`);
        return;
      }
      
      // 生成测试邮件内容
      const htmlContent = EmailTemplates.generateTestEmailTemplate({
        projectName: projectConfig.name,
        testMessage
      });
      
      const success = await this.emailService.sendEmail(
        projectConfig.alertEmail,
        `[${projectConfig.name}] 测试邮件`,
        htmlContent
      );
      
      if (success) {
        this.logger.log(`测试邮件发送成功: ${projectId}`);
      } else {
        this.logger.warn(`测试邮件发送失败: ${projectId}`);
        throw new Error('测试邮件发送失败');
      }
    } catch (error) {
      this.logger.error(`测试邮件处理失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}