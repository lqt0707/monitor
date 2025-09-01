import { request } from "./api";

/**
 * 源代码与Sourcemap集成服务
 * 处理源代码版本与sourcemap文件的关联、定位和AI诊断上下文准备
 */

export interface SourceCodeSourcemapAssociation {
  id: string;
  projectId: string;
  sourceCodeVersionId: string;
  sourcemapVersionId: string;
  sourceCodeVersion: string;
  sourcemapVersion: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadSourceCodeAndSourcemapRequest {
  projectId: string;
  sourceCodeArchive: File;
  sourcemapArchive: File;
  setAsActive?: boolean;
}

export interface UploadSourceCodeAndSourcemapResponse {
  success: boolean;
  message: string;
  data?: {
    sourceCodeVersionId: string;
    sourcemapVersionId: string;
    associationId: string;
    sourceCodeVersion: string;
    sourcemapVersion: string;
  };
}

export interface LocateSourceCodeRequest {
  projectId: string;
  version: string;
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  errorMessage?: string;
}

export interface SourceCodeLocationResult {
  success: boolean;
  message: string;
  data?: {
    originalFile: string;
    originalLine: number;
    originalColumn?: number;
    sourceFile: string;
    sourceLine: number;
    sourceColumn?: number;
    functionName?: string;
    sourceContent?: string;
    contextLines?: string[];
  };
}

export interface PrepareAIContextRequest {
  projectId: string;
  version: string;
  errorInfo: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
    errorMessage: string;
    stackTrace?: string;
  };
  contextSize?: number;
}

export interface AIContextResult {
  success: boolean;
  message: string;
  data?: {
    errorLocation: {
      file: string;
      line: number;
      column?: number;
    };
    sourceCode: string;
    relatedFiles: Array<{
      file: string;
      content: string;
      relevance: number;
    }>;
    context: string;
  };
}

/**
 * 上传源代码和sourcemap压缩包
 */
export async function uploadSourceCodeAndSourcemap(
  data: UploadSourceCodeAndSourcemapRequest
): Promise<UploadSourceCodeAndSourcemapResponse> {
  const formData = new FormData();
  formData.append("projectId", data.projectId);
  formData.append("sourceCodeArchive", data.sourceCodeArchive);
  formData.append("sourcemapArchive", data.sourcemapArchive);
  if (data.setAsActive !== undefined) {
    formData.append("setAsActive", data.setAsActive.toString());
  }

  return request("/api/source-code-sourcemap-integration/upload", {
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/**
 * 获取源代码与sourcemap关联信息
 */
export async function getSourceCodeSourcemapAssociation(
  projectId: string
): Promise<{ success: boolean; data?: SourceCodeSourcemapAssociation[] }> {
  return request(
    `/api/source-code-sourcemap-integration/association/${projectId}`,
    {
      method: "GET",
    }
  );
}

/**
 * 根据错误信息定位源代码
 */
export async function locateSourceCodeByError(
  data: LocateSourceCodeRequest
): Promise<SourceCodeLocationResult> {
  return request("/api/source-code-sourcemap-integration/locate", {
    method: "POST",
    data,
  });
}

/**
 * 准备AI诊断上下文
 */
export async function prepareAIContext(
  data: PrepareAIContextRequest
): Promise<AIContextResult> {
  return request("/api/source-code-sourcemap-integration/prepare-ai-context", {
    method: "POST",
    data,
  });
}

/**
 * 设置活跃的源代码与sourcemap关联
 */
export async function setActiveAssociation(
  projectId: string,
  associationId: string
): Promise<{ success: boolean; message: string }> {
  return request(
    `/api/source-code-sourcemap-integration/set-active/${projectId}/${associationId}`,
    {
      method: "POST",
    }
  );
}

/**
 * 删除源代码与sourcemap关联
 */
export async function deleteAssociation(
  projectId: string,
  associationId: string
): Promise<{ success: boolean; message: string }> {
  return request(
    `/api/source-code-sourcemap-integration/association/${projectId}/${associationId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * 获取项目的sourcemap文件列表
 */
export async function getSourcemapFilesForProject(
  projectId: string,
  version?: string
): Promise<{ success: boolean; data?: string[] }> {
  const params: any = { projectId };
  if (version) {
    params.version = version;
  }

  return request("/api/source-code-sourcemap-integration/sourcemap-files", {
    method: "GET",
    params,
  });
}