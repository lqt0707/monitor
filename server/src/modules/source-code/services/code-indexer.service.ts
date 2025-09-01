import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SourceCodeChunk } from '../entities/source-code-chunk.entity';
import { ProjectIndex } from '../entities/project-index.entity';

export interface CodeChunk {
  id: string;
  content: string;
  metadata: {
    filePath: string;
    functionName?: string;
    startLine: number;
    endLine: number;
    language: string;
    framework?: string;
    imports: string[];
    exports: string[];
    chunkType: 'function' | 'class' | 'module' | 'component';
  };
  embedding?: number[];
}

export interface SearchResult {
  chunk: CodeChunk;
  score: number;
  context: string;
}

@Injectable()
export class CodeIndexerService {
  private readonly logger = new Logger(CodeIndexerService.name);

  constructor(
    @InjectRepository(SourceCodeChunk)
    private readonly sourceCodeChunkRepository: Repository<SourceCodeChunk>,
    @InjectRepository(ProjectIndex)
    private readonly projectIndexRepository: Repository<ProjectIndex>,
  ) {}

  /**
   * 索引项目代码
   */
  async indexProject(projectStructure: any): Promise<void> {
    try {
      this.logger.log(`开始索引项目代码: ${projectStructure.files.length} 个文件`);
      
      // 检查项目是否已索引
      let projectIndex = await this.projectIndexRepository.findOne({
        where: { projectPath: projectStructure.root },
      });

      if (!projectIndex) {
        projectIndex = this.projectIndexRepository.create({
          projectPath: projectStructure.root,
          projectName: path.basename(projectStructure.root),
          framework: projectStructure.framework,
          totalFiles: 0,
          totalChunks: 0,
          indexStatus: 'indexing',
        });
        await this.projectIndexRepository.save(projectIndex);
      } else {
        projectIndex.indexStatus = 'indexing';
        await this.projectIndexRepository.save(projectIndex);
      }

      const chunks: CodeChunk[] = [];
      
      for (const file of projectStructure.files) {
        const fileChunks = await this.createCodeChunks(file);
        chunks.push(...fileChunks);
      }
      
      // 批量存储到数据库
      await this.storeChunks(chunks, projectIndex.id);
      
      // 更新项目索引状态
      projectIndex.totalFiles = projectStructure.files.length;
      projectIndex.totalChunks = chunks.length;
      projectIndex.indexStatus = 'completed';
      projectIndex.lastIndexedAt = new Date();
      await this.projectIndexRepository.save(projectIndex);
      
      this.logger.log(`项目代码索引完成: ${chunks.length} 个代码块`);
    } catch (error) {
      this.logger.error(`项目代码索引失败: ${error.message}`, error.stack);
      
      // 更新索引状态为失败
      const projectIndex = await this.projectIndexRepository.findOne({
        where: { projectPath: projectStructure.root },
      });
      if (projectIndex) {
        projectIndex.indexStatus = 'failed';
        await this.projectIndexRepository.save(projectIndex);
      }
      
      throw error;
    }
  }

  /**
   * 创建代码块
   */
  private async createCodeChunks(parsedFile: any): Promise<CodeChunk[]> {
    const chunks: CodeChunk[] = [];
    
    // 按函数分割代码
    for (const func of parsedFile.functions) {
      const chunk: CodeChunk = {
        id: `${parsedFile.filePath}:${func.startLine}:${func.endLine}`,
        content: func.body,
        metadata: {
          filePath: parsedFile.filePath,
          functionName: func.name,
          startLine: func.startLine,
          endLine: func.endLine,
          language: this.detectLanguage(parsedFile.filePath),
          framework: this.detectFramework(parsedFile.filePath),
          imports: parsedFile.imports.map(i => i.source),
          exports: parsedFile.exports.map(e => e.name),
          chunkType: 'function',
        },
      };
      
      chunks.push(chunk);
    }
    
    // 按模块分割代码（如果没有函数）
    if (parsedFile.functions.length === 0) {
      const textChunks = this.splitTextIntoChunks(parsedFile.content, 1000, 200);
      
      for (let i = 0; i < textChunks.length; i++) {
        const chunk: CodeChunk = {
          id: `${parsedFile.filePath}:chunk:${i}`,
          content: textChunks[i],
          metadata: {
            filePath: parsedFile.filePath,
            startLine: 0,
            endLine: 0,
            language: this.detectLanguage(parsedFile.filePath),
            framework: this.detectFramework(parsedFile.filePath),
            imports: parsedFile.imports.map(i => i.source),
            exports: parsedFile.exports.map(e => e.name),
            chunkType: 'module',
          },
        };
        
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }

  /**
   * 文本分块
   */
  private splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    const lines = text.split('\n');
    let currentChunk = '';
    let lineCount = 0;
    
    for (const line of lines) {
      if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line + '\n';
        lineCount = 1;
      } else {
        currentChunk += line + '\n';
        lineCount++;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * 存储代码块到数据库
   */
  private async storeChunks(chunks: CodeChunk[], projectIndexId: number): Promise<void> {
    try {
      for (const chunk of chunks) {
        // 检查是否已存在
        const existingChunk = await this.sourceCodeChunkRepository.findOne({
          where: { id: chunk.id },
        });

        if (existingChunk) {
          // 更新现有代码块
          existingChunk.content = chunk.content;
          existingChunk.functionName = chunk.metadata.functionName;
          existingChunk.startLine = chunk.metadata.startLine;
          existingChunk.endLine = chunk.metadata.endLine;
          existingChunk.language = chunk.metadata.language;
          existingChunk.framework = chunk.metadata.framework;
          existingChunk.imports = JSON.stringify(chunk.metadata.imports);
          existingChunk.exports = JSON.stringify(chunk.metadata.exports);
          existingChunk.chunkType = chunk.metadata.chunkType;
          existingChunk.projectIndexId = projectIndexId;
          
          await this.sourceCodeChunkRepository.save(existingChunk);
        } else {
          // 创建新的代码块
          const newChunk = this.sourceCodeChunkRepository.create({
            id: chunk.id,
            filePath: chunk.metadata.filePath,
            content: chunk.content,
            functionName: chunk.metadata.functionName,
            startLine: chunk.metadata.startLine,
            endLine: chunk.metadata.endLine,
            language: chunk.metadata.language,
            framework: chunk.metadata.framework,
            imports: JSON.stringify(chunk.metadata.imports),
            exports: JSON.stringify(chunk.metadata.exports),
            chunkType: chunk.metadata.chunkType,
            projectIndexId: projectIndexId,
          });
          
          await this.sourceCodeChunkRepository.save(newChunk);
        }
      }
      
      this.logger.log(`代码块存储完成: ${chunks.length} 个`);
    } catch (error) {
      this.logger.error(`代码块存储失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 语义搜索代码
   */
  async searchCode(
    query: string,
    filters?: Record<string, any>,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      // 构建查询条件
      const whereConditions: any = {};
      
      if (filters?.framework) {
        whereConditions.framework = filters.framework;
      }
      
      if (filters?.language) {
        whereConditions.language = filters.language;
      }
      
      if (filters?.chunkType) {
        whereConditions.chunkType = filters.chunkType;
      }

      // 执行数据库搜索
      const chunks = await this.sourceCodeChunkRepository.find({
        where: whereConditions,
        take: limit * 2, // 获取更多结果用于评分
        order: { createdAt: 'DESC' },
      });

      // 简单的文本相似度评分
      const searchResults: SearchResult[] = chunks.map(chunk => {
        const score = this.calculateTextSimilarity(query, chunk.content);
        return {
          chunk: {
            id: chunk.id,
            content: chunk.content,
            metadata: {
              filePath: chunk.filePath,
              functionName: chunk.functionName,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
              language: chunk.language,
              framework: chunk.framework,
              imports: JSON.parse(chunk.imports || '[]'),
              exports: JSON.parse(chunk.exports || '[]'),
              chunkType: chunk.chunkType,
            },
          },
          score,
          context: this.extractContext(chunk.content, query),
        };
      });

      // 按分数排序并限制结果数量
      searchResults.sort((a, b) => b.score - a.score);
      return searchResults.slice(0, limit);
    } catch (error) {
      this.logger.error(`代码搜索失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 计算文本相似度
   */
  private calculateTextSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let matchCount = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        matchCount++;
      }
    }
    
    // 基于匹配词数量和内容长度的相似度评分
    const wordMatchRatio = matchCount / queryWords.length;
    const lengthRatio = Math.min(query.length / content.length, 1);
    
    return (wordMatchRatio * 0.7) + (lengthRatio * 0.3);
  }

  /**
   * 提取相关上下文
   */
  private extractContext(content: string, query: string): string {
    const lines = content.split('\n');
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // 找到包含查询词最多的行
    let bestLine = 0;
    let maxMatches = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const matches = queryWords.filter(word => line.includes(word)).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestLine = i;
      }
    }
    
    // 返回上下文（前后几行）
    const start = Math.max(0, bestLine - 2);
    const end = Math.min(lines.length, bestLine + 3);
    
    return lines.slice(start, end).join('\n');
  }

  /**
   * 检测编程语言
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.vue': 'Vue',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
    };
    
    return languageMap[ext] || 'Unknown';
  }

  /**
   * 检测前端框架
   */
  private detectFramework(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (content.includes('@tarojs/taro')) return 'Taro';
      if (content.includes('react') || content.includes('React')) return 'React';
      if (content.includes('vue') || content.includes('Vue')) return 'Vue';
      if (content.includes('angular') || content.includes('Angular')) return 'Angular';
      
      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * 获取项目索引状态
   */
  async getProjectIndexStatus(projectPath: string): Promise<any> {
    return await this.projectIndexRepository.findOne({
      where: { projectPath },
    });
  }

  /**
   * 删除项目索引
   */
  async deleteProjectIndex(projectPath: string): Promise<void> {
    const projectIndex = await this.projectIndexRepository.findOne({
      where: { projectPath },
    });

    if (projectIndex) {
      // 删除相关的代码块
      await this.sourceCodeChunkRepository.delete({
        projectIndexId: projectIndex.id,
      });

      // 删除项目索引
      await this.projectIndexRepository.delete(projectIndex.id);
    }
  }
}

// 添加必要的导入
import * as fs from 'fs';
import * as path from 'path';
