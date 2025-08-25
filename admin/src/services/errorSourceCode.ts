import { request } from './api';

/**
 * 获取错误详情
 * @param errorId 错误ID
 * @returns 错误详情
 */
export async function fetchErrorDetail(errorId: string) {
    return request(`/api/error-log/${errorId}`, {
        method: 'GET',
    });
}

/**
 * 获取错误对应的源代码
 * @param errorId 错误ID
 * @returns 错误源代码信息
 */
export async function fetchErrorSourceCode(errorId: string) {
    return request(`/api/error-location/error/${errorId}/source-code`, {
        method: 'GET',
    });
}

/**
 * 解析错误位置到源代码
 * @param data 错误位置数据
 * @returns 解析结果
 */
export async function resolveErrorLocation(data: {
    projectId: string;
    version: string;
    stackTrace: string;
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
}) {
    return request('/api/error-location/resolve', {
        method: 'POST',
        data,
    });
}

/**
 * 获取指定版本的源代码文件内容
 * @param projectId 项目ID
 * @param version 版本号
 * @param filePath 文件路径
 * @param lineNumber 行号（可选）
 * @param contextSize 上下文行数（可选）
 * @returns 源代码内容
 */
export async function fetchSourceCodeContent(
    projectId: string,
    version: string,
    filePath: string,
    lineNumber?: number,
    contextSize?: number
) {
    return request(`/api/source-code-version/file-content/${projectId}/${version}`, {
        method: 'GET',
        params: {
            filePath,
            lineNumber,
            contextSize,
        },
    });
}

/**
 * 批量解析多个错误的源代码位置
 * @param errors 错误位置数据数组
 * @returns 批量解析结果
 */
export async function batchResolveErrorLocation(errors: Array<{
    projectId: string;
    version: string;
    stackTrace: string;
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
}>) {
    return request('/api/error-location/batch-resolve', {
        method: 'POST',
        data: { errors },
    });
}

/**
 * 获取源代码版本列表
 * @param projectId 项目ID
 * @returns 版本列表
 */
export async function fetchSourceCodeVersions(projectId: string) {
    return request('/api/source-code-version/versions', {
        method: 'GET',
        params: { projectId },
    });
}

/**
 * 获取源代码文件列表
 * @param projectId 项目ID
 * @param version 版本号
 * @returns 文件列表
 */
export async function fetchSourceCodeFiles(projectId: string, version: string) {
    return request('/api/source-code-version/files', {
        method: 'GET',
        params: { projectId, version },
    });
}

/**
 * 上传源代码压缩包
 * @param formData 包含源代码压缩包的表单数据
 * @returns 上传结果
 */
export async function uploadSourceCodeArchive(formData: FormData) {
    return request('/api/source-code-version/upload', {
        method: 'POST',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

/**
 * 设置活跃版本
 * @param projectId 项目ID
 * @param versionId 版本ID
 * @returns 设置结果
 */
export async function setActiveSourceCodeVersion(projectId: string, versionId: string) {
    return request(`/api/source-code-version/set-active/${projectId}/${versionId}`, {
        method: 'POST',
    });
}

/**
 * 删除源代码版本
 * @param projectId 项目ID
 * @param version 版本号
 * @returns 删除结果
 */
export async function deleteSourceCodeVersion(projectId: string, version: string) {
    return request(`/api/source-code-version/${projectId}/${version}`, {
        method: 'DELETE',
    });
}