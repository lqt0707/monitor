import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ErrorAggregation } from '../../monitor/entities/error-aggregation.entity';
import { ProjectConfig } from '../../project-config/entities/project-config.entity';
import { EmailTemplates } from '../templates/email-templates';

/**
 * 邮件通知服务
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * 初始化邮件发送器
   */
  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const secure = this.configService.get<boolean>('SMTP_SECURE');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      this.logger.warn('邮件配置不完整，邮件通知功能将不可用');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    // 验证连接配置
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(`邮件服务配置错误: ${error.message}`);
      } else {
        this.logger.log('邮件服务准备就绪');
      }
    });
  }

  /**
   * 发送错误告警邮件
   * @param errorAggregation 错误聚合信息
   * @param projectConfig 项目配置
   * @returns 发送结果
   */
  async sendErrorAlert(errorAggregation: ErrorAggregation, projectConfig: ProjectConfig): Promise<boolean> {
    if (!this.transporter || !projectConfig.alertEmail) {
      this.logger.warn(`无法发送告警邮件: ${!this.transporter ? '邮件服务未配置' : '未设置告警邮箱'}`);
      return false;
    }

    try {
      const subject = `[错误告警] ${projectConfig.name}: ${errorAggregation.errorMessage.substring(0, 50)}`;
      
      const htmlContent = EmailTemplates.generateErrorAlertTemplate({
        projectName: projectConfig.name,
        errorLevel: errorAggregation.errorLevel,
        errorType: errorAggregation.type,
        errorMessage: errorAggregation.errorMessage,
        firstSeen: errorAggregation.firstSeen,
        lastSeen: errorAggregation.lastSeen,
        occurrenceCount: errorAggregation.occurrenceCount,
        affectedUsers: errorAggregation.affectedUsers,
        sourceFile: errorAggregation.sourceFile,
        sourceLine: errorAggregation.sourceLine,
        sourceColumn: errorAggregation.sourceColumn,
        aiDiagnosis: errorAggregation.aiDiagnosis,
        errorStack: errorAggregation.errorStack,
      });
      
      const result = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to: projectConfig.alertEmail,
        subject,
        html: htmlContent,
      });

      this.logger.log(`告警邮件发送成功: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`告警邮件发送失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 发送错误摘要邮件
   * @param projectConfig 项目配置
   * @param errorSummary 错误摘要数据
   * @returns 发送结果
   */
  async sendErrorSummary(projectConfig: ProjectConfig, errorSummary: any): Promise<boolean> {
    if (!this.transporter || !projectConfig.alertEmail) {
      return false;
    }

    try {
      const subject = `[错误摘要] ${projectConfig.name}: 最近24小时错误报告`;
      
      const htmlContent = EmailTemplates.generateErrorSummaryTemplate({
        projectName: projectConfig.name,
        totalErrors: errorSummary.totalErrors,
        newErrors: errorSummary.newErrors,
        resolvedErrors: errorSummary.resolvedErrors,
        topErrors: errorSummary.topErrors,
        timeRange: errorSummary.timeRange || '过去24小时',
      });
      
      const result = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to: projectConfig.alertEmail,
        subject,
        html: htmlContent,
      });

      this.logger.log(`摘要邮件发送成功: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`摘要邮件发送失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 发送通用邮件
   * @param to 收件人邮箱
   * @param subject 邮件主题
   * @param htmlContent 邮件HTML内容
   * @returns 发送结果
   */
  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('邮件服务未配置，无法发送邮件');
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject,
        html: htmlContent,
      });

      this.logger.log(`邮件发送成功: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`邮件发送失败: ${error.message}`);
      return false;
    }
  }
}