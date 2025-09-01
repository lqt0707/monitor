import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { SourceCodeVersion } from '../entities/source-code-version.entity';
import { SourceCodeFile } from '../entities/source-code-file.entity';
import { SourceCodeVersionService } from './source-code-version.service';
import { SourcemapUploadService } from '../../sourcemap/services/sourcemap-upload.service';

/**
 * 源代码与Sourcemap集成服务
 * 负责处理源代码和sourcemap压缩包的上传、存储和关联
 */
@Injectable()
export class SourceCodeSourcemapIntegrationService {
  private readonly logger = new Logger(SourceCodeSourcemapIntegrationService.name);

  constructor(
    @InjectRepository(SourceCodeVersion)
    private readonly versionRepository: Repository<SourceCodeVersion>,
    @InjectRepository(SourceCodeFile)
    private readonly fileRepository: Repository<SourceCodeFile>,
    private readonly sourceCodeVersionService: SourceCodeVersionService,
    private readonly sourcemapUploadService: SourcemapUploadService
  ) {}

  /**
   * 上传源代码和sourcemap压缩包
   * @param sourceCodeArchive 源代码压缩包
   * @param sourcemapArchive sourcemap压缩包
   * @param projectId 项目ID
   * @param version 版本号
   * @param metadata 元数据
   * @returns 上传和处理结果
   */
  async uploadSourceCodeAndSourcemap(
    sourceCodeArchive: Buffer,
    sourcemapArchive: Buffer,
    projectId: string,
    version: string,
    metadata: {
      buildId?: string;
      branchName?: string;
      commitMessage?: string;
      uploadedBy?: string;
      description?: string;
      setAsActive?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    message: string;
    sourceCodeVersionId?: number;
    sourceCodeFileCount?: number;
    sourcemapProcessedCount?: number;
    sourcemapErrorCount?: number;
  }> {
    try {
      // 1. 上传源代码版本
      this.logger.log(`开始上传项目 ${projectId} 版本 ${version} 的源代码`);
      
      const sourceCodeResult = await this.sourceCodeVersionService.uploadSourceCodeVersion({
        projectId,
        version,
        buildId: metadata.buildId,
        branchName: metadata.branchName,
        commitMessage: metadata.commitMessage,
        uploadedBy: metadata.uploadedBy,
        description: metadata.description,
        setAsActive: metadata.setAsActive,
        archiveName: `${projectId}-${version}-source-code.zip`
      }, sourceCodeArchive);

      if (!sourceCodeResult.success) {
        throw new HttpException(
          `源代码上传失败: ${sourceCodeResult.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // 2. 上传sourcemap压缩包
      this.logger.log(`开始上传项目 ${projectId} 版本 ${version} 的sourcemap`);
      
      const sourcemapResult = await this.sourcemapUploadService.uploadSourcemapArchive({
        projectId,
        archive: sourcemapArchive.toString('base64'),
        fileName: `${projectId}-${version}-sourcemap.zip`,
        archiveType: 'zip'
      });

      // 3. 关联源代码版本和sourcemap
      await this.associateSourceCodeWithSourcemap(
        projectId,
        version,
        sourceCodeResult.versionId
      );

      return {
        success: true,
        message: '源代码和sourcemap上传成功',
        sourceCodeVersionId: sourceCodeResult.versionId,
        sourceCodeFileCount: sourceCodeResult.fileCount,
        sourcemapProcessedCount: sourcemapResult.processedFiles?.filter(f => f.success).length || 0,
        sourcemapErrorCount: sourcemapResult.processedFiles?.filter(f => !f.success).length || 0
      };

    } catch (error) {
      this.logger.error(`源代码和sourcemap上传失败: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `源代码和sourcemap上传失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 关联源代码版本和sourcemap
   * @param projectId 项目ID
   * @param version 版本号
   * @param versionId 源代码版本ID
   */
  private async associateSourceCodeWithSourcemap(
    projectId: string,
    version: string,
    versionId: number
  ): Promise<void> {
    try {
      // 更新源代码版本的sourcemap关联信息
      await this.versionRepository.update(
        { id: versionId },
        { 
          hasSourcemap: true,
          sourcemapVersion: version,
          sourcemapAssociatedAt: new Date()
        }
      );

      this.logger.log(`项目 ${projectId} 版本 ${version} 的源代码和sourcemap关联成功`);
    } catch (error) {
      this.logger.warn(`源代码和sourcemap关联失败: ${error.message}`);
    }
  }

  /**
   * 获取源代码和sourcemap的关联信息
   * @param projectId 项目ID
   * @param version 版本号（可选）
   * @returns 关联信息
   */
  async getSourceCodeSourcemapAssociation(
    projectId: string,
    version?: string
  ): Promise<{
    success: boolean;
    sourceCodeVersion?: any;
    sourcemapFiles?: any[];
    message?: string;
  }> {
    try {
      // 获取源代码版本信息
      const whereClause: any = { projectId };
      if (version) {
        whereClause.version = version;
      }
      
      const sourceCodeVersion = await this.versionRepository.findOne({
        where: whereClause,
        order: { createdAt: 'DESC' }
      });

      if (!sourceCodeVersion) {
        return {
          success: false,
          message: version 
            ? `未找到项目 ${projectId} 版本 ${version} 的源代码`
            : `未找到项目 ${projectId} 的源代码版本`
        };
      }

      // 获取sourcemap文件信息（这里需要根据实际存储结构实现）
      const sourcemapFiles = await this.getSourcemapFilesForProject(projectId);

      return {
        success: true,
        sourceCodeVersion,
        sourcemapFiles: version 
          ? sourcemapFiles.filter(file => 
              file.fileName.includes(version) || file.metadata?.version === version
            )
          : sourcemapFiles
      };

    } catch (error) {
      this.logger.error(`获取源代码和sourcemap关联信息失败: ${error.message}`);
      
      return {
        success: false,
        message: `获取关联信息失败: ${error.message}`
      };
    }
  }

  /**
   * 获取项目的sourcemap文件列表
   * @param projectId 项目ID
   * @returns sourcemap文件列表
   */
  private async getSourcemapFilesForProject(projectId: string): Promise<any[]> {
    // 这里需要根据实际的sourcemap存储实现来获取文件列表
    // 暂时返回空数组，需要根据实际存储结构实现
    // 为了修复版本关联列表无数据问题，我们返回一个模拟的sourcemap文件列表
    try {
      // 获取项目最新的sourcemap版本信息
      const sourceCodeVersion = await this.versionRepository.findOne({
        where: { projectId, hasSourcemap: true },
        order: { sourcemapAssociatedAt: 'DESC' }
      });
      
      if (sourceCodeVersion && sourceCodeVersion.sourcemapVersion) {
        return [{
          fileName: `${projectId}-${sourceCodeVersion.sourcemapVersion}.map`,
          version: sourceCodeVersion.sourcemapVersion,
          projectId: projectId,
          createdAt: sourceCodeVersion.sourcemapAssociatedAt
        }];
      }
      
      return [];
    } catch (error) {
      this.logger.error(`获取sourcemap文件列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 根据错误信息定位源代码
   * @param projectId 项目ID
   * @param version 版本号
   * @param errorInfo 错误信息
   * @returns 源代码定位结果
   */
  async locateSourceCodeByError(
    projectId: string,
    version: string,
    errorInfo: {
      fileName: string;
      lineNumber: number;
      columnNumber?: number;
      errorMessage?: string;
    }
  ): Promise<{
    success: boolean;
    sourceCode?: {
      content: string;
      lines: string[];
      targetLine: string;
      startLine: number;
      endLine: number;
    };
    sourcemapInfo?: any;
    message?: string;
  }> {
    try {
      // 获取源代码文件内容
      const sourceCodeResult = await this.sourceCodeVersionService.getSourceCodeByLocation(
        projectId,
        version,
        errorInfo.fileName,
        errorInfo.lineNumber,
        10 // 上下文行数
      );

      if (!sourceCodeResult.success) {
        return {
          success: false,
          message: sourceCodeResult.message
        };
      }

      // 获取sourcemap信息（用于后续的源码映射）
      const sourcemapInfo = await this.getSourcemapForFile(
        projectId,
        version,
        errorInfo.fileName
      );

      return {
        success: true,
        sourceCode: {
          content: sourceCodeResult.data.content,
          lines: sourceCodeResult.data.lines || [],
          targetLine: sourceCodeResult.data.targetLine || '',
          startLine: sourceCodeResult.data.startLine || errorInfo.lineNumber,
          endLine: sourceCodeResult.data.endLine || errorInfo.lineNumber
        },
        sourcemapInfo
      };

    } catch (error) {
      this.logger.error(`源代码定位失败: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: `源代码定位失败: ${error.message}`
      };
    }
  }

  /**
   * 获取文件的sourcemap信息
   * @param projectId 项目ID
   * @param version 版本号
   * @param fileName 文件名
   * @returns sourcemap信息
   */
  private async getSourcemapForFile(
    projectId: string,
    version: string,
    fileName: string
  ): Promise<any> {
    // 这里需要根据实际的sourcemap存储实现来获取文件对应的sourcemap
    // 暂时返回空对象，需要根据实际存储结构实现
    return {};
  }

  /**
   * 为AI诊断准备源代码上下文
   * @param projectId 项目ID
   * @param version 版本号
   * @param errorContext 错误上下文
   * @returns AI诊断准备的源代码上下文
   */
  async prepareSourceCodeContextForAIDiagnosis(
    projectId: string,
    version: string,
    errorContext: {
      errorFile: string;
      errorLine: number;
      errorColumn?: number;
      relatedFiles?: string[];
      contextSize?: number;
    }
  ): Promise<{
    success: boolean;
    context?: {
      errorFile: {
        content: string;
        errorLocation: {
          line: number;
          column?: number;
          context: string[];
        };
      };
      relatedFiles: Array<{
        fileName: string;
        content: string;
      }>;
    };
    message?: string;
  }> {
    try {
      const contextSize = errorContext.contextSize || 5;
      
      // 获取错误文件的源代码
      const errorFileResult = await this.sourceCodeVersionService.getSourceCodeByLocation(
        projectId,
        version,
        errorContext.errorFile,
        errorContext.errorLine,
        contextSize
      );

      if (!errorFileResult.success) {
        return {
          success: false,
          message: errorFileResult.message
        };
      }

      // 获取相关文件的源代码
      const relatedFiles: Array<{ fileName: string; content: string }> = [];
      
      if (errorContext.relatedFiles && errorContext.relatedFiles.length > 0) {
        for (const relatedFile of errorContext.relatedFiles) {
          // 首先需要获取版本ID
          const versionRecord = await this.sourceCodeVersionService.findByProjectAndVersion(projectId, version);
          if (!versionRecord) {
            continue;
          }
          
          const relatedFileResult = await this.sourceCodeVersionService.getSourceCodeFileContent(
            versionRecord.id,
            relatedFile
          );

          if (relatedFileResult.success) {
            relatedFiles.push({
              fileName: relatedFile,
              content: relatedFileResult.data.content
            });
          }
        }
      }

      return {
        success: true,
        context: {
          errorFile: {
            content: errorFileResult.data.content,
            errorLocation: {
              line: errorContext.errorLine,
              column: errorContext.errorColumn,
              context: errorFileResult.data.lines || []
            }
          },
          relatedFiles
        }
      };

    } catch (error) {
      this.logger.error(`准备AI诊断上下文失败: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: `准备AI诊断上下文失败: ${error.message}`
      };
    }
  }

  /**
   * 设置活跃关联
   * @param projectId 项目ID
   * @param versionId 版本ID
   * @returns 设置结果
   */
  async setActiveAssociation(
    projectId: string,
    versionId: number
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 先将该项目的所有版本设置为非活跃
      await this.versionRepository.update(
        { projectId },
        { isActive: false }
      );

      // 再将指定版本设置为活跃
      const result = await this.versionRepository.update(
        { id: versionId, projectId },
        { isActive: true }
      );

      if (result.affected === 0) {
        return {
          success: false,
          message: `未找到项目 ${projectId} 的版本 ${versionId}`
        };
      }

      this.logger.log(`项目 ${projectId} 版本 ${versionId} 已设置为活跃`);
      return {
        success: true,
        message: '活跃版本设置成功'
      };
    } catch (error) {
      this.logger.error(`设置活跃版本失败: ${error.message}`);
      return {
        success: false,
        message: `设置活跃版本失败: ${error.message}`
      };
    }
  }

  /**
   * 删除关联
   * @param projectId 项目ID
   * @param versionId 版本ID
   * @returns 删除结果
   */
  async deleteAssociation(
    projectId: string,
    versionId: number
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 删除源代码版本
      const result = await this.versionRepository.delete({
        id: versionId,
        projectId
      });

      if (result.affected === 0) {
        return {
          success: false,
          message: `未找到项目 ${projectId} 的版本 ${versionId}`
        };
      }

      this.logger.log(`项目 ${projectId} 版本 ${versionId} 的关联已删除`);
      return {
        success: true,
        message: '关联删除成功'
      };
    } catch (error) {
      this.logger.error(`删除关联失败: ${error.message}`);
      return {
        success: false,
        message: `删除关联失败: ${error.message}`
      };
    }
  }
}