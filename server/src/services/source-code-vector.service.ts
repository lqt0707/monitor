import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SourceCodeChunk } from '../entities/source-code-chunk.entity';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

/**
 * 源代码向量化服务
 * 负责源代码的分块、向量化和相似性搜索
 */
@Injectable()
export class SourceCodeVectorService {
  private readonly logger = new Logger(SourceCodeVectorService.name);
  private vectorStore: MemoryVectorStore;
  private embeddings: OpenAIEmbeddings;

  constructor(
    @InjectRepository(SourceCodeChunk)
    private readonly sourceCodeRepository: Repository<SourceCodeChunk>,
  ) {
    this.initializeVectorStore();
  }

  /**
   * 初始化向量存储
   */
  private async initializeVectorStore(): Promise<void> {
    try {
      // 初始化嵌入模型（使用OpenAI兼容接口）
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.DEEPSEEK_API_KEY,
        modelName: 'text-embedding-ada-002',
        configuration: {
          baseURL: 'https://api.deepseek.com/v1',
        },
      });

      // 初始化内存向量存储
      this.vectorStore = new MemoryVectorStore(this.embeddings);

      // 从数据库加载已保存的源代码块
      await this.loadStoredSourceCode();
      
      this.logger.log('源代码向量存储初始化成功');
    } catch (error) {
      this.logger.error(`向量存储初始化失败: ${error.message}`);
    }
  }

  /**
   * 从数据库加载已保存的源代码
   */
  private async loadStoredSourceCode(): Promise<void> {
    try {
      const chunks = await this.sourceCodeRepository.find({
        where: { isActive: true },
        take: 1000, // 限制加载数量
      });

      if (chunks.length > 0) {
        const documents = chunks.map(chunk => 
          new Document({
            pageContent: chunk.content,
            metadata: {
              id: chunk.id,
              projectId: chunk.projectId,
              filePath: chunk.filePath,
              version: chunk.version,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
              language: chunk.language,
            }
          })
        );

        await this.vectorStore.addDocuments(documents);
        this.logger.log(`从数据库加载了 ${chunks.length} 个源代码块`);
      }
    } catch (error) {
      this.logger.error(`加载存储的源代码失败: ${error.message}`);
    }
  }

  /**
   * 处理并索引源代码文件
   * @param projectId 项目ID
   * @param version 版本号
   * @param filePath 文件路径
   * @param content 文件内容
   */
  async processSourceFile(
    projectId: string,
    version: string,
    filePath: string,
    content: string
  ): Promise<void> {
    try {
      // 分块处理源代码
      const chunks = this.chunkSourceCode(content, filePath);
      
      const documents: Document[] = [];
      const entities: SourceCodeChunk[] = [];

      for (const chunk of chunks) {
        // 创建向量存储文档
        const doc = new Document({
          pageContent: chunk.content,
          metadata: {
            projectId,
            filePath,
            version,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            language: this.detectLanguage(filePath),
          }
        });
        documents.push(doc);

        // 创建数据库实体
        const entity = this.sourceCodeRepository.create({
          projectId,
          filePath,
          version,
          content: chunk.content,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          language: this.detectLanguage(filePath),
          chunkHash: this.generateChunkHash(chunk.content, filePath, chunk.startLine),
          isActive: true,
        });
        entities.push(entity);
      }

      // 批量保存到数据库
      await this.sourceCodeRepository.save(entities);
      
      // 添加到向量存储
      await this.vectorStore.addDocuments(documents);
      
      this.logger.log(`已处理文件 ${filePath}，生成 ${chunks.length} 个代码块`);
    } catch (error) {
      this.logger.error(`处理源代码文件失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量处理多个源代码文件
   * @param projectId 项目ID
   * @param version 版本号
   * @param files 文件列表
   */
  async batchProcessSourceFiles(
    projectId: string,
    version: string,
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    try {
      for (const file of files) {
        await this.processSourceFile(projectId, version, file.path, file.content);
      }
      
      this.logger.log(`批量处理完成，共处理 ${files.length} 个文件`);
    } catch (error) {
      this.logger.error(`批量处理源代码文件失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 搜索相似的源代码
   * @param query 查询文本
   * @param projectId 项目ID（可选过滤器）
   * @param limit 返回结果数量
   */
  async searchSimilarCode(
    query: string,
    projectId?: string,
    limit: number = 5
  ): Promise<Array<{
    content: string;
    metadata: any;
    score: number;
  }>> {
    try {
      let filter = undefined;
      if (projectId) {
        filter = (doc: Document) => doc.metadata.projectId === projectId;
      }

      const results = await this.vectorStore.similaritySearch(query, limit, filter);
      
      return results.map((doc, index) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score: 1 - (index * 0.1) // 简单评分
      }));
    } catch (error) {
      this.logger.error(`相似代码搜索失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 根据错误堆栈搜索相关代码
   * @param errorStack 错误堆栈
   * @param projectId 项目ID
   */
  async searchCodeByErrorStack(
    errorStack: string,
    projectId?: string
  ): Promise<Array<{
    content: string;
    metadata: any;
    score: number;
    relevance: string;
  }>> {
    try {
      // 从错误堆栈中提取关键信息
      const keywords = this.extractKeywordsFromErrorStack(errorStack);
      const query = keywords.join(' ');

      const results = await this.searchSimilarCode(query, projectId, 10);

      // 计算相关性评分
      return results.map(result => ({
        ...result,
        relevance: this.calculateRelevance(result.content, errorStack)
      }));
    } catch (error) {
      this.logger.error(`根据错误堆栈搜索代码失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 源代码分块
   */
  private chunkSourceCode(content: string, filePath: string): Array<{
    content: string;
    startLine: number;
    endLine: number;
  }> {
    const lines = content.split('\n');
    const chunks: Array<{
      content: string;
      startLine: number;
      endLine: number;
    }> = [];
    
    const chunkSize = this.getOptimalChunkSize(filePath);
    
    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunkLines = lines.slice(i, i + chunkSize);
      chunks.push({
        content: chunkLines.join('\n'),
        startLine: i + 1,
        endLine: Math.min(i + chunkSize, lines.length)
      });
    }
    
    return chunks;
  }

  /**
   * 获取最优分块大小
   */
  private getOptimalChunkSize(filePath: string): number {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    
    // 根据文件类型调整分块大小
    const chunkSizes: { [key: string]: number } = {
      'js': 20,
      'jsx': 15,
      'ts': 20,
      'tsx': 15,
      'vue': 15,
      'css': 30,
      'scss': 30,
      'less': 30,
      'html': 25,
      'json': 40
    };
    
    return chunkSizes[ext] || 20; // 默认20行
  }

  /**
   * 检测编程语言
   */
  private detectLanguage(filePath: string): string {
    const ext = (filePath.split('.').pop() || '').toLowerCase();
    
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'vue': 'vue',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'html': 'html',
      'json': 'json'
    };
    
    return languageMap[ext] || 'unknown';
  }

  /**
   * 生成代码块哈希
   */
  private generateChunkHash(content: string, filePath: string, startLine: number): string {
    const str = `${filePath}:${startLine}:${content}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16);
  }

  /**
   * 从错误堆栈中提取关键词
   */
  private extractKeywordsFromErrorStack(errorStack: string): string[] {
    const keywords: Set<string> = new Set();
    
    // 提取错误类型
    const errorTypeMatch = errorStack.match(/^(\w+Error|\w+Exception):/);
    if (errorTypeMatch) {
      keywords.add(errorTypeMatch[1]);
    }

    // 提取函数名
    const functionMatches = errorStack.match(/at\s+([\w$.]+)\s*\(/g) || [];
    functionMatches.forEach((match: string) => {
      const funcName = match.replace(/^at\s+/, '').replace(/\s*\(.*$/, '');
      if (funcName && !funcName.includes('.')) {
        keywords.add(funcName);
      }
    });

    // 提取文件名和扩展名
    const fileMatches = errorStack.match(/\b(\w+\.(js|jsx|ts|tsx|vue))\b/g) || [];
    fileMatches.forEach(file => keywords.add(file));

    // 提取常见的错误关键词
    const commonErrorWords = [
      'undefined', 'null', 'not defined', 'cannot read', 
      'property', 'method', 'function', 'import', 'export',
      'require', 'module', 'promise', 'async', 'await'
    ];
    
    commonErrorWords.forEach(word => {
      if (errorStack.toLowerCase().includes(word)) {
        keywords.add(word);
      }
    });

    return Array.from(keywords).filter(keyword => keyword.length > 2);
  }

  /**
   * 计算代码与错误的相关性
   */
  private calculateRelevance(codeContent: string, errorStack: string): string {
    const keywords = this.extractKeywordsFromErrorStack(errorStack);
    let matchCount = 0;
    
    keywords.forEach(keyword => {
      if (codeContent.includes(keyword)) {
        matchCount++;
      }
    });
    
    const ratio = matchCount / Math.max(1, keywords.length);
    
    if (ratio >= 0.7) return 'high';
    if (ratio >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * 获取向量存储统计信息
   */
  async getStats(): Promise<{
    totalChunks: number;
    totalProjects: number;
    memoryUsage: string;
  }> {
    // 这里返回基本统计信息
    // 实际实现可能需要更复杂的统计逻辑
    return {
      totalChunks: await this.sourceCodeRepository.count({ where: { isActive: true } }),
      totalProjects: await this.sourceCodeRepository
        .createQueryBuilder('chunk')
        .select('COUNT(DISTINCT chunk.projectId)', 'count')
        .getRawOne()
        .then(result => parseInt(result.count) || 0),
      memoryUsage: 'N/A' // 内存使用情况需要额外计算
    };
  }

  /**
   * 清理过期的源代码数据
   * @param projectId 项目ID
   * @param version 要保留的版本号
   */
  async cleanupOldVersions(projectId: string, keepVersion: string): Promise<void> {
    try {
      // 标记旧版本为不活跃
      await this.sourceCodeRepository
        .createQueryBuilder()
        .update(SourceCodeChunk)
        .set({ isActive: false })
        .where('projectId = :projectId', { projectId })
        .andWhere('version != :version', { version: keepVersion })
        .execute();

      this.logger.log(`已清理项目 ${projectId} 的旧版本数据`);
    } catch (error) {
      this.logger.error(`清理旧版本数据失败: ${error.message}`);
    }
  }
}