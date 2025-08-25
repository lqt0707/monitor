import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoggingConfig } from "../interfaces/logging-config.interface";

/**
 * 日志配置服务
 * 负责管理日志配置和提供默认值
 */
@Injectable()
export class LoggingConfigService {
  private defaultConfig: LoggingConfig = {
    fileEnabled: true,
    filePath: "./logs/app.log",
    fileDir: "./logs",
    maxFileSize: 20, // MB
    maxFiles: "14d",
    retentionDays: 30,
    level: "info",
    databaseEnabled: true,
    databaseRetentionDays: 90,
    consoleEnabled: true,
    compressionFormat: "gzip",
    filenamePattern: "app-{date}-{level}.log",
    performanceEnabled: true,
    performanceMaxSamples: 1000,
    httpEnabled: true,
    httpIncludeBody: true,
    httpIncludeResponse: false,
    httpSkipPatterns: [
      "/health",
      "/metrics",
      "/favicon.ico",
      "/static/",
      "/assets/",
    ],
    structuredEnabled: true,
    format: "json",
    asyncEnabled: true,
    asyncQueueSize: 1000,
    batchSize: 100,
    batchInterval: 1000,
    sensitiveFields: [
      "password",
      "token",
      "authorization",
      "cookie",
      "x-api-key",
      "secret",
      "key",
    ],
    dataMaskingEnabled: true,
    maskingChar: "*",
    debugMode: false,
    colorsEnabled: true,
  };

  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取日志配置
   */
  getConfig(): LoggingConfig {
    return {
      fileEnabled: this.configService.get<boolean>(
        "LOGGING_FILE_ENABLED",
        this.defaultConfig.fileEnabled
      ),
      filePath: this.configService.get<string>(
        "LOGGING_FILE_PATH",
        this.defaultConfig.filePath
      ),
      fileDir: this.configService.get<string>(
        "LOGGING_FILE_DIR",
        this.defaultConfig.fileDir
      ),
      maxFileSize: this.configService.get<number>(
        "LOGGING_MAX_FILE_SIZE",
        this.defaultConfig.maxFileSize
      ),
      maxFiles: this.configService.get<string>(
        "LOGGING_MAX_FILES",
        this.defaultConfig.maxFiles
      ),
      retentionDays: this.configService.get<number>(
        "LOGGING_RETENTION_DAYS",
        this.defaultConfig.retentionDays
      ),
      level: this.configService.get<string>(
        "LOGGING_LEVEL",
        this.defaultConfig.level
      ),
      databaseEnabled: this.configService.get<boolean>(
        "LOGGING_DATABASE_ENABLED",
        this.defaultConfig.databaseEnabled
      ),
      databaseRetentionDays: this.configService.get<number>(
        "LOGGING_DATABASE_RETENTION_DAYS",
        this.defaultConfig.databaseRetentionDays
      ),
      consoleEnabled: this.configService.get<boolean>(
        "LOGGING_CONSOLE_ENABLED",
        this.defaultConfig.consoleEnabled
      ),
      compressionFormat: this.configService.get<string>(
        "LOGGING_COMPRESSION_FORMAT",
        this.defaultConfig.compressionFormat
      ) as "gzip" | "zip" | "tar" | "none",
      filenamePattern: this.configService.get<string>(
        "LOGGING_FILENAME_PATTERN",
        this.defaultConfig.filenamePattern
      ),
      performanceEnabled: this.configService.get<boolean>(
        "LOGGING_PERFORMANCE_ENABLED",
        this.defaultConfig.performanceEnabled
      ),
      performanceMaxSamples: this.configService.get<number>(
        "LOGGING_PERFORMANCE_MAX_SAMPLES",
        this.defaultConfig.performanceMaxSamples
      ),
      httpEnabled: this.configService.get<boolean>(
        "LOGGING_HTTP_ENABLED",
        this.defaultConfig.httpEnabled
      ),
      httpIncludeBody: this.configService.get<boolean>(
        "LOGGING_HTTP_INCLUDE_BODY",
        this.defaultConfig.httpIncludeBody
      ),
      httpIncludeResponse: this.configService.get<boolean>(
        "LOGGING_HTTP_INCLUDE_RESPONSE",
        this.defaultConfig.httpIncludeResponse
      ),
      httpSkipPatterns: this.parseArrayConfig(
        "LOGGING_HTTP_SKIP_PATTERNS",
        this.defaultConfig.httpSkipPatterns
      ),
      structuredEnabled: this.configService.get<boolean>(
        "LOGGING_STRUCTURED_ENABLED",
        this.defaultConfig.structuredEnabled
      ),
      format: this.configService.get<string>(
        "LOGGING_FORMAT",
        this.defaultConfig.format
      ) as "json" | "simple" | "combined",
      asyncEnabled: this.configService.get<boolean>(
        "LOGGING_ASYNC_ENABLED",
        this.defaultConfig.asyncEnabled
      ),
      asyncQueueSize: this.configService.get<number>(
        "LOGGING_ASYNC_QUEUE_SIZE",
        this.defaultConfig.asyncQueueSize
      ),
      batchSize: this.configService.get<number>(
        "LOGGING_BATCH_SIZE",
        this.defaultConfig.batchSize
      ),
      batchInterval: this.configService.get<number>(
        "LOGGING_BATCH_INTERVAL",
        this.defaultConfig.batchInterval
      ),
      sensitiveFields: this.parseArrayConfig(
        "LOGGING_SENSITIVE_FIELDS",
        this.defaultConfig.sensitiveFields
      ),
      dataMaskingEnabled: this.configService.get<boolean>(
        "LOGGING_DATA_MASKING_ENABLED",
        this.defaultConfig.dataMaskingEnabled
      ),
      maskingChar: this.configService.get<string>(
        "LOGGING_MASKING_CHAR",
        this.defaultConfig.maskingChar
      ),
      debugMode: this.configService.get<boolean>(
        "LOGGING_DEBUG_MODE",
        this.defaultConfig.debugMode
      ),
      colorsEnabled: this.configService.get<boolean>(
        "LOGGING_COLORS_ENABLED",
        this.defaultConfig.colorsEnabled
      ),
    };
  }

  /**
   * 解析数组配置
   * @param key 配置键
   * @param defaultValue 默认值
   */
  private parseArrayConfig(
    key: string,
    defaultValue?: string[]
  ): string[] | undefined {
    const value = this.configService.get<string>(key);
    if (value) {
      return value.split(",").map((item) => item.trim());
    }
    return defaultValue;
  }

  /**
   * 获取环境变量说明
   */
  getEnvVariablesDescription(): Record<string, string> {
    return {
      LOGGING_FILE_ENABLED: "是否启用文件日志 (true/false)",
      LOGGING_FILE_PATH: "文件日志路径",
      LOGGING_FILE_DIR: "文件日志目录",
      LOGGING_MAX_FILE_SIZE: "日志文件最大大小 (MB)",
      LOGGING_MAX_FILES: "最大保留文件数 (例如: 14d 表示14天)",
      LOGGING_RETENTION_DAYS: "日志文件保留天数",
      LOGGING_LEVEL: "日志级别 (error/warn/info/debug/verbose)",
      LOGGING_DATABASE_ENABLED: "是否启用数据库日志 (true/false)",
      LOGGING_DATABASE_RETENTION_DAYS: "数据库日志保留天数",
      LOGGING_CONSOLE_ENABLED: "是否启用控制台日志 (true/false)",
      LOGGING_COMPRESSION_FORMAT: "日志文件压缩格式 (gzip/zip/tar/none)",
      LOGGING_FILENAME_PATTERN:
        "日志文件命名模式 (支持 {date} 和 {level} 占位符)",
      LOGGING_PERFORMANCE_ENABLED: "是否启用性能监控 (true/false)",
      LOGGING_PERFORMANCE_MAX_SAMPLES: "性能指标最大样本数",
      LOGGING_HTTP_ENABLED: "是否启用HTTP请求日志 (true/false)",
      LOGGING_HTTP_INCLUDE_BODY: "是否记录请求体 (true/false)",
      LOGGING_HTTP_INCLUDE_RESPONSE: "是否记录响应体 (true/false)",
      LOGGING_HTTP_SKIP_PATTERNS: "HTTP日志跳过的路径模式 (逗号分隔)",
      LOGGING_STRUCTURED_ENABLED: "是否启用结构化日志 (true/false)",
      LOGGING_FORMAT: "日志格式 (json/simple/combined)",
      LOGGING_ASYNC_ENABLED: "是否启用异步日志 (true/false)",
      LOGGING_ASYNC_QUEUE_SIZE: "异步队列大小",
      LOGGING_BATCH_SIZE: "批量写入大小",
      LOGGING_BATCH_INTERVAL: "批量写入间隔 (毫秒)",
      LOGGING_SENSITIVE_FIELDS: "敏感字段列表 (逗号分隔)",
      LOGGING_DATA_MASKING_ENABLED: "是否启用数据脱敏 (true/false)",
      LOGGING_MASKING_CHAR: "脱敏字符",
      LOGGING_DEBUG_MODE: "是否启用调试模式 (true/false)",
      LOGGING_COLORS_ENABLED: "是否启用颜色 (true/false)",
    };
  }

  /**
   * 验证日志级别
   * @param level 日志级别
   */
  isValidLogLevel(level: string): boolean {
    const validLevels = ["error", "warn", "info", "debug", "verbose"];
    return validLevels.includes(level);
  }

  /**
   * 验证压缩格式
   * @param format 压缩格式
   */
  isValidCompressionFormat(format: string): boolean {
    const validFormats = ["gzip", "zip", "tar", "none"];
    return validFormats.includes(format);
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(): LoggingConfig {
    return { ...this.defaultConfig };
  }

  /**
   * 获取支持的日志级别
   */
  getSupportedLevels(): string[] {
    return ["error", "warn", "info", "debug", "verbose"];
  }

  /**
   * 获取支持的压缩格式
   */
  getSupportedCompressionFormats(): string[] {
    return ["gzip", "zip", "tar", "none"];
  }

  /**
   * 获取支持的日志格式
   */
  getSupportedFormats(): string[] {
    return ["json", "simple", "combined"];
  }

  /**
   * 验证配置
   * @param config 配置对象
   */
  validateConfig(config: Partial<LoggingConfig>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (config.level && !this.isValidLogLevel(config.level)) {
      errors.push(`无效的日志级别: ${config.level}`);
    }

    if (
      config.compressionFormat &&
      !this.isValidCompressionFormat(config.compressionFormat)
    ) {
      errors.push(`无效的压缩格式: ${config.compressionFormat}`);
    }

    if (
      config.maxFileSize &&
      (config.maxFileSize <= 0 || config.maxFileSize > 1000)
    ) {
      errors.push("文件大小必须在 1-1000 MB 之间");
    }

    if (
      config.retentionDays &&
      (config.retentionDays <= 0 || config.retentionDays > 365)
    ) {
      errors.push("保留天数必须在 1-365 天之间");
    }

    if (
      config.performanceMaxSamples &&
      (config.performanceMaxSamples <= 0 ||
        config.performanceMaxSamples > 10000)
    ) {
      errors.push("性能样本数必须在 1-10000 之间");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
