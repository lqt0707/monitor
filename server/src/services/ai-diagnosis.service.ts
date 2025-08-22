import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ErrorAggregation } from '../modules/monitor/entities/error-aggregation.entity';
import { SourceLocation } from '../modules/sourcemap/services/sourcemap.service';

/**
 * AI错误诊断服务
 * 使用LangChain和OpenAI API进行错误分析和修复建议
 */
@Injectable()
export class AiDiagnosisService {
  private readonly logger = new Logger(AiDiagnosisService.name);
  private chatModel: ChatOpenAI;
  private isEnabled: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeChatModel();
  }

  /**
   * 初始化聊天模型
   */
  private initializeChatModel(): void {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('AI_MODEL', 'gpt-3.5-turbo');
    const maxTokens = this.configService.get<number>('AI_MAX_TOKENS', 1000);
    const temperature = this.configService.get<number>('AI_TEMPERATURE', 0.3);

    if (!apiKey) {
      this.logger.warn('OpenAI API密钥未配置，AI诊断功能将不可用');
      return;
    }

    try {
      this.chatModel = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: model,
        maxTokens,
        temperature,
        timeout: 30000, // 30秒超时
      });
      
      this.isEnabled = true;
      this.logger.log('AI诊断服务初始化成功');
    } catch (error) {
      this.logger.error(`AI诊断服务初始化失败: ${error.message}`);
    }
  }

  /**
   * 诊断错误并生成修复建议
   * @param errorAggregation 错误聚合信息
   * @param sourceLocation 源代码位置信息（可选）
   * @returns 诊断结果
   */
  async diagnoseError(errorAggregation: ErrorAggregation, sourceLocation?: SourceLocation): Promise<DiagnosisResult | null> {
    if (!this.isEnabled) {
      this.logger.warn('AI诊断服务未启用');
      return null;
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(errorAggregation, sourceLocation);

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await this.chatModel.call(messages);
      const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const result = this.parseResponse(content);

      this.logger.log(`AI诊断完成: ${errorAggregation.errorHash}`);
      return result;
    } catch (error) {
      this.logger.error(`AI诊断失败: ${error.message}`);
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
  private buildUserPrompt(errorAggregation: ErrorAggregation, sourceLocation?: SourceLocation): string {
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
        const contextCode = this.extractContextCode(sourceLocation.sourceContent, sourceLocation.line, 5);
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
  private extractContextCode(sourceContent: string, errorLine: number, contextLines: number = 5): string | null {
    try {
      const lines = sourceContent.split('\n');
      const startLine = Math.max(0, errorLine - contextLines - 1);
      const endLine = Math.min(lines.length, errorLine + contextLines);
      
      const contextLines_array = lines.slice(startLine, endLine);
      
      return contextLines_array
        .map((line, index) => {
          const lineNumber = startLine + index + 1;
          const marker = lineNumber === errorLine ? '>>> ' : '    ';
          return `${marker}${lineNumber.toString().padStart(3, ' ')}: ${line}`;
        })
        .join('\n');
    } catch (error) {
      this.logger.warn(`提取代码上下文失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 解析AI响应
   * @param content AI响应内容
   * @returns 诊断结果
   */
  private parseResponse(content: string): DiagnosisResult {
    const result: DiagnosisResult = {
      analysis: '',
      possibleCauses: [],
      fixSuggestions: [],
      preventionMeasures: '',
      severity: 'medium',
      rawResponse: content,
    };

    try {
      // 解析错误分析
      const analysisMatch = content.match(/\*\*错误分析：\*\*\s*([\s\S]*?)(?=\*\*可能原因：\*\*|$)/i);
      if (analysisMatch) {
        result.analysis = analysisMatch[1].trim();
      }

      // 解析可能原因
      const causesMatch = content.match(/\*\*可能原因：\*\*\s*([\s\S]*?)(?=\*\*修复建议：\*\*|$)/i);
      if (causesMatch) {
        const causesText = causesMatch[1].trim();
        result.possibleCauses = this.extractListItems(causesText);
      }

      // 解析修复建议
      const fixMatch = content.match(/\*\*修复建议：\*\*\s*([\s\S]*?)(?=\*\*预防措施：\*\*|$)/i);
      if (fixMatch) {
        const fixText = fixMatch[1].trim();
        result.fixSuggestions = this.extractListItems(fixText);
      }

      // 解析预防措施
      const preventionMatch = content.match(/\*\*预防措施：\*\*\s*([\s\S]*?)(?=\*\*严重程度：\*\*|$)/i);
      if (preventionMatch) {
        result.preventionMeasures = preventionMatch[1].trim();
      }

      // 解析严重程度
      const severityMatch = content.match(/\*\*严重程度：\*\*\s*(低|中|高)/i);
      if (severityMatch) {
        const severityText = severityMatch[1];
        result.severity = severityText === '低' ? 'low' : severityText === '高' ? 'high' : 'medium';
      }
    } catch (error) {
      this.logger.warn(`解析AI响应失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 提取列表项
   * @param text 文本内容
   * @returns 列表项数组
   */
  private extractListItems(text: string): string[] {
    const items = [];
    const lines = text.split('\n');
    
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
      if (trimmedLine && !trimmedLine.startsWith('**')) {
        items.push(trimmedLine);
      }
    }
    
    return items.filter(item => item.length > 0);
  }

  /**
   * 检查AI诊断服务是否可用
   * @returns 是否可用
   */
  isAvailable(): boolean {
    return this.isEnabled;
  }
}

/**
 * 诊断结果接口
 */
export interface DiagnosisResult {
  analysis: string;              // 错误分析
  possibleCauses: string[];      // 可能原因列表
  fixSuggestions: string[];      // 修复建议列表
  preventionMeasures: string;    // 预防措施
  severity: 'low' | 'medium' | 'high'; // 严重程度
  rawResponse: string;           // 原始AI响应
}