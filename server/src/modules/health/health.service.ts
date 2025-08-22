import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ClickHouseService } from '../clickhouse/services/clickhouse.service';

/**
 * 健康检查服务
 */
@Injectable()
export class HealthService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    private readonly clickHouseService: ClickHouseService,
  ) {}

  /**
   * 检查服务健康状态
   * @returns 健康状态信息
   */
  async checkHealth() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * 检查数据库连接状态
   * @returns 数据库连接状态
   */
  async checkDatabase() {
    const results: {
      mysql: { status: string; connected: boolean; error?: string };
      clickhouse: { status: string; connected: boolean; error?: string };
    } = {
      mysql: { status: 'unknown', connected: false },
      clickhouse: { status: 'unknown', connected: false },
    };

    // 检查MySQL连接
    try {
      await this.connection.query('SELECT 1');
      results.mysql = { status: 'ok', connected: true };
    } catch (error) {
      results.mysql = { status: 'error', connected: false, error: error.message };
    }

    // 检查ClickHouse连接
    try {
      const clickhouseHealth = await this.clickHouseService.checkHealth();
      results.clickhouse = clickhouseHealth;
    } catch (error) {
      results.clickhouse = { status: 'error', connected: false, error: error.message };
    }

    const overallStatus = results.mysql.connected && results.clickhouse.connected ? 'ok' : 'error';

    return {
      status: overallStatus,
      databases: results,
      timestamp: new Date().toISOString(),
    };
  }
}