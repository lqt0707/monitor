import { Injectable, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ErrorAggregation } from "../modules/monitor/entities/error-aggregation.entity";
import { ErrorLog } from "../modules/monitor/entities/error-log.entity";
import { SourceLocation } from "../modules/sourcemap/services/sourcemap.service";
import { DeepSeekService } from "../modules/deepseek/deepseek.service";

/**
 * AI错误诊断服务
 * 使用DeepSeek大模型进行错误分析和修复建议
 * 架构设计保持可扩展性，便于未来集成其他模型
 */
@Injectable()
export class AiDiagnosisService {
  private readonly logger = new Logger(AiDiagnosisService.name);
  private isEnabled: boolean = false;

  constructor(
    private configService: ConfigService,
    private deepSeekService: DeepSeekService,
    @InjectRepository(ErrorLog)
    private errorLogRepository: Repository<ErrorLog>,
    @InjectRepository(ErrorAggregation)
    private errorAggregationRepository: Repository<ErrorAggregation>
  ) {
    this.initializeService();
  }

  /**
   * 初始化AI诊断服务
   */
  private initializeService(): void {
    // 检查DeepSeek服务是否可用
    if (this.deepSeekService.isAvailable()) {
      this.isEnabled = true;
      this.logger.log("AI诊断服务初始化成功（使用DeepSeek模型）");
    } else {
      this.logger.warn("DeepSeek服务不可用，AI诊断功能将不可用");
    }
  }

  /**
   * 诊断错误并生成修复建议
   * @param errorAggregation 错误聚合信息
   * @param sourceLocation 源代码位置信息（可选）
   * @returns 诊断结果
   */
  async diagnoseError(
    errorAggregation: ErrorAggregation,
    sourceLocation?: SourceLocation
  ): Promise<DiagnosisResult | null> {
    // 检查服务是否可用
    if (!this.isEnabled) {
      this.logger.warn("AI诊断服务未启用");
      return null;
    }

    // 使用DeepSeek进行错误诊断
    return this.diagnoseWithDeepSeek(errorAggregation, sourceLocation);
  }

  /**
   * 使用DeepSeek进行错误诊断
   */
  private async diagnoseWithDeepSeek(
    errorAggregation: ErrorAggregation,
    sourceLocation?: SourceLocation
  ): Promise<DiagnosisResult | null> {
    try {
      const errorStack =
        errorAggregation.errorStack ||
        `${errorAggregation.type}: ${errorAggregation.errorMessage}`;
      let sourceContext: string | undefined;

      // 如果有源代码位置信息，提取上下文
      if (sourceLocation?.sourceContent) {
        sourceContext = this.extractContextCode(
          sourceLocation.sourceContent,
          sourceLocation.line,
          10
        );
      }

      const deepSeekResult = await this.deepSeekService.analyzeJavaScriptError(
        errorStack,
        sourceContext,
        errorAggregation.projectId
      );

      if (!deepSeekResult) {
        this.logger.warn("DeepSeek分析返回空结果");
        return null;
      }

      // 转换DeepSeek结果到标准格式
      const result: DiagnosisResult = {
        analysis: deepSeekResult.errorAnalysis,
        possibleCauses: [deepSeekResult.frameworkContext],
        fixSuggestions: deepSeekResult.fixSuggestions,
        preventionMeasures: deepSeekResult.preventionMeasures,
        severity: this.determineSeverity(deepSeekResult.errorAnalysis),
        rawResponse: deepSeekResult.rawResponse,
        exactLocation: deepSeekResult.exactLocation,
      };

      this.logger.log(`DeepSeek诊断完成: ${errorAggregation.errorHash}`);
      return result;
    } catch (error) {
      this.logger.error(`DeepSeek诊断失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 构建系统提示词
   * @returns 系统提示词
   */
  private buildSystemPrompt(): string {
    return `你是一个专业的前端错误诊断专家。你的任务是分析JavaScript/TypeScript错误，并提供准确的诊断和修复建议。

请按照以下格式回复：

**错误分析：**
[详细分析错误的原因和可能的触发条件]

**可能原因：**
1. [原因1]
2. [原因2]
3. [原因3]

**修复建议：**
1. [具体的修复步骤1]
2. [具体的修复步骤2]
3. [具体的修复步骤3]

**预防措施：**
[如何预防类似错误再次发生的建议]

**严重程度：**
[低/中/高] - [简要说明严重程度的理由]

请确保你的回复专业、准确、可操作。`;
  }

  /**
   * 构建用户提示词
   * @param errorAggregation 错误聚合信息
   * @param sourceLocation 源代码位置信息
   * @returns 用户提示词
   */
  private buildUserPrompt(
    errorAggregation: ErrorAggregation,
    sourceLocation?: SourceLocation
  ): string {
    let prompt = `请分析以下JavaScript错误：

`;

    prompt += `**错误类型：** ${errorAggregation.type}\n`;
    prompt += `**错误消息：** ${errorAggregation.errorMessage}\n`;
    prompt += `**出现次数：** ${errorAggregation.occurrenceCount}\n`;
    prompt += `**影响用户数：** ${errorAggregation.affectedUsers}\n`;

    if (errorAggregation.errorStack) {
      prompt += `\n**错误堆栈：**\n\`\`\`\n${errorAggregation.errorStack}\n\`\`\`\n`;
    }

    if (sourceLocation) {
      prompt += `\n**源代码位置：**\n`;
      prompt += `- 文件：${sourceLocation.source}\n`;
      prompt += `- 行号：${sourceLocation.line}\n`;
      prompt += `- 列号：${sourceLocation.column}\n`;

      if (sourceLocation.name) {
        prompt += `- 函数/变量名：${sourceLocation.name}\n`;
      }

      if (sourceLocation.sourceContent) {
        // 提取错误行周围的代码
        const contextCode = this.extractContextCode(
          sourceLocation.sourceContent,
          sourceLocation.line,
          5
        );
        if (contextCode) {
          prompt += `\n**相关源代码：**\n\`\`\`javascript\n${contextCode}\n\`\`\`\n`;
        }
      }
    }

    return prompt;
  }

  /**
   * 提取错误行周围的代码上下文
   * @param sourceContent 源代码内容
   * @param errorLine 错误行号
   * @param contextLines 上下文行数
   * @returns 代码上下文
   */
  private extractContextCode(
    sourceContent: string,
    errorLine: number,
    contextLines: number = 5
  ): string | null {
    try {
      const lines = sourceContent.split("\n");
      const startLine = Math.max(0, errorLine - contextLines - 1);
      const endLine = Math.min(lines.length, errorLine + contextLines);

      const contextLines_array = lines.slice(startLine, endLine);

      return contextLines_array
        .map((line, index) => {
          const lineNumber = startLine + index + 1;
          const marker = lineNumber === errorLine ? ">>> " : "    ";
          return `${marker}${lineNumber.toString().padStart(3, " ")}: ${line}`;
        })
        .join("\n");
    } catch (error) {
      this.logger.warn(`提取代码上下文失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 根据错误分析确定严重程度
   */
  private determineSeverity(analysis: string): "low" | "medium" | "high" {
    const lowerAnalysis = analysis.toLowerCase();

    if (
      lowerAnalysis.includes("critical") ||
      lowerAnalysis.includes("fatal") ||
      lowerAnalysis.includes("严重") ||
      lowerAnalysis.includes("崩溃")
    ) {
      return "high";
    }

    if (
      lowerAnalysis.includes("warning") ||
      lowerAnalysis.includes("minor") ||
      lowerAnalysis.includes("警告") ||
      lowerAnalysis.includes("轻微")
    ) {
      return "low";
    }

    return "medium";
  }

  /**
   * 解析AI响应
   * @param content AI响应内容
   * @returns 诊断结果
   */
  private parseResponse(content: string): DiagnosisResult {
    const result: DiagnosisResult = {
      analysis: "",
      possibleCauses: [],
      fixSuggestions: [],
      preventionMeasures: "",
      severity: "medium",
      rawResponse: content,
    };

    try {
      // 解析错误分析
      const analysisMatch = content.match(
        /\*\*错误分析：\*\*\s*([\s\S]*?)(?=\*\*可能原因：\*\*|$)/i
      );
      if (analysisMatch) {
        result.analysis = analysisMatch[1].trim();
      }

      // 解析可能原因
      const causesMatch = content.match(
        /\*\*可能原因：\*\*\s*([\s\S]*?)(?=\*\*修复建议：\*\*|$)/i
      );
      if (causesMatch) {
        const causesText = causesMatch[1].trim();
        result.possibleCauses = this.extractListItems(causesText);
      }

      // 解析修复建议
      const fixMatch = content.match(
        /\*\*修复建议：\*\*\s*([\s\S]*?)(?=\*\*预防措施：\*\*|$)/i
      );
      if (fixMatch) {
        const fixText = fixMatch[1].trim();
        result.fixSuggestions = this.extractListItems(fixText);
      }

      // 解析预防措施
      const preventionMatch = content.match(
        /\*\*预防措施：\*\*\s*([\s\S]*?)(?=\*\*严重程度：\*\*|$)/i
      );
      if (preventionMatch) {
        result.preventionMeasures = preventionMatch[1].trim();
      }

      // 解析严重程度
      const severityMatch = content.match(/\*\*严重程度：\*\*\s*(低|中|高)/i);
      if (severityMatch) {
        const severityText = severityMatch[1];
        result.severity =
          severityText === "低"
            ? "low"
            : severityText === "高"
              ? "high"
              : "medium";
      }
    } catch (error) {
      this.logger.warn(`解析AI响应失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 检查AI诊断服务是否可用
   * @returns 是否可用
   */
  isAvailable(): boolean {
    return this.isEnabled;
  }

  /**
   * 异步执行诊断任务
   * @param errorId 错误日志ID
   * @param taskId 任务ID
   */
  private async performDiagnosisAsync(
    errorId: number,
    taskId: string
  ): Promise<void> {
    this.logger.log(`开始异步诊断任务: ${taskId}`);

    try {
      // 获取错误日志详情
      const errorLog = await this.errorLogRepository.findOne({
        where: { id: errorId },
      });

      if (!errorLog) {
        this.logger.error(`诊断任务失败: 错误日志不存在 - ${errorId}`);
        return;
      }

      // 获取错误聚合信息
      const errorAggregation = {
        type: errorLog.type,
        errorMessage: errorLog.errorMessage,
        errorStack: errorLog.errorStack,
        errorHash: errorLog.errorHash,
        projectId: errorLog.projectId,
        occurrenceCount: 1,
        affectedUsers: 1,
      };

      // 执行AI诊断
      const diagnosisResult = await this.diagnoseError(
        errorAggregation as ErrorAggregation
      );

      if (diagnosisResult) {
        // 保存诊断结果到数据库
        errorLog.aiDiagnosis = JSON.stringify(diagnosisResult);
        await this.errorLogRepository.save(errorLog);
        this.logger.log(`诊断任务完成并保存结果: ${taskId}`);
      } else {
        this.logger.warn(`诊断任务完成但无结果: ${taskId}`);
      }
    } catch (error) {
      this.logger.error(
        `诊断任务失败: ${taskId} - ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * 获取错误日志的AI诊断结果（修复版）
   * @param errorId 错误日志ID
   * @returns AI诊断结果
   */
  async getErrorDiagnosis(errorId: number): Promise<any> {
    try {
      this.logger.log(`开始获取错误ID ${errorId} 的AI诊断结果`);

      // 首先获取错误日志详情
      const errorLog = await this.errorLogRepository.findOne({
        where: { id: errorId },
      });

      if (!errorLog) {
        throw new Error(`错误日志不存在: ${errorId}`);
      }

      this.logger.log(
        `找到错误日志: ${errorId}, 项目ID: ${errorLog.projectId}, 错误哈希: ${errorLog.errorHash}`
      );

      // 检查错误日志中是否已有AI诊断结果
      if (errorLog.aiDiagnosis) {
        this.logger.log(`从错误日志中获取到AI诊断结果: ${errorId}`);
        return JSON.parse(errorLog.aiDiagnosis);
      }

      // 如果错误日志中没有诊断结果，尝试从错误聚合表中查找
      this.logger.log(
        `错误日志中无AI诊断结果，尝试从错误聚合表中查找: ${errorId}`
      );

      // 通过错误哈希和项目ID查找对应的错误聚合
      const errorAggregation = await this.errorAggregationRepository.findOne({
        where: {
          errorHash: errorLog.errorHash,
          projectId: errorLog.projectId,
        },
      });

      if (errorAggregation && errorAggregation.aiDiagnosis) {
        this.logger.log(
          `从错误聚合表中获取到AI诊断结果: ${errorId}, 聚合ID: ${errorAggregation.id}`
        );

        // 将聚合表中的诊断结果同步到错误日志中，避免重复查询
        try {
          errorLog.aiDiagnosis = errorAggregation.aiDiagnosis;
          await this.errorLogRepository.save(errorLog);
          this.logger.log(`已将AI诊断结果同步到错误日志: ${errorId}`);
        } catch (syncError) {
          this.logger.warn(
            `同步AI诊断结果到错误日志失败: ${errorId}, 错误: ${syncError.message}`
          );
        }

        return JSON.parse(errorAggregation.aiDiagnosis);
      }

      // 如果都没有找到，返回空结果
      this.logger.log(`未找到错误ID ${errorId} 的AI诊断结果`);
      return {
        status: "pending",
        message: "该错误尚未进行AI诊断",
        errorId: errorId,
        errorHash: errorLog.errorHash,
        projectId: errorLog.projectId,
      };
    } catch (error) {
      this.logger.error(`获取错误诊断结果失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取错误聚合的AI诊断结果
   * @param aggregationId 错误聚合ID
   * @returns AI诊断结果
   */
  async getAggregationDiagnosis(aggregationId: number): Promise<any> {
    // TODO: 实现获取聚合诊断结果的逻辑
    // 目前先返回空实现
    return {
      status: "not_implemented",
      message: "聚合诊断功能尚未实现",
    };
  }

  /**
   * 触发错误诊断
   * @param errorId 错误日志ID
   * @returns 诊断任务ID
   */
  async triggerErrorDiagnosis(errorId: number): Promise<string> {
    try {
      // 获取错误日志详情
      const errorLog = await this.errorLogRepository.findOne({
        where: { id: errorId },
      });

      if (!errorLog) {
        throw new Error(`错误日志不存在: ${errorId}`);
      }

      // 生成任务ID
      const taskId = `ai_diagnosis_${errorId}_${Date.now()}`;

      // 异步执行诊断任务
      this.performDiagnosisAsync(errorId, taskId);

      return taskId;
    } catch (error) {
      this.logger.error(`触发诊断失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取诊断任务状态
   * @param taskId 诊断任务ID
   * @returns 任务状态
   */
  async getDiagnosisStatus(taskId: string): Promise<any> {
    // 解析任务ID获取错误ID
    const match = taskId.match(/ai_diagnosis_(\d+)_/);
    if (!match) {
      throw new Error(`无效的任务ID: ${taskId}`);
    }

    const errorId = parseInt(match[1]);

    try {
      // 获取错误日志详情
      const errorLog = await this.errorLogRepository.findOne({
        where: { id: errorId },
      });

      if (!errorLog) {
        return {
          status: "error",
          message: "错误日志不存在",
        };
      }

      // 检查是否已有AI诊断结果
      if (errorLog.aiDiagnosis) {
        const diagnosis = JSON.parse(errorLog.aiDiagnosis);
        return {
          status: "completed",
          result: diagnosis,
        };
      }

      // 如果没有诊断结果，返回进行中状态
      return {
        status: "processing",
        message: "AI诊断正在进行中",
      };
    } catch (error) {
      this.logger.error(`获取诊断状态失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 生成综合分析报告（优化版）
   * 合并AI诊断和综合分析为单次调用，提高效率
   * @param analysisData 综合分析请求数据
   * @returns 综合分析报告
   */
  async generateComprehensiveAnalysis(
    analysisData: any
  ): Promise<ComprehensiveAnalysisReport> {
    try {
      this.logger.log(`开始生成综合分析报告: ${analysisData.errorId}`);

      // 验证必要参数
      if (!analysisData.errorId) {
        throw new Error("缺少必要的分析参数");
      }

      // 构建统一的综合分析提示词（包含诊断和分析）
      const unifiedPrompt = this.buildUnifiedAnalysisPrompt(analysisData);

      // 单次AI调用完成所有分析工作
      const aiResponse = await this.deepSeekService.analyzeJavaScriptError(
        unifiedPrompt, // 使用统一提示词
        "", // 不需要额外的源代码上下文，已在提示词中包含
        analysisData.errorId?.toString()
      );

      if (!aiResponse) {
        throw new Error("AI综合分析失败");
      }

      // 直接构建综合分析报告，无需额外解析
      const report = this.buildOptimizedAnalysisReport(
        analysisData,
        aiResponse
      );

      // 自动存储综合分析报告到数据库
      try {
        const storeResult = await this.storeComprehensiveAnalysisReport(
          analysisData.errorId,
          report
        );

        if (storeResult) {
          this.logger.log(
            `综合分析报告已成功存储到数据库: ${analysisData.errorId}`
          );
        } else {
          this.logger.warn(
            `综合分析报告存储到数据库失败: ${analysisData.errorId}`
          );
        }
      } catch (storeError) {
        this.logger.error(
          `存储综合分析报告时发生错误: ${analysisData.errorId}, 错误: ${storeError.message}`
        );
        // 存储失败不影响报告返回，只记录日志
      }

      this.logger.log(`综合分析报告生成完成: ${analysisData.errorId}`);
      return report;
    } catch (error) {
      this.logger.error(`生成综合分析报告失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 构建统一的分析提示词（优化版）
   * 将诊断和分析需求合并为一个提示词，减少AI调用次数
   */
  private buildUnifiedAnalysisPrompt(analysisData: any): string {
    return `你是一个专业的前端错误诊断专家，请对以下错误进行全面的分析和诊断。

**错误基本信息：**
- 错误ID: ${analysisData.errorId}
- 错误消息: ${analysisData.errorMessage || "未知错误"}
- 项目版本: ${analysisData.projectVersion || "未知"}
- 源文件: ${analysisData.sourceFile || "未知文件"}
- 源行号: ${analysisData.sourceLine || "未知"}

**错误堆栈信息：**
\`\`\`
${analysisData.errorStack || "无堆栈信息"}
\`\`\`

**现有AI诊断结果（如果有）：**
${this.formatExistingDiagnosis(analysisData.aiDiagnosis)}

**源代码信息：**
${this.formatSourceCodeForPrompt(analysisData.sourceCode)}

**SourceMap映射信息：**
${this.formatSourceMapForPrompt(analysisData.sourceCode)}

请基于以上信息，生成一份完整的错误分析报告，包含以下内容：

**1. 错误根本原因分析**
- 主要问题：[请分析错误的根本原因]
- 可能原因：[列出可能的触发条件]
- 错误上下文：[分析错误的技术背景]

**2. 问题代码精确定位**
- 文件路径：[具体文件位置]
- 行号列号：[精确的行列位置]
- 函数名：[出错的函数名称]
- SourceMap映射：[原始代码位置]

**3. 具体修改建议方案**
- 立即修复：[紧急修复步骤]
- 长期解决方案：[根本性解决方案]
- 代码示例：[具体的修改代码]
- 最佳实践：[推荐的代码规范]

**4. 技术细节分析**
- 严重程度：[低/中/高]
- 系统影响：[对系统的影响评估]
- 预防措施：[避免类似错误的建议]

请确保分析结果准确、详细且可操作。`;
  }

  /**
   * 格式化现有诊断结果（如果有）
   */
  private formatExistingDiagnosis(aiDiagnosis: any): string {
    if (!aiDiagnosis) return "无现有诊断结果";

    let formatted = "";
    if (aiDiagnosis.diagnosis)
      formatted += `- 诊断分析: ${aiDiagnosis.diagnosis}\n`;
    if (aiDiagnosis.confidence)
      formatted += `- 置信度: ${aiDiagnosis.confidence}\n`;
    if (aiDiagnosis.fixSuggestion)
      formatted += `- 修复建议: ${aiDiagnosis.fixSuggestion}\n`;
    if (aiDiagnosis["diagnosis-basis"])
      formatted += `- 诊断依据: ${aiDiagnosis["diagnosis-basis"]}\n`;

    return formatted || "现有诊断结果格式异常";
  }

  /**
   * 构建优化的分析报告（减少解析步骤）
   */
  private buildOptimizedAnalysisReport(
    analysisData: any,
    aiResponse: any
  ): ComprehensiveAnalysisReport {
    // 直接使用AI响应构建报告，减少中间解析步骤
    const analysisContent = aiResponse.errorAnalysis || "";

    return {
      id: `comprehensive_${analysisData.errorId}_${Date.now()}`,
      errorId: analysisData.errorId,
      timestamp: new Date().toISOString(),
      status: "completed",

      // 错误根本原因分析
      rootCauseAnalysis: {
        mainProblem:
          this.extractMainProblem(analysisContent) || "无法确定主要问题",
        possibleCauses: this.extractPossibleCauses(analysisContent) || [
          "需要进一步分析",
        ],
        errorContext: {
          errorType: analysisData.errorMessage || "未知错误",
          errorMessage: analysisData.errorMessage || "未知错误",
          projectVersion: analysisData.projectVersion || "未知",
          occurrenceTime: analysisData.timestamp || new Date().toISOString(),
        },
        confidence: this.determineConfidence(aiResponse.confidence),
      },

      // 问题代码精确定位
      codeLocation: {
        filePath: analysisData.sourceFile || "未知文件",
        lineNumber: analysisData.sourceLine || 0,
        columnNumber: 0,
        functionName: this.extractFunctionName(analysisContent) || "未知函数",
        sourcemapInfo: {
          originalFile: analysisData.sourceCode?.sourcemap?.originalFile,
          originalLine: analysisData.sourceCode?.sourcemap?.originalLine,
          originalColumn: analysisData.sourceCode?.sourcemap?.originalColumn,
          originalName: analysisData.sourceCode?.sourcemap?.originalName,
        },
        codePreview: analysisData.sourceCode?.codeContent || "无法获取代码预览",
      },

      // 具体修改建议方案
      fixSuggestions: {
        immediateFixes: this.extractImmediateFixes(analysisContent) || [
          "需要进一步分析",
        ],
        longTermSolutions: this.extractLongTermSolutions(analysisContent) || [
          "需要进一步分析",
        ],
        codeExamples: this.extractCodeExamples(analysisContent),
        bestPractices: this.extractBestPractices(analysisContent) || [
          "遵循代码规范",
        ],
      },

      // 技术细节分析
      technicalDetails: {
        errorSeverity: this.extractErrorSeverity(analysisContent),
        systemImpact:
          this.extractSystemImpact(analysisContent) || "需要进一步评估",
        technicalContext: "基于AI分析的错误诊断",
        preventionMeasures: this.extractPreventionMeasures(analysisContent) || [
          "加强代码审查",
        ],
      },

      // 元数据
      metadata: {
        analysisDuration: "AI分析完成",
        dataSources: ["AI诊断", "源代码", "SourceMap"],
        aiModel: "DeepSeek",
        version: "2.0.0",
        optimization: "单次AI调用完成全部分析",
      },
    };
  }

  /**
   * 提取主要问题（优化版）
   */
  private extractMainProblem(content: string): string | null {
    const match = content.match(/主要问题[：:]\s*([^\n]+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * 提取可能原因（优化版）
   */
  private extractPossibleCauses(content: string): string[] {
    const match = content.match(
      /可能原因[：:]\s*([\s\S]*?)(?=问题代码精确定位|具体修改建议方案|$)/
    );
    if (!match) return [];

    return this.extractListItems(match[1]);
  }

  /**
   * 提取立即修复（优化版）
   */
  private extractImmediateFixes(content: string): string[] {
    const match = content.match(
      /立即修复[：:]\s*([\s\S]*?)(?=长期解决方案|代码示例|$)/
    );
    if (!match) return [];

    return this.extractListItems(match[1]);
  }

  /**
   * 提取长期解决方案（优化版）
   */
  private extractLongTermSolutions(content: string): string[] {
    const match = content.match(
      /长期解决方案[：:]\s*([\s\S]*?)(?=代码示例|最佳实践|$)/
    );
    if (!match) return [];

    return this.extractListItems(match[1]);
  }

  /**
   * 提取最佳实践（优化版）
   */
  private extractBestPractices(content: string): string[] {
    const match = content.match(/最佳实践[：:]\s*([\s\S]*?)(?=技术细节分析|$)/);
    if (!match) return [];

    return this.extractListItems(match[1]);
  }

  /**
   * 提取预防措施（优化版）
   */
  private extractPreventionMeasures(content: string): string[] {
    const match = content.match(/预防措施[：:]\s*([\s\S]*?)(?=技术细节分析|$)/);
    if (!match) return [];

    return this.extractListItems(match[1]);
  }

  /**
   * 提取函数名（优化版）
   */
  private extractFunctionName(content: string): string | null {
    const match = content.match(/函数名[：:]\s*([^\n]+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * 提取错误严重程度（优化版）
   */
  private extractErrorSeverity(content: string): string {
    const match = content.match(/严重程度[：:]\s*(低|中|高|low|medium|high)/i);
    if (match) {
      const severity = match[1].toLowerCase();
      return severity === "低" || severity === "low"
        ? "low"
        : severity === "高" || severity === "high"
          ? "high"
          : "medium";
    }
    return "medium";
  }

  /**
   * 提取系统影响（优化版）
   */
  private extractSystemImpact(content: string): string | null {
    const match = content.match(/系统影响[：:]\s*([^\n]+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * 确定置信度（优化版）
   */
  private determineConfidence(confidence: number): string {
    if (confidence >= 0.8) return "high";
    if (confidence >= 0.5) return "medium";
    return "low";
  }

  /**
   * 格式化源代码信息用于提示词
   */
  private formatSourceCodeForPrompt(sourceCode: any): string {
    if (!sourceCode) return "无源代码信息";

    let formatted = "";
    if (sourceCode.filePath)
      formatted += `- 文件路径: ${sourceCode.filePath}\n`;
    if (sourceCode.lineNumber)
      formatted += `- 行号: ${sourceCode.lineNumber}\n`;
    if (sourceCode.columnNumber)
      formatted += `- 列号: ${sourceCode.columnNumber}\n`;
    if (sourceCode.functionName)
      formatted += `- 函数名: ${sourceCode.functionName}\n`;
    if (sourceCode.codeContent) {
      formatted += `- 代码内容:\n\`\`\`javascript\n${sourceCode.codeContent}\n\`\`\`\n`;
    }

    return formatted || "源代码信息格式异常";
  }

  /**
   * 格式化SourceMap信息用于提示词
   */
  private formatSourceMapForPrompt(sourceCode: any): string {
    if (!sourceCode || !sourceCode.sourcemap) return "无SourceMap信息";

    let formatted = "";
    if (sourceCode.sourcemap.originalFile)
      formatted += `- 原始文件: ${sourceCode.sourcemap.originalFile}\n`;
    if (sourceCode.sourcemap.originalLine)
      formatted += `- 原始行号: ${sourceCode.sourcemap.originalLine}\n`;
    if (sourceCode.sourcemap.originalColumn)
      formatted += `- 原始列号: ${sourceCode.sourcemap.originalColumn}\n`;
    if (sourceCode.sourcemap.originalName)
      formatted += `- 原始名称: ${sourceCode.sourcemap.originalName}\n`;

    return formatted || "SourceMap信息格式异常";
  }

  /**
   * 提取代码示例
   */
  private extractCodeExamples(text: string): string[] {
    const codeBlocks = text.match(/```[\s\S]*?```/g);
    if (!codeBlocks) return [];

    return codeBlocks.map((block) => block.replace(/```/g, "").trim());
  }

  /**
   * 提取列表项（增强版）
   */
  private extractListItems(text: string, regex?: RegExp): string[] {
    let targetText = text;

    if (regex) {
      const match = text.match(regex);
      if (match) {
        targetText = match[1];
      } else {
        return [];
      }
    }

    const items = [];
    const lines = targetText.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 匹配数字列表项 (1. 2. 3. 等)
      const numberMatch = trimmedLine.match(/^\d+\.\s*(.+)$/);
      if (numberMatch) {
        items.push(numberMatch[1].trim());
        continue;
      }

      // 匹配破折号列表项 (- 等)
      const dashMatch = trimmedLine.match(/^[-*]\s*(.+)$/);
      if (dashMatch) {
        items.push(dashMatch[1].trim());
        continue;
      }

      // 如果不是列表项但有内容，也添加进去
      if (
        trimmedLine &&
        !trimmedLine.startsWith("**") &&
        !trimmedLine.startsWith("```")
      ) {
        items.push(trimmedLine);
      }
    }

    return items.filter((item) => item.length > 0);
  }

  /**
   * 存储综合分析报告到数据库
   * @param errorId 错误ID
   * @param comprehensiveReport 综合分析报告
   * @returns 存储结果
   */
  async storeComprehensiveAnalysisReport(
    errorId: number,
    comprehensiveReport: ComprehensiveAnalysisReport
  ): Promise<boolean> {
    try {
      this.logger.log(`开始存储错误ID ${errorId} 的综合分析报告`);

      // 首先尝试存储到错误日志表
      const errorLog = await this.errorLogRepository.findOne({
        where: { id: errorId },
      });

      if (errorLog) {
        // 更新错误日志表
        errorLog.comprehensiveAnalysisReport =
          JSON.stringify(comprehensiveReport);
        errorLog.comprehensiveAnalysisGeneratedAt = new Date();
        errorLog.comprehensiveAnalysisVersion =
          comprehensiveReport.metadata.version || "1.0.0";

        await this.errorLogRepository.save(errorLog);
        this.logger.log(`已存储综合分析报告到错误日志表: ${errorId}`);
      }

      // 同时存储到错误聚合表
      if (errorLog) {
        const errorAggregation = await this.errorAggregationRepository.findOne({
          where: {
            errorHash: errorLog.errorHash,
            projectId: errorLog.projectId,
          },
        });

        if (errorAggregation) {
          // 更新错误聚合表
          errorAggregation.comprehensiveAnalysisReport =
            JSON.stringify(comprehensiveReport);
          errorAggregation.comprehensiveAnalysisGeneratedAt = new Date();
          errorAggregation.comprehensiveAnalysisVersion =
            comprehensiveReport.metadata.version || "1.0.0";

          await this.errorAggregationRepository.save(errorAggregation);
          this.logger.log(
            `已存储综合分析报告到错误聚合表: ${errorId}, 聚合ID: ${errorAggregation.id}`
          );
        }
      }

      this.logger.log(`综合分析报告存储完成: ${errorId}`);
      return true;
    } catch (error) {
      this.logger.error(`存储综合分析报告失败: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 获取综合分析报告
   * @param errorId 错误ID
   * @returns 综合分析报告
   */
  async getComprehensiveAnalysisReport(
    errorId: number
  ): Promise<ComprehensiveAnalysisReport | null> {
    try {
      this.logger.log(`开始获取错误ID ${errorId} 的综合分析报告`);

      // 首先从错误日志表获取
      const errorLog = await this.errorLogRepository.findOne({
        where: { id: errorId },
      });

      if (errorLog?.comprehensiveAnalysisReport) {
        this.logger.log(`从错误日志表获取到综合分析报告: ${errorId}`);
        return JSON.parse(errorLog.comprehensiveAnalysisReport);
      }

      // 如果错误日志表中没有，尝试从错误聚合表获取
      if (errorLog) {
        const errorAggregation = await this.errorAggregationRepository.findOne({
          where: {
            errorHash: errorLog.errorHash,
            projectId: errorLog.projectId,
          },
        });

        if (errorAggregation?.comprehensiveAnalysisReport) {
          this.logger.log(
            `从错误聚合表获取到综合分析报告: ${errorId}, 聚合ID: ${errorAggregation.id}`
          );

          // 同步到错误日志表
          try {
            errorLog.comprehensiveAnalysisReport =
              errorAggregation.comprehensiveAnalysisReport;
            errorLog.comprehensiveAnalysisGeneratedAt =
              errorAggregation.comprehensiveAnalysisGeneratedAt;
            errorLog.comprehensiveAnalysisVersion =
              errorAggregation.comprehensiveAnalysisVersion;
            await this.errorLogRepository.save(errorLog);
            this.logger.log(`已将综合分析报告同步到错误日志表: ${errorId}`);
          } catch (syncError) {
            this.logger.warn(
              `同步综合分析报告到错误日志表失败: ${errorId}, 错误: ${syncError.message}`
            );
          }

          return JSON.parse(errorAggregation.comprehensiveAnalysisReport);
        }
      }

      this.logger.log(`未找到错误ID ${errorId} 的综合分析报告`);
      return null;
    } catch (error) {
      this.logger.error(`获取综合分析报告失败: ${error.message}`, error.stack);
      return null;
    }
  }
}

/**
 * 诊断结果接口
 */
export interface DiagnosisResult {
  analysis: string; // 错误分析
  possibleCauses: string[]; // 可能原因列表
  fixSuggestions: string[]; // 修复建议列表
  preventionMeasures: string; // 预防措施
  severity: "low" | "medium" | "high"; // 严重程度
  rawResponse: string; // 原始AI响应
  exactLocation?: {
    // 精确位置信息（DeepSeek特有）
    file?: string; // 文件路径
    line?: number; // 行号
    column?: number; // 列号
    function?: string; // 函数名
  };
}

/**
 * 综合分析报告接口
 */
export interface ComprehensiveAnalysisReport {
  id: string; // 报告ID
  errorId: number; // 错误ID
  timestamp: string; // 报告生成时间
  status: "pending" | "processing" | "completed" | "error"; // 报告状态

  // 错误根本原因分析
  rootCauseAnalysis: {
    mainProblem: string; // 主要问题
    possibleCauses: string[]; // 可能原因
    errorContext: {
      errorType: string; // 错误类型
      errorMessage: string; // 错误消息
      projectVersion: string; // 项目版本
      occurrenceTime: string; // 错误发生时间
    };
    confidence: string; // 置信度
  };

  // 问题代码精确定位
  codeLocation: {
    filePath: string; // 文件路径
    lineNumber: number; // 行号
    columnNumber: number; // 列号
    functionName: string; // 函数名
    sourcemapInfo: {
      originalFile?: string; // 原始文件
      originalLine?: number; // 原始行号
      originalColumn?: number; // 原始列号
      originalName?: string; // 原始名称
    };
    codePreview: string; // 代码预览
  };

  // 具体修改建议方案
  fixSuggestions: {
    immediateFixes: string[]; // 立即修复
    longTermSolutions: string[]; // 长期解决方案
    codeExamples: string[]; // 代码示例
    bestPractices: string[]; // 最佳实践
  };

  // 技术细节分析
  technicalDetails: {
    errorSeverity: string; // 错误严重程度
    systemImpact: string; // 系统影响
    technicalContext: string; // 技术背景
    preventionMeasures: string[]; // 预防措施
  };

  // 元数据
  metadata: {
    analysisDuration: string; // 分析持续时间
    dataSources: string[]; // 数据来源
    aiModel: string; // AI模型
    version: string; // 版本
    optimization?: string; // 优化信息
  };
}
