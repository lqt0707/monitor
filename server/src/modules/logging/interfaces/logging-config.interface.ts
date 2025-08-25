/**
/**
 * 日志配置接口
 */
export interface LoggingConfig {
  /**
   * 是否启用文件日志
   */
  fileEnabled: boolean;

  /**
   * 文件日志路径
   */
  filePath: string;

  /**
   * 文件日志目录
   */
  fileDir?: string;

  /**
   * 日志文件最大大小（MB）
   */
  maxFileSize: number;

  /**
   * 最大保留文件数
   */
  maxFiles?: string;

  /**
   * 日志文件保留天数
   */
  retentionDays: number;

  /**
   * 日志级别
   * error, warn, info, debug, verbose
   */
  level: string;

  /**
   * 是否启用数据库日志
   */
  databaseEnabled: boolean;

  /**
   * 数据库日志保留天数
   */
  databaseRetentionDays?: number;

  /**
   * 是否启用控制台日志
   */
  consoleEnabled: boolean;

  /**
   * 日志文件压缩格式
   */
  compressionFormat: "gzip" | "zip" | "tar" | "none";

  /**
   * 日志文件命名模式
   */
  filenamePattern: string;

  /**
   * 是否启用性能监控
   */
  performanceEnabled?: boolean;

  /**
   * 性能指标最大样本数
   */
  performanceMaxSamples?: number;

  /**
   * 是否启用HTTP日志
   */
  httpEnabled?: boolean;

  /**
   * 是否记录请求体
   */
  httpIncludeBody?: boolean;

  /**
   * 是否记录响应体
   */
  httpIncludeResponse?: boolean;

  /**
   * HTTP日志跳过的路径模式
   */
  httpSkipPatterns?: string[];

  /**
   * 是否启用结构化日志
   */
  structuredEnabled?: boolean;

  /**
   * 日志格式
   */
  format?: "json" | "simple" | "combined";

  /**
   * 是否启用异步日志
   */
  asyncEnabled?: boolean;

  /**
   * 异步队列大小
   */
  asyncQueueSize?: number;

  /**
   * 批量写入大小
   */
  batchSize?: number;

  /**
   * 批量写入间隔（毫秒）
   */
  batchInterval?: number;

  /**
   * 敏感字段列表
   */
  sensitiveFields?: string[];

  /**
   * 是否启用数据脱敏
   */
  dataMaskingEnabled?: boolean;

  /**
   * 脱敏字符
   */
  maskingChar?: string;

  /**
   * 是否启用调试模式
   */
  debugMode?: boolean;

  /**
   * 是否启用颜色
   */
  colorsEnabled?: boolean;
}
