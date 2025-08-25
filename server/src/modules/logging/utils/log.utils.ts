import { LoggingService } from "../services/logging.service";

/**
 * 日志工具类
 * 提供便捷的日志操作方法
 */
export class LogUtils {
  /**
   * 创建结构化日志数据
   * @param data 原始数据
   * @param options 选项
   */
  static createStructuredLog(
    data: any,
    options: {
      includeTimestamp?: boolean;
      includeStackTrace?: boolean;
      maxDepth?: number;
    } = {}
  ): Record<string, any> {
    const {
      includeTimestamp = true,
      includeStackTrace = false,
      maxDepth = 3,
    } = options;

    const result: Record<string, any> = {};

    if (includeTimestamp) {
      result.timestamp = new Date().toISOString();
    }

    if (includeStackTrace) {
      result.stackTrace = new Error().stack;
    }

    // 深度限制的对象序列化
    result.data = this.deepClone(data, maxDepth);

    return result;
  }

  /**
   * 深度克隆对象（带深度限制）
   * @param obj 要克隆的对象
   * @param maxDepth 最大深度
   * @param currentDepth 当前深度
   */
  private static deepClone(obj: any, maxDepth: number, currentDepth = 0): any {
    if (currentDepth >= maxDepth) {
      return "[Max Depth Reached]";
    }

    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (obj instanceof Error) {
      return {
        name: obj.name,
        message: obj.message,
        stack: obj.stack,
      };
    }

    if (Array.isArray(obj)) {
      return obj.map((item) =>
        this.deepClone(item, maxDepth, currentDepth + 1)
      );
    }

    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key], maxDepth, currentDepth + 1);
      }
    }

    return cloned;
  }

  /**
   * 格式化错误对象
   * @param error 错误对象
   */
  static formatError(error: any): Record<string, any> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: (error as any).cause,
      };
    }

    return {
      error: String(error),
    };
  }

  /**
   * 创建性能日志
   * @param operation 操作名称
   * @param startTime 开始时间
   * @param endTime 结束时间
   * @param metadata 元数据
   */
  static createPerformanceLog(
    operation: string,
    startTime: number,
    endTime: number,
    metadata: Record<string, any> = {}
  ): Record<string, any> {
    const duration = endTime - startTime;

    return {
      operation,
      duration,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      ...metadata,
    };
  }

  /**
   * 创建用户操作日志
   * @param userId 用户ID
   * @param action 操作
   * @param resource 资源
   * @param metadata 元数据
   */
  static createUserActionLog(
    userId: string,
    action: string,
    resource: string,
    metadata: Record<string, any> = {}
  ): Record<string, any> {
    return {
      userId,
      action,
      resource,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }

  /**
   * 创建API调用日志
   * @param method HTTP方法
   * @param url URL
   * @param statusCode 状态码
   * @param duration 耗时
   * @param metadata 元数据
   */
  static createApiLog(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    metadata: Record<string, any> = {}
  ): Record<string, any> {
    return {
      method,
      url,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }

  /**
   * 创建数据库操作日志
   * @param operation 操作类型
   * @param table 表名
   * @param duration 耗时
   * @param metadata 元数据
   */
  static createDatabaseLog(
    operation: string,
    table: string,
    duration: number,
    metadata: Record<string, any> = {}
  ): Record<string, any> {
    return {
      operation,
      table,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }

  /**
   * 安全地序列化对象（避免循环引用）
   * @param obj 要序列化的对象
   */
  static safeStringify(obj: any): string {
    const seen = new WeakSet();

    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular Reference]";
        }
        seen.add(value);
      }
      return value;
    });
  }

  /**
   * 创建日志装饰器
   * @param loggingService 日志服务
   * @param level 日志级别
   * @param context 上下文
   */
  static createLogDecorator(
    loggingService: LoggingService,
    level: "error" | "warn" | "info" | "debug" | "verbose" = "info",
    context?: string
  ) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const startTime = Date.now();
        const methodContext =
          context || `${target.constructor.name}.${propertyName}`;

        try {
          // 记录方法开始
          await loggingService[level](
            `方法开始: ${methodContext}`,
            methodContext,
            { args: LogUtils.createStructuredLog(args, { maxDepth: 2 }) }
          );

          const result = await method.apply(this, args);
          const duration = Date.now() - startTime;

          // 记录方法成功完成
          await loggingService[level](
            `方法完成: ${methodContext} (${duration}ms)`,
            methodContext,
            {
              duration,
              result: LogUtils.createStructuredLog(result, { maxDepth: 1 }),
            }
          );

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;

          // 记录方法错误
          await loggingService.error(
            `方法错误: ${methodContext} (${duration}ms)`,
            methodContext,
            {
              duration,
              error: LogUtils.formatError(error),
              args: LogUtils.createStructuredLog(args, { maxDepth: 2 }),
            }
          );

          throw error;
        }
      };
    };
  }

  /**
   * 批量处理日志
   * @param loggingService 日志服务
   * @param logs 日志数组
   * @param batchSize 批次大小
   */
  static async batchProcessLogs(
    loggingService: LoggingService,
    logs: Array<{
      level: string;
      message: string;
      context?: string;
      extra?: Record<string, any>;
      projectId?: string;
      traceId?: string;
      userId?: string;
    }>,
    batchSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);
      await loggingService.batchLog(batch);
    }
  }

  /**
   * 创建链路追踪ID
   */
  static generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从请求中提取追踪信息
   * @param request 请求对象
   */
  static extractTraceInfo(request: any): {
    traceId?: string;
    userId?: string;
    projectId?: string;
  } {
    return {
      traceId: request.headers["x-trace-id"] || request.headers["x-request-id"],
      userId: request.user?.id || request.user?.userId,
      projectId: request.headers["x-project-id"] || request.query?.projectId,
    };
  }
}
