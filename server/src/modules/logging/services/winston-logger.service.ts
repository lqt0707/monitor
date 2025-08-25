import { Injectable, Inject } from "@nestjs/common";
import { LoggerService } from "@nestjs/common/services/logger.service";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { FileLoggerService } from "./file-logger.service";
import { DatabaseLoggerService } from "./database-logger.service";
import { LoggingConfig } from "../interfaces/logging-config.interface";

/**
 * Winston日志服务
 * 基于nest-winston的日志服务，提供统一的日志接口
 * 支持文件日志、数据库日志和控制台输出
 */
@Injectable()
export class WinstonLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winstonLogger: Logger,
    @Inject("LOGGING_CONFIG") private readonly config: LoggingConfig,
    private readonly fileLogger: FileLoggerService,
    private readonly databaseLogger: DatabaseLoggerService
  ) {}

  /**
   * 记录错误日志
   * @param message 日志消息
   * @param context 日志上下文
   * @param extra 额外数据
   * @param projectId 项目ID
   * @param traceId 跟踪ID
   * @param userId 用户ID
   */
  async error(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.logAsync(
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
   * @param message 日志消息
   * @param context 日志上下文
   * @param extra 额外数据
   * @param projectId 项目ID
   * @param traceId 跟踪ID
   * @param userId 用户ID
   */
  async warn(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.logAsync(
      "warn",
      message,
      context,
      extra,
      projectId,
      traceId,
      userId
    );
  }

  /**
   * 记录信息日志
   * @param message 日志消息
   * @param context 日志上下文
   * @param extra 额外数据
   * @param projectId 项目ID
   * @param traceId 跟踪ID
   * @param userId 用户ID
   */
  async info(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.logAsync(
      "info",
      message,
      context,
      extra,
      projectId,
      traceId,
      userId
    );
  }

  /**
   * 记录调试日志
   * @param message 日志消息
   * @param context 日志上下文
   * @param extra 额外数据
   * @param projectId 项目ID
   * @param traceId 跟踪ID
   * @param userId 用户ID
   */
  async debug(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.logAsync(
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
   * @param message 日志消息
   * @param context 日志上下文
   * @param extra 额外数据
   * @param projectId 项目ID
   * @param traceId 跟踪ID
   * @param userId 用户ID
   */
  async verbose(
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    await this.logAsync(
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
   * 记录日志（NestJS LoggerService接口）
   * @param message 日志消息
   * @param context 日志上下文
   */
  log(message: any, context?: string): void {
    this.winstonLogger.info(message, { context });
  }

  /**
   * 通用异步日志记录方法
   * @param level 日志级别
   * @param message 日志消息
   * @param context 日志上下文
   * @param extra 额外数据
   * @param projectId 项目ID
   * @param traceId 跟踪ID
   * @param userId 用户ID
   */
  private async logAsync(
    level: string,
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    // 检查日志级别是否启用
    if (!this.isLevelEnabled(level)) {
      return;
    }

    try {
      // 构建日志元数据
      const metadata = {
        context,
        projectId,
        traceId,
        userId,
        timestamp: new Date().toISOString(),
        ...extra,
      };

      // 使用winston记录日志
      this.winstonLogger.log(level, message, metadata);

      // 并行执行文件日志和数据库日志
      await Promise.allSettled([
        this.fileLogger.writeToFile(level, message, context, extra),
        this.databaseLogger.saveToDatabase(
          level,
          message,
          context,
          extra,
          projectId,
          traceId,
          userId
        ),
      ]);
    } catch (error) {
      this.winstonLogger.error(`记录日志失败: ${error.message}`);
    }
  }

  /**
   * 检查日志级别是否启用
   * @param level 日志级别
   */
  private isLevelEnabled(level: string): boolean {
    const levels = ["error", "warn", "info", "debug", "verbose"];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const targetLevelIndex = levels.indexOf(level);

    return targetLevelIndex <= currentLevelIndex;
  }

  /**
   * 批量记录日志
   * @param logs 日志数组
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

      // 使用winston批量记录
      enabledLogs.forEach((log) => {
        const metadata = {
          context: log.context,
          projectId: log.projectId,
          traceId: log.traceId,
          userId: log.userId,
          timestamp: new Date().toISOString(),
          ...log.extra,
        };

        this.winstonLogger.log(log.level, log.message, metadata);
      });

      // 并行执行批量操作
      await Promise.allSettled([
        // 文件日志（逐条写入）
        ...enabledLogs.map((log) =>
          this.fileLogger.writeToFile(
            log.level,
            log.message,
            log.context,
            log.extra
          )
        ),
        // 数据库日志（批量保存）
        this.databaseLogger.batchSaveToDatabase(enabledLogs),
      ]);
    } catch (error) {
      this.winstonLogger.error(`批量记录日志失败: ${error.message}`);
    }
  }

  /**
   * 获取当前日志级别
   */
  getCurrentLevel(): string {
    return this.config.level;
  }

  /**
   * 动态设置日志级别
   * @param level 新的日志级别
   */
  setLevel(level: string): void {
    if (this.isValidLevel(level)) {
      this.winstonLogger.level = level;
    }
  }

  /**
   * 验证日志级别是否有效
   * @param level 日志级别
   */
  private isValidLevel(level: string): boolean {
    const validLevels = ["error", "warn", "info", "debug", "verbose"];
    return validLevels.includes(level);
  }

  /**
   * 获取日志传输器信息
   */
  getTransportsInfo(): Array<{
    name: string;
    level: string;
    enabled: boolean;
  }> {
    return [
      {
        name: "console",
        level: this.config.level,
        enabled: this.config.consoleEnabled,
      },
      {
        name: "file",
        level: this.config.level,
        enabled: this.config.fileEnabled,
      },
      {
        name: "database",
        level: this.config.level,
        enabled: this.config.databaseEnabled,
      },
    ];
  }
}
