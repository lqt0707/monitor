/**
 * Sourcemap上传相关类型定义
 */

/**
 * 单个Sourcemap文件上传请求
 */
export interface UploadSourcemapRequest {
  /**
   * 项目ID
   */
  projectId: string;

  /**
   * Sourcemap文件内容（base64编码）
   */
  sourcemap: string;

  /**
   * 文件名
   */
  fileName: string;

  /**
   * 文件路径
   */
  filePath?: string;
}

/**
 * Sourcemap压缩包上传请求
 */
export interface UploadSourcemapArchiveRequest {
  /**
   * 项目ID
   */
  projectId: string;

  /**
   * 压缩包文件内容（base64编码）
   */
  archive: string;

  /**
   * 压缩包文件名
   */
  fileName: string;

  /**
   * 压缩包类型
   */
  archiveType: "zip" | "tar" | "gz" | "rar" | "7z" | string;
}

/**
 * 批量Sourcemap文件上传请求
 */
export interface BatchUploadSourcemapRequest {
  /**
   * 项目ID
   */
  projectId: string;

  /**
   * Sourcemap文件列表
   */
  files: Array<{
    /**
     * Sourcemap文件内容（base64编码）
     */
    sourcemap: string;

    /**
     * 文件名
     */
    fileName: string;
  }>;
}

/**
 * Sourcemap上传响应
 */
export interface UploadSourcemapResponse {
  /**
   * 上传是否成功
   */
  success: boolean;

  /**
   * 上传结果消息
   */
  message: string;

  /**
   * 上传的文件信息
   */
  fileInfo?: {
    /**
     * 文件名
     */
    fileName: string;

    /**
     * 文件大小（字节）
     */
    fileSize: number;

    /**
     * 上传时间
     */
    uploadedAt: string;
  };

  /**
   * 错误信息（如果有）
   */
  error?: string;

  /**
   * 文件路径
   */
  filePath?: string;
}

/**
 * Sourcemap压缩包上传响应
 */
export interface UploadSourcemapArchiveResponse {
  /**
   * 上传是否成功
   */
  success: boolean;

  /**
   * 上传结果消息
   */
  message: string;

  /**
   * 解压的文件列表
   */
  extractedFiles?: Array<{
    /**
     * 文件名
     */
    fileName: string;

    /**
     * 文件大小（字节）
     */
    fileSize: number;

    totalFiles: number;
  }>;

  /**
   * 错误信息（如果有）
   */
  error?: string;

  projectId?: string;

  archiveType?: string;
  totalFiles?: number;
  processedFiles?: Array<{
    fileName: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
  archiveName?: string;
}

/**
 * 批量Sourcemap上传响应
 */
export interface BatchUploadSourcemapResponse {
  /**
   * 批量上传结果
   */
  results: Array<{
    /**
     * 文件名
     */
    fileName: string;

    /**
     * 上传是否成功
     */
    success: boolean;

    /**
     * 上传结果消息
     */
    message: string;

    /**
     * 错误信息（如果有）
     */
    error?: string;
  }>;

  /**
   * 总上传文件数
   */
  total: number;

  /**
   * 成功上传文件数
   */
  successCount: number;

  /**
   * 失败上传文件数
   */
  failureCount: number;
}
