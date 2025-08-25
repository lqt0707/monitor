import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Sourcemap文件管理服务
 * 负责Sourcemap文件的定期清理和管理
 */
@Injectable()
export class SourcemapFileManagerService {
  private readonly logger = new Logger(SourcemapFileManagerService.name);

  /**
   * 清理过期的Sourcemap文件
   * @param storagePath 存储路径
   * @param ttlSeconds 文件存活时间（秒）
   * @returns 清理结果
   */
  async cleanupExpiredFiles(storagePath: string, ttlSeconds: number): Promise<{
    totalFiles: number;
    deletedFiles: number;
    freedSpace: number;
  }> {
    let totalFiles = 0;
    let deletedFiles = 0;
    let freedSpace = 0;

    try {
      if (!fs.existsSync(storagePath)) {
        this.logger.warn(`存储路径不存在: ${storagePath}`);
        return { totalFiles, deletedFiles, freedSpace };
      }

      const now = Date.now();
      const cutoffTime = now - (ttlSeconds * 1000);

      // 遍历所有项目目录
      const projectDirs = fs.readdirSync(storagePath);
      
      for (const projectDir of projectDirs) {
        const projectPath = path.join(storagePath, projectDir);
        
        if (fs.statSync(projectPath).isDirectory()) {
          const files = fs.readdirSync(projectPath);
          
          for (const file of files) {
            if (file.endsWith('.map')) {
              totalFiles++;
              const filePath = path.join(projectPath, file);
              const stats = fs.statSync(filePath);
              
              if (stats.mtimeMs < cutoffTime) {
                // 删除过期文件
                const fileSize = stats.size;
                fs.unlinkSync(filePath);
                deletedFiles++;
                freedSpace += fileSize;
                
                this.logger.debug(`删除过期文件: ${filePath}`);
              }
            }
          }

          // 如果项目目录为空，删除空目录
          if (fs.readdirSync(projectPath).length === 0) {
            fs.rmdirSync(projectPath);
            this.logger.debug(`删除空目录: ${projectPath}`);
          }
        }
      }

      this.logger.log(`清理完成: 总共 ${totalFiles} 个文件，删除 ${deletedFiles} 个过期文件，释放 ${this.formatBytes(freedSpace)} 空间`);
      
    } catch (error) {
      this.logger.error(`清理文件失败: ${error.message}`);
    }

    return { totalFiles, deletedFiles, freedSpace };
  }

  /**
   * 获取存储目录使用情况
   * @param storagePath 存储路径
   * @returns 存储使用情况
   */
  async getStorageUsage(storagePath: string): Promise<{
    totalFiles: number;
    totalSize: number;
    projectCount: number;
  }> {
    let totalFiles = 0;
    let totalSize = 0;
    let projectCount = 0;

    try {
      if (!fs.existsSync(storagePath)) {
        return { totalFiles, totalSize, projectCount };
      }

      const projectDirs = fs.readdirSync(storagePath);
      
      for (const projectDir of projectDirs) {
        const projectPath = path.join(storagePath, projectDir);
        
        if (fs.statSync(projectPath).isDirectory()) {
          projectCount++;
          const files = fs.readdirSync(projectPath);
          
          for (const file of files) {
            if (file.endsWith('.map')) {
              totalFiles++;
              const filePath = path.join(projectPath, file);
              const stats = fs.statSync(filePath);
              totalSize += stats.size;
            }
          }
        }
      }
      
    } catch (error) {
      this.logger.error(`获取存储使用情况失败: ${error.message}`);
    }

    return { totalFiles, totalSize, projectCount };
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
   * 检查存储目录是否存在，如果不存在则创建
   * @param storagePath 存储路径
   */
  ensureStorageDirectory(storagePath: string): void {
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
      this.logger.log(`创建存储目录: ${storagePath}`);
    }
  }
}