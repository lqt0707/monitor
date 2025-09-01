import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface SourceMapInfo {
  originalFile: string;
  originalLine: number;
  originalColumn: number;
  originalName?: string;
  sourceContent?: string;
}

export interface StackTraceLocation {
  file: string;
  line: number;
  column: number;
  function?: string;
  sourceMap?: SourceMapInfo;
}

@Injectable()
export class SourceMapParserService {
  private readonly logger = new Logger(SourceMapParserService.name);
  private sourceMapCache = new Map<string, any>();

  /**
   * 解析错误堆栈
   */
  async parseStackTrace(
    stackTrace: string,
    projectPath: string,
    sourceMapDir?: string
  ): Promise<StackTraceLocation[]> {
    try {
      this.logger.log(`开始解析错误堆栈: ${stackTrace.substring(0, 100)}...`);
      
      const locations: StackTraceLocation[] = [];
      const lines = stackTrace.split('\n');
      
      for (const line of lines) {
        const location = this.parseStackTraceLine(line);
        if (location) {
          // 尝试通过sourcemap还原原始位置
          if (sourceMapDir) {
            location.sourceMap = await this.resolveSourceMap(
              location.file,
              location.line,
              location.column,
              sourceMapDir
            );
          }
          
          locations.push(location);
        }
      }
      
      this.logger.log(`堆栈解析完成: ${locations.length} 个位置`);
      return locations;
    } catch (error) {
      this.logger.error(`堆栈解析失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 解析单行堆栈信息
   */
  private parseStackTraceLine(line: string): StackTraceLocation | null {
    // 匹配常见的堆栈格式
    const patterns = [
      // Chrome/Node.js格式: at FunctionName (file:line:column)
      /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/,
      // Firefox格式: FunctionName@file:line:column
      /(.+?)@(.+?):(\d+):(\d+)/,
      // 简化格式: file:line:column
      /(.+?):(\d+):(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = line.trim().match(pattern);
      if (match) {
        return {
          file: match[2] || match[1],
          line: parseInt(match[3] || match[2]),
          column: parseInt(match[4] || match[3]),
          function: match[1] || undefined,
        };
      }
    }

    return null;
  }

  /**
   * 通过SourceMap解析原始位置
   */
  async resolveSourceMap(
    filePath: string,
    line: number,
    column: number,
    sourceMapDir: string
  ): Promise<SourceMapInfo | null> {
    try {
      // 查找对应的sourcemap文件
      const sourceMapPath = this.findSourceMapFile(filePath, sourceMapDir);
      if (!sourceMapPath) {
        return null;
      }

      // 获取或创建SourceMapConsumer
      let sourceMapData = this.sourceMapCache.get(sourceMapPath);
      if (!sourceMapData) {
        const sourceMapContent = fs.readFileSync(sourceMapPath, 'utf-8');
        sourceMapData = JSON.parse(sourceMapContent);
        this.sourceMapCache.set(sourceMapPath, sourceMapData);
      }

      // 简化的sourcemap解析逻辑
      const originalPosition = this.findOriginalPosition(sourceMapData, line, column);
      
      if (originalPosition) {
        return {
          originalFile: originalPosition.source || 'unknown',
          originalLine: originalPosition.line || 0,
          originalColumn: originalPosition.column || 0,
          originalName: originalPosition.name || undefined,
          sourceContent: originalPosition.sourceContent || undefined,
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(`SourceMap解析失败: ${filePath}:${line}:${column}`, error.message);
      return null;
    }
  }

  /**
   * 查找原始位置（简化版本）
   */
  private findOriginalPosition(sourceMapData: any, line: number, column: number): any {
    try {
      // 简化的mapping解析
      if (sourceMapData.mappings) {
        // 这里应该实现完整的mapping解析
        // 为了简化，我们返回一个基本的位置信息
        return {
          source: sourceMapData.sources?.[0] || 'unknown',
          line: line,
          column: column,
          name: undefined,
          sourceContent: sourceMapData.sourcesContent?.[0] || undefined,
        };
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`原始位置查找失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 查找SourceMap文件
   */
  private findSourceMapFile(filePath: string, sourceMapDir: string): string | null {
    const fileName = path.basename(filePath);
    const nameWithoutExt = path.parse(fileName).name;
    
    // 可能的sourcemap文件名
    const possibleNames = [
      `${fileName}.map`,
      `${nameWithoutExt}.map`,
      `${fileName}.js.map`,
      `${nameWithoutExt}.js.map`,
    ];

    for (const name of possibleNames) {
      const fullPath = path.join(sourceMapDir, name);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }

  /**
   * 清理缓存
   */
  async cleanup(): Promise<void> {
    this.sourceMapCache.clear();
  }
}
