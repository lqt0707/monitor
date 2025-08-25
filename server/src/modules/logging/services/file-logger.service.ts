import { Injectable, Logger, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const appendFileAsync = promisify(fs.appendFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const unlinkAsync = promisify(fs.unlink);
const renameAsync = promisify(fs.rename);
const gzipAsync = promisify(zlib.gzip);

/**
 * 文件日志服务
 * 负责将日志写入文件系统，并提供日志文件管理功能
 */
@Injectable()
export class FileLoggerService {
  private readonly logger = new Logger(FileLoggerService.name);
  private currentFile: string;
  private currentFileSize: number = 0;
  private readonly config: any;

  constructor(@Inject('LOGGING_CONFIG') config: any) {
    this.config = config;
    this.ensureLogDirectory();
    this.currentFile = this.getCurrentLogFile();
    this.initializeCurrentFileSize();
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.config.filePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      this.logger.log(`创建日志目录: ${logDir}`);
    }
  }

  /**
   * 获取当前日志文件路径
   */
  private getCurrentLogFile(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = this.config.filenamePattern
      .replace('{date}', dateStr)
      .replace('{level}', 'combined');
    
    return path.join(path.dirname(this.config.filePath), filename);
  }

  /**
   * 初始化当前文件大小
   */
  private initializeCurrentFileSize(): void {
    try {
      if (fs.existsSync(this.currentFile)) {
        const stats = fs.statSync(this.currentFile);
        this.currentFileSize = stats.size;
      }
    } catch (error) {
      this.logger.error('初始化文件大小失败', error);
      this.currentFileSize = 0;
    }
  }

  /**
   * 写入日志到文件
   */
  async writeToFile(
    level: string,
    message: string,
    context?: string,
    extra?: Record<string, any>
  ): Promise<void> {
    if (!this.config.fileEnabled) {
      return;
    }

    try {
      const logEntry = this.formatLogEntry(level, message, context, extra);
      
      if (this.shouldRotateFile()) {
        await this.rotateLogFile();
      }

      await appendFileAsync(this.currentFile, logEntry + '\n');
      this.currentFileSize += Buffer.byteLength(logEntry + '\n', 'utf8');
    } catch (error) {
      this.logger.error('写入日志文件失败', error);
    }
  }

  /**
   * 格式化日志条目
   */
  private formatLogEntry(
    level: string,
    message: string,
    context?: string,
    extra?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level: level.toUpperCase(),
      message,
      context,
      ...extra
    };
    return JSON.stringify(logObject);
  }

  /**
   * 检查是否需要轮转文件
   */
  private shouldRotateFile(): boolean {
    return this.currentFileSize > this.config.maxFileSize;
  }

  /**
   * 轮转日志文件
   */
  private async rotateLogFile(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = `${this.currentFile}.${timestamp}`;
      
      await renameAsync(this.currentFile, rotatedFile);
      
      // 压缩旧文件
      if (this.config.compressionFormat !== 'none') {
        await this.compressLogFile(rotatedFile);
      }
      
      // 重置当前文件大小
      this.currentFileSize = 0;
      
      // 清理过期日志
      await this.cleanupOldLogs();
    } catch (error) {
      this.logger.error('日志轮转失败', error);
    }
  }

  /**
   * 压缩日志文件
   */
  private async compressLogFile(filePath: string): Promise<void> {
    try {
      if (this.config.compressionFormat === 'gzip') {
        const data = await fs.promises.readFile(filePath);
        const compressed = await gzipAsync(data);
        const compressedPath = `${filePath}.gz`;
        
        await writeFileAsync(compressedPath, compressed);
        await unlinkAsync(filePath);
        
        this.logger.log(`压缩日志文件: ${compressedPath}`);
      }
    } catch (error) {
      this.logger.error('压缩日志文件失败', error);
    }
  }

  /**
   * 清理过期日志
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const logDir = path.dirname(this.config.filePath);
      const files = await readdirAsync(logDir);
      const now = Date.now();
      const retentionTime = this.config.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = await statAsync(filePath);
        
        if (now - stats.mtime.getTime() > retentionTime) {
          await unlinkAsync(filePath);
          this.logger.log(`删除过期日志文件: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error('清理过期日志失败', error);
    }
  }

  /**
   * 获取所有日志文件列表
   */
  async getLogFiles(): Promise<string[]> {
    try {
      const logDir = path.dirname(this.config.filePath);
      const files = await readdirAsync(logDir);
      return files.filter(file => file.endsWith('.log') || file.endsWith('.gz'));
    } catch (error) {
      this.logger.error('获取日志文件列表失败', error);
      return [];
    }
  }

  /**
   * 批量写入日志到文件
   */
  async batchWriteToFile(
    logs: Array<{
      level: string;
      message: string;
      context?: string;
      extra?: Record<string, any>;
    }>
  ): Promise<void> {
    if (!this.config.fileEnabled || logs.length === 0) {
      return;
    }

    try {
      const logEntries = logs.map(log => 
        this.formatLogEntry(log.level, log.message, log.context, log.extra)
      ).join('\n') + '\n';

      if (this.shouldRotateFile()) {
        await this.rotateLogFile();
      }

      await appendFileAsync(this.currentFile, logEntries);
      this.currentFileSize += Buffer.byteLength(logEntries, 'utf8');
    } catch (error) {
      this.logger.error('批量写入日志文件失败', error);
    }
  }

  /**
   * 清理日志文件
   */
  async cleanup(): Promise<boolean> {
    try {
      const logDir = path.dirname(this.config.filePath);
      const files = await readdirAsync(logDir);
      const logFiles = files.filter(file => file.includes('log'));

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let cleanedCount = 0;
      for (const file of logFiles) {
        const filePath = path.join(logDir, file);
        const stats = await statAsync(filePath);
        
        if (stats.mtime < cutoffDate) {
          await unlinkAsync(filePath);
          cleanedCount++;
        }
      }

      this.logger.log(`清理了 ${cleanedCount} 个过期日志文件`);
      return true;
    } catch (error) {
      this.logger.error('清理日志文件失败', error);
      return false;
    }
  }

  /**
   * 手动清理日志
   */
  async manualCleanup(): Promise<void> {
    await this.cleanupOldLogs();
  }
}