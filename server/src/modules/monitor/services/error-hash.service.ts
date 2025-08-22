import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";

/**
 * 错误类型枚举
 */
export enum ErrorType {
  JAVASCRIPT = "javascript",
  NETWORK = "network",
  RESOURCE = "resource",
  PROMISE = "promise",
  CUSTOM = "custom",
}

/**
 * MinHash配置接口
 */
export interface MinHashConfig {
  hashFunctionsCount?: number;
  similarityThreshold?: number;
  maxStackDepth?: number;
  maxFeatures?: number;
  enableWeighting?: boolean;
}

/**
 * 错误特征权重配置
 */
interface FeatureWeights {
  errorMessage: number;
  stackTrace: number;
  sourceFile: number;
  errorType: number;
}

/**
 * MinHash错误聚合服务
 * 用于计算错误的指纹哈希，实现错误去重和聚合
 * 支持动态配置、特征权重、多种相似度算法
 */
@Injectable()
export class ErrorHashService {
  private readonly logger = new Logger(ErrorHashService.name);

  // 默认配置
  private readonly DEFAULT_CONFIG: Required<MinHashConfig> = {
    hashFunctionsCount: 128,
    similarityThreshold: 0.8,
    maxStackDepth: 10,
    maxFeatures: 50,
    enableWeighting: true,
  };

  // 质数用于哈希计算
  private readonly PRIME_NUMBERS = [
    2147483647, 2147483629, 2147483587, 2147483579, 2147483563,
  ];

  // 特征权重配置
  private readonly FEATURE_WEIGHTS: FeatureWeights = {
    errorMessage: 0.4,
    stackTrace: 0.4,
    sourceFile: 0.15,
    errorType: 0.05,
  };

  private config: Required<MinHashConfig>;

  constructor() {
    this.config = { ...this.DEFAULT_CONFIG };
  }

  /**
   * 更新MinHash配置
   * @param newConfig 新配置
   */
  updateConfig(newConfig: Partial<MinHashConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.log(`MinHash配置已更新: ${JSON.stringify(this.config)}`);
  }

  /**
   * 获取当前配置
   * @returns 当前配置
   */
  getConfig(): Required<MinHashConfig> {
    return { ...this.config };
  }

  /**
   * 计算错误的MinHash指纹
   * @param errorStack 错误堆栈
   * @param errorMessage 错误消息
   * @param sourceFile 源文件
   * @param errorType 错误类型
   * @returns MinHash指纹字符串
   */
  calculateMinHash(
    errorStack: string,
    errorMessage: string,
    sourceFile?: string,
    errorType?: ErrorType
  ): string {
    // 提取关键特征
    const features = this.extractFeatures(
      errorStack,
      errorMessage,
      sourceFile,
      errorType
    );

    // 计算MinHash
    const minHashes = this.computeMinHash(features);

    // 转换为十六进制字符串
    return minHashes.map((hash) => hash.toString(16).padStart(8, "0")).join("");
  }

  /**
   * 计算两个错误哈希的相似度
   * @param hash1 第一个哈希
   * @param hash2 第二个哈希
   * @returns 相似度 (0-1)
   */
  calculateSimilarity(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      return 0;
    }

    const hashLength = hash1.length / 8; // 每个哈希值8个字符
    let matches = 0;

    for (let i = 0; i < hashLength; i++) {
      const start = i * 8;
      const end = start + 8;
      if (hash1.substring(start, end) === hash2.substring(start, end)) {
        matches++;
      }
    }

    return matches / hashLength;
  }

  /**
   * 判断两个错误是否应该聚合
   * @param hash1 第一个哈希
   * @param hash2 第二个哈希
   * @returns 是否应该聚合
   */
  shouldAggregate(hash1: string, hash2: string): boolean {
    const similarity = this.calculateSimilarity(hash1, hash2);
    return similarity >= this.config.similarityThreshold;
  }

  /**
   * 计算加权Jaccard相似度
   * @param hash1 第一个哈希
   * @param hash2 第二个哈希
   * @returns 加权相似度 (0-1)
   */
  calculateWeightedSimilarity(hash1: string, hash2: string): number {
    if (!this.config.enableWeighting) {
      return this.calculateSimilarity(hash1, hash2);
    }

    // 这里可以实现更复杂的加权相似度算法
    // 目前使用基础相似度作为基准
    const baseSimilarity = this.calculateSimilarity(hash1, hash2);

    // 可以根据错误类型、频率等因素调整权重
    return baseSimilarity;
  }

  /**
   * 批量计算相似度矩阵
   * @param hashes 哈希数组
   * @returns 相似度矩阵
   */
  calculateSimilarityMatrix(hashes: string[]): number[][] {
    const matrix: number[][] = [];

    for (let i = 0; i < hashes.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < hashes.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else if (i < j) {
          matrix[i][j] = this.calculateSimilarity(hashes[i], hashes[j]);
        } else {
          matrix[i][j] = matrix[j][i]; // 对称矩阵
        }
      }
    }

    return matrix;
  }

  /**
   * 查找相似错误组
   * @param targetHash 目标哈希
   * @param candidateHashes 候选哈希数组
   * @param threshold 相似度阈值
   * @returns 相似的哈希数组
   */
  findSimilarErrors(
    targetHash: string,
    candidateHashes: string[],
    threshold?: number
  ): Array<{ hash: string; similarity: number }> {
    const similarityThreshold = threshold || this.config.similarityThreshold;

    return candidateHashes
      .map((hash) => ({
        hash,
        similarity: this.calculateSimilarity(targetHash, hash),
      }))
      .filter((item) => item.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 提取错误特征
   * @param errorStack 错误堆栈
   * @param errorMessage 错误消息
   * @param sourceFile 源文件
   * @param errorType 错误类型
   * @returns 特征集合
   */
  private extractFeatures(
    errorStack: string,
    errorMessage: string,
    sourceFile?: string,
    errorType?: ErrorType
  ): Set<string> {
    const features = new Set<string>();
    const maxFeatures = this.config.maxFeatures;
    const maxStackDepth = this.config.maxStackDepth;

    // 添加错误类型特征
    if (errorType) {
      features.add(`type:${errorType}`);
    }

    // 添加错误消息特征
    if (errorMessage) {
      // 移除动态内容（数字、URL等）
      const cleanMessage = this.cleanErrorMessage(errorMessage);
      const messageTokens = this.tokenize(cleanMessage);

      // 限制特征数量
      const messageFeatureCount = Math.floor(
        maxFeatures * this.FEATURE_WEIGHTS.errorMessage
      );
      messageTokens.slice(0, messageFeatureCount).forEach((token) => {
        if (token.length > 2) {
          // 过滤短词
          features.add(`msg:${token}`);
        }
      });

      // 添加错误类型特征（从错误消息中提取）
      if (!errorType) {
        const detectedType = this.detectErrorTypeFromMessage(cleanMessage);
        if (detectedType) {
          features.add(`type:${detectedType}`);
        }
      }
    }

    // 添加堆栈特征
    if (errorStack) {
      const stackLines = this.parseStackTrace(errorStack);
      const stackFeatureCount = Math.floor(
        maxFeatures * this.FEATURE_WEIGHTS.stackTrace
      );

      // 只取前几层堆栈，避免过深的调用链影响聚合
      stackLines
        .slice(0, Math.min(maxStackDepth, stackFeatureCount))
        .forEach((line, index) => {
          features.add(`stack:${line}`);

          // 从堆栈中提取函数名作为额外特征
          const functionName = this.extractFunctionName(line);
          if (functionName) {
            features.add(`func:${functionName}`);
          }
        });
    }

    // 添加源文件特征
    if (sourceFile) {
      const fileName = this.extractFileName(sourceFile);
      features.add(`file:${fileName}`);

      // 添加文件路径特征
      const pathParts = sourceFile.split(/[\/\\]/);
      if (pathParts.length > 1) {
        // 添加目录名作为特征
        const dirName = pathParts[pathParts.length - 2];
        features.add(`dir:${dirName}`);
      }
    }

    this.logger.debug(`提取了 ${features.size} 个特征`);
    return features;
  }

  /**
   * 计算MinHash值
   * @param features 特征集合
   * @returns MinHash数组
   */
  private computeMinHash(features: Set<string>): number[] {
    const minHashes = new Array(this.config.hashFunctionsCount).fill(Infinity);

    // 为每个特征计算哈希值
    features.forEach((feature) => {
      for (let i = 0; i < this.config.hashFunctionsCount; i++) {
        const hashValue = this.hashFunction(feature, i);
        minHashes[i] = Math.min(minHashes[i], hashValue);
      }
    });

    return minHashes;
  }

  /**
   * 哈希函数
   * @param input 输入字符串
   * @param seed 种子值
   * @returns 哈希值
   */
  private hashFunction(input: string, seed: number): number {
    const primeIndex = seed % this.PRIME_NUMBERS.length;
    const prime = this.PRIME_NUMBERS[primeIndex];
    const hash = createHash("md5")
      .update(input + seed.toString())
      .digest("hex");
    return parseInt(hash.substring(0, 8), 16) % prime;
  }

  /**
   * 清理错误消息，移除动态内容
   * @param message 原始错误消息
   * @returns 清理后的消息
   */
  private cleanErrorMessage(message: string): string {
    return (
      message
        // 移除数字
        .replace(/\d+/g, "NUM")
        // 移除URL
        .replace(/https?:\/\/[^\s]+/g, "URL")
        // 移除文件路径
        .replace(/[a-zA-Z]:\\.+|\/.+/g, "PATH")
        // 移除时间戳
        .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/g, "TIMESTAMP")
        // 移除UUID
        .replace(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
          "UUID"
        )
        .toLowerCase()
    );
  }

  /**
   * 分词
   * @param text 文本
   * @returns 词汇数组
   */
  private tokenize(text: string): string[] {
    return text
      .split(/[\s\W]+/)
      .filter((token) => token.length > 2) // 过滤短词
      .slice(0, 20); // 限制特征数量
  }

  /**
   * 解析堆栈跟踪
   * @param stackTrace 堆栈跟踪字符串
   * @returns 标准化的堆栈行数组
   */
  private parseStackTrace(stackTrace: string): string[] {
    return stackTrace
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => this.normalizeStackLine(line))
      .filter((line) => line.length > 0)
      .slice(0, 10); // 限制堆栈深度
  }

  /**
   * 标准化堆栈行
   * @param line 堆栈行
   * @returns 标准化后的行
   */
  private normalizeStackLine(line: string): string {
    // 移除文件路径，只保留函数名和相对位置
    return line
      .replace(/https?:\/\/[^\s]+\//g, "") // 移除URL前缀
      .replace(/[a-zA-Z]:\\.+\\/g, "") // 移除Windows路径
      .replace(/\/.+\//g, "") // 移除Unix路径
      .replace(/:\d+:\d+/g, ":LINE:COL") // 标准化行列号
      .replace(/\s+/g, " ") // 标准化空格
      .trim();
  }

  /**
   * 从错误消息中检测错误类型
   * @param message 清理后的错误消息
   * @returns 检测到的错误类型
   */
  private detectErrorTypeFromMessage(message: string): ErrorType | null {
    const lowerMessage = message.toLowerCase();

    // 网络错误
    if (
      lowerMessage.includes("network") ||
      lowerMessage.includes("fetch") ||
      lowerMessage.includes("xhr") ||
      lowerMessage.includes("ajax") ||
      lowerMessage.includes("timeout")
    ) {
      return ErrorType.NETWORK;
    }

    // 资源加载错误
    if (
      lowerMessage.includes("script") ||
      lowerMessage.includes("resource") ||
      lowerMessage.includes("load") ||
      lowerMessage.includes("404") ||
      lowerMessage.includes("not found")
    ) {
      return ErrorType.RESOURCE;
    }

    // Promise错误
    if (
      lowerMessage.includes("promise") ||
      lowerMessage.includes("unhandled") ||
      lowerMessage.includes("rejection")
    ) {
      return ErrorType.PROMISE;
    }

    // 默认为JavaScript错误
    return ErrorType.JAVASCRIPT;
  }

  /**
   * 从堆栈行中提取函数名
   * @param stackLine 堆栈行
   * @returns 函数名
   */
  private extractFunctionName(stackLine: string): string | null {
    // 匹配常见的函数名模式
    const patterns = [
      /at\s+([\w.$]+)\s*\(/, // Chrome: at functionName (
      /at\s+([\w.$]+)@/, // Firefox: at functionName@
      /^\s*([\w.$]+)\s*\(/, // 简单模式: functionName(
      /\s+([\w.$]+)\s*\[/, // 数组访问: functionName[
    ];

    for (const pattern of patterns) {
      const match = stackLine.match(pattern);
      if (
        match &&
        match[1] &&
        match[1] !== "anonymous" &&
        match[1] !== "<anonymous>"
      ) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * 提取文件名
   * @param filePath 文件路径
   * @returns 文件名
   */
  private extractFileName(filePath: string): string {
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1] || filePath;
  }

  /**
   * 获取MinHash算法统计信息
   * @returns 统计信息
   */
  getStatistics(): {
    config: Required<MinHashConfig>;
    primeNumbers: number[];
    featureWeights: FeatureWeights;
  } {
    return {
      config: this.getConfig(),
      primeNumbers: [...this.PRIME_NUMBERS],
      featureWeights: { ...this.FEATURE_WEIGHTS },
    };
  }

  /**
   * 验证哈希格式
   * @param hash 哈希字符串
   * @returns 是否有效
   */
  isValidHash(hash: string): boolean {
    if (!hash || typeof hash !== "string") {
      return false;
    }

    const expectedLength = this.config.hashFunctionsCount * 8; // 每个哈希8个字符
    return hash.length === expectedLength && /^[0-9a-f]+$/i.test(hash);
  }

  /**
   * 重置配置为默认值
   */
  resetConfig(): void {
    this.config = { ...this.DEFAULT_CONFIG };
    this.logger.log("MinHash配置已重置为默认值");
  }
}
