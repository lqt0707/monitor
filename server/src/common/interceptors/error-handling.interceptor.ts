import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
}

/**
 * 全局错误处理拦截器
 */
@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      catchError((error) => {
        const errorResponse = this.handleError(error, request);
        
        // 记录错误日志
        this.logError(error, request, errorResponse);
        
        // 设置响应状态码
        response.status(errorResponse.statusCode);
        
        return throwError(() => new HttpException(errorResponse, errorResponse.statusCode));
      }),
    );
  }

  /**
   * 处理错误
   * @param error 错误对象
   * @param request 请求对象
   * @returns 错误响应
   */
  private handleError(error: any, request: any): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // 处理HTTP异常
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const errorResponse = error.getResponse() as any;
      
      return {
        success: false,
        message: typeof errorResponse === 'string' ? errorResponse : errorResponse.message,
        error: typeof errorResponse === 'object' ? errorResponse.error : undefined,
        statusCode: status,
        timestamp,
        path,
        details: typeof errorResponse === 'object' ? errorResponse : undefined,
      };
    }

    // 处理数据库错误
    if (error.code) {
      return this.handleDatabaseError(error, timestamp, path);
    }

    // 处理验证错误
    if (error.name === 'ValidationError') {
      return {
        success: false,
        message: '数据验证失败',
        error: error.message,
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
        details: error.details,
      };
    }

    // 处理未知错误
    return {
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '未知错误',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
    };
  }

  /**
   * 处理数据库错误
   * @param error 数据库错误
   * @param timestamp 时间戳
   * @param path 请求路径
   * @returns 错误响应
   */
  private handleDatabaseError(error: any, timestamp: string, path: string): ErrorResponse {
    let message = '数据操作失败';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (error.code) {
      case 'ER_DUP_ENTRY':
        message = '数据已存在';
        statusCode = HttpStatus.CONFLICT;
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        message = '关联数据不存在';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      case 'ER_ROW_IS_REFERENCED_2':
        message = '数据被引用，无法删除';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      case 'ER_DATA_TOO_LONG':
        message = '数据长度超出限制';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      case 'ER_BAD_NULL_ERROR':
        message = '必填字段不能为空';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      case 'ECONNREFUSED':
        message = '数据库连接失败';
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        message = '数据库访问被拒绝';
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        break;
      default:
        message = process.env.NODE_ENV === 'development' 
          ? `数据库错误: ${error.message}` 
          : '数据操作失败';
    }

    return {
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.sqlMessage || error.message : undefined,
      statusCode,
      timestamp,
      path,
    };
  }

  /**
   * 记录错误日志
   * @param error 错误对象
   * @param request 请求对象
   * @param errorResponse 错误响应
   */
  private logError(error: any, request: any, errorResponse: ErrorResponse): void {
    const logData = {
      method: request.method,
      url: request.url,
      statusCode: errorResponse.statusCode,
      message: errorResponse.message,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      body: request.body,
      query: request.query,
      params: request.params,
    };

    // 根据错误级别选择日志级别
    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `服务器错误: ${errorResponse.message}`,
        {
          error: error.stack,
          request: logData,
        },
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(
        `客户端错误: ${errorResponse.message}`,
        logData,
      );
    }

    // 特殊错误的额外处理
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      this.logger.error(
        `关键系统错误: ${error.message}`,
        {
          error: error.stack,
          code: error.code,
        },
      );
    }
  }
}