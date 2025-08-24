/**
 * 队列管理工具
 * 提供数据队列管理、批量处理、持久化等功能
 */

import { MonitorData } from "../types/base";
import { StorageAdapter } from "../interfaces/PlatformAdapter";
import { safeJsonStringify, safeJsonParse, debounce } from "./common";

/**
 * 队列配置选项
 */
export interface QueueConfig {
  /** 最大队列大小 */
  maxSize?: number;
  /** 批量处理大小 */
  batchSize?: number;
  /** 自动刷新间隔（毫秒） */
  flushInterval?: number;
  /** 是否启用持久化 */
  enablePersistence?: boolean;
  /** 持久化存储key */
  storageKey?: string;
  /** 最大缓存大小 */
  maxCacheSize?: number;
  /** 是否启用压缩 */
  enableCompression?: boolean;
}

/**
 * 队列状态
 */
export interface QueueStatus {
  /** 队列大小 */
  size: number;
  /** 最大大小 */
  maxSize: number;
  /** 是否已满 */
  isFull: boolean;
  /** 挂起的数据数量 */
  pendingCount: number;
  /** 失败的数据数量 */
  failedCount: number;
  /** 成功发送的数据数量 */
  successCount: number;
}

/**
 * 队列事件类型
 */
export enum QueueEventType {
  ITEM_ADDED = "itemAdded",
  ITEMS_FLUSHED = "itemsFlushed",
  FLUSH_SUCCESS = "flushSuccess",
  FLUSH_ERROR = "flushError",
  QUEUE_FULL = "queueFull",
  CACHE_RESTORED = "cacheRestored",
}

/**
 * 队列事件发射器
 */
export interface QueueEventEmitter {
  on(event: QueueEventType, listener: Function): void;
  emit(event: QueueEventType, ...args: any[]): void;
}

/**
 * 数据队列管理器
 */
export class DataQueue {
  private config: Required<QueueConfig>;
  private queue: MonitorData[] = [];
  private pendingQueue: MonitorData[] = [];
  private storage?: StorageAdapter;
  private flushTimer?: any;
  private eventEmitter?: QueueEventEmitter;
  private stats = {
    successCount: 0,
    failedCount: 0,
  };

  constructor(
    config: QueueConfig = {},
    storage?: StorageAdapter,
    eventEmitter?: QueueEventEmitter
  ) {
    this.config = {
      maxSize: 500,
      batchSize: 20,
      flushInterval: 10000,
      enablePersistence: false,
      storageKey: "monitor_queue",
      maxCacheSize: 100,
      enableCompression: false,
      ...config,
    };

    this.storage = storage;
    this.eventEmitter = eventEmitter;

    this.init();
  }

  /**
   * 初始化队列
   */
  private init(): void {
    // 从缓存恢复数据
    if (this.config.enablePersistence && this.storage) {
      this.restoreFromCache();
    }

    // 启动定时刷新
    this.startFlushTimer();
  }

  /**
   * 添加数据到队列
   * @param data 监控数据
   */
  public add(data: MonitorData): void {
    // 检查队列是否已满
    if (this.queue.length >= this.config.maxSize) {
      // 移除最老的数据
      this.queue.shift();
      this.eventEmitter?.emit(QueueEventType.QUEUE_FULL, this.getStatus());
    }

    this.queue.push(data);
    this.eventEmitter?.emit(QueueEventType.ITEM_ADDED, data);

    // 持久化
    if (this.config.enablePersistence) {
      this.debouncedSaveToCache();
    }
  }

  /**
   * 批量添加数据
   * @param dataList 数据列表
   */
  public addBatch(dataList: MonitorData[]): void {
    dataList.forEach((data) => this.add(data));
  }

  /**
   * 获取批量数据
   * @param size 批量大小
   * @returns 数据数组
   */
  public getBatch(size?: number): MonitorData[] {
    const batchSize = size || this.config.batchSize;
    return this.queue.splice(0, Math.min(batchSize, this.queue.length));
  }

  /**
   * 获取所有数据并清空队列
   * @returns 所有数据
   */
  public flush(): MonitorData[] {
    const allData = [...this.queue];
    this.queue = [];
    this.eventEmitter?.emit(QueueEventType.ITEMS_FLUSHED, allData);

    // 更新缓存
    if (this.config.enablePersistence) {
      this.saveToCache();
    }

    return allData;
  }

  /**
   * 处理发送成功
   * @param data 成功发送的数据
   */
  public onSendSuccess(data: MonitorData[]): void {
    this.stats.successCount += data.length;
    this.eventEmitter?.emit(QueueEventType.FLUSH_SUCCESS, data);
  }

  /**
   * 处理发送失败
   * @param data 失败的数据
   * @param error 错误信息
   */
  public onSendError(data: MonitorData[], error: any): void {
    this.stats.failedCount += data.length;

    // 将失败的数据重新放回队列
    this.queue.unshift(...data);

    // 限制队列大小
    if (this.queue.length > this.config.maxSize) {
      this.queue = this.queue.slice(0, this.config.maxSize);
    }

    this.eventEmitter?.emit(QueueEventType.FLUSH_ERROR, { data, error });
  }

  /**
   * 获取队列状态
   * @returns 队列状态
   */
  public getStatus(): QueueStatus {
    return {
      size: this.queue.length,
      maxSize: this.config.maxSize,
      isFull: this.queue.length >= this.config.maxSize,
      pendingCount: this.pendingQueue.length,
      failedCount: this.stats.failedCount,
      successCount: this.stats.successCount,
    };
  }

  /**
   * 检查队列是否为空
   * @returns 是否为空
   */
  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * 检查队列是否已满
   * @returns 是否已满
   */
  public isFull(): boolean {
    return this.queue.length >= this.config.maxSize;
  }

  /**
   * 清空队列
   */
  public clear(): void {
    this.queue = [];
    this.pendingQueue = [];
    this.stats = { successCount: 0, failedCount: 0 };

    if (this.config.enablePersistence && this.storage) {
      this.storage.removeItem(this.config.storageKey);
    }
  }

  /**
   * 启动定时刷新
   */
  private startFlushTimer(): void {
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        if (!this.isEmpty()) {
          // 这里需要外部处理实际的发送逻辑
          const data = this.getBatch();
          if (data.length > 0) {
            this.eventEmitter?.emit(QueueEventType.ITEMS_FLUSHED, data);
          }
        }
      }, this.config.flushInterval);
    }
  }

  /**
   * 停止定时刷新
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * 保存到缓存
   */
  private saveToCache(): void {
    if (!this.storage) return;

    try {
      const cacheData = {
        queue: this.queue.slice(-this.config.maxCacheSize), // 只缓存最新的数据
        timestamp: Date.now(),
        stats: this.stats,
      };

      const serialized = this.config.enableCompression
        ? this.compress(safeJsonStringify(cacheData))
        : safeJsonStringify(cacheData);

      this.storage.setItem(this.config.storageKey, serialized);
    } catch (error) {
      console.warn("[DataQueue] Failed to save to cache:", error);
    }
  }

  /**
   * 从缓存恢复
   */
  private restoreFromCache(): void {
    if (!this.storage) return;

    try {
      const cached = this.storage.getItem(this.config.storageKey);
      if (!cached) return;

      const serialized = this.config.enableCompression
        ? this.decompress(cached)
        : cached;

      const cacheData = safeJsonParse(serialized);
      if (!cacheData) return;

      // 检查缓存是否过期（24小时）
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - cacheData.timestamp > maxAge) {
        this.storage.removeItem(this.config.storageKey);
        return;
      }

      // 恢复队列数据
      if (Array.isArray(cacheData.queue)) {
        this.queue = cacheData.queue;
      }

      // 恢复统计数据
      if (cacheData.stats) {
        this.stats = { ...this.stats, ...cacheData.stats };
      }

      this.eventEmitter?.emit(QueueEventType.CACHE_RESTORED, {
        restoredCount: this.queue.length,
        stats: this.stats,
      });

      console.log(`[DataQueue] Restored ${this.queue.length} items from cache`);
    } catch (error) {
      console.warn("[DataQueue] Failed to restore from cache:", error);
      // 清除损坏的缓存
      this.storage.removeItem(this.config.storageKey);
    }
  }

  /**
   * 防抖的保存到缓存
   */
  private debouncedSaveToCache = debounce(() => {
    this.saveToCache();
  }, 1000);

  /**
   * 简单压缩（这里使用base64编码作为示例）
   * @param data 数据
   * @returns 压缩后的数据
   */
  private compress(data: string): string {
    // 在实际项目中，可以使用更高效的压缩算法
    try {
      return btoa(encodeURIComponent(data));
    } catch {
      return data;
    }
  }

  /**
   * 简单解压缩
   * @param data 压缩的数据
   * @returns 解压后的数据
   */
  private decompress(data: string): string {
    try {
      return decodeURIComponent(atob(data));
    } catch {
      return data;
    }
  }

  /**
   * 销毁队列
   */
  public destroy(): void {
    this.stopFlushTimer();

    // 最后一次保存
    if (this.config.enablePersistence) {
      this.saveToCache();
    }

    this.clear();
  }
}

/**
 * 重试队列
 * 专门处理失败重试的队列
 */
export class RetryQueue extends DataQueue {
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number;
  private retryDelay: number;

  constructor(
    config: QueueConfig & { maxRetries?: number; retryDelay?: number } = {},
    storage?: StorageAdapter,
    eventEmitter?: QueueEventEmitter
  ) {
    super(config, storage, eventEmitter);
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 2000;
  }

  /**
   * 添加重试数据
   * @param data 数据
   * @param error 错误信息
   */
  public addRetry(data: MonitorData, error: any): void {
    const key = data.id;
    const attempts = this.retryAttempts.get(key) || 0;

    if (attempts < this.maxRetries) {
      this.retryAttempts.set(key, attempts + 1);

      // 延迟重试
      setTimeout(() => {
        this.add(data);
      }, this.retryDelay * Math.pow(2, attempts)); // 指数退避
    } else {
      // 达到最大重试次数，丢弃数据
      this.retryAttempts.delete(key);
      console.warn("[RetryQueue] Max retries reached for data:", key);
    }
  }

  /**
   * 处理发送成功
   */
  public onSendSuccess(data: MonitorData[]): void {
    super.onSendSuccess(data);

    // 清除重试计数
    data.forEach((item) => {
      this.retryAttempts.delete(item.id);
    });
  }

  /**
   * 获取重试统计
   */
  public getRetryStats(): { totalRetries: number; activeRetries: number } {
    return {
      totalRetries: Array.from(this.retryAttempts.values()).reduce(
        (sum, count) => sum + count,
        0
      ),
      activeRetries: this.retryAttempts.size,
    };
  }

  /**
   * 清空重试队列
   */
  public clear(): void {
    super.clear();
    this.retryAttempts.clear();
  }
}
