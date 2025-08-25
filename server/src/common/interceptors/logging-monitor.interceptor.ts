import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { LoggingService } from "@/modules/logging/services/logging.service";

/**
 * 请求日志接口
 */
interface RequestLog {
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  referer?: string;
  timestamp: Date;
}

/**
 * 响应日志接口
 */
interface ResponseLog {
  statusCode: number;
  responseTime: number;
  contentLength?: number;
  timestamp: Date;
}

/**
 * 完整请求日志接口
 */
interface FullRequestLog extends RequestLog, ResponseLog {
  success: boolean;
  error?: string;
}

/**
 * 日志监控拦截器
 * 负责记录所有HTTP请求的详细信息，包括性能指标和错误信息
 */
@Injectable()
export class LoggingMonitorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingMonitorInterceptor.name);

  constructor(
    @Inject(LoggingService)
    private readonly loggingService: LoggingService
  ) {}

  /**
   * 拦截HTTP请求并记录日志
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // 记录请求开始
    const requestLog: RequestLog = {
      method: request.method,
      url: request.url,
      ip: this.getClientIp(request),
      userAgent: request.get("User-Agent"),
      referer: request.get("Referer"),
      timestamp: new Date(),
    };

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          const fullLog: FullRequestLog = {
            ...requestLog,
            statusCode: response.statusCode,
            responseTime,
            contentLength: this.getContentLength(data),
            success: true,
            timestamp: new Date(),
          };

          this.logRequest(fullLog);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const fullLog: FullRequestLog = {
            ...requestLog,
            statusCode: response.statusCode || 500,
            responseTime,
            success: false,
            error: error.message,
            timestamp: new Date(),
          };

          this.logRequest(fullLog);
        },
      })
    );
  }

  /**
   * 记录请求日志
   */
  private async logRequest(log: FullRequestLog): Promise<void> {
    try {
      const logLevel = this.getLogLevel(log);
      const message = this.formatLogMessage(log);
      const context = "HTTP_REQUEST";
      const extra = {
        method: log.method,
        url: log.url,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        ip: log.ip,
        userAgent: log.userAgent,
        success: log.success,
        error: log.error,
      };

      switch (logLevel) {
        case "error":
          await this.loggingService.error(message, context, extra);
          break;
        case "warn":
          await this.loggingService.warn(message, context, extra);
          break;
        case "info":
          await this.loggingService.info(message, context, extra);
          break;
        default:
          await this.loggingService.debug(message, context, extra);
      }
    } catch (error) {
      this.logger.error("记录请求日志失败", error);
    }
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (request.headers["x-real-ip"] as string) ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      "unknown"
    );
  }

  /**
   * 获取响应内容长度
   */
  private getContentLength(data: any): number | undefined {
    if (!data) return undefined;

    if (typeof data === "string") {
      return Buffer.byteLength(data, "utf8");
    }

    if (typeof data === "object") {
      return Buffer.byteLength(JSON.stringify(data), "utf8");
    }

    return undefined;
  }

  /**
   * 根据响应状态确定日志级别
   */
  private getLogLevel(log: FullRequestLog): string {
    if (!log.success || log.statusCode >= 500) {
      return "error";
    }

    if (log.statusCode >= 400) {
      return "warn";
    }

    if (log.responseTime > 5000) {
      return "warn";
    }

    if (log.responseTime > 1000) {
      return "info";
    }

    return "debug";
  }

  /**
   * 格式化日志消息
   */
  private formatLogMessage(log: FullRequestLog): string {
    const status = log.success ? "SUCCESS" : "ERROR";
    return `${log.method} ${log.url} - ${log.statusCode} ${status} (${log.responseTime}ms)`;
  }

  /**
   * 检查是否应该记录此请求
   */
  private shouldLogRequest(request: Request): boolean {
    // 跳过健康检查和静态资源
    const skipPaths = ["/health", "/favicon.ico", "/robots.txt"];
    return !skipPaths.some((path) => request.url.startsWith(path));
  }

  /**
   * 获取请求大小
   */
  private getRequestSize(request: Request): number | undefined {
    const contentLength = request.get("Content-Length");
    return contentLength ? parseInt(contentLength, 10) : undefined;
  }

  /**
   * 记录慢请求警告
   */
  private logSlowRequest(log: FullRequestLog): void {
    if (log.responseTime > 3000) {
      this.logger.debug({
        message: "检测到慢请求",
        method: log.method,
        url: log.url,
        responseTime: log.responseTime,
        statusCode: log.statusCode,
      });
    }
  }

  /**
   * 记录异常请求
   */
  private logAbnormalRequest(log: FullRequestLog): void {
    if (log.responseTime > 10000) {
      this.logger.warn({
        message: "检测到异常慢请求",
        method: log.method,
        url: log.url,
        responseTime: log.responseTime,
        statusCode: log.statusCode,
      });
    }
  }

  /**
   * 获取用户信息（如果有认证）
   */
  private getUserInfo(request: Request): any {
    // 这里可以根据实际的认证机制来获取用户信息
    return (request as any).user || null;
  }

  /**
   * 记录安全相关事件
   */
  private logSecurityEvent(request: Request, log: FullRequestLog): void {
    // 记录可疑的请求模式
    if (log.statusCode === 401 || log.statusCode === 403) {
      this.logger.debug({
        message: "安全事件：访问被拒绝",
        method: log.method,
        url: log.url,
        ip: log.ip,
        userAgent: log.userAgent,
        statusCode: log.statusCode,
      });
    }
  }

  /**
   * 记录性能指标
   */
  private logPerformanceMetrics(log: FullRequestLog): void {
    if (log.responseTime > 1000) {
      this.logger.debug({
        message: "性能监控：响应时间较长",
        method: log.method,
        url: log.url,
        responseTime: log.responseTime,
        statusCode: log.statusCode,
      });
    }
  }

  /**
   * 记录错误详情
   */
  private logErrorDetails(request: Request, error: any): void {
    if (error) {
      this.logger.error({
        message: "请求处理错误",
        method: request.method,
        url: request.url,
        error: error.message,
        stack: error.stack,
        ip: this.getClientIp(request),
      });
    }
  }
}
