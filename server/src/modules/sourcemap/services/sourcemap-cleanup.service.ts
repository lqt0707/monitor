import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SourcemapFileManagerService } from './sourcemap-file-manager.service';

/**
 * Sourcemap清理服务
 * 负责定期执行Sourcemap文件的清理任务
 */
@Injectable()
export class SourcemapCleanupService {
  private readonly logger = new Logger(SourcemapCleanupService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly fileManagerService: SourcemapFileManagerService
  ) {
    // 确保存储目录在服务启动时存在
    const storagePath = this.configService.get<string>('SOURCEMAP_STORAGE_PATH', '/data/sourcemaps');
    this.fileManagerService.ensureStorageDirectory(storagePath);
  }

  /**
   * 每天凌晨2点执行清理任务
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyCleanup() {
    this.logger.log('开始执行每日Sourcemap文件清理任务');
    
    try {
      const storagePath = this.configService.get<string>('SOURCEMAP_STORAGE_PATH', '/data/sourcemaps');
      const ttlSeconds = this.configService.get<number>('SOURCEMAP_STORAGE_TTL', 2592000); // 默认30天
      
      // 确保存储目录存在
      this.fileManagerService.ensureStorageDirectory(storagePath);
      
      // 执行清理
      const result = await this.fileManagerService.cleanupExpiredFiles(storagePath, ttlSeconds);
      
      this.logger.log(`每日清理完成: 删除 ${result.deletedFiles} 个过期文件，释放 ${this.formatBytes(result.freedSpace)} 空间`);
      
    } catch (error) {
      this.logger.error(`每日清理任务执行失败: ${error.message}`);
    }
  }

  /**
   * 每周一凌晨3点执行存储使用情况报告
   */
  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyReport() {
    this.logger.log('开始生成每周Sourcemap存储使用报告');
    
    try {
      const storagePath = this.configService.get<string>('SOURCEMAP_STORAGE_PATH', '/data/sourcemaps');
      
      if (!this.fileManagerService) {
        this.logger.warn('文件管理器服务未初始化');
        return;
      }
      
      const usage = await this.fileManagerService.getStorageUsage(storagePath);
      
      this.logger.log(`存储使用报告: ${usage.totalFiles} 个文件，总共 ${this.formatBytes(usage.totalSize)}，${usage.projectCount} 个项目`);
      
    } catch (error) {
      this.logger.error(`每周报告生成失败: ${error.message}`);
    }
  }

  /**
   * 手动触发清理任务
   * @param storagePath 存储路径
   * @param ttlSeconds 存活时间（秒）
   * @returns 清理结果
   */
  async manualCleanup(storagePath?: string, ttlSeconds?: number): Promise<{
    totalFiles: number;
    deletedFiles: number;
    freedSpace: number;
  }> {
    const actualStoragePath = storagePath || this.configService.get<string>('SOURCEMAP_STORAGE_PATH', '/data/sourcemaps');
    const actualTtlSeconds = ttlSeconds || this.configService.get<number>('SOURCEMAP_STORAGE_TTL', 2592000);
    
    this.logger.log(`手动触发清理任务: 路径=${actualStoragePath}, TTL=${actualTtlSeconds}秒`);
    
    // 确保存储目录存在
    this.fileManagerService.ensureStorageDirectory(actualStoragePath);
    
    return await this.fileManagerService.cleanupExpiredFiles(actualStoragePath, actualTtlSeconds);
  }

  /**
   * 格式化字节数为可读格式
   * @param bytes 字节数
   * @returns 格式化后的字符串
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}