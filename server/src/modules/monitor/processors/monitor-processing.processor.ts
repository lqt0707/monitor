import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_NAMES, JOB_TYPES } from '../../../config/queue.config';
import { MonitorData } from '../entities/monitor-data.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueService } from '../services/queue.service';
import { ErrorLogService } from '../error-log.service';
import { CreateErrorLogDto, ErrorType, ErrorLevel } from '../dto/create-error-log.dto';

/**
 * 监控数据处理处理器
 * 负责处理监控数据队列中的任务
 */
@Processor(QUEUE_NAMES.MONITOR_PROCESSING)
@Injectable()
export class MonitorProcessingProcessor {
  private readonly logger = new Logger(MonitorProcessingProcessor.name);

 constructor(
    @InjectRepository(MonitorData)
    private readonly monitorDataRepository: Repository<MonitorData>,
    private readonly queueService: QueueService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  /**
   * 处理监控数据任务
   * @param job Bull任务对象
   */
  @Process(JOB_TYPES.PROCESS_MONITOR_DATA)
  async processMonitorData(job: Job<{ monitorData: MonitorData }>): Promise<void> {
    const { monitorData } = job.data;
    
    try {
      this.logger.log(`开始处理监控数据: ${monitorData.id}`);

      // 1. 保存监控数据到数据库
      await this.monitorDataRepository.save(monitorData);

      // 2. 如果是jsError类型，转换为错误日志
      if (monitorData.type === 'jsError' && monitorData.errorMessage) {
        await this.processJsError(monitorData);
      }

      // 3. 如果是performance类型，处理性能数据
      if (monitorData.type === 'performance') {
        await this.processPerformanceData(monitorData);
      }

      // 4. 如果是resource类型，处理资源加载错误
      if (monitorData.type === 'resource') {
        await this.processResourceError(monitorData);
      }

      this.logger.log(`监控数据处理完成: ${monitorData.id}`);
    } catch (error) {
      this.logger.error(`处理监控数据失败: ${monitorData.id}, 错误: ${error.message}`);
      throw error; // 让Bull进行重试
    }
  }

  /**
   * 处理JavaScript错误
   * 将MonitorData转换为ErrorLog并保存
   * @param monitorData 监控数据
   */
  private async processJsError(monitorData: MonitorData): Promise<void> {
    try {
      this.logger.log(`Processing JavaScript error: ${monitorData.errorMessage}`);
      
      // 解析JSON字符串数据
      const extraData = monitorData.extraData ? JSON.parse(monitorData.extraData) : {};
      const deviceInfo = monitorData.deviceInfo ? JSON.parse(monitorData.deviceInfo) : {};
      const networkInfo = monitorData.networkInfo ? JSON.parse(monitorData.networkInfo) : {};
      
      // 创建ErrorLog DTO
      const createErrorLogDto: CreateErrorLogDto = {
        projectId: monitorData.projectId,
        type: ErrorType.JS_ERROR,
        errorMessage: monitorData.errorMessage || 'Unknown JavaScript error',
        errorStack: monitorData.errorStack,
        level: ErrorLevel.HIGH,
        sourceFile: extraData.sourceFile,
        sourceLine: extraData.sourceLine,
        sourceColumn: extraData.sourceColumn,
        pageUrl: monitorData.pageUrl,
        userId: monitorData.userId,
        userAgent: monitorData.userAgent,
        deviceInfo: deviceInfo,
        networkInfo: networkInfo,
        requestUrl: extraData.requestUrl,
        requestMethod: extraData.requestMethod,
        responseStatus: extraData.responseStatus,
        duration: monitorData.duration,
        extraData: extraData
      };
      
      // 保存ErrorLog
      await this.errorLogService.createErrorLog(createErrorLogDto);
      this.logger.log(`Successfully converted MonitorData to ErrorLog for project: ${monitorData.projectId}`);
      
    } catch (error) {
      this.logger.error(`Failed to process JavaScript error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 处理性能数据
   * @param monitorData 监控数据
   */
  private async processPerformanceData(monitorData: MonitorData): Promise<void> {
    try {
      // 这里可以添加性能数据处理逻辑
      // 例如：性能指标分析、阈值告警、数据聚合等
      this.logger.log(`性能数据处理完成: ${monitorData.id}`);
    } catch (error) {
      this.logger.error(`处理性能数据失败: ${error.message}`);
    }
  }

  /**
   * 处理资源加载错误
   * @param monitorData 监控数据
   */
  private async processResourceError(monitorData: MonitorData): Promise<void> {
    try {
      // 这里可以添加资源错误处理逻辑
      // 例如：资源监控、CDN优化建议等
      this.logger.log(`资源错误处理完成: ${monitorData.id}`);
    } catch (error) {
      this.logger.error(`处理资源错误失败: ${error.message}`);
    }
  }
}