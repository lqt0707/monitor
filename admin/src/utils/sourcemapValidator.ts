/**
 * Sourcemap验证器
 * 用于验证上传的sourcemap文件的有效性和一致性
 */

export interface SourceFile {
  name: string;
  type: string;
  size: number;
  content?: string;
  path: string;
}

export interface SourcemapFile {
  name: string;
  content: string;
  sourceFile?: string;
  path: string;
}

export interface ValidationIssue {
  type:
    | "missing_sourcemap"
    | "invalid_sourcemap"
    | "version_mismatch"
    | "path_mismatch";
  file: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  summary: {
    totalFiles: number;
    sourcemapFiles: number;
    missingSourcemaps: number;
    invalidSourcemaps: number;
    coverage: number;
  };
}

export class SourcemapValidator {
  /**
   * 验证sourcemap文件的一致性
   */
  async validateSourcemapConsistency(
    sourceFiles: SourceFile[],
    sourcemapFiles: SourcemapFile[]
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const jsFiles = sourceFiles.filter(
      (file) => file.type === "javascript" || file.name.endsWith(".js")
    );

    let missingSourcemaps = 0;
    let invalidSourcemaps = 0;

    // 检查每个JS文件是否有对应的sourcemap
    for (const jsFile of jsFiles) {
      const sourcemapFile = this.findMatchingSourcemap(jsFile, sourcemapFiles);

      if (!sourcemapFile) {
        missingSourcemaps++;
        issues.push({
          type: "missing_sourcemap",
          file: jsFile.name,
          severity: "warning",
          message: `JavaScript文件缺少对应的sourcemap文件`,
          suggestion: `请确保构建配置中启用了sourcemap生成，并重新构建项目`,
        });
      } else {
        // 验证sourcemap文件的有效性
        const sourcemapValidation = await this.validateSourcemapFile(
          sourcemapFile
        );
        if (!sourcemapValidation.isValid) {
          invalidSourcemaps++;
          issues.push({
            type: "invalid_sourcemap",
            file: sourcemapFile.name,
            severity: "error",
            message: `Sourcemap文件格式无效: ${sourcemapValidation.error}`,
            suggestion: `请检查构建工具配置，确保生成正确的sourcemap文件`,
          });
        }

        // 检查文件路径匹配
        const pathValidation = this.validatePathConsistency(
          jsFile,
          sourcemapFile
        );
        if (!pathValidation.isValid) {
          issues.push({
            type: "path_mismatch",
            file: jsFile.name,
            severity: "warning",
            message: `文件路径不匹配: ${pathValidation.message}`,
            suggestion: `请确保JS文件和sourcemap文件在同一目录下`,
          });
        }
      }
    }

    // 检查是否有孤立的sourcemap文件
    const orphanedSourcemaps = sourcemapFiles.filter(
      (sm) => !jsFiles.some((js) => this.isMatchingPair(js, sm))
    );

    for (const orphaned of orphanedSourcemaps) {
      issues.push({
        type: "path_mismatch",
        file: orphaned.name,
        severity: "info",
        message: `发现孤立的sourcemap文件，可能缺少对应的JS文件`,
        suggestion: `请检查是否遗漏了JS文件，或删除不需要的sourcemap文件`,
      });
    }

    const coverage =
      jsFiles.length > 0
        ? ((jsFiles.length - missingSourcemaps) / jsFiles.length) * 100
        : 0;

    return {
      isValid: issues.filter((i) => i.severity === "error").length === 0,
      issues,
      warnings: issues.filter((i) => i.severity === "warning"),
      errors: issues.filter((i) => i.severity === "error"),
      summary: {
        totalFiles: sourceFiles.length,
        sourcemapFiles: sourcemapFiles.length,
        missingSourcemaps,
        invalidSourcemaps,
        coverage: Math.round(coverage * 100) / 100,
      },
    };
  }

  /**
   * 验证单个sourcemap文件
   */
  async validateSourcemapFile(sourcemapFile: SourcemapFile): Promise<{
    isValid: boolean;
    error?: string;
    metadata?: any;
  }> {
    try {
      // 解析sourcemap内容
      const sourcemapContent = JSON.parse(sourcemapFile.content);

      // 检查基本结构
      if (!sourcemapContent.version || !sourcemapContent.mappings) {
        return {
          isValid: false,
          error: "缺少必要的sourcemap字段",
        };
      }

      // 检查版本
      if (sourcemapContent.version !== 3) {
        return {
          isValid: false,
          error: `不支持的sourcemap版本: ${sourcemapContent.version}`,
        };
      }

      // 检查mappings字段
      if (typeof sourcemapContent.mappings !== "string") {
        return {
          isValid: false,
          error: "mappings字段格式不正确",
        };
      }

      // 检查sources字段
      if (!Array.isArray(sourcemapContent.sources)) {
        return {
          isValid: false,
          error: "sources字段格式不正确",
        };
      }

      // 检查names字段
      if (sourcemapContent.names && !Array.isArray(sourcemapContent.names)) {
        return {
          isValid: false,
          error: "names字段格式不正确",
        };
      }

      // 检查file字段
      if (sourcemapContent.file && typeof sourcemapContent.file !== "string") {
        return {
          isValid: false,
          error: "file字段格式不正确",
        };
      }

      return {
        isValid: true,
        metadata: {
          version: sourcemapContent.version,
          sources: sourcemapContent.sources.length,
          names: sourcemapContent.names?.length || 0,
          file: sourcemapContent.file,
          sourceRoot: sourcemapContent.sourceRoot,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: `JSON解析失败: ${error.message}`,
      };
    }
  }

  /**
   * 验证文件路径一致性
   */
  validatePathConsistency(
    jsFile: SourceFile,
    sourcemapFile: SourcemapFile
  ): {
    isValid: boolean;
    message: string;
  } {
    const jsDir = this.getDirectoryPath(jsFile.path);
    const sourcemapDir = this.getDirectoryPath(sourcemapFile.path);

    if (jsDir !== sourcemapDir) {
      return {
        isValid: false,
        message: `JS文件在 ${jsDir}，sourcemap文件在 ${sourcemapDir}`,
      };
    }

    return {
      isValid: true,
      message: "路径匹配",
    };
  }

  /**
   * 查找匹配的sourcemap文件
   */
  private findMatchingSourcemap(
    jsFile: SourceFile,
    sourcemapFiles: SourcemapFile[]
  ): SourcemapFile | null {
    // 方法1: 通过文件名匹配（去掉.js后缀，添加.map后缀）
    const baseName = jsFile.name.replace(/\.js$/, "");
    const exactMatch = sourcemapFiles.find(
      (sm) => sm.name === `${baseName}.map`
    );

    if (exactMatch) {
      return exactMatch;
    }

    // 方法2: 通过路径匹配
    const jsDir = this.getDirectoryPath(jsFile.path);
    const jsBaseName = this.getBaseFileName(jsFile.name);

    return (
      sourcemapFiles.find((sm) => {
        const smDir = this.getDirectoryPath(sm.path);
        const smBaseName = this.getBaseFileName(sm.name);

        return smDir === jsDir && smBaseName === jsBaseName;
      }) || null
    );
  }

  /**
   * 检查文件是否匹配
   */
  private isMatchingPair(
    jsFile: SourceFile,
    sourcemapFile: SourcemapFile
  ): boolean {
    const jsBaseName = this.getBaseFileName(jsFile.name);
    const smBaseName = this.getBaseFileName(sourcemapFile.name);

    return jsBaseName === smBaseName;
  }

  /**
   * 获取目录路径
   */
  private getDirectoryPath(filePath: string): string {
    const lastSlashIndex = filePath.lastIndexOf("/");
    return lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : "";
  }

  /**
   * 获取文件名（不含扩展名）
   */
  private getBaseFileName(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf(".");
    return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  }

  /**
   * 生成验证报告
   */
  generateValidationReport(result: ValidationResult): string {
    const { summary, issues } = result;

    let report = `# Sourcemap验证报告\n\n`;
    report += `## 概览\n`;
    report += `- 总文件数: ${summary.totalFiles}\n`;
    report += `- Sourcemap文件数: ${summary.sourcemapFiles}\n`;
    report += `- 覆盖率: ${summary.coverage}%\n`;
    report += `- 问题总数: ${issues.length}\n\n`;

    if (issues.length === 0) {
      report += `✅ 所有文件验证通过！\n`;
      return report;
    }

    // 按严重程度分组
    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");
    const infos = issues.filter((i) => i.severity === "info");

    if (errors.length > 0) {
      report += `## ❌ 错误 (${errors.length})\n`;
      errors.forEach((issue) => {
        report += `- **${issue.file}**: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `  💡 建议: ${issue.suggestion}\n`;
        }
      });
      report += `\n`;
    }

    if (warnings.length > 0) {
      report += `## ⚠️ 警告 (${warnings.length})\n`;
      warnings.forEach((issue) => {
        report += `- **${issue.file}**: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `  💡 建议: ${issue.suggestion}\n`;
        }
      });
      report += `\n`;
    }

    if (infos.length > 0) {
      report += `## ℹ️ 信息 (${infos.length})\n`;
      infos.forEach((issue) => {
        report += `- **${issue.file}**: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `  💡 建议: ${issue.suggestion}\n`;
        }
      });
      report += `\n`;
    }

    // 添加改进建议
    report += `## 🔧 改进建议\n`;
    if (summary.coverage < 100) {
      report += `1. 提高sourcemap覆盖率到100%\n`;
    }
    if (errors.length > 0) {
      report += `2. 修复所有错误级别的验证问题\n`;
    }
    if (warnings.length > 0) {
      report += `3. 解决警告级别的问题以提高质量\n`;
    }
    report += `4. 确保构建配置正确启用sourcemap生成\n`;
    report += `5. 验证JS文件和sourcemap文件的路径一致性\n`;

    return report;
  }

  /**
   * 检查sourcemap文件大小是否合理
   */
  validateSourcemapSize(
    sourcemapFile: SourcemapFile,
    jsFile: SourceFile
  ): {
    isValid: boolean;
    ratio: number;
    message: string;
  } {
    const jsSize = jsFile.size;
    const sourcemapSize = Buffer.byteLength(sourcemapFile.content, "utf8");
    const ratio = sourcemapSize / jsSize;

    // 通常sourcemap文件大小应该在JS文件的1-5倍之间
    if (ratio < 0.5) {
      return {
        isValid: false,
        ratio,
        message: "Sourcemap文件过小，可能缺少必要的映射信息",
      };
    }

    if (ratio > 10) {
      return {
        isValid: false,
        ratio,
        message: "Sourcemap文件过大，可能存在冗余信息",
      };
    }

    return {
      isValid: true,
      ratio,
      message: "Sourcemap文件大小合理",
    };
  }

  /**
   * 批量验证多个sourcemap文件
   */
  async batchValidateSourcemaps(sourcemapFiles: SourcemapFile[]): Promise<{
    valid: SourcemapFile[];
    invalid: Array<{ file: SourcemapFile; error: string }>;
  }> {
    const valid: SourcemapFile[] = [];
    const invalid: Array<{ file: SourcemapFile; error: string }> = [];

    for (const file of sourcemapFiles) {
      const validation = await this.validateSourcemapFile(file);
      if (validation.isValid) {
        valid.push(file);
      } else {
        invalid.push({ file, error: validation.error || "未知错误" });
      }
    }

    return { valid, invalid };
  }
}

export default SourcemapValidator;
