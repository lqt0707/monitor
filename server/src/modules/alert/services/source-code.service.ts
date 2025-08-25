import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as AdmZip from 'adm-zip';
import * as tar from 'tar';
import { createReadStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { AlertRule, AlertRuleType } from '../entities/alert-rule.entity';
import { ProjectConfigService } from '../../project-config/project-config.service';
import { AlertHistoryService } from './alert-history.service';
import { UploadSourceCodeDto, UploadSourceCodeArchiveDto } from '../dto/upload-source-code.dto';

/**
 * 源代码分析服务
 * 负责处理源代码上传、分析和与告警规则的联动
 */
@Injectable()
export class SourceCodeService {
  constructor(
    @InjectRepository(AlertRule)
    private readonly alertRuleRepository: Repository<AlertRule>,
    private readonly projectConfigService: ProjectConfigService,
    private readonly alertHistoryService: AlertHistoryService,
  ) {}

  /**
   * 上传源代码文件
   * @param uploadSourceCodeDto 源代码上传DTO
   * @returns 上传结果
   */
  async uploadSourceCode(uploadSourceCodeDto: UploadSourceCodeDto): Promise<{
    success: boolean;
    message: string;
    analysisResults?: any[];
    alertResults?: any[];
  }> {
    try {
      const { projectId, sourceCode, fileName, filePath, fileType } = uploadSourceCodeDto;

      // 验证项目存在
      try {
        await this.projectConfigService.findByProjectId(projectId);
      } catch (error) {
        throw new HttpException('项目不存在', HttpStatus.NOT_FOUND);
      }

      // 解码源代码
      const decodedSourceCode = Buffer.from(sourceCode, 'base64').toString('utf-8');

      // 分析源代码
      const analysisResults = await this.analyzeSourceCode(decodedSourceCode, fileName, fileType);

      // 检查是否需要触发告警
      const alertResults = await this.checkForAlerts(projectId, analysisResults);

      return {
        success: true,
        message: '源代码上传和分析成功',
        analysisResults: analysisResults,
        alertResults: alertResults.length > 0 ? alertResults : []
      };

    } catch (error) {
      throw new HttpException(
        `源代码上传失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 上传源代码压缩包
   * @param uploadSourceCodeArchiveDto 源代码压缩包上传数据
   * @returns 处理结果
   */
  async uploadSourceCodeArchive(uploadSourceCodeArchiveDto: UploadSourceCodeArchiveDto): Promise<{
    success: boolean;
    message: string;
    totalFiles?: number;
    processedFiles?: Array<{
      fileName: string;
      success: boolean;
      analysisResults?: any[];
      error?: string;
    }>;
    archiveName?: string;
  }> {
    try {
      const { projectId, archive, fileName, archiveType } = uploadSourceCodeArchiveDto;

      // 验证项目存在
      try {
        await this.projectConfigService.findByProjectId(projectId);
      } catch (error) {
        throw new HttpException('项目不存在', HttpStatus.NOT_FOUND);
      }

      // 解码压缩包内容
      const archiveBuffer = Buffer.from(archive, 'base64');
      const processedFiles = [];

      // 根据压缩包类型进行处理
      switch (archiveType) {
        case 'zip':
          await this.processZipArchive(archiveBuffer, projectId, processedFiles);
          break;
        case 'tar':
        case 'gz':
          await this.processTarArchive(archiveBuffer, projectId, processedFiles, archiveType);
          break;
        default:
          throw new HttpException(`不支持的压缩包格式: ${archiveType}`, HttpStatus.BAD_REQUEST);
      }

      const successCount = processedFiles.filter(f => f.success).length;
      const failureCount = processedFiles.filter(f => !f.success).length;

      return {
        success: failureCount === 0,
        message: `压缩包处理完成，成功: ${successCount}, 失败: ${failureCount}`,
        totalFiles: processedFiles.length,
        processedFiles,
        archiveName: fileName
      };

    } catch (error) {
      throw new HttpException(
        `压缩包处理失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 处理ZIP压缩包
   * @param buffer 压缩包缓冲区
   * @param projectId 项目ID
   * @param processedFiles 处理结果数组
   */
  private async processZipArchive(buffer: Buffer, projectId: string, processedFiles: any[]) {
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      for (const entry of zipEntries) {
        if (!entry.isDirectory && this.isSourceCodeFile(entry.name)) {
          try {
            const fileContent = entry.getData().toString('utf-8');
            const result = await this.uploadSourceCode({
              projectId,
              sourceCode: Buffer.from(fileContent).toString('base64'),
              fileName: entry.name,
              filePath: entry.entryName
            });

            processedFiles.push({
              fileName: entry.name,
              success: true,
              analysisResults: result.analysisResults
            });
          } catch (error) {
            processedFiles.push({
              fileName: entry.name,
              success: false,
              error: error.message
            });
          }
        }
      }
    } catch (error) {
      throw new HttpException(`ZIP压缩包处理失败: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 处理TAR压缩包
   * @param buffer 压缩包缓冲区
   * @param projectId 项目ID
   * @param processedFiles 处理结果数组
   * @param archiveType 压缩包类型
   */
  private async processTarArchive(buffer: Buffer, projectId: string, processedFiles: any[], archiveType: string) {
    const tempDir = tmpdir();
    const tempFile = join(tempDir, `source-code-${Date.now()}.${archiveType}`);
    
    try {
      // 将缓冲区写入临时文件
      require('fs').writeFileSync(tempFile, buffer);

      // 使用tar库解压文件
      await tar.extract({
        file: tempFile,
        cwd: tempDir,
        sync: true
      });

      // 读取解压后的文件并处理
      const files = require('fs').readdirSync(tempDir, { recursive: true });
      
      for (const file of files) {
        if (typeof file === 'string' && this.isSourceCodeFile(file)) {
          try {
            const filePath = join(tempDir, file);
            const fileContent = require('fs').readFileSync(filePath, 'utf-8');
            
            const result = await this.uploadSourceCode({
              projectId,
              sourceCode: Buffer.from(fileContent).toString('base64'),
              fileName: file,
              filePath: require('path').dirname(file)
            });

            processedFiles.push({
              fileName: file,
              success: true,
              analysisResults: result.analysisResults
            });
          } catch (error) {
            processedFiles.push({
              fileName: file,
              success: false,
              error: error.message
            });
          }
        }
      }

      // 清理临时文件
      require('fs').unlinkSync(tempFile);
      require('fs').rmSync(tempDir, { recursive: true, force: true });

    } catch (error) {
      throw new HttpException(`TAR压缩包处理失败: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 判断是否为源代码文件
   * @param fileName 文件名
   */
  private isSourceCodeFile(fileName: string): boolean {
    const sourceCodeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.vue',
      '.css', '.scss', '.less', '.html',
      '.json', '.xml', '.yaml', '.yml', '.md'
    ];
    return sourceCodeExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  /**
   * 分析源代码内容
   * @param sourceCode 源代码内容
   * @param fileName 文件名
   * @param fileType 文件类型
   * @returns 分析结果
   */
  private async analyzeSourceCode(
    sourceCode: string,
    fileName: string,
    fileType?: string
  ): Promise<any[]> {
    const results = [];

    // 1. 代码复杂度分析
    const complexityAnalysis = this.analyzeComplexity(sourceCode);
    if (complexityAnalysis) {
      results.push(complexityAnalysis);
    }

    // 2. 安全漏洞检测
    const securityAnalysis = this.analyzeSecurity(sourceCode, fileType);
    if (securityAnalysis) {
      results.push(securityAnalysis);
    }

    // 3. 代码规范检查
    const styleAnalysis = this.analyzeCodeStyle(sourceCode, fileType);
    if (styleAnalysis) {
      results.push(styleAnalysis);
    }

    // 4. 依赖分析
    const dependencyAnalysis = this.analyzeDependencies(sourceCode, fileType);
    if (dependencyAnalysis) {
      results.push(dependencyAnalysis);
    }

    return results;
  }

  /**
   * 分析代码复杂度
   * @param sourceCode 源代码
   * @returns 复杂度分析结果
   */
  private analyzeComplexity(sourceCode: string): any {
    // 简单的复杂度分析逻辑
    const lines = sourceCode.split('\n').length;
    const functionCount = (sourceCode.match(/function\s+\w+\s*\(/g) || []).length;
    const classCount = (sourceCode.match(/class\s+\w+/g) || []).length;

    return {
      type: 'complexity',
      metrics: {
        linesOfCode: lines,
        functionCount,
        classCount,
        complexityScore: Math.round((functionCount + classCount) / Math.max(1, lines) * 100)
      }
    };
  }

  /**
   * 分析安全漏洞
   * @param sourceCode 源代码
   * @param fileType 文件类型
   * @returns 安全分析结果
   */
  private analyzeSecurity(sourceCode: string, fileType?: string): any {
    const vulnerabilities = [];

    // 常见的安全漏洞模式检测
    const patterns = [
      { pattern: /eval\(/, description: '使用eval函数可能存在安全风险' },
      { pattern: /innerHTML\s*=/, description: '直接设置innerHTML可能导致XSS攻击' },
      { pattern: /localStorage\.setItem\([^)]*,[^)]*['"][^)]*['"]\)/, description: '敏感数据存储风险' },
    ];

    patterns.forEach(({ pattern, description }) => {
      if (pattern.test(sourceCode)) {
        vulnerabilities.push({
          severity: 'medium',
          description,
          location: 'multiple'
        });
      }
    });

    if (vulnerabilities.length > 0) {
      return {
        type: 'security',
        vulnerabilities,
        total: vulnerabilities.length
      };
    }

    return null;
  }

  /**
   * 分析代码规范
   * @param sourceCode 源代码
   * @param fileType 文件类型
   * @returns 代码规范分析结果
   */
  private analyzeCodeStyle(sourceCode: string, fileType?: string): any {
    const issues = [];

    // 简单的代码规范检查
    if (sourceCode.includes('console.log')) {
      issues.push({
        type: 'warning',
        description: '生产代码中不建议使用console.log',
        suggestion: '使用日志库代替'
      });
    }

    if (sourceCode.includes('var ')) {
      issues.push({
        type: 'suggestion',
        description: '建议使用let或const代替var',
        suggestion: '使用ES6+语法'
      });
    }

    if (issues.length > 0) {
      return {
        type: 'code_style',
        issues,
        total: issues.length
      };
    }

    return null;
  }

  /**
   * 分析依赖关系
   * @param sourceCode 源代码
   * @param fileType 文件类型
   * @returns 依赖分析结果
   */
  private analyzeDependencies(sourceCode: string, fileType?: string): any {
    const dependencies = new Set<string>();

    // 提取导入语句
    const importPatterns = [
      /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
      /require\(['"]([^'"]+)['"]\)/g
    ];

    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sourceCode)) !== null) {
        dependencies.add(match[1]);
      }
    });

    if (dependencies.size > 0) {
      return {
        type: 'dependencies',
        dependencies: Array.from(dependencies),
        total: dependencies.size
      };
    }

    return null;
  }

  /**
   * 检查分析结果是否需要触发告警
   * @param projectId 项目ID
   * @param analysisResults 分析结果
   * @returns 告警检查结果
   */
  private async checkForAlerts(projectId: string, analysisResults: any[]): Promise<any[]> {
    const alertResults = [];

    // 获取项目的告警规则
    const alertRules = await this.alertRuleRepository.find({
      where: { projectId, enabled: true }
    });

    // 获取项目配置
    const projectConfig = await this.projectConfigService.findByProjectId(projectId);

    for (const result of analysisResults) {
      for (const rule of alertRules) {
        const shouldAlert = this.evaluateAlertRule(rule, result);
        if (shouldAlert) {
          // 保存告警历史记录
          await this.alertHistoryService.createAlertHistory(
            rule,
            projectConfig,
            this.getTriggeredValue(result, rule.type),
            `告警规则"${rule.name}"被触发`,
            this.getErrorLevel(result)
          );

          alertResults.push({
            ruleId: rule.id,
            ruleName: rule.name,
            analysisType: result.type,
            triggered: true,
            message: `告警规则"${rule.name}"被触发`
          });
        }
      }
    }

    return alertResults;
  }

  /**
   * 评估告警规则
   * @param rule 告警规则
   * @param analysisResult 分析结果
   * @returns 是否触发告警
   */
  private evaluateAlertRule(rule: AlertRule, analysisResult: any): boolean {
    // 根据规则类型和条件进行评估
    switch (rule.type) {
      case AlertRuleType.ERROR_COUNT:
        return analysisResult.type === 'security' && 
               analysisResult.total >= parseInt(rule.condition);
      
      case AlertRuleType.ERROR_RATE:
        return analysisResult.type === 'complexity' && 
               analysisResult.metrics.complexityScore >= rule.threshold;
      
      default:
        return false;
    }
  }

  /**
   * 获取触发值
   * @param result 分析结果
   * @param ruleType 规则类型
   * @returns 触发值
   */
  private getTriggeredValue(result: any, ruleType: AlertRuleType): number {
    switch (ruleType) {
      case AlertRuleType.ERROR_COUNT:
        return result.total || 0;
      case AlertRuleType.ERROR_RATE:
        return result.metrics?.complexityScore || 0;
      default:
        return 0;
    }
  }

  /**
   * 获取错误级别
   * @param result 分析结果
   * @returns 错误级别
   */
  private getErrorLevel(result: any): number {
    if (result.type === 'security') {
      return 2; // 中等严重级别
    } else if (result.type === 'complexity') {
      return 1; // 低严重级别
    }
    return 0; // 默认级别
  }
}