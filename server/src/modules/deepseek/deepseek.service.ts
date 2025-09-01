import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

/**
 * DeepSeek AI服务
 * 提供基于DeepSeek模型的错误分析和源代码定位功能
 */
@Injectable()
export class DeepSeekService {
  private readonly logger = new Logger(DeepSeekService.name);
  private deepSeekModel: ChatOpenAI;
  private vectorStore: MemoryVectorStore;
  private embeddings: OpenAIEmbeddings;
  private isEnabled: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeDeepSeek();
  }

  /**
   * 初始化DeepSeek模型和向量存储
   */
  private async initializeDeepSeek(): Promise<void> {
    const apiKey = this.configService.get<string>("DEEPSEEK_API_KEY");
    const model = this.configService.get<string>(
      "DEEPSEEK_MODEL",
      "deepseek-chat-v3.1"
    );
    const maxTokens = this.configService.get<number>(
      "DEEPSEEK_MAX_TOKENS",
      2000
    );
    const temperature = this.configService.get<number>(
      "DEEPSEEK_TEMPERATURE",
      0.1
    );
    const useLocalOllama = this.configService.get<boolean>(
      "DEEPSEEK_USE_OLLAMA",
      false
    );
    const ollamaBaseUrl = this.configService.get<string>(
      "OLLAMA_BASE_URL",
      "http://localhost:11434/v1"
    );

    if (!apiKey && !useLocalOllama) {
      this.logger.warn(
        "DeepSeek API密钥未配置且未启用本地Ollama，AI诊断功能将不可用"
      );
      return;
    }

    try {
      let baseURL = "https://api.deepseek.com/v1";
      let openAIApiKey = apiKey;

      // 如果启用本地Ollama，使用本地部署
      if (useLocalOllama) {
        baseURL = ollamaBaseUrl;
        openAIApiKey = "ollama"; // Ollama不需要真实的API密钥
        this.logger.log(`使用本地Ollama部署: ${baseURL}`);
      }

      // 初始化DeepSeek聊天模型
      this.deepSeekModel = new ChatOpenAI({
        openAIApiKey: openAIApiKey,
        modelName: model,
        maxTokens,
        temperature,
        timeout: 60000, // 60秒超时
        configuration: {
          baseURL: baseURL,
        },
      });

      // 初始化嵌入模型
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: openAIApiKey,
        modelName: "text-embedding-ada-002",
        configuration: {
          baseURL: baseURL,
        },
      });

      // 初始化内存向量存储
      this.vectorStore = new MemoryVectorStore(this.embeddings);

      this.isEnabled = true;
      this.logger.log("DeepSeek服务初始化成功");
    } catch (error) {
      this.logger.error(`DeepSeek服务初始化失败: ${error.message}`);
    }
  }

  /**
   * 分析JavaScript错误并提供精确定位
   * @param errorStack 错误堆栈
   * @param sourceContext 源代码上下文
   * @param projectId 项目ID
   * @returns 分析结果
   */
  async analyzeJavaScriptError(
    errorStack: string,
    sourceContext?: string,
    projectId?: string
  ): Promise<ErrorAnalysisResult> {
    if (!this.isEnabled) {
      this.logger.warn("DeepSeek服务未启用");
      return null;
    }

    try {
      const systemPrompt = this.buildErrorAnalysisSystemPrompt();
      const userPrompt = this.buildErrorAnalysisUserPrompt(
        errorStack,
        sourceContext,
        projectId
      );

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await this.deepSeekModel.invoke(messages);
      const content =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
      const result = this.parseErrorAnalysisResponse(content);

      this.logger.log("JavaScript错误分析完成");
      return result;
    } catch (error) {
      this.logger.error(`JavaScript错误分析失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 流式分析JavaScript错误
   * @param errorStack 错误堆栈
   * @param sourceContext 源代码上下文
   * @param projectId 项目ID
   * @param onProgress 进度回调函数
   * @returns 分析结果
   */
  async analyzeJavaScriptErrorStream(
    errorStack: string,
    sourceContext?: string,
    projectId?: string,
    onProgress?: (chunk: string, progress: number) => void
  ): Promise<ErrorAnalysisResult> {
    if (!this.isEnabled) {
      this.logger.warn("DeepSeek服务未启用");
      return null;
    }

    try {
      const systemPrompt = this.buildErrorAnalysisSystemPrompt();
      const userPrompt = this.buildErrorAnalysisUserPrompt(
        errorStack,
        sourceContext,
        projectId
      );

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      let fullResponse = "";
      const response = await this.deepSeekModel.stream(messages);

      // 处理流式响应
      for await (const chunk of response) {
        const content =
          typeof chunk.content === "string"
            ? chunk.content
            : JSON.stringify(chunk.content);
        fullResponse += content;

        // 发送进度更新
        if (onProgress) {
          onProgress(content, fullResponse.length / 1000); // 简单进度估算
        }
      }

      const result = this.parseErrorAnalysisResponse(fullResponse);
      this.logger.log("JavaScript错误流式分析完成");
      return result;
    } catch (error) {
      this.logger.error(`JavaScript错误流式分析失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 构建错误分析系统提示词
   */
  private buildErrorAnalysisSystemPrompt(): string {
    return `你是一个专业的前端错误诊断专家，专门处理JavaScript/TypeScript错误。

请按照以下JSON格式回复：

{
  "exactLocation": {
    "file": "精确的文件路径",
    "line": 行号,
    "column": 列号,
    "function": "函数名（如果可识别）"
  },
  "errorAnalysis": "详细的错误原因分析",
  "frameworkContext": "框架上下文分析（React/Taro/小程序等）",
  "fixSuggestions": [
    "具体的修复建议1",
    "具体的修复建议2"
  ],
  "preventionMeasures": "预防类似错误的措施",
  "confidence": 0.95
}

请确保分析准确，特别是对于框架特定的错误模式。`;
  }

  /**
   * 构建错误分析用户提示词
   */
  private buildErrorAnalysisUserPrompt(
    errorStack: string,
    sourceContext?: string,
    projectId?: string
  ): string {
    let prompt = `请分析以下JavaScript错误堆栈，提供精确的源代码定位和修复建议：

`;

    prompt += `**错误堆栈：**
\`\`\`
${errorStack}
\`\`\`
`;

    if (sourceContext) {
      prompt += `\n**源代码上下文：**
\`\`\`javascript
${sourceContext}
\`\`\`
`;
    }

    if (projectId) {
      prompt += `\n**项目ID：** ${projectId}\n`;
    }

    prompt += `\n请特别注意：
1. 识别框架特定的错误模式（React、Taro、小程序等）
2. 提供精确的源代码文件路径和位置
3. 给出具体的、可操作的修复建议
4. 分析错误的根本原因和预防措施`;

    return prompt;
  }

  /**
   * 解析错误分析响应
   */
  private parseErrorAnalysisResponse(content: string): ErrorAnalysisResult {
    try {
      // 尝试解析JSON响应
      const parsed = JSON.parse(content);
      return {
        exactLocation: parsed.exactLocation || {},
        errorAnalysis: parsed.errorAnalysis || "",
        frameworkContext: parsed.frameworkContext || "",
        fixSuggestions: parsed.fixSuggestions || [],
        preventionMeasures: parsed.preventionMeasures || "",
        confidence: parsed.confidence || 0,
        rawResponse: content,
      };
    } catch (error) {
      // 如果JSON解析失败，返回原始响应
      this.logger.warn("DeepSeek响应JSON解析失败，返回原始内容");
      return {
        exactLocation: {},
        errorAnalysis: content,
        frameworkContext: "",
        fixSuggestions: [],
        preventionMeasures: "",
        confidence: 0,
        rawResponse: content,
      };
    }
  }

  /**
   * 索引源代码到向量存储
   * @param projectId 项目ID
   * @param version 版本号
   * @param sourceFiles 源代码文件列表
   */
  async indexSourceCode(
    projectId: string,
    version: string,
    sourceFiles: SourceFile[]
  ): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn("DeepSeek服务未启用");
      return;
    }

    try {
      const documents: Document[] = [];

      for (const file of sourceFiles) {
        // 将源代码文件分块
        const chunks = this.chunkSourceCode(file.content, file.path);

        for (const chunk of chunks) {
          documents.push(
            new Document({
              pageContent: chunk.content,
              metadata: {
                projectId,
                version,
                filePath: file.path,
                chunkIndex: chunk.index,
                language: this.detectLanguage(file.path),
              },
            })
          );
        }
      }

      // 添加到向量存储
      await this.vectorStore.addDocuments(documents);

      this.logger.log(`已索引 ${documents.length} 个源代码块到向量存储`);
    } catch (error) {
      this.logger.error(`源代码索引失败: ${error.message}`);
    }
  }

  /**
   * 搜索相似的源代码
   * @param query 查询文本
   * @param projectId 项目ID
   * @param limit 返回结果数量
   */
  async searchSimilarCode(
    query: string,
    projectId?: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (!this.isEnabled) {
      this.logger.warn("DeepSeek服务未启用");
      return [];
    }

    try {
      let filter = undefined;
      if (projectId) {
        filter = (doc: Document) => doc.metadata.projectId === projectId;
      }

      const results = await this.vectorStore.similaritySearch(
        query,
        limit,
        filter
      );

      return results.map((doc, index) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score: 1 - index * 0.1, // 简单评分
      }));
    } catch (error) {
      this.logger.error(`源代码搜索失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 源代码分块
   */
  private chunkSourceCode(content: string, filePath: string): CodeChunk[] {
    const lines = content.split("\n");
    const chunks: CodeChunk[] = [];
    const chunkSize = 20; // 每块20行

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunkLines = lines.slice(i, i + chunkSize);
      chunks.push({
        index: Math.floor(i / chunkSize) + 1,
        content: chunkLines.join("\n"),
        startLine: i + 1,
        endLine: Math.min(i + chunkSize, lines.length),
      });
    }

    return chunks;
  }

  /**
   * 检测编程语言
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";

    const languageMap: { [key: string]: string } = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      vue: "vue",
      css: "css",
      scss: "scss",
      less: "less",
      html: "html",
      json: "json",
    };

    return languageMap[ext] || "unknown";
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return this.isEnabled;
  }

  /**
   * 综合分析错误
   * @param systemPrompt 系统提示词
   * @param userPrompt 用户提示词
   * @param projectVersion 项目版本
   * @returns 综合分析结果
   */
  async analyzeComprehensiveError(
    systemPrompt: string,
    userPrompt: string,
    projectVersion?: string
  ): Promise<ComprehensiveAnalysisResult> {
    if (!this.isEnabled) {
      this.logger.warn("DeepSeek服务未启用");
      return null;
    }

    try {
      this.logger.log("开始综合分析错误");

      // 构建消息
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      // 调用AI模型
      const response = await this.deepSeekModel.invoke(messages);

      if (!response || !response.content) {
        this.logger.warn("DeepSeek综合分析返回空结果");
        return null;
      }

      const result: ComprehensiveAnalysisResult = {
        content: response.content.toString(),
        rawResponse: response,
        timestamp: new Date().toISOString(),
        projectVersion: projectVersion || "unknown",
      };

      this.logger.log("DeepSeek综合分析完成");
      return result;
    } catch (error) {
      this.logger.error(`DeepSeek综合分析失败: ${error.message}`, error.stack);
      return null;
    }
  }
}

/**
 * 源代码文件接口
 */
export interface SourceFile {
  path: string;
  content: string;
  version?: string;
}

/**
 * 代码块接口
 */
interface CodeChunk {
  index: number;
  content: string;
  startLine: number;
  endLine: number;
}

/**
 * 错误分析结果接口
 */
export interface ErrorAnalysisResult {
  exactLocation: {
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  };
  errorAnalysis: string;
  frameworkContext: string;
  fixSuggestions: string[];
  preventionMeasures: string;
  confidence: number;
  rawResponse: string;
}

/**
 * 搜索结果接口
 */
export interface SearchResult {
  content: string;
  metadata: any;
  score: number;
}

/**
 * 综合分析结果接口
 */
export interface ComprehensiveAnalysisResult {
  content: string; // AI分析内容
  rawResponse: any; // 原始AI响应
  timestamp: string; // 分析时间戳
  projectVersion: string; // 项目版本
}
