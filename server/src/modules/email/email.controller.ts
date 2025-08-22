import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './services/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectConfig } from '../project-config/entities/project-config.entity';
import { EmailTemplates } from './templates/email-templates';

/**
 * 邮件控制器
 * 提供邮件发送相关的API接口
 */
@ApiTags('邮件服务')
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    @InjectRepository(ProjectConfig)
    private readonly projectConfigRepository: Repository<ProjectConfig>,
  ) {}

  /**
   * 发送测试邮件
   * @param body 请求体
   * @returns 发送结果
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送测试邮件' })
  @ApiResponse({ status: 200, description: '邮件发送成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '项目配置不存在' })
  async sendTestEmail(@Body() body: { projectId: string; testMessage?: string }) {
    const { projectId, testMessage = '这是一封测试邮件，用于验证邮件服务是否正常工作。' } = body;

    // 获取项目配置
    const projectConfig = await this.projectConfigRepository.findOne({
      where: { projectId },
    });

    if (!projectConfig) {
      return {
        success: false,
        message: '项目配置不存在',
        code: 'PROJECT_NOT_FOUND',
      };
    }

    if (!projectConfig.alertEmail) {
      return {
        success: false,
        message: '项目未配置告警邮箱',
        code: 'NO_ALERT_EMAIL',
      };
    }

    // 生成测试邮件内容
    const htmlContent = EmailTemplates.generateTestEmailTemplate({
      projectName: projectConfig.name,
      testMessage,
    });

    // 发送邮件
    const success = await this.emailService.sendEmail(
      projectConfig.alertEmail,
      `[${projectConfig.name}] 测试邮件`,
      htmlContent,
    );

    return {
      success,
      message: success ? '测试邮件发送成功' : '测试邮件发送失败',
      data: {
        projectId,
        projectName: projectConfig.name,
        alertEmail: projectConfig.alertEmail,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 模拟发送错误告警邮件
   * @param body 请求体
   * @returns 发送结果
   */
  @Post('alert/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送测试错误告警邮件' })
  @ApiResponse({ status: 200, description: '告警邮件发送成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '项目配置不存在' })
  async sendTestAlert(@Body() body: { projectId: string }) {
    const { projectId } = body;

    // 获取项目配置
    const projectConfig = await this.projectConfigRepository.findOne({
      where: { projectId },
    });

    if (!projectConfig) {
      return {
        success: false,
        message: '项目配置不存在',
        code: 'PROJECT_NOT_FOUND',
      };
    }

    if (!projectConfig.alertEmail) {
      return {
        success: false,
        message: '项目未配置告警邮箱',
        code: 'NO_ALERT_EMAIL',
      };
    }

    // 创建模拟错误数据
    const mockErrorData = {
      projectName: projectConfig.name,
      errorLevel: 3,
      errorType: 'TypeError',
      errorMessage: '测试错误：Cannot read property \'length\' of undefined',
      firstSeen: new Date(Date.now() - 3600000), // 1小时前
      lastSeen: new Date(),
      occurrenceCount: 5,
      affectedUsers: 3,
      sourceFile: '/src/components/TestComponent.js',
      sourceLine: 42,
      sourceColumn: 15,
      aiDiagnosis: '这是一个典型的空值引用错误。建议在访问对象属性前先检查对象是否存在。',
      errorStack: `TypeError: Cannot read property 'length' of undefined\n    at TestComponent.render (/src/components/TestComponent.js:42:15)\n    at ReactDOMComponent.render (/node_modules/react-dom/lib/ReactDOMComponent.js:865:21)`,
    };

    // 生成告警邮件内容
    const htmlContent = EmailTemplates.generateErrorAlertTemplate(mockErrorData);

    // 发送邮件
    const success = await this.emailService.sendEmail(
      projectConfig.alertEmail,
      `[错误告警] ${projectConfig.name}: ${mockErrorData.errorMessage.substring(0, 50)}`,
      htmlContent,
    );

    return {
      success,
      message: success ? '测试告警邮件发送成功' : '测试告警邮件发送失败',
      data: {
        projectId,
        projectName: projectConfig.name,
        alertEmail: projectConfig.alertEmail,
        errorData: mockErrorData,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 发送测试错误摘要邮件
   * @param body 请求体
   * @returns 发送结果
   */
  @Post('summary/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送测试错误摘要邮件' })
  @ApiResponse({ status: 200, description: '摘要邮件发送成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '项目配置不存在' })
  async sendTestSummary(@Body() body: { projectId: string }) {
    const { projectId } = body;

    // 获取项目配置
    const projectConfig = await this.projectConfigRepository.findOne({
      where: { projectId },
    });

    if (!projectConfig) {
      return {
        success: false,
        message: '项目配置不存在',
        code: 'PROJECT_NOT_FOUND',
      };
    }

    if (!projectConfig.alertEmail) {
      return {
        success: false,
        message: '项目未配置告警邮箱',
        code: 'NO_ALERT_EMAIL',
      };
    }

    // 创建模拟摘要数据
    const mockSummaryData = {
      projectName: projectConfig.name,
      totalErrors: 25,
      newErrors: 8,
      resolvedErrors: 3,
      timeRange: '过去24小时',
      topErrors: [
        {
          errorLevel: 3,
          type: 'TypeError',
          errorMessage: 'TypeError: Cannot read property \'map\' of undefined',
          occurrenceCount: 12,
          affectedUsers: 8,
        },
        {
          errorLevel: 2,
          type: 'ReferenceError',
          errorMessage: 'ReferenceError: $ is not defined',
          occurrenceCount: 7,
          affectedUsers: 5,
        },
        {
          errorLevel: 3,
          type: 'NetworkError',
          errorMessage: 'Network Error: Failed to fetch data from API',
          occurrenceCount: 6,
          affectedUsers: 4,
        },
      ],
    };

    // 生成摘要邮件内容
    const htmlContent = EmailTemplates.generateErrorSummaryTemplate(mockSummaryData);

    // 发送邮件
    const success = await this.emailService.sendEmail(
      projectConfig.alertEmail,
      `[错误摘要] ${projectConfig.name}: 最近24小时错误报告`,
      htmlContent,
    );

    return {
      success,
      message: success ? '测试摘要邮件发送成功' : '测试摘要邮件发送失败',
      data: {
        projectId,
        projectName: projectConfig.name,
        alertEmail: projectConfig.alertEmail,
        summaryData: mockSummaryData,
        timestamp: new Date().toISOString(),
      },
    };
  }
}