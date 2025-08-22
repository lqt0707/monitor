import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as sourceMap from "source-map";

/**
 * SourceMap解析服务
 * 用于解析SourceMap文件，将压缩后的代码位置映射回源代码位置
 */
@Injectable()
export class SourceMapService {
  private readonly logger = new Logger(SourceMapService.name);
  private readonly sourceMapCache = new Map<
    string,
    sourceMap.SourceMapConsumer
  >();
  private readonly cacheTTL: number;

  constructor(private configService: ConfigService) {
    this.cacheTTL =
      this.configService.get<number>("SOURCEMAP_CACHE_TTL", 86400) * 1000; // 默认缓存1天
  }

  /**
   * 解析错误位置
   * @param projectId 项目ID
   * @param fileName 文件名
   * @param line 行号
   * @param column 列号
   * @param sourcemapPath SourceMap文件路径
   * @returns 源代码位置信息
   */
  async parseErrorLocation(
    projectId: string,
    fileName: string,
    line: number,
    column: number,
    sourcemapPath: string
  ): Promise<SourceLocation | null> {
    try {
      if (!fileName || !line || !sourcemapPath) {
        return null;
      }

      const consumer = await this.getSourceMapConsumer(
        projectId,
        fileName,
        sourcemapPath
      );
      if (!consumer) {
        return null;
      }

      const originalPosition = consumer.originalPositionFor({
        line,
        column,
      });

      if (!originalPosition.source) {
        return null;
      }

      // 尝试获取源代码内容
      let sourceContent: string | null = null;
      try {
        sourceContent = consumer.sourceContentFor(originalPosition.source);
      } catch (error) {
        this.logger.warn(`无法获取源代码内容: ${error.message}`);
      }

      return {
        source: originalPosition.source,
        line: originalPosition.line,
        column: originalPosition.column,
        name: originalPosition.name,
        sourceContent,
      };
    } catch (error) {
      this.logger.error(`解析错误位置失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取SourceMap消费者
   * @param projectId 项目ID
   * @param fileName 文件名
   * @param sourcemapPath SourceMap文件路径
   * @returns SourceMap消费者
   */
  private async getSourceMapConsumer(
    projectId: string,
    fileName: string,
    sourcemapPath: string
  ): Promise<sourceMap.SourceMapConsumer | null> {
    // 使用项目ID、文件名和SourceMap路径的哈希作为缓存键，避免路径冲突
    const pathHash = crypto
      .createHash("md5")
      .update(sourcemapPath)
      .digest("hex")
      .substring(0, 8);
    const cacheKey = `${projectId}:${fileName}:${pathHash}`;

    // 检查缓存
    if (this.sourceMapCache.has(cacheKey)) {
      return this.sourceMapCache.get(cacheKey);
    }

    try {
      // 构建SourceMap文件路径
      const mapFilePath = this.resolveSourceMapPath(fileName, sourcemapPath);
      if (!mapFilePath) {
        return null;
      }

      // 读取SourceMap文件
      const mapContent = await fs.promises.readFile(mapFilePath, "utf8");
      const rawSourceMap = JSON.parse(mapContent);

      // 创建SourceMap消费者
      const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);

      // 缓存SourceMap消费者
      this.sourceMapCache.set(cacheKey, consumer);

      // 设置缓存过期
      setTimeout(() => {
        if (this.sourceMapCache.has(cacheKey)) {
          const cachedConsumer = this.sourceMapCache.get(cacheKey);
          cachedConsumer.destroy(); // 释放WASM资源
          this.sourceMapCache.delete(cacheKey);
        }
      }, this.cacheTTL);

      return consumer;
    } catch (error) {
      this.logger.error(`获取SourceMap消费者失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 解析SourceMap文件路径
   * @param fileName 文件名
   * @param sourcemapPath SourceMap文件路径
   * @returns 完整的SourceMap文件路径
   */
  private resolveSourceMapPath(
    fileName: string,
    sourcemapPath: string
  ): string | null {
    try {
      // 尝试直接查找.map文件
      let mapFilePath = path.join(sourcemapPath, `${fileName}.map`);
      if (fs.existsSync(mapFilePath)) {
        return mapFilePath;
      }

      // 尝试在js文件同目录查找
      const jsFilePath = path.join(sourcemapPath, fileName);
      if (fs.existsSync(jsFilePath)) {
        mapFilePath = `${jsFilePath}.map`;
        if (fs.existsSync(mapFilePath)) {
          return mapFilePath;
        }
      }

      // 尝试在sourcemaps子目录查找
      mapFilePath = path.join(sourcemapPath, "sourcemaps", `${fileName}.map`);
      if (fs.existsSync(mapFilePath)) {
        return mapFilePath;
      }

      this.logger.warn(`找不到SourceMap文件: ${fileName}`);
      return null;
    } catch (error) {
      this.logger.error(`解析SourceMap路径失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 清除SourceMap缓存
   * @param projectId 项目ID（可选，不提供则清除所有缓存）
   */
  clearCache(projectId?: string): void {
    if (projectId) {
      // 清除特定项目的缓存
      const prefix = `${projectId}:`;
      for (const [key, consumer] of this.sourceMapCache.entries()) {
        if (key.startsWith(prefix)) {
          consumer.destroy(); // 释放WASM资源
          this.sourceMapCache.delete(key);
        }
      }
    } else {
      // 清除所有缓存
      for (const consumer of this.sourceMapCache.values()) {
        consumer.destroy(); // 释放WASM资源
      }
      this.sourceMapCache.clear();
    }
  }
}

/**
 * 源代码位置接口
 */
export interface SourceLocation {
  source: string; // 源文件路径
  line: number; // 行号
  column: number; // 列号
  name: string | null; // 标识符名称
  sourceContent: string | null; // 源代码内容
}
