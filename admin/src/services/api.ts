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

import type {
  UploadSourceCodeRequest,
  UploadSourceCodeResponse,
  BatchUploadSourceCodeRequest,
  BatchUploadSourceCodeResponse,
  UploadSourceCodeArchiveRequest,
  UploadSourceCodeArchiveResponse,
} from "../types/source-code";

import type {
  UploadSourcemapRequest,
  UploadSourcemapResponse,
  UploadSourcemapArchiveRequest,
  UploadSourcemapArchiveResponse,
  BatchUploadSourcemapRequest,
  BatchUploadSourcemapResponse,
} from "../types/sourcemap";

import type { AiDiagnosisResult, DiagnosisTaskStatus } from "../types/monitor";

import type {
  UploadSourceCodeAndSourcemapResponse,
  SourceCodeSourcemapAssociation,
  LocateSourceCodeRequest,
  SourceCodeLocationResult,
  PrepareAIContextRequest,
  AIContextResult,
} from "../types/sourceCodeSourcemapIntegration";

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
      >("/api/auth/login", loginForm);
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
      await this.instance.post("/api/auth/logout");
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
      const response = await this.instance.get<ApiResponse<ErrorLog[]>>(
        "/api/error-logs",
        {
          params,
        }
      );
      return {
        data: response.data.data,
        total: response.data.total || 0,
      };
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
      const response = await this.instance.get<ApiResponse<ErrorAggregation[]>>(
        "/api/error-aggregations",
        {
          params,
        }
      );
      return {
        data: response.data.data,
        total: response.data.total || 0,
      };
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

    /**
     * 重新分析错误（AI诊断）
     * @param id 错误聚合ID
     */
    reanalyze: async (id: number): Promise<void> => {
      await this.instance.post(`/api/error-aggregations/${id}/reanalyze`);
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

  /**
   * 源代码上传和分析相关接口
   */
  sourceCode = {
    /**
     * 上传单个源代码文件
     * @param data 上传请求数据
     * @returns 上传和分析结果
     */
    upload: async (
      data: UploadSourceCodeRequest
    ): Promise<UploadSourceCodeResponse> => {
      const response = await this.instance.post<
        ApiResponse<UploadSourceCodeResponse>
      >("/api/source-code/upload", data);
      return response.data.data;
    },

    /**
     * 批量上传源代码文件
     * @param data 批量上传请求数据
     * @returns 批量上传结果
     */
    batchUpload: async (
      data: BatchUploadSourceCodeRequest
    ): Promise<BatchUploadSourceCodeResponse> => {
      const response = await this.instance.post<
        ApiResponse<BatchUploadSourceCodeResponse>
      >("/api/source-code/batch-upload", data);
      return response.data.data;
    },

    /**
     * 上传源代码压缩包
     * @param data 压缩包上传数据
     * @returns 解压和处理结果
     */
    uploadArchive: async (
      data: UploadSourceCodeArchiveRequest
    ): Promise<UploadSourceCodeArchiveResponse> => {
      const response = await this.instance.post<
        ApiResponse<UploadSourceCodeArchiveResponse>
      >("/api/source-code/upload-archive", data);
      return response.data.data;
    },
  };

  /**
   * Sourcemap上传相关接口
   */
  sourcemapUpload = {
    /**
     * 上传单个Sourcemap文件
     * @param data Sourcemap上传数据
     * @returns 上传结果
     */
    upload: async (
      data: UploadSourcemapRequest
    ): Promise<UploadSourcemapResponse> => {
      const response = await this.instance.post<
        ApiResponse<UploadSourcemapResponse>
      >("/api/sourcemap-upload/upload", data);
      return response.data.data;
    },

    /**
     * 上传Sourcemap压缩包
     * @param data 压缩包上传数据
     * @returns 解压和处理结果
     */
    uploadArchive: async (
      data: UploadSourcemapArchiveRequest
    ): Promise<UploadSourcemapArchiveResponse> => {
      const response = await this.instance.post<
        ApiResponse<UploadSourcemapArchiveResponse>
      >("/api/sourcemap-upload/upload-archive", data);
      return response.data.data;
    },

    /**
     * 批量上传Sourcemap文件
     * @param data 多个Sourcemap上传数据
     * @returns 批量处理结果
     */
    batchUpload: async (
      data: BatchUploadSourcemapRequest
    ): Promise<BatchUploadSourcemapResponse> => {
      const response = await this.instance.post<
        ApiResponse<BatchUploadSourcemapResponse>
      >("/api/sourcemap-upload/batch-upload", data);
      return response.data.data;
    },
  };

  /**
   * 源代码与Sourcemap集成相关接口
   */
  sourceCodeSourcemapIntegration = {
    /**
     * 上传源代码和sourcemap压缩包
     * @param data 上传数据
     * @returns 上传结果
     */
    uploadSourceCodeAndSourcemap: async (
      data: FormData
    ): Promise<UploadSourceCodeAndSourcemapResponse> => {
      const response = await this.instance.post<
        ApiResponse<UploadSourceCodeAndSourcemapResponse>
      >("/api/source-code-sourcemap-integration/upload", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data;
    },

    /**
     * 获取源代码与sourcemap关联信息
     * @param projectId 项目ID
     * @returns 关联信息对象
     */
    getAssociation: async (
      projectId: string
    ): Promise<{
      success: boolean;
      sourceCodeVersion:
        | {
            id: number;
            projectId: string;
            version: string;
            sourcemapVersion?: string;
            isActive: boolean;
            createdAt: string;
            updatedAt: string;
          }
        | undefined;
      sourcemapFiles: any[];
      message?: string;
    }> => {
      const response = await this.instance.get(
        `/api/source-code-sourcemap-integration/association/${projectId}`
      );
      // 兼容后端既可能返回 ApiResponse 包装，也可能直接返回原始对象
      const maybeWrapped: any = response.data as any;
      const data =
        typeof maybeWrapped === "object" && "data" in maybeWrapped
          ? maybeWrapped.data
          : maybeWrapped;
      return data;
    },

    /**
     * 根据错误信息定位源代码
     * @param data 定位请求数据
     * @returns 定位结果
     */
    locateSourceCodeByError: async (
      data: LocateSourceCodeRequest
    ): Promise<SourceCodeLocationResult> => {
      const response = await this.instance.post<
        ApiResponse<SourceCodeLocationResult>
      >("/api/source-code-sourcemap-integration/locate", data);
      return response.data.data;
    },

    /**
     * 准备AI诊断上下文
     *极速模式
     * @param data 上下文请求数据
     * @returns 上下文结果
     */
    prepareAIContext: async (
      data: PrepareAIContextRequest
    ): Promise<AIContextResult> => {
      const response = await this.instance.post<ApiResponse<AIContextResult>>(
        "/api/source-code-sourcemap-integration/prepare-ai-context",
        data
      );
      return response.data.data;
    },

    /**
     * 设置活跃关联
     * @param projectId 项目ID
     * @param associationId 关联ID
     * @returns 设置结果
     */
    setActiveAssociation: async (
      projectId: string,
      associationId: string
    ): Promise<{ success: boolean; message: string }> => {
      const response = await this.instance.post<
        ApiResponse<{ success: boolean; message: string }>
      >(
        `/api/source-code-sourcemap-integration/set-active/${projectId}/${associationId}`
      );
      return response.data.data;
    },

    /**
     * 删除关联
     * @param projectId 项目ID
     * @param associationId 关联ID
     * @returns 删除结果
     */
    deleteAssociation: async (
      projectId: string,
      associationId: string
    ): Promise<{ success: boolean; message: string }> => {
      const response = await this.instance.delete<
        ApiResponse<{ success: boolean; message: string }>
      >(
        `/api/source-code-sourcemap-integration/association/${projectId}/${associationId}`
      );
      return response.data.data;
    },

    /**
     * 获取sourcemap文件列表
     * @param projectId 项目ID
     * @param version 版本号（可选）
     * @returns 文件列表
     */
    getSourcemapFiles: async (
      projectId: string,
      version?: string
    ): Promise<string[]> => {
      const params: any = { projectId };
      if (version) {
        params.version = version;
      }

      const response = await axios.get<ApiResponse<string[]>>(
        `${API_BASE_URL}/api/source-code-sourcemap-integration/sourcemap-files`,
        { params }
      );
      return response.data.data;
    },
  };

  /**
   * AI诊断相关接口
   */
  aiDiagnosis = {
    /**
     * 获取错误诊断结果
     * @param errorId 错误ID
     * @returns 诊断结果
     */
    getErrorDiagnosis: async (errorId: number): Promise<AiDiagnosisResult> => {
      try {
        console.log("获取错误诊断结果，错误ID:", errorId);

        const response = await axios.get<AiDiagnosisResult>(
          `${API_BASE_URL}/api/ai-diagnosis/error/${errorId}`
        );

        console.log("获取诊断结果响应:", response);
        console.log("响应数据:", response.data);

        // 后端直接返回数据，不是ApiResponse格式
        if (!response.data) {
          throw new Error("获取诊断结果失败：响应数据为空");
        }

        return response.data;
      } catch (error) {
        console.error("获取错误诊断结果失败:", error);
        throw error;
      }
    },

    /**
     * 触发错误诊断分析
     * @param errorId 错误ID
     * @returns 诊断任务ID
     */
    triggerDiagnosis: async (errorId: number): Promise<{ taskId: string }> => {
      try {
        console.log("API客户端调用开始，错误ID:", errorId);
        console.log("请求URL:", `/api/ai-diagnosis/error/${errorId}/analyze`);

        const response = await axios.post<ApiResponse<{ taskId: string }>>(
          `${API_BASE_URL}/api/ai-diagnosis/error/${errorId}/analyze`
        );

        console.log("API客户端原始响应:", response);
        console.log("响应状态:", response.status);
        console.log("响应数据:", response.data);

        if (!response.data) {
          throw new Error("API响应数据为空");
        }

        if (!response.data.data) {
          throw new Error(`API响应格式错误: ${JSON.stringify(response.data)}`);
        }

        const result = response.data.data;
        console.log("API客户端返回结果:", result);

        return result;
      } catch (error) {
        console.error("API客户端调用失败:", error);
        throw error;
      }
    },

    /**
     * 获取诊断任务状态
     * @param taskId 任务ID
     * @returns 任务状态
     */
    getDiagnosisStatus: async (
      taskId: string
    ): Promise<DiagnosisTaskStatus> => {
      try {
        console.log("获取诊断任务状态，任务ID:", taskId);

        const response = await axios.get<DiagnosisTaskStatus>(
          `${API_BASE_URL}/api/ai-diagnosis/task/${taskId}`
        );

        console.log("获取诊断状态响应:", response);
        console.log("响应数据:", response.data);

        // 后端直接返回数据，不是ApiResponse格式
        if (!response.data) {
          throw new Error("获取诊断状态失败：响应数据为空");
        }

        return response.data;
      } catch (error) {
        console.error("获取诊断任务状态失败:", error);
        throw error;
      }
    },

    /**
     * 获取错误聚合诊断结果
     * @param aggregationId 聚合ID
     * @returns 诊断结果
     */
    getAggregationDiagnosis: async (
      aggregationId: number
    ): Promise<AiDiagnosisResult> => {
      try {
        console.log("获取错误聚合诊断结果，聚合ID:", aggregationId);

        const response = await axios.get<AiDiagnosisResult>(
          `${API_BASE_URL}/api/ai-diagnosis/aggregation/${aggregationId}`
        );

        console.log("获取聚合诊断响应:", response);
        console.log("响应数据:", response.data);

        // 后端直接返回数据，不是ApiResponse格式
        if (!response.data) {
          throw new Error("获取聚合诊断结果失败：响应数据为空");
        }

        return response.data;
      } catch (error) {
        console.error("获取错误聚合诊断结果失败:", error);
        throw error;
      }
    },
  };
}

// 导出 API 客户端实例
export const apiClient = new ApiClient();

// 导出便捷函数以保持向后兼容
export const fetchErrorDetail = apiClient.errorLogs.getDetail;
export const fetchErrorSourceCode = async (errorId: string | number) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/error-location/error/${errorId}/source-code`
    );
    return response.data;
  } catch (error) {
    console.error("获取源代码失败:", error);
    throw error;
  }
};

// 导出通用请求函数 - 兼容旧的 request 函数格式
export const request = async (url: string, options: any = {}) => {
  const { method = "GET", data, params, headers } = options;

  try {
    let response;
    if (method.toLowerCase() === "get") {
      response = await axios.get(API_BASE_URL + url, { params, headers });
    } else if (method.toLowerCase() === "post") {
      response = await axios.post(API_BASE_URL + url, data, { headers });
    } else if (method.toLowerCase() === "put") {
      response = await axios.put(API_BASE_URL + url, data, { headers });
    } else if (method.toLowerCase() === "delete") {
      response = await axios.delete(API_BASE_URL + url, { headers });
    } else {
      response = await axios.request({
        url: API_BASE_URL + url,
        method,
        data,
        params,
        headers,
      });
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;
