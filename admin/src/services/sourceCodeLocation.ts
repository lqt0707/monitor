import { apiClient } from "./api";

/**
 * 源代码定位服务
 * 用于处理错误文件与源代码的关联和定位
 */

export interface SourceLocation {
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  functionName?: string;
  sourceContent?: string;
  contextLines?: number;
}

export interface ErrorLocation {
  projectId: string;
  version: string;
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  errorMessage?: string;
}

export interface SourceCodeContext {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  targetLine: number;
  contextLines: string[];
}

/**
 * 解析错误位置到源代码位置
 */
export async function resolveErrorLocation(
  projectId: string,
  version: string,
  fileName: string,
  lineNumber: number,
  columnNumber?: number
): Promise<SourceLocation | null> {
  try {
    const response = await apiClient.errorLocation.resolveErrorLocation({
      projectId,
      version,
      fileName,
      lineNumber,
      columnNumber,
    });

    if (response.success && response.data) {
      return {
        filePath: response.data.source || fileName,
        lineNumber: response.data.line || lineNumber,
        columnNumber: response.data.column || columnNumber,
        functionName: response.data.name,
        sourceContent: response.data.sourceContent,
      };
    }
    return null;
  } catch (error) {
    console.error("解析错误位置失败:", error);
    return null;
  }
}

/**
 * 获取源代码文件内容（带上下文）
 */
export async function getSourceCodeWithContext(
  projectId: string,
  version: string,
  filePath: string,
  lineNumber: number,
  contextLines: number = 10
): Promise<SourceCodeContext | null> {
  try {
    const response = await apiClient.sourceCodeVersion.getFileContent(
      projectId,
      version,
      filePath,
      lineNumber,
      contextLines
    );

    if (response.success && response.data) {
      return {
        filePath,
        content: response.data.content,
        startLine: response.data.startLine || 1,
        endLine: response.data.endLine || 1,
        targetLine: lineNumber,
        contextLines: response.data.contextLines || [],
      };
    }
    return null;
  } catch (error) {
    console.error("获取源代码内容失败:", error);
    return null;
  }
}

/**
 * 批量解析错误位置
 */
export async function batchResolveErrorLocations(
  locations: ErrorLocation[]
): Promise<(SourceLocation | null)[]> {
  try {
    const response = await apiClient.errorLocation.batchResolve(locations);

    if (response.success && response.data) {
      return response.data.map((item: any) =>
        item
          ? {
              filePath: item.source || item.fileName,
              lineNumber: item.line || item.lineNumber,
              columnNumber: item.column || item.columnNumber,
              functionName: item.name,
              sourceContent: item.sourceContent,
            }
          : null
      );
    }
    return locations.map(() => null);
  } catch (error) {
    console.error("批量解析错误位置失败:", error);
    return locations.map(() => null);
  }
}

/**
 * 搜索源代码文件
 */
export async function searchSourceCodeFiles(
  projectId: string,
  version: string,
  query: string
): Promise<string[]> {
  try {
    const response = await apiClient.sourceCodeVersion.searchFiles(
      projectId,
      version,
      query
    );

    if (response.success && response.data) {
      return response.data.files || [];
    }
    return [];
  } catch (error) {
    console.error("搜索源代码文件失败:", error);
    return [];
  }
}

/**
 * 获取文件树结构
 */
export async function getSourceCodeFileTree(
  projectId: string,
  version: string
): Promise<any[]> {
  try {
    const response = await apiClient.sourceCodeVersion.getFileTree(
      projectId,
      version
    );

    if (response.success && response.data) {
      return response.data.files || [];
    }
    return [];
  } catch (error) {
    console.error("获取文件树失败:", error);
    return [];
  }
}

/**
 * 验证源代码版本一致性
 */
export async function validateSourceCodeVersion(
  projectId: string,
  errorVersion: string
): Promise<{
  isValid: boolean;
  availableVersions: string[];
  suggestedVersion?: string;
}> {
  try {
    const response = await apiClient.sourceCodeVersion.getVersions(projectId);

    if (response.success && response.data) {
      const versions = response.data.versions || [];
      const isValid = versions.some((v) => v.version === errorVersion);

      // 找到最接近的版本
      let suggestedVersion: string | undefined;
      if (!isValid && versions.length > 0) {
        // 简单的版本比较逻辑
        const errorVersionParts = errorVersion.split(".").map(Number);
        let bestMatch = versions[0];
        let bestScore = -1;

        versions.forEach((version) => {
          const versionParts = version.version.split(".").map(Number);
          let score = 0;

          // 计算版本相似度
          for (
            let i = 0;
            i < Math.min(errorVersionParts.length, versionParts.length);
            i++
          ) {
            if (errorVersionParts[i] === versionParts[i]) {
              score += 10;
            } else {
              score += Math.max(
                0,
                10 - Math.abs(errorVersionParts[i] - versionParts[i])
              );
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestMatch = version;
          }
        });

        suggestedVersion = bestMatch.version;
      }

      return {
        isValid,
        availableVersions: versions.map((v) => v.version),
        suggestedVersion,
      };
    }

    return {
      isValid: false,
      availableVersions: [],
    };
  } catch (error) {
    console.error("验证源代码版本失败:", error);
    return {
      isValid: false,
      availableVersions: [],
    };
  }
}
