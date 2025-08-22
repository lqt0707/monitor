import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModuleOptions, BullOptionsFactory } from '@nestjs/bull';
import { RedisOptions } from 'ioredis';

/**
 * Redis配置服务
 */
@Injectable()
export class RedisConfigService implements BullOptionsFactory {
  constructor(private configService: ConfigService) {}

  /**
   * 创建Bull队列配置
   */
  createBullOptions(): BullModuleOptions {
    return {
      redis: this.getRedisConfig(),
      defaultJobOptions: {
        removeOnComplete: 100, // 保留最近100个完成的任务
        removeOnFail: 50,      // 保留最近50个失败的任务
        attempts: 3,           // 重试次数
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };
  }

  /**
   * 获取Redis连接配置
   */
  getRedisConfig(): RedisOptions {
    return {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    };
  }

  /**
   * 获取Redis缓存配置
   */
  getCacheConfig(): any {
    return {
      store: 'redis',
      ...this.getRedisConfig(),
      ttl: this.configService.get<number>('CACHE_TTL', 3600), // 默认1小时
    };
  }
}