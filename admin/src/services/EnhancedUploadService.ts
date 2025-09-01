import { message } from 'antd';

// 构建信息接口
export interface BuildInfo {
  projectId: string;
  version: string;
  buildId: string;
  buildTime: string;
  buildType: string;
  sourcemapCount: number;
  files: Array<{
    path: string;
    size: number;
    type: 'source' | 'sourcemap';
  }>;
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  buildInfo?: BuildInfo;
  fileCount: number;
  sourcemapCount: number;
  sourceCodeCount: number;
}

// 上传选项接口
export interface UploadOptions {
  projectId?: string;
  version?: string;
  buildId?: string;
  uploadType: 'combined' | 'sourcemap_only' | 'source_code_only';
}

// 上传结果接口
export interface UploadResult {
  success: boolean;
  message: string;
  data?: {
    uploadId: string;
    sourceFileIds: string[];
    sourcemapFileIds: string[];
    projectId: string;
    version: string;
  };
  errors?: string[];
}

/**
 * 增强上传服务
 * 处理源代码和sourcemap文件的上传、验证和分离
 */
class EnhancedUploadService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api';
  }

  /**
   * 验证ZIP文件
   * @param file 上传的文件
   * @returns 验证结果
   */
  async validateZipFile(file: File): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: false,
      warnings: [],
      errors: [],
      fileCount: 0,
      sourcemapCount: 0,
      sourceCodeCount: 0
    };

    try {
      // 检查文件类型
      if (!file.name.endsWith('.zip')) {
        result.errors.push('文件格式必须是ZIP格式');
        return result;
      }

      // 检查文件大小（最大100MB）
      if (file.size > 100 * 1024 * 1024) {
        result.errors.push('文件大小不能超过100MB');
        return result;
      }

      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);

      // 调用后端验证API
      const response = await fetch(`${this.baseUrl}/upload/validate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`验证请求失败: ${response.statusText}`);
      }

      const validationData = await response.json();
      
      // 合并验证结果
      Object.assign(result, validationData);

    } catch (error: any) {
      console.error('文件验证失败:', error);
      result.errors.push(`文件验证失败: ${error.message}`);
      
      // 模拟验证结果（开发环境）
      if (process.env.NODE_ENV === 'development') {
        await this.mockValidation(file, result);
      }
    }

    return result;
  }

  /**
   * 开发环境模拟验证
   */
  private async mockValidation(file: File, result: ValidationResult): Promise<void> {
    // 模拟验证逻辑
    const hasBuildInfo = file.name.includes('build-info.json');
    
    if (hasBuildInfo) {
      result.buildInfo = {
        projectId: 'demo-project',
        version: '1.0.0',
        buildId: Date.now().toString(),
        buildTime: new Date().toISOString(),
        buildType: 'taro',
        sourcemapCount: 7,
        files: [
          { path: 'app.js', size: 1024, type: 'source' },
          { path: 'app.js.map', size: 2048, type: 'sourcemap' },
          { path: 'vendors.js', size: 2048, type: 'source' },
          { path: 'vendors.js.map', size: 4096, type: 'sourcemap' }
        ]
      };
      
      result.sourcemapCount = result.buildInfo.sourcemapCount;
      result.sourceCodeCount = result.buildInfo.files.filter(f => f.type === 'source').length;
      result.fileCount = result.buildInfo.files.length;
    } else {
      // 普通ZIP文件
      result.fileCount = Math.floor(Math.random() * 20) + 5;
      result.sourcemapCount = Math.floor(result.fileCount * 0.3);
      result.sourceCodeCount = result.fileCount - result.sourcemapCount;
      result.warnings.push('未检测到构建信息文件，请确保包含完整的源代码和sourcemap文件');
    }

    // 基本验证规则
    if (result.sourcemapCount === 0) {
      result.warnings.push('未检测到sourcemap文件，错误定位功能将无法使用');
    }

    if (result.sourceCodeCount === 0) {
      result.errors.push('未检测到源代码文件');
    }

    result.isValid = result.errors.length === 0;
  }

  /**
   * 上传文件
   * @param file 上传的文件
   * @param options 上传选项
   * @returns 上传结果
   */
  async uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
    try {
      // 先验证文件
      const validationResult = await this.validateZipFile(file);
      
      if (!validationResult.isValid) {
        return {
          success: false,
          message: '文件验证失败',
          errors: validationResult.errors
        };
      }

      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', options.uploadType);
      
      if (options.projectId) {
        formData.append('projectId', options.projectId);
      }
      if (options.version) {
        formData.append('version', options.version);
      }
      if (options.buildId) {
        formData.append('buildId', options.buildId);
      }

      // 调用后端上传API
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `上传失败: ${response.statusText}`);
      }

      const uploadResult = await response.json();

      return {
        success: true,
        message: '上传成功',
        data: uploadResult
      };

    } catch (error: any) {
      console.error('文件上传失败:', error);
      
      // 模拟上传成功（开发环境）
      if (process.env.NODE_ENV === 'development') {
        return this.mockUpload(file, options);
      }

      return {
        success: false,
        message: error.message,
        errors: [error.message]
      };
    }
  }

  /**
   * 开发环境模拟上传
   */
  private async mockUpload(file: File, options: UploadOptions): Promise<UploadResult> {
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      message: '上传成功（模拟）',
      data: {
        uploadId: `upload_${Date.now()}`,
        sourceFileIds: ['source_1', 'source_2', 'source_3'],
        sourcemapFileIds: ['map_1', 'map_2'],
        projectId: options.projectId || 'demo-project',
        version: options.version || '1.0.0'
      }
    };
  }

  /**
   * 获取项目上传历史
   * @param projectId 项目ID
   * @param limit 限制数量
   * @returns 上传历史列表
   */
  async getUploadHistory(projectId: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/upload/history?projectId=${projectId}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`获取上传历史失败: ${response.statusText}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('获取上传历史失败:', error);
      
      // 模拟数据（开发环境）
      if (process.env.NODE_ENV === 'development') {
        return this.mockUploadHistory(projectId, limit);
      }

      throw error;
    }
  }

  /**
   * 开发环境模拟上传历史
   */
  private mockUploadHistory(projectId: string, limit: number): any[] {
    const history = [];
    const now = new Date();
    
    for (let i = 0; i < limit; i++) {
      history.push({
        id: `history_${i}`,
        projectId,
        version: `1.0.${i}`,
        buildId: `build_${Date.now() - i * 86400000}`,
        uploadTime: new Date(now.getTime() - i * 86400000).toISOString(),
        fileCount: Math.floor(Math.random() * 20) + 5,
        sourcemapCount: Math.floor(Math.random() * 10) + 1,
        status: i === 0 ? 'processing' : 'completed',
        uploadType: i % 3 === 0 ? 'combined' : i % 3 === 1 ? 'sourcemap_only' : 'source_code_only'
      });
    }

    return history;
  }

  /**
   * 获取上传进度
   * @param uploadId 上传ID
   * @returns 进度信息
   */
  async getUploadProgress(uploadId: string): Promise<{
    progress: number;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    message?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/upload/progress/${uploadId}`);
      
      if (!response.ok) {
        throw new Error(`获取上传进度失败: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('获取上传进度失败:', error);
      
      // 模拟进度（开发环境）
      if (process.env.NODE_ENV === 'development') {
        return this.mockUploadProgress(uploadId);
      }

      throw error;
    }
  }

  /**
   * 开发环境模拟上传进度
   */
  private async mockUploadProgress(uploadId: string): Promise<any> {
    // 模拟进度查询
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      progress: Math.min(100, Math.floor(Math.random() * 40) + 60),
      status: 'uploading' as const,
      message: '文件处理中...'
    };
  }

  /**
   * 取消上传
   * @param uploadId 上传ID
   * @returns 取消结果
   */
  async cancelUpload(uploadId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/upload/cancel/${uploadId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`取消上传失败: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('取消上传失败:', error);
      
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// 创建单例实例
export const enhancedUploadService = new EnhancedUploadService();

export default EnhancedUploadService;