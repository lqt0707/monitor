import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request, Response } from "express";
import { LoggingService } from "../services/logging.service";

/**
 * HTTP日志拦截器
 * 自动记录HTTP请求和响应日志
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // 生成请求ID用于追踪
    const requestId = this.generateRequestId();
    request.headers["x-request-id"] = requestId;

    // 记录请求开始日志
    this.logRequest(request, requestId);

    return next.handle().pipe(
      tap((data) => {
        // 记录成功响应日志
        this.logResponse(request, response, startTime, requestId, data);
      }),
      catchError((error) => {
        // 记录错误响应日志
        this.logError(request, response, startTime, requestId, error);
        throw error;
      })
    );
  }

  /**
   * 记录请求日志
   */
  private async logRequest(request: Request, requestId: string): Promise<void> {
    const { method, url, headers, body, query, params, ip } = request;

    // 过滤敏感信息
    const filteredHeaders = this.filterSensitiveData(headers);
    const filteredBody = this.filterSensitiveData(body);

    const logData = {
      requestId,
      method,
      url,
      headers: filteredHeaders,
      body: filteredBody,
      query,
      params,
      ip,
      userAgent: headers["user-agent"],
      timestamp: new Date().toISOString(),
    };

    await this.loggingService.info(
      `HTTP请求开始: ${method} ${url}`,
      "HttpLoggingInterceptor",
      logData,
      undefined, // projectId
      requestId, // traceId
      this.extractUserId(request) // userId
    );
  }

  /**
   * 记录响应日志
   */
  private async logResponse(
    request: Request,
    response: Response,
    startTime: number,
    requestId: string,
    responseData: any
  ): Promise<void> {
    const duration = Date.now() - startTime;
    const { method, url } = request;
    const { statusCode } = response;

    const logData = {
      requestId,
      method,
      url,
      statusCode,
      duration,
      responseSize: JSON.stringify(responseData).length,
      timestamp: new Date().toISOString(),
    };

    const level = statusCode >= 400 ? "warn" : "info";
    const message = `HTTP请求完成: ${method} ${url} - ${statusCode} (${duration}ms)`;

    await this.loggingService[level](
      message,
      "HttpLoggingInterceptor",
      logData,
      undefined, // projectId
      requestId, // traceId
      this.extractUserId(request) // userId
    );
  }

  /**
   * 记录错误日志
   */
  private async logError(
    request: Request,
    response: Response,
    startTime: number,
    requestId: string,
    error: any
  ): Promise<void> {
    const duration = Date.now() - startTime;
    const { method, url } = request;
    const statusCode = error.status || 500;

    const logData = {
      requestId,
      method,
      url,
      statusCode,
      duration,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
    };

    await this.loggingService.error(
      `HTTP请求错误: ${method} ${url} - ${statusCode} (${duration}ms)`,
      "HttpLoggingInterceptor",
      logData,
      undefined, // projectId
      requestId, // traceId
      this.extractUserId(request) // userId
    );
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 提取用户ID
   */
  private extractUserId(request: Request): string | undefined {
    // 从JWT token或session中提取用户ID
    const user = (request as any).user;
    return user?.id || user?.userId;
  }

  /**
   * 过滤敏感数据
   */
  private filterSensitiveData(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sensitiveFields = [
      "password",
      "token",
      "authorization",
      "cookie",
      "x-api-key",
      "secret",
      "key",
    ];

    const filtered = { ...data };

    for (const field of sensitiveFields) {
      if (filtered[field]) {
        filtered[field] = "***FILTERED***";
      }
    }

    return filtered;
  }

  /**
   * 检查是否应该记录此请求
   */
  private shouldLogRequest(request: Request): boolean {
    const { url, method } = request;

    // 跳过健康检查和静态资源请求
    const skipPatterns = [
      "/health",
      "/metrics",
      "/favicon.ico",
      "/static/",
      "/assets/",
    ];

    return !skipPatterns.some((pattern) => url.includes(pattern));
  }
}
