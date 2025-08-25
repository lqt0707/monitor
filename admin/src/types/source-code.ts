/**
 * 源代码上传和分析相关类型定义
 */

// 源代码分析结果接口
export interface SourceCodeAnalysis {
  /** 代码复杂度分析结果 */
  complexity: {
    /** 圈复杂度 */
    cyclomaticComplexity: number;
    /** 代码行数 */
    linesOfCode: number;
    /** 函数数量 */
    functionCount: number;
    /** 平均函数长度 */
    averageFunctionLength: number;
  };

  /** 安全漏洞检测结果 */
  security: {
    /** 安全漏洞数量 */
    vulnerabilityCount: number;
    /** 安全漏洞列表 */
    vulnerabilities: Array<{
      /** 漏洞类型 */
      type: string;
      /** 漏洞描述 */
      description: string;
      /** 漏洞位置 */
      location: string;
      /** 严重级别 */
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  };

  /** 代码规范检查结果 */
  codeStyle: {
    /** 规范问题数量 */
    issueCount: number;
    /** 规范问题列表 */
    issues: Array<{
      /** 问题类型 */
      type: string;
      /** 问题描述 */
      description: string;
      /** 问题位置 */
      location: string;
    }>;
  };

  /** 依赖分析结果 */
  dependencies: {
    /** 依赖数量 */
    dependencyCount: number;
    /** 依赖列表 */
    dependencies: Array<{
      /** 依赖名称 */
      name: string;
      /** 依赖版本 */
      version: string;
      /** 依赖类型 */
      type: 'production' | 'development';
    }>;
  };
}

// 源代码上传请求接口
export interface UploadSourceCodeRequest {
  /** 项目ID */
  projectId: string;
  /** 源代码内容 */
  sourceCode: string;
  /** 文件名 */
  fileName: string;
  /** 文件路径（可选） */
  filePath?: string;
  /** 文件类型（可选） */
  fileType?: string;
}

export interface UploadSourceCodeArchiveRequest {
  /** 项目ID */
  projectId: string;
  /** 压缩包内容（base64编码） */
  archive: string;
  /** 文件名 */
  fileName: string;
  /** 压缩包类型 */
  archiveType: string;
}

export interface UploadSourceCodeArchiveResponse {
  /** 总文件数 */
  totalFiles: number;
  /** 成功处理文件数 */
  processedFiles: number;
  /** 失败文件数 */
  failedFiles: number;
  /** 处理结果列表 */
  results: Array<{
    /** 文件名 */
    fileName: string;
    /** 是否成功 */
    success: boolean;
    /** 错误信息（如果失败） */
    error?: string;
    /** 分析结果（如果成功） */
    analysis?: SourceCodeAnalysis;
  }>;
}

// 源代码上传响应接口
export interface UploadSourceCodeResponse {
  /** 上传结果ID */
  id: string;
  /** 分析结果 */
  analysis: SourceCodeAnalysis;
  /** 告警触发情况 */
  triggeredAlerts: Array<{
    /** 告警规则ID */
    ruleId: number;
    /** 告警规则名称 */
    ruleName: string;
    /** 告警级别 */
    level: 'low' | 'medium' | 'high' | 'critical';
    /** 告警消息 */
    message: string;
  }>;
  /** 上传时间 */
  uploadedAt: string;
}

// 批量上传请求接口
export interface BatchUploadSourceCodeRequest {
  /** 项目ID */
  projectId: string;
  /** 文件列表 */
  files: Array<{
    /** 文件名 */
    fileName: string;
    /** 源代码内容 */
    sourceCode: string;
  }>;
}

// 批量上传响应接口
export interface BatchUploadSourceCodeResponse {
  /** 成功上传的文件数量 */
  successCount: number;
  /** 失败的文件数量 */
  failureCount: number;
  /** 上传结果列表 */
  results: Array<{
    /** 文件名 */
    fileName: string;
    /** 是否成功 */
    success: boolean;
    /** 错误信息（如果失败） */
    error?: string;
    /** 分析结果（如果成功） */
    analysis?: UploadSourceCodeResponse;
  }>;
}