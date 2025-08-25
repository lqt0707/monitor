import { Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { SourcemapCleanupService } from '../services/sourcemap-cleanup.service';
import { SourcemapFileManagerService } from '../services/sourcemap-file-manager.service';
import { ConfigService } from '@nestjs/config';

/**
 * Sourcemap清理控制器
 * 提供手动触发清理和查看存储使用情况的API接口
 */
@Controller('sourcemap/cleanup')
export class SourcemapCleanupController {
  private readonly logger = new Logger(SourcemapCleanupController.name);

  constructor(
    private readonly cleanupService: SourcemapCleanupService,
    private readonly fileManagerService: SourcemapFileManagerService,
    private readonly configService: ConfigService
  ) {}

  /**
   * 手动触发清理任务
   * @param storagePath 自定义存储路径（可选）
   * @param ttl 自定义存活时间，单位：秒（可选）
   * @returns 清理结果
   */
  @Post('manual')
  async manualCleanup(
    @Query('storagePath') storagePath?: string,
    @Query('ttl') ttl?: number
  ) {
    this.logger.log(`手动触发清理任务: storagePath=${storagePath}, ttl=${ttl}`);
    
    try {
      const result = await this.cleanupService.manualCleanup(storagePath, ttl);
      
      return {
        success: true,
        message: '清理任务执行成功',
        data: {
          totalFiles: result.totalFiles,
          deletedFiles: result.deletedFiles,
          freedSpace: result.freedSpace,
          freedSpaceFormatted: this.formatBytes(result.freedSpace)
        }
      };
    } catch (error) {
      this.logger.error(`手动清理任务失败: ${error.message}`);
      
      return {
        success: false,
        message: `清理任务执行失败: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * 获取存储使用情况
   * @param storagePath 自定义存储路径（可选）
   * @returns 存储使用情况
   */
  @Get('usage')
  async getStorageUsage(@Query('storagePath') storagePath?: string) {
    this.logger.log(`获取存储使用情况: storagePath=${storagePath}`);
    
    try {
      const actualStoragePath = storagePath || 
                               this.configService.get<string>('SOURCEMAP_STORAGE_PATH', '/data/sourcemaps');
      
      const usage = await this.fileManagerService.getStorageUsage(actualStoragePath);
      
      return {
        success: true,
        message: '获取存储使用情况成功',
        data: {
          storagePath: actualStoragePath,
          totalFiles: usage.totalFiles,
          totalSize: usage.totalSize,
          totalSizeFormatted: this.formatBytes(usage.totalSize),
          projectCount: usage.projectCount,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error(`获取存储使用情况失败: ${error.message}`);
      
      return {
        success: false,
        message: `获取存储使用情况失败: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * 获取清理配置信息
   * @returns 清理配置信息
   */
  @Get('config')
  async getCleanupConfig() {
    try {
      const storagePath = this.configService.get<string>('SOURCEMAP_STORAGE_PATH', '/data/sourcemaps');
      const ttlSeconds = this.configService.get<number>('SOURCEMAP_STORAGE_TTL', 2592000);
      
      // 计算TTL的人类可读格式
      const ttlDays = Math.floor(ttlSeconds / 86400);
      const ttlHours = Math.floor((ttlSeconds % 86400) / 3600);
      
      return {
        success: true,
        message: '获取清理配置成功',
        data: {
          storagePath,
          ttlSeconds,
          ttlFormatted: `${ttlDays}天${ttlHours}小时`,
          nextCleanupTime: this.getNextCleanupTime(),
          configSource: '环境变量配置'
        }
      };
    } catch (error) {
      this.logger.error(`获取清理配置失败: ${error.message}`);
      
      return {
        success: false,
        message: `获取清理配置失败: ${error.message}`,
        data: null
      };
    }
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

  /**
   * 计算下一次清理时间
   * @returns 下一次清理时间字符串
   */
  private getNextCleanupTime(): string {
    const now = new Date();
    const nextCleanup = new Date(now);
    
    // 设置为明天凌晨2点
    nextCleanup.setDate(now.getDate() + 1);
    nextCleanup.setHours(2, 0, 0, 0);
    
    return nextCleanup.toISOString();
  }
}