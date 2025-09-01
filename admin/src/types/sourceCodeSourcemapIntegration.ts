/**
 * 源代码与Sourcemap集成相关类型定义
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