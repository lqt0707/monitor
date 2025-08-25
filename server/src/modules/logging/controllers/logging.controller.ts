import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { LoggingService } from "../services/logging.service";
import { DatabaseLoggerService } from "../services/database-logger.service";
import { LoggingConfigService } from "../services/logging-config.service";
import { LogPerformanceService } from "../services/log-performance.service";
import { QueryLogsDto } from "../dto/query-logs.dto";

/**
 * 日志管理控制器
 */
@ApiTags("日志管理")
@Controller("logging")
export class LoggingController {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly databaseLogger: DatabaseLoggerService,
    private readonly configService: LoggingConfigService,
    private readonly performanceService: LogPerformanceService
  ) {}

  /**
   * 查询日志
   */
  @Get("query")
  @ApiOperation({ summary: "查询日志" })
  @ApiResponse({ status: 200, description: "查询成功" })
  async queryLogs(@Query() queryDto: QueryLogsDto) {
    try {
      const {
        page = 1,
        pageSize = 20,
        level,
        context,
        startDate,
        endDate,
        projectId,
        traceId,
        userId,
      } = queryDto;

      const [logs, total] = await this.databaseLogger.queryLogs({
        page,
        pageSize,
        level,
        context,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        projectId,
        traceId,
        userId,
      });

      const totalPages = Math.ceil(total / pageSize);

      return {
        success: true,
        data: {
          logs,
          pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: "查询日志失败",
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取环境变量配置
   */
  @Get("config/env")
  @ApiOperation({ summary: "获取环境变量配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  getEnvVariables() {
    return {
      success: true,
      data: {
        LOGGING_FILE_ENABLED: process.env.LOGGING_FILE_ENABLED,
        LOGGING_FILE_PATH: process.env.LOGGING_FILE_PATH,
        LOGGING_MAX_FILE_SIZE: process.env.LOGGING_MAX_FILE_SIZE,
        LOGGING_RETENTION_DAYS: process.env.LOGGING_RETENTION_DAYS,
        LOGGING_LEVEL: process.env.LOGGING_LEVEL,
        LOGGING_DATABASE_ENABLED: process.env.LOGGING_DATABASE_ENABLED,
        LOGGING_CONSOLE_ENABLED: process.env.LOGGING_CONSOLE_ENABLED,
        LOGGING_COMPRESSION_FORMAT: process.env.LOGGING_COMPRESSION_FORMAT,
        LOGGING_FILENAME_PATTERN: process.env.LOGGING_FILENAME_PATTERN,
        LOGGING_PERFORMANCE_ENABLED: process.env.LOGGING_PERFORMANCE_ENABLED,
        LOGGING_BATCH_SIZE: process.env.LOGGING_BATCH_SIZE,
        LOGGING_BATCH_TIMEOUT: process.env.LOGGING_BATCH_TIMEOUT,
      },
    };
  }

  /**
   * 获取默认配置
   */
  @Get("config/default")
  @ApiOperation({ summary: "获取默认配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  getDefaultConfig() {
    return {
      success: true,
      data: this.configService.getDefaultConfig(),
    };
  }

  /**
   * 获取支持的日志级别
   */
  @Get("config/levels")
  @ApiOperation({ summary: "获取支持的日志级别" })
  @ApiResponse({ status: 200, description: "获取成功" })
  getSupportedLevels() {
    return {
      success: true,
      data: {
        levels: ["error", "warn", "info", "debug", "verbose"],
        description: {
          error: "错误级别，记录系统错误",
          warn: "警告级别，记录潜在问题",
          info: "信息级别，记录一般信息",
          debug: "调试级别，记录调试信息",
          verbose: "详细级别，记录所有信息",
        },
      },
    };
  }

  /**
   * 获取支持的压缩格式
   */
  @Get("config/compression-formats")
  @ApiOperation({ summary: "获取支持的压缩格式" })
  @ApiResponse({ status: 200, description: "获取成功" })
  getSupportedCompressionFormats() {
    return {
      success: true,
      data: {
        formats: ["gzip", "zip", "none"],
        description: {
          gzip: "GZIP压缩格式",
          zip: "ZIP压缩格式",
          none: "不压缩",
        },
      },
    };
  }

  /**
   * 获取当前配置
   */
  @Get("config/current")
  @ApiOperation({ summary: "获取当前配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  getCurrentConfig() {
    return {
      success: true,
      data: this.configService.getConfig(),
    };
  }

  /**
   * 获取性能指标
   */
  @Get("performance/metrics")
  @ApiOperation({ summary: "获取性能指标" })
  @ApiResponse({ status: 200, description: "获取成功" })
  getPerformanceMetrics() {
    return {
      success: true,
      data: this.performanceService.getMetrics(),
    };
  }

  /**
   * 重置性能指标
   */
  @Post("performance/reset")
  @ApiOperation({ summary: "重置性能指标" })
  @ApiResponse({ status: 200, description: "重置成功" })
  resetPerformanceMetrics() {
    this.performanceService.resetMetrics();
    return {
      success: true,
      message: "性能指标已重置",
    };
  }

  /**
   * 获取健康状态
   */
  @Get("health")
  @ApiOperation({ summary: "获取健康状态" })
  @ApiResponse({ status: 200, description: "获取成功" })
  getHealthStatus() {
    return {
      success: true,
      data: this.loggingService.getHealthStatus(),
    };
  }

  /**
   * 获取日志统计
   */
  @Get("stats")
  @ApiOperation({ summary: "获取日志统计" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStats() {
    try {
      const stats = await this.loggingService.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: "获取统计失败",
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 清理日志
   */
  @Post("cleanup")
  @ApiOperation({ summary: "清理日志" })
  @ApiResponse({ status: 200, description: "清理成功" })
  async cleanup() {
    try {
      const result = await this.loggingService.cleanup();
      return {
        success: true,
        data: result,
        message: "日志清理完成",
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: "清理日志失败",
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 手动记录日志
   */
  @Post("manual")
  @ApiOperation({ summary: "手动记录日志" })
  @ApiResponse({ status: 200, description: "记录成功" })
  async manualLog(
    @Body()
    body: {
      level: string;
      message: string;
      context?: string;
      extra?: Record<string, any>;
      projectId?: string;
      traceId?: string;
      userId?: string;
    }
  ) {
    try {
      const { level, message, context, extra, projectId, traceId, userId } =
        body;

      switch (level) {
        case "error":
          await this.loggingService.error(
            message,
            context,
            extra,
            projectId,
            traceId,
            userId
          );
          break;
        case "warn":
          await this.loggingService.warn(
            message,
            context,
            extra,
            projectId,
            traceId,
            userId
          );
          break;
        case "info":
          await this.loggingService.info(
            message,
            context,
            extra,
            projectId,
            traceId,
            userId
          );
          break;
        case "debug":
          await this.loggingService.debug(
            message,
            context,
            extra,
            projectId,
            traceId,
            userId
          );
          break;
        case "verbose":
          await this.loggingService.verbose(
            message,
            context,
            extra,
            projectId,
            traceId,
            userId
          );
          break;
        default:
          throw new Error(`不支持的日志级别: ${level}`);
      }

      return {
        success: true,
        message: "日志记录成功",
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: "记录日志失败",
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
