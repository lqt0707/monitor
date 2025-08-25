import { Injectable, Inject, Logger } from "@nestjs/common";
import { LoggingConfig } from "../interfaces/logging-config.interface";
import { FileLoggerService } from "./file-logger.service";
import { DatabaseLoggerService } from "./database-logger.service";
import { LogPerformanceService } from "./log-performance.service";

/**
 * 主日志服务
 * 统一管理所有日志操作
 */
@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  constructor(
    @Inject("LOGGING_CONFIG")
    private readonly config: LoggingConfig,
    private readonly fileLogger: FileLoggerService,
    private readonly databaseLogger: DatabaseLoggerService,
    private readonly performanceService: LogPerformanceService
  ) {}

  /**
   * 记录错误日志
   */
  async error(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.log(
      "error",
      message,
      context,
      extra,
      projectId,
      traceId,
      userId
    );
  }

  /**
   * 记录警告日志
   */
  async warn(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.log("warn", message, context, extra, projectId, traceId, userId);
  }

  /**
   * 记录信息日志
   */
  async info(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.log("info", message, context, extra, projectId, traceId, userId);
  }

  /**
   * 记录调试日志
   */
  async debug(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.log(
      "debug",
      message,
      context,
      extra,
      projectId,
      traceId,
      userId
    );
  }

  /**
   * 记录详细日志
   */
  async verbose(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.log(
      "verbose",
      message,
      context,
      extra,
      projectId,
      traceId,
      userId
    );
  }

  /**
   * 核心日志记录方法
   */
  private async log(
    level: string,
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    const startTime = Date.now();
    let success = false;

    try {
      // 检查日志级别是否启用
      if (!this.isLevelEnabled(level)) {
        return;
      }

      // 并行写入文件和数据库
      const promises = [];

      if (this.config.fileEnabled) {
        promises.push(
          this.fileLogger.writeToFile(level, message, context, extra)
        );
      }

      if (this.config.databaseEnabled) {
        promises.push(
          this.databaseLogger.saveToDatabase(
            level,
            message,
            context,
            extra,
            projectId,
            traceId,
            userId
          )
        );
      }

      await Promise.all(promises);

      // 控制台输出
      if (this.config.consoleEnabled) {
        this.consoleLog(level, message, context, extra);
      }

      success = true;
    } catch (error) {
      this.logger.error(`记录日志失败: ${error.message}`);
    } finally {
      const writeTime = Date.now() - startTime;
      this.performanceService.recordLogWrite(level, writeTime, success);
    }
  }

  /**
   * 检查日志级别是否启用
   */
  private isLevelEnabled(level: string): boolean {
    const levels = ["error", "warn", "info", "debug", "verbose"];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex <= currentLevelIndex;
  }

  /**
   * 控制台日志输出
   */
  private consoleLog(
    level: string,
    message: string,
    context?: string,
    extra?: Record<string, any>
  ): void {
    const timestamp = new Date().toISOString();
    const contextPart = context ? ` [${context}]` : "";
    const extraPart = extra ? ` ${JSON.stringify(extra)}` : "";

    const logMessage = `[${timestamp}]${contextPart} ${level.toUpperCase()}: ${message}${extraPart}`;

    switch (level) {
      case "error":
        console.error(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "info":
        console.info(logMessage);
        break;
      case "debug":
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * 批量记录日志
   */
  async batchLog(
    logs: Array<{
      level: string;
      message: string;
      context?: string;
      extra?: Record<string, any>;
      projectId?: string;
      traceId?: string;
      userId?: string;
    }>
  ): Promise<void> {
    if (logs.length === 0) {
      return;
    }

    try {
      // 过滤启用的日志级别
      const enabledLogs = logs.filter((log) => this.isLevelEnabled(log.level));

      if (enabledLogs.length === 0) {
        return;
      }

      // 批量写入文件和数据库
      const promises = [];

      if (this.config.fileEnabled) {
        promises.push(this.fileLogger.batchWriteToFile(enabledLogs));
      }

      if (this.config.databaseEnabled) {
        promises.push(this.databaseLogger.batchSaveToDatabase(enabledLogs));
      }

      await Promise.all(promises);

      // 控制台输出
      if (this.config.consoleEnabled) {
        enabledLogs.forEach((log) => {
          this.consoleLog(log.level, log.message, log.context, log.extra);
        });
      }
    } catch (error) {
      this.logger.error(`批量记录日志失败: ${error.message}`);
    }
  }

  /**
   * 清理日志
   */
  async cleanup(): Promise<{
    fileCleanup: boolean;
    databaseCleanup: number;
  }> {
    try {
      const [fileCleanup, databaseCleanup] = await Promise.all([
        this.fileLogger.cleanup(),
        this.databaseLogger.cleanupOldLogs(),
      ]);

      return {
        fileCleanup,
        databaseCleanup,
      };
    } catch (error) {
      this.logger.error(`清理日志失败: ${error.message}`);
      return {
        fileCleanup: false,
        databaseCleanup: 0,
      };
    }
  }

  /**
   * 获取日志统计
   */
  async getStats(): Promise<{
    fileStats: string[];
    databaseStats: {
      total: number;
      byLevel: Record<string, number>;
      byContext: Record<string, number>;
    };
    performanceStats: any;
  }> {
    try {
      const [fileStats, databaseStats, performanceStats] = await Promise.all([
        this.fileLogger.getLogFiles(),
        this.databaseLogger.getLogStats(),
        this.performanceService.getMetrics(),
      ]);

      return {
        fileStats,
        databaseStats,
        performanceStats,
      };
    } catch (error) {
      this.logger.error(`获取日志统计失败: ${error.message}`);
      return {
        fileStats: [],
        databaseStats: { total: 0, byLevel: {}, byContext: {} },
        performanceStats: {},
      };
    }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return this.performanceService.getMetrics();
  }

  /**
   * 重置性能指标
   */
  resetPerformanceMetrics(): void {
    this.performanceService.resetMetrics();
  }

  /**
   * 获取健康状态
   */
  getHealthStatus() {
    return {
      fileLogger: this.config.fileEnabled,
      databaseLogger: this.config.databaseEnabled,
      consoleLogger: this.config.consoleEnabled,
      performance: this.config.performanceEnabled,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }
}
