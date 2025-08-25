import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FileLoggerService } from './file-logger.service';
import { DatabaseLoggerService } from './database-logger.service';

/**
 * 日志清理服务
 * 负责定时清理过期的日志文件和数据库记录
 */
@Injectable()
export class LogCleanupService {
  private readonly logger = new Logger(LogCleanupService.name);

  constructor(
    private readonly fileLogger: FileLoggerService,
    private readonly databaseLogger: DatabaseLoggerService,
    @Inject('LOGGING_CONFIG') private readonly config: any
  ) {}

  /**
   * 每天凌晨2点执行日志清理任务
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    this.logger.log('开始执行定时日志清理任务');
    
    try {
      await this.cleanup();
      this.logger.log('定时日志清理任务完成');
    } catch (error) {
      this.logger.error(`定时日志清理任务失败: ${error.message}`);
    }
  }

  /**
   * 执行日志清理
   */
  async cleanup(): Promise<{
    fileCleanup: boolean;
    databaseCleanup: number;
  }> {
    this.logger.log('开始清理过期日志');

    try {
      // 清理文件日志
      await this.fileLogger.manualCleanup();
      
      // 清理数据库日志
      const deletedCount = await this.databaseLogger.cleanupOldLogs();
      
      this.logger.log(`日志清理完成: 删除了 ${deletedCount} 条数据库记录`);
      
      return {
        fileCleanup: true,
        databaseCleanup: deletedCount
      };
    } catch (error) {
      this.logger.error(`日志清理失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取清理配置信息
   */
  getCleanupConfig(): {
    retentionDays: number;
    maxFileSize: number;
    nextCleanupTime: Date;
  } {
    const now = new Date();
    const nextCleanup = new Date(now);
    nextCleanup.setDate(nextCleanup.getDate() + 1);
    nextCleanup.setHours(2, 0, 0, 0);

    return {
      retentionDays: this.config.retentionDays,
      maxFileSize: this.config.maxFileSize,
      nextCleanupTime: nextCleanup
    };
  }

  /**
   * 手动触发日志清理
   */
  async manualCleanup(): Promise<{
    success: boolean;
    message: string;
    details: {
      fileCleanup: boolean;
      databaseCleanup: number;
    };
  }> {
    try {
      const result = await this.cleanup();
      
      return {
        success: true,
        message: '手动日志清理完成',
        details: result
      };
    } catch (error) {
      return {
        success: false,
        message: `手动日志清理失败: ${error.message}`,
        details: {
          fileCleanup: false,
          databaseCleanup: 0
        }
      };
    }
  }

  /**
   * 检查日志清理状态
   */
  getCleanupStatus(): {
    enabled: boolean;
    schedule: string;
    lastRun?: Date;
    nextRun: Date;
    config: {
      retentionDays: number;
      maxFileSize: number;
    };
  } {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(2, 0, 0, 0);

    return {
      enabled: true,
      schedule: CronExpression.EVERY_DAY_AT_2AM,
      nextRun,
      config: {
        retentionDays: this.config.retentionDays,
        maxFileSize: this.config.maxFileSize
      }
    };
  }
}