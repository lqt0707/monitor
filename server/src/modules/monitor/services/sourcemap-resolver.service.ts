import { Injectable, Logger } from "@nestjs/common";
import { SourceMapConsumer } from "source-map";
import * as fs from "fs";
import * as path from "path";

export interface SourceMapPosition {
  source: string;
  line: number;
  column: number;
  name?: string;
}

export interface ErrorStackFrame {
  functionName?: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface ResolvedStackFrame extends ErrorStackFrame {
  originalSource?: string;
  originalLine?: number;
  originalColumn?: number;
  originalName?: string;
}

@Injectable()
export class SourcemapResolverService {
  private readonly logger = new Logger(SourcemapResolverService.name);
  private readonly sourcemapCache = new Map<string, SourceMapConsumer>();

  /**
   * 解析错误堆栈中的源代码位置
   */
  async resolveErrorStack(
    projectId: string,
    version: string,
    stackFrames: ErrorStackFrame[]
  ): Promise<ResolvedStackFrame[]> {
    const resolvedFrames: ResolvedStackFrame[] = [];

    for (const frame of stackFrames) {
      const resolvedFrame = await this.resolveStackFrame(
        projectId,
        version,
        frame
      );
      resolvedFrames.push(resolvedFrame);
    }

    return resolvedFrames;
  }

  /**
   * 解析单个堆栈帧
   */
  async resolveStackFrame(
    projectId: string,
    version: string,
    frame: ErrorStackFrame
  ): Promise<ResolvedStackFrame> {
    try {
      const sourcemapPath = this.getSourcemapPath(
        projectId,
        version,
        frame.fileName
      );

      if (!fs.existsSync(sourcemapPath)) {
        this.logger.warn(`Sourcemap not found: ${sourcemapPath}`);
        return frame;
      }

      const consumer = await this.getSourceMapConsumer(sourcemapPath);

      const position = consumer.originalPositionFor({
        line: frame.lineNumber,
        column: frame.columnNumber,
      });

      if (position.source) {
        return {
          ...frame,
          originalSource: position.source,
          originalLine: position.line,
          originalColumn: position.column,
          originalName: position.name,
        };
      }
    } catch (error) {
      this.logger.error(`Error resolving stack frame: ${error.message}`, error);
    }

    return frame;
  }

  /**
   * 获取或创建 SourceMap Consumer
   */
  private async getSourceMapConsumer(
    sourcemapPath: string
  ): Promise<SourceMapConsumer> {
    if (this.sourcemapCache.has(sourcemapPath)) {
      return this.sourcemapCache.get(sourcemapPath);
    }

    const sourcemapContent = fs.readFileSync(sourcemapPath, "utf8");
    const consumer = await new SourceMapConsumer(sourcemapContent);

    // 缓存 consumer，但设置合理的缓存大小限制
    if (this.sourcemapCache.size > 100) {
      // 清理最旧的缓存
      const firstKey = this.sourcemapCache.keys().next().value;
      const oldConsumer = this.sourcemapCache.get(firstKey);
      oldConsumer?.destroy();
      this.sourcemapCache.delete(firstKey);
    }

    this.sourcemapCache.set(sourcemapPath, consumer);
    return consumer;
  }

  /**
   * 获取 sourcemap 文件路径
   */
  private getSourcemapPath(
    projectId: string,
    version: string,
    fileName: string
  ): string {
    // 从文件名提取 sourcemap 路径
    const baseName = path.basename(fileName, path.extname(fileName));
    const sourcemapDir = path.join(
      process.cwd(),
      "storage",
      "sourcemaps",
      projectId
    );

    // 首先尝试标准格式的文件名
    const standardFileName = `${baseName}.js.map`;
    const standardPath = path.join(sourcemapDir, standardFileName);

    if (fs.existsSync(standardPath)) {
      return standardPath;
    }

    // 如果标准格式不存在，尝试查找带时间戳的文件
    try {
      const files = fs.readdirSync(sourcemapDir);
      const matchingFile = files.find(
        (file) => file.startsWith(`${baseName}.js_`) && file.endsWith(".map")
      );

      if (matchingFile) {
        return path.join(sourcemapDir, matchingFile);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to read sourcemap directory: ${sourcemapDir}`,
        error
      );
    }

    // 如果都找不到，返回标准路径（让后续逻辑处理文件不存在的情况）
    return standardPath;
  }

  /**
   * 获取错误位置的上下文代码行
   */
  private getContextLines(
    sourceContent: string,
    lineNumber: number,
    contextSize = 5
  ): string[] {
    if (!sourceContent) return [];

    const lines = sourceContent.split("\n");
    const startLine = Math.max(0, lineNumber - contextSize - 1);
    const endLine = Math.min(lines.length, lineNumber + contextSize);

    return lines.slice(startLine, endLine);
  }

  /**
   * 解析错误堆栈字符串
   */
  parseErrorStack(stackTrace: string): ErrorStackFrame[] {
    const frames: ErrorStackFrame[] = [];
    const lines = stackTrace.split("\n");

    for (const line of lines) {
      const frame = this.parseStackLine(line.trim());
      if (frame) {
        frames.push(frame);
      }
    }

    return frames;
  }

  /**
   * 解析单行堆栈信息
   */
  private parseStackLine(line: string): ErrorStackFrame | null {
    // 匹配不同格式的堆栈行
    const patterns = [
      // Chrome/V8 格式: at functionName (file:line:column)
      /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/,
      // Chrome/V8 格式: at file:line:column
      /at\s+(.+?):(\d+):(\d+)/,
      // Firefox 格式: functionName@file:line:column
      /(.+?)@(.+?):(\d+):(\d+)/,
      // Safari 格式: functionName@file:line:column
      /(.+?)@(.+?):(\d+):(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        if (match.length === 5) {
          // 包含函数名的格式
          return {
            functionName: match[1],
            fileName: match[2],
            lineNumber: parseInt(match[3]),
            columnNumber: parseInt(match[4]),
          };
        } else if (match.length === 4) {
          // 不包含函数名的格式
          return {
            fileName: match[1],
            lineNumber: parseInt(match[2]),
            columnNumber: parseInt(match[3]),
          };
        }
      }
    }

    return null;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    for (const consumer of this.sourcemapCache.values()) {
      consumer.destroy();
    }
    this.sourcemapCache.clear();
  }

  /**
   * 销毁服务时清理资源
   */
  onModuleDestroy(): void {
    this.clearCache();
  }
}
