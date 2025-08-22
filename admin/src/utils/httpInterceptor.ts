/**
 * HTTP 拦截器
 * 自动处理 token 刷新和请求重试
 */

import { tokenRefreshManager } from './tokenRefresh';
import { JWTUtils } from './jwt';
import { message } from 'antd';

/**
 * HTTP 拦截器配置
 */
interface InterceptorConfig {
  baseURL?: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * 请求配置
 */
interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
  skipAuth?: boolean;
  skipRetry?: boolean;
}

/**
 * 响应数据
 */
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

/**
 * HTTP 拦截器类
 */
export class HttpInterceptor {
  private config: InterceptorConfig;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor(config: InterceptorConfig = {}) {
    this.config = {
      baseURL: '/api',
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * 发送请求
   */
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    const requestKey = this.getRequestKey(config);
    
    // 防止重复请求
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }

    const requestPromise = this.executeRequest<T>(config);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * 执行请求
   */
  private async executeRequest<T>(config: RequestConfig, retryCount = 0): Promise<ApiResponse<T>> {
    try {
      // 构建请求配置
      const requestConfig = await this.buildRequestConfig(config);
      
      // 发送请求
      const response = await this.sendRequest(requestConfig);
      
      // 处理响应
      return await this.handleResponse<T>(response, config, retryCount);
    } catch (error: any) {
      return this.handleError<T>(error, config, retryCount);
    }
  }

  /**
   * 构建请求配置
   */
  private async buildRequestConfig(config: RequestConfig): Promise<RequestInit> {
    const { url, method, headers = {}, data, skipAuth } = config;
    
    // 构建完整 URL
    const fullUrl = this.buildUrl(url, config.params);
    
    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // 添加认证头
    if (!skipAuth) {
      const token = JWTUtils.getStoredToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    // 构建请求体
    let body: string | undefined;
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      body = JSON.stringify(data);
    }

    return {
      method,
      headers: requestHeaders,
      body,
      signal: AbortSignal.timeout(this.config.timeout!),
    };
  }

  /**
   * 发送请求
   */
  private async sendRequest(config: RequestInit & { url?: string }): Promise<Response> {
    const url = config.url || '';
    delete config.url;
    
    return fetch(url, config);
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(
    response: Response,
    config: RequestConfig,
    retryCount: number
  ): Promise<ApiResponse<T>> {
    // 处理 401 未授权错误
    if (response.status === 401) {
      return this.handleUnauthorized<T>(config, retryCount);
    }

    // 处理其他 HTTP 错误
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 解析响应数据
    const data = await response.json();
    return data;
  }

  /**
   * 处理未授权错误
   */
  private async handleUnauthorized<T>(
    config: RequestConfig,
    retryCount: number
  ): Promise<ApiResponse<T>> {
    // 如果跳过认证或已经重试过，直接抛出错误
    if (config.skipAuth || retryCount > 0) {
      throw new Error('未授权访问');
    }

    try {
      // 尝试刷新 token
      const newToken = await tokenRefreshManager.forceRefreshToken();
      
      if (newToken) {
        // 刷新成功，重试请求
        return this.executeRequest<T>(config, retryCount + 1);
      } else {
        throw new Error('Token 刷新失败');
      }
    } catch (error) {
      // 刷新失败，抛出未授权错误
      throw new Error('认证失败，请重新登录');
    }
  }

  /**
   * 处理错误
   */
  private async handleError<T>(
    error: any,
    config: RequestConfig,
    retryCount: number
  ): Promise<ApiResponse<T>> {
    console.error('请求错误:', error);

    // 如果是网络错误且允许重试
    if (this.shouldRetry(error, config, retryCount)) {
      await this.delay(this.config.retryDelay!);
      return this.executeRequest<T>(config, retryCount + 1);
    }

    // 显示错误消息
    message.error(error.message || '请求失败');

    // 抛出错误
    throw error;
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: any, config: RequestConfig, retryCount: number): boolean {
    // 如果跳过重试或已达到最大重试次数
    if (config.skipRetry || retryCount >= this.config.retryCount!) {
      return false;
    }

    // 网络错误或超时错误可以重试
    return (
      error.name === 'TypeError' || // 网络错误
      error.name === 'TimeoutError' || // 超时错误
      (error.message && error.message.includes('fetch')) // fetch 相关错误
    );
  }

  /**
   * 构建完整 URL
   */
  private buildUrl(url: string, params?: Record<string, any>): string {
    let fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }
    
    return fullUrl;
  }

  /**
   * 生成请求唯一标识
   */
  private getRequestKey(config: RequestConfig): string {
    const { url, method, data, params } = config;
    return `${method}:${url}:${JSON.stringify(data || {})}:${JSON.stringify(params || {})}`;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      params,
      ...config,
    });
  }

  /**
   * POST 请求
   */
  async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config,
    });
  }

  /**
   * PUT 请求
   */
  async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      ...config,
    });
  }
}

// 创建默认实例
export const httpClient = new HttpInterceptor();

export default httpClient;