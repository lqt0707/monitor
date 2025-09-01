import { Injectable, Logger } from '@nestjs/common';
import { CodeIndexerService, SearchResult } from '../../source-code/services/code-indexer.service';
import { SourceMapParserService, StackTraceLocation } from '../../source-code/services/sourcemap-parser.service';
import { DeepSeekService } from '../../deepseek/deepseek.service';

export interface RAGContext {
  errorMessage: string;
  stackTrace: string;
  projectPath: string;
  sourceMapDir?: string;
  framework?: string;
}

export interface RAGAnalysisResult {
  errorContext: {
    filePath: string;
    line: number;
    column: number;
    functionName?: string;
    originalLocation?: {
      file: string;
      line: number;
      column: number;
    };
  };
  possibleCauses: string[];
  codeContext: {
    relevantCode: string;
    imports: string[];
    dependencies: string[];
  };
  fixSuggestions: {
    immediate: string[];
    longTerm: string[];
    codeExamples: string[];
  };
  frameworkSpecific: {
    framework: string;
    bestPractices: string[];
    commonPatterns: string[];
  };
  confidence: number;
}

@Injectable()
export class RAGEngineService {
  private readonly logger = new Logger(RAGEngineService.name);

  constructor(
    private readonly codeIndexer: CodeIndexerService,
    private readonly sourceMapParser: SourceMapParserService,
    private readonly deepSeekService: DeepSeekService,
  ) {}

  /**
   * 执行RAG分析
   */
  async analyzeError(context: RAGContext): Promise<RAGAnalysisResult> {
    try {
      this.logger.log(`开始RAG错误分析: ${context.errorMessage.substring(0, 100)}...`);
      
      // 1. 解析堆栈信息
      const stackLocations = await this.sourceMapParser.parseStackTrace(
        context.stackTrace,
        context.projectPath,
        context.sourceMapDir
      );
      
      // 2. 语义搜索相关代码
      const searchResults = await this.searchRelevantCode(context, stackLocations);
      
      // 3. 构建RAG提示词
      const ragPrompt = this.buildRAGPrompt(context, stackLocations, searchResults);
      
      // 4. 调用AI生成分析结果
      const aiResponse = await this.deepSeekService.analyzeJavaScriptError(
        ragPrompt,
        this.formatSearchResults(searchResults),
        context.projectPath
      );
      
      // 5. 解析AI响应
      const result = this.parseAIResponse(aiResponse?.rawResponse || '', stackLocations, searchResults);
      
      this.logger.log('RAG错误分析完成');
      return result;
    } catch (error) {
      this.logger.error(`RAG错误分析失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 搜索相关代码
   */
  private async searchRelevantCode(
    context: RAGContext,
    stackLocations: StackTraceLocation[]
  ): Promise<SearchResult[]> {
    const searchQueries = [
      context.errorMessage,
      ...stackLocations.map(loc => loc.function || ''),
      context.framework || '',
    ].filter(Boolean);
    
    const allResults: SearchResult[] = [];
    
    for (const query of searchQueries) {
      try {
        const results = await this.codeIndexer.searchCode(query, {
          framework: context.framework,
        }, 5);
        allResults.push(...results);
      } catch (error) {
        this.logger.warn(`代码搜索失败: ${query}`, error.message);
      }
    }
    
    // 去重并按分数排序
    const uniqueResults = this.deduplicateResults(allResults);
    return uniqueResults.slice(0, 10);
  }

  /**
   * 构建RAG提示词
   */
  private buildRAGPrompt(
    context: RAGContext,
    stackLocations: StackTraceLocation[],
    searchResults: SearchResult[]
  ): string {
    return `你是一个专业的前端错误诊断专家，请基于以下信息进行详细的错误分析：

**错误信息：**
${context.errorMessage}

**错误堆栈：**
${context.stackTrace}

**项目信息：**
- 框架: ${context.framework || '未知'}
- 项目路径: ${context.projectPath}

**相关代码上下文：**
${this.formatSearchResults(searchResults)}

**SourceMap映射信息：**
${this.formatSourceMapInfo(stackLocations)}

请提供以下分析：

1. **错误上下文分析**
   - 错误发生的具体位置（文件、行号、列号）
   - 错误发生的函数或组件
   - 通过SourceMap还原的原始代码位置

2. **可能原因分析**
   - 基于错误类型和代码上下文分析可能的原因
   - 考虑框架特定的常见问题
   - 分析数据流和状态管理问题

3. **代码上下文分析**
   - 相关代码的功能和结构
   - 导入的依赖和模块
   - 代码的执行流程

4. **修复建议**
   - 立即修复方案（代码级别的修复）
   - 长期解决方案（架构和设计改进）
   - 具体的代码示例和最佳实践

5. **框架特定建议**
   - 针对${context.framework}框架的最佳实践
   - 常见的错误模式和避免方法
   - 调试和测试建议

请确保分析结果准确、详细且可操作。`;
  }

  /**
   * 格式化搜索结果
   */
  private formatSearchResults(searchResults: SearchResult[]): string {
    if (searchResults.length === 0) {
      return '未找到相关代码';
    }
    
    return searchResults.map(result => {
      const { chunk, score, context } = result;
      return `**文件**: ${chunk.metadata.filePath}
**函数**: ${chunk.metadata.functionName || 'N/A'}
**位置**: ${chunk.metadata.startLine}-${chunk.metadata.endLine}
**相关度**: ${(score * 100).toFixed(1)}%
**代码片段**:
\`\`\`${chunk.metadata.language}
${context}
\`\`\`
---`;
    }).join('\n\n');
  }

  /**
   * 格式化SourceMap信息
   */
  private formatSourceMapInfo(stackLocations: StackTraceLocation[]): string {
    return stackLocations.map(loc => {
      let info = `**位置**: ${loc.file}:${loc.line}:${loc.column}`;
      
      if (loc.function) {
        info += ` (${loc.function})`;
      }
      
      if (loc.sourceMap) {
        info += `\n**原始位置**: ${loc.sourceMap.originalFile}:${loc.sourceMap.originalLine}:${loc.sourceMap.originalColumn}`;
        if (loc.sourceMap.originalName) {
          info += ` (${loc.sourceMap.originalName})`;
        }
      }
      
      return info;
    }).join('\n');
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(
    aiResponse: string,
    stackLocations: StackTraceLocation[],
    searchResults: SearchResult[]
  ): RAGAnalysisResult {
    // 这里可以添加更复杂的AI响应解析逻辑
    // 目前返回一个基本的结构
    return {
      errorContext: {
        filePath: stackLocations[0]?.file || 'unknown',
        line: stackLocations[0]?.line || 0,
        column: stackLocations[0]?.column || 0,
        functionName: stackLocations[0]?.function,
        originalLocation: stackLocations[0]?.sourceMap ? {
          file: stackLocations[0].sourceMap.originalFile,
          line: stackLocations[0].sourceMap.originalLine,
          column: stackLocations[0].sourceMap.originalColumn,
        } : undefined,
      },
      possibleCauses: this.extractPossibleCauses(aiResponse),
      codeContext: {
        relevantCode: searchResults[0]?.chunk.content || '',
        imports: searchResults[0]?.chunk.metadata.imports || [],
        dependencies: [],
      },
      fixSuggestions: this.extractFixSuggestions(aiResponse),
      frameworkSpecific: {
        framework: searchResults[0]?.chunk.metadata.framework || 'Unknown',
        bestPractices: [],
        commonPatterns: [],
      },
      confidence: 0.8,
    };
  }

  /**
   * 提取可能原因
   */
  private extractPossibleCauses(aiResponse: string): string[] {
    const causes: string[] = [];
    const lines = aiResponse.split('\n');
    
    for (const line of lines) {
      if (line.includes('可能原因') || line.includes('可能的原因')) {
        // 提取后续的列表项
        const nextLines = lines.slice(lines.indexOf(line) + 1);
        for (const nextLine of nextLines) {
          if (nextLine.trim().match(/^[-*•]\s+/)) {
            causes.push(nextLine.trim().replace(/^[-*•]\s+/, ''));
          } else if (nextLine.trim() === '') {
            break;
          }
        }
        break;
      }
    }
    
    return causes.length > 0 ? causes : ['需要进一步分析'];
  }

  /**
   * 提取修复建议
   */
  private extractFixSuggestions(aiResponse: string): {
    immediate: string[];
    longTerm: string[];
    codeExamples: string[];
  } {
    const suggestions = {
      immediate: [] as string[],
      longTerm: [] as string[],
      codeExamples: [] as string[],
    };
    
    const lines = aiResponse.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('立即修复') || line.includes('紧急修复')) {
        suggestions.immediate = this.extractListItems(lines.slice(i + 1));
      } else if (line.includes('长期解决方案') || line.includes('根本解决方案')) {
        suggestions.longTerm = this.extractListItems(lines.slice(i + 1));
      } else if (line.includes('代码示例') || line.includes('示例代码')) {
        suggestions.codeExamples = this.extractCodeExamples(lines.slice(i + 1));
      }
    }
    
    return suggestions;
  }

  /**
   * 提取列表项
   */
  private extractListItems(lines: string[]): string[] {
    const items: string[] = [];
    
    for (const line of lines) {
      if (line.trim().match(/^[-*•]\s+/)) {
        items.push(line.trim().replace(/^[-*•]\s+/, ''));
      } else if (line.trim() === '') {
        break;
      }
    }
    
    return items;
  }

  /**
   * 提取代码示例
   */
  private extractCodeExamples(lines: string[]): string[] {
    const examples: string[] = [];
    let inCodeBlock = false;
    let currentExample = '';
    
    for (const line of lines) {
      if (line.includes('```')) {
        if (inCodeBlock) {
          examples.push(currentExample.trim());
          currentExample = '';
        }
        inCodeBlock = !inCodeBlock;
      } else if (inCodeBlock) {
        currentExample += line + '\n';
      } else if (line.trim() === '') {
        break;
      }
    }
    
    return examples;
  }

  /**
   * 去重搜索结果
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.chunk.id)) {
        return false;
      }
      seen.add(result.chunk.id);
      return true;
    });
  }
}
