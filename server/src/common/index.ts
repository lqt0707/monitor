/**
 * Common模块统一导出文件
 * 集中导出所有通用工具、配置、拦截器和接口
 */

// 导出配置相关
// export * from './config';

// 导出拦截器相关
// export * from './interceptors';

// 导出接口相关
// export * from './interfaces';

// 导出工具函数相关
export * from './utils';

// 导出通用类型和常量
/**
 * 分页查询结果接口
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 分页查询参数接口
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 通用响应格式
 */
export interface CommonResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 通用错误响应
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: number;
}

/**
 * 通用成功响应
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// 通用常量
export const COMMON_CONSTANTS = {
  // 分页默认值
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // 排序方向
  SORT_ASC: 'ASC',
  SORT_DESC: 'DESC',
  
  // 状态码
  STATUS_SUCCESS: 200,
  STATUS_CREATED: 201,
  STATUS_BAD_REQUEST: 400,
  STATUS_UNAUTHORIZED: 401,
  STATUS_FORBIDDEN: 403,
  STATUS_NOT_FOUND: 404,
  STATUS_INTERNAL_ERROR: 500,
  
  // 通用消息
  MESSAGES: {
    SUCCESS: '操作成功',
    ERROR: '操作失败',
    NOT_FOUND: '资源不存在',
    UNAUTHORIZED: '未授权访问',
    FORBIDDEN: '禁止访问',
    INVALID_INPUT: '输入参数无效',
    INTERNAL_ERROR: '服务器内部错误'
  }
} as const;

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    message: message || COMMON_CONSTANTS.MESSAGES.SUCCESS
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(error: string, message?: string, code?: number): ErrorResponse {
  return {
    success: false,
    error,
    message: message || COMMON_CONSTANTS.MESSAGES.ERROR,
    code: code || COMMON_CONSTANTS.STATUS_BAD_REQUEST
  };
}

/**
 * 创建分页响应
 */
export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): SuccessResponse<PaginationResult<T>> {
  const totalPages = Math.ceil(total / pageSize);
  
  return createSuccessResponse({
    data,
    total,
    page,
    pageSize,
    totalPages
  }, '查询成功');
}