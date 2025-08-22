/**
 * API 服务模块
 * 提供与后端服务器通信的接口
 */

import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import { message } from "antd";

import type {
  ApiResponse,
  ErrorLog,
  ErrorAggregation,
  ProjectConfig,
  QueryParams,
  LoginForm,
  LoginResponse,
  ErrorStats,
} from "../types/monitor";

// API 基础配置
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * API 客户端类
 * 封装所有与后端的 HTTP 通信
 */
class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        // 记录HTTP错误到控制台
        if (error.response) {
          console.error("HTTP Error:", {
            url: error.config?.url || "unknown",
            method: error.config?.method?.toUpperCase() || "GET",
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          });
        } else if (error.request) {
          // 网络错误
          console.error("Network Error:", {
            message: error.message,
            url: error.config?.url,
            method: error.config?.method,
            type: "network_error",
          });
        } else {
          // 其他错误
          console.error("Request Error:", {
            error,
            url: error.config?.url,
            method: error.config?.method,
            type: "request_error",
          });
        }

        // 原有的错误处理逻辑
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        } else if (error.response?.status >= 500) {
          message.error("服务器错误，请稍后重试");
        } else if (error.message === "Network Error") {
          message.error("网络连接失败，请检查网络");
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 用户认证相关接口
   */
  auth = {
    /**
     * 用户登录
     * @param loginForm 登录表单数据
     * @returns 登录响应
     */
    login: async (loginForm: LoginForm): Promise<LoginResponse> => {
      const response = await this.instance.post<
        ApiResponse<{ access_token: string; user: any }>
      >("/auth/login", loginForm);
      // 将服务器返回的 access_token 映射为前端期望的 token 字段
      return {
        token: response.data.data.access_token,
        user: response.data.data.user,
      };
    },

    /**
     * 用户登出
     */
    logout: async (): Promise<void> => {
      await this.instance.post("/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  };

  /**
   * 错误日志相关接口
   */
  errorLogs = {
    /**
     * 获取错误日志列表
     * @param params 查询参数
     * @returns 错误日志列表和总数
     */
    getList: async (
      params: QueryParams
    ): Promise<{ data: ErrorLog[]; total: number }> => {
      const response = await this.instance.get<
        ApiResponse<{ data: ErrorLog[]; total: number }>
      >("/api/error-logs", {
        params,
      });
      return response.data.data;
    },

    /**
     * 获取错误日志详情
     * @param id 错误日志ID
     * @returns 错误日志详情
     */
    getDetail: async (id: number): Promise<ErrorLog> => {
      const response = await this.instance.get<ApiResponse<ErrorLog>>(
        `/api/error-logs/${id}`
      );
      return response.data.data;
    },
  };

  /**
   * 错误聚合相关接口
   */
  errorAggregations = {
    /**
     * 获取错误聚合列表
     * @param params 查询参数
     * @returns 错误聚合列表和总数
     */
    getList: async (
      params: QueryParams
    ): Promise<{ data: ErrorAggregation[]; total: number }> => {
      const response = await this.instance.get<
        ApiResponse<{ data: ErrorAggregation[]; total: number }>
      >("/api/error-aggregations", {
        params,
      });
      return response.data.data;
    },

    /**
     * 获取错误聚合详情
     * @param id 错误聚合ID
     * @returns 错误聚合详情
     */
    getDetail: async (id: number): Promise<ErrorAggregation> => {
      const response = await this.instance.get<ApiResponse<ErrorAggregation>>(
        `/api/error-aggregations/${id}`
      );
      return response.data.data;
    },

    /**
     * 标记错误为已解决
     * @param id 错误聚合ID
     */
    markResolved: async (id: number): Promise<void> => {
      await this.instance.patch(`/api/error-aggregations/${id}/resolve`);
    },

    /**
     * 重新打开错误
     * @param id 错误聚合ID
     */
    reopen: async (id: number): Promise<void> => {
      await this.instance.patch(`/api/error-aggregations/${id}/reopen`);
    },
  };

  /**
   * 项目配置相关接口
   */
  projects = {
    /**
     * 获取项目列表
     * @returns 项目列表
     */
    getList: async (): Promise<ProjectConfig[]> => {
      const response = await this.instance.get<ApiResponse<ProjectConfig[]>>(
        "/api/project-config"
      );
      return response.data.data;
    },

    /**
     * 获取项目详情
     * @param id 项目ID
     * @returns 项目详情
     */
    getDetail: async (id: string): Promise<ProjectConfig> => {
      const response = await this.instance.get<ApiResponse<ProjectConfig>>(
        `/api/project-config/${id}`
      );
      return response.data.data;
    },

    /**
     * 创建项目
     * @param project 项目数据
     * @returns 创建的项目
     */
    create: async (
      project: Omit<ProjectConfig, "id" | "createdAt" | "updatedAt">
    ): Promise<ProjectConfig> => {
      const response = await this.instance.post<ApiResponse<ProjectConfig>>(
        "/api/project-config",
        project
      );
      return response.data.data;
    },

    /**
     * 更新项目
     * @param id 项目ID
     * @param project 项目数据
     * @returns 更新的项目
     */
    update: async (
      id: string,
      project: Partial<ProjectConfig>
    ): Promise<ProjectConfig> => {
      const response = await this.instance.put<ApiResponse<ProjectConfig>>(
        `/api/project-config/${id}`,
        project
      );
      return response.data.data;
    },

    /**
     * 删除项目
     * @param id 项目ID
     */
    delete: async (id: string): Promise<void> => {
      await this.instance.delete(`/api/project-config/${id}`);
    },
  };

  /**
   * 监控数据相关接口
   */
  monitor = {
    /**
     * 上报监控数据
     * @param data 监控数据
     * @returns 上报结果
     */
    report: async (data: any): Promise<any> => {
      const response = await this.instance.post<ApiResponse<any>>(
        "/api/monitor/report",
        data
      );
      return response.data.data;
    },

    /**
     * 获取监控数据列表
     * @param params 查询参数
     * @returns 监控数据列表
     */
    getData: async (params?: any): Promise<any> => {
      const response = await this.instance.get<ApiResponse<any>>(
        "/api/monitor/data",
        { params }
      );
      return response.data.data;
    },
  };

  /**
   * 统计数据相关接口
   */
  stats = {
    /**
     * 获取错误统计数据
     * @param projectId 项目ID（可选）
     * @returns 统计数据
     */
    getErrorStats: async (projectId?: string): Promise<ErrorStats> => {
      const response = await this.instance.get<ApiResponse<ErrorStats>>(
        "/api/error-logs/stats/summary",
        {
          params: { projectId },
        }
      );
      return response.data.data;
    },

    /**
     * 获取错误趋势数据
     * @param projectId 项目ID（可选）
     * @param days 天数（默认7天）
     * @returns 趋势数据
     */
    getErrorTrends: async (
      projectId?: string,
      days: number = 7
    ): Promise<Array<{ date: string; count: number }>> => {
      const response = await this.instance.get<
        ApiResponse<Array<{ date: string; count: number }>>
      >("/api/error-logs/stats/trend", {
        params: { projectId, days },
      });
      return response.data.data;
    },
  };

  /**
   * 邮件相关接口
   */
  email = {
    /**
     * 测试邮件发送
     * @param email 邮箱地址
     */
    testSend: async (email: string): Promise<void> => {
      await this.instance.post("/api/email/test", { projectId: email });
    },

    /**
     * 测试告警邮件
     * @param projectId 项目ID
     */
    testAlert: async (projectId: string): Promise<void> => {
      await this.instance.post("/api/email/alert/test", { projectId });
    },

    /**
     * 测试摘要邮件
     * @param projectId 项目ID
     */
    testSummary: async (projectId: string): Promise<void> => {
      await this.instance.post("/api/email/summary/test", { projectId });
    },
  };
}

// 导出 API 客户端实例
export const apiClient = new ApiClient();
export default apiClient;
