import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickHouseClient, createClient } from '@clickhouse/client';
import { ErrorLog } from '../modules/monitor/entities/error-log.entity';
import { ClickHouseConfig } from '../config/database.config';

/**
 * ClickHouse数据库服务
 * 负责ClickHouse数据库的连接和数据操作
 */
@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseService.name);
  private client: ClickHouseClient;
  private isConnected = false;

  constructor(
    private configService: ConfigService,
    private clickHouseConfig: ClickHouseConfig
  ) {}

  /**
   * 模块初始化时连接ClickHouse
   */
  async onModuleInit() {
    await this.connect();
    await this.initializeTables();
  }

  /**
   * 连接ClickHouse数据库
   */
  private async connect() {
    try {
      const config = this.clickHouseConfig.getClickHouseConfig();

      this.client = createClient({
        host: config.host,
        username: config.username,
        password: config.password,
        database: config.database,
        clickhouse_settings: {
          async_insert: 1,
          wait_for_async_insert: 0,
        },
      });

      // 测试连接
      await this.client.ping();
      this.isConnected = true;
      this.logger.log('ClickHouse连接成功');
    } catch (error) {
      this.logger.error(`ClickHouse连接失败: ${error.message}`);
      this.isConnected = false;
    }
  }

  /**
   * 初始化数据表
   */
  private async initializeTables() {
    if (!this.isConnected) {
      this.logger.warn('ClickHouse未连接，跳过表初始化');
      return;
    }

    try {
      // 创建错误日志表
      await this.createErrorLogsTable();
      this.logger.log('ClickHouse表初始化完成');
    } catch (error) {
      this.logger.error(`ClickHouse表初始化失败: ${error.message}`);
    }
  }

  /**
   * 创建错误日志表
   */
  private async createErrorLogsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS error_logs (
        id UInt64,
        project_id String,
        type String,
        error_hash String,
        error_message String,
        error_stack Nullable(String),
        page_url Nullable(String),
        user_id Nullable(String),
        user_agent Nullable(String),
        device_info Nullable(String),
        network_info Nullable(String),
        performance_data Nullable(String),
        source_file Nullable(String),
        source_line Nullable(UInt32),
        source_column Nullable(UInt32),
        extra_data Nullable(String),
        created_at DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY (project_id, created_at)
      PARTITION BY toYYYYMM(created_at)
      TTL created_at + INTERVAL 90 DAY
    `;

    await this.client.exec({ query: createTableSQL });
  }

  /**
   * 插入错误日志
   * @param errorLog 错误日志数据
   */
  async insertErrorLog(errorLog: Partial<ErrorLog>): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('ClickHouse未连接，无法插入数据');
      return;
    }

    try {
      await this.client.insert({
        table: 'error_logs',
        values: [{
          id: errorLog.id || 0,
          project_id: errorLog.projectId,
          type: errorLog.type,
          error_hash: errorLog.errorHash,
          error_message: errorLog.errorMessage,
          error_stack: errorLog.errorStack || null,
          page_url: errorLog.pageUrl || null,
          user_id: errorLog.userId || null,
          user_agent: errorLog.userAgent || null,
          device_info: errorLog.deviceInfo || null,
          network_info: errorLog.networkInfo || null,
          performance_data: errorLog.performanceData || null,
          source_file: errorLog.sourceFile || null,
          source_line: errorLog.sourceLine || null,
          source_column: errorLog.sourceColumn || null,
          extra_data: errorLog.extraData || null,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }],
        format: 'JSONEachRow',
      });

      this.logger.debug(`错误日志已插入ClickHouse: ${errorLog.projectId}`);
    } catch (error) {
      this.logger.error(`插入错误日志失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量插入错误日志
   * @param errorLogs 错误日志数组
   */
  async insertErrorLogs(errorLogs: Partial<ErrorLog>[]): Promise<void> {
    if (!this.isConnected || errorLogs.length === 0) {
      return;
    }

    try {
      const values = errorLogs.map(errorLog => ({
        id: errorLog.id || 0,
        project_id: errorLog.projectId,
        type: errorLog.type,
        error_hash: errorLog.errorHash,
        error_message: errorLog.errorMessage,
        error_stack: errorLog.errorStack || null,
        page_url: errorLog.pageUrl || null,
        user_id: errorLog.userId || null,
        user_agent: errorLog.userAgent || null,
        device_info: errorLog.deviceInfo || null,
        network_info: errorLog.networkInfo || null,
        performance_data: errorLog.performanceData || null,
        source_file: errorLog.sourceFile || null,
        source_line: errorLog.sourceLine || null,
        source_column: errorLog.sourceColumn || null,
        extra_data: errorLog.extraData || null,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }));

      await this.client.insert({
        table: 'error_logs',
        values,
        format: 'JSONEachRow',
      });

      this.logger.debug(`批量插入${errorLogs.length}条错误日志到ClickHouse`);
    } catch (error) {
      this.logger.error(`批量插入错误日志失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查询错误日志
   * @param projectId 项目ID
   * @param options 查询选项
   */
  async queryErrorLogs(projectId: string, options: {
    startTime?: Date;
    endTime?: Date;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    if (!this.isConnected) {
      this.logger.warn('ClickHouse未连接，无法查询数据');
      return [];
    }

    try {
      const { startTime, endTime, type, limit = 100, offset = 0 } = options;
      
      let whereClause = `project_id = '${projectId}'`;
      
      if (startTime) {
        whereClause += ` AND created_at >= '${startTime.toISOString().slice(0, 19).replace('T', ' ')}'`;
      }
      
      if (endTime) {
        whereClause += ` AND created_at <= '${endTime.toISOString().slice(0, 19).replace('T', ' ')}'`;
      }
      
      if (type) {
        whereClause += ` AND type = '${type}'`;
      }

      const query = `
        SELECT *
        FROM error_logs
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const result = await this.client.query({
        query,
        format: 'JSONEachRow',
      });

      return await result.json();
    } catch (error) {
      this.logger.error(`查询错误日志失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取错误统计信息
   * @param projectId 项目ID
   * @param timeRange 时间范围（小时）
   */
  async getErrorStats(projectId: string, timeRange: number = 24): Promise<any> {
    if (!this.isConnected) {
      this.logger.warn('ClickHouse未连接，无法获取统计数据');
      return null;
    }

    try {
      const query = `
        SELECT
          type,
          count() as count,
          uniq(error_hash) as unique_errors,
          max(created_at) as last_occurrence
        FROM error_logs
        WHERE project_id = '${projectId}'
          AND created_at >= now() - INTERVAL ${timeRange} HOUR
        GROUP BY type
        ORDER BY count DESC
      `;

      const result = await this.client.query({
        query,
        format: 'JSONEachRow',
      });

      return await result.json();
    } catch (error) {
      this.logger.error(`获取错误统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 检查ClickHouse连接状态
   */
  async checkHealth(): Promise<{ status: string; connected: boolean }> {
    try {
      if (!this.client) {
        return { status: 'error', connected: false };
      }

      await this.client.ping();
      return { status: 'ok', connected: true };
    } catch (error) {
      this.logger.error(`ClickHouse健康检查失败: ${error.message}`);
      return { status: 'error', connected: false };
    }
  }

  /**
   * 关闭连接
   */
  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('ClickHouse连接已关闭');
    }
  }
}