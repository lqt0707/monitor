/**
 * 监控数据相关类型定义
 */

// 错误级别常量
export const ErrorLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
} as const;

export type ErrorLevel = typeof ErrorLevel[keyof typeof ErrorLevel];

// 错误日志接口
export interface ErrorLog {
  id: number;
  projectId: string;
  errorMessage: string;
  errorStack?: string;
  errorLevel: ErrorLevel;
  sourceFile?: string;
  sourceLine?: number;
  sourceColumn?: number;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  isResolved?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 错误聚合接口
export interface ErrorAggregation {
  id: number;
  projectId: string;
  errorHash: string;
  errorMessage: string;
  errorLevel: ErrorLevel;
  sourceFile?: string;
  sourceLine?: number;
  sourceColumn?: number;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  aiDiagnosis?: string;
  aiFixSuggestion?: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

// 项目配置接口
export interface ProjectConfig {
  id: string;
  name: string;
  description?: string;
  domain: string;
  isActive: boolean;
  alertEmail?: string;
  alertThreshold: number;
  sourcemapConfig?: SourcemapConfig;
  createdAt: string;
  updatedAt: string;
}

// Sourcemap配置接口
export interface SourcemapConfig {
  id: number;
  projectId: string;
  sourcemapPath: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// 统计数据接口
export interface ErrorStats {
  totalErrors: number;
  todayErrors: number;
  resolvedErrors: number;
  criticalErrors: number;
  errorTrend: Array<{
    date: string;
    count: number;
  }>;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

// 分页参数接口
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 查询参数接口
export interface QueryParams extends PaginationParams {
  projectId?: string;
  errorLevel?: ErrorLevel;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  isResolved?: boolean;
}

// 用户接口
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

// 登录表单接口
export interface LoginForm {
  username: string;
  password: string;
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  user: User;
}