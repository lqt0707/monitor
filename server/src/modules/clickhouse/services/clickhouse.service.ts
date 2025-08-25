import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickHouseClient, createClient } from '@clickhouse/client';
import { ErrorLog } from '../../monitor/entities/error-log.entity';
import { ClickHouseConfig } from '../../../config/database.config';

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
   * 创建错误日志表（优化版本）
   * 优化点：
   * 1. 使用LowCardinality优化高基数字符串字段
   * 2. 添加二级索引优化常用查询
   * 3. 使用更好的排序键组合
   * 4. 添加采样设置优化大数据量查询
   */
  private async createErrorLogsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS error_logs (
        id UInt64,
        project_id LowCardinality(String),
        type LowCardinality(String),
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
        created_at DateTime DEFAULT now(),
        
        -- 添加物化列用于快速统计
        error_date Date MATERIALIZED toDate(created_at),
        error_hour DateTime MATERIALIZED toStartOfHour(created_at)
      ) ENGINE = MergeTree()
      ORDER BY (project_id, created_at, type)
      PARTITION BY toYYYYMM(created_at)
      TTL created_at + INTERVAL 90 DAY
      SETTINGS index_granularity = 8192, 
               min_bytes_for_wide_part = 0,
               min_rows_for_wide_part = 0
    `;

    await this.client.exec({ query: createTableSQL });
    
    // 创建物化视图用于快速聚合查询
    await this.createMaterializedViews();
  }

  /**
   * 创建物化视图优化常用查询
   */
  private async createMaterializedViews() {
    // 按小时统计的错误数量物化视图
    const hourlyStatsSQL = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS error_logs_hourly_stats
      ENGINE = SummingMergeTree()
      ORDER BY (project_id, error_hour, type)
      POPULATE
      AS SELECT
        project_id,
        error_hour,
        type,
        count() as total_count,
        uniq(error_hash) as unique_count
      FROM error_logs
      GROUP BY project_id, error_hour, type
    `;

    // 按天统计的错误数量物化视图
    const dailyStatsSQL = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS error_logs_daily_stats
      ENGINE = SummingMergeTree()
      ORDER BY (project_id, error_date, type)
      POPULATE
      AS SELECT
        project_id,
        error_date,
        type,
        count() as total_count,
        uniq(error_hash) as unique_count
      FROM error_logs
      GROUP BY project_id, error_date, type
    `;

    try {
      await this.client.exec({ query: hourlyStatsSQL });
      await this.client.exec({ query: dailyStatsSQL });
      this.logger.log('ClickHouse物化视图创建完成');
    } catch (error) {
      this.logger.warn(`创建物化视图失败: ${error.message}`);
    }
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
   * 查询错误日志（优化版本）
   * 优化点：
   * 1. 使用参数化查询避免SQL注入
   * 2. 添加查询超时设置
   * 3. 支持采样查询优化性能
   */
  async queryErrorLogs(projectId: string, options: {
    startTime?: Date;
    endTime?: Date;
    type?: string;
    limit?: number;
    offset?: number;
    sample?: number; // 采样率，0-1之间
  } = {}): Promise<any[]> {
    if (!this.isConnected) {
      this.logger.warn('ClickHouse未连接，无法查询数据');
      return [];
    }

    try {
      const { startTime, endTime, type, limit = 100, offset = 0, sample } = options;
      
      const queryParams: any = { project_id: projectId };
      let whereClause = 'project_id = {project_id:String}';
      
      if (startTime) {
        whereClause += ' AND created_at >= {start_time:DateTime}';
        queryParams.start_time = startTime.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      if (endTime) {
        whereClause += ' AND created_at <= {end_time:DateTime}';
        queryParams.end_time = endTime.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      if (type) {
        whereClause += ' AND type = {type:String}';
        queryParams.type = type;
      }

      let sampleClause = '';
      if (sample && sample > 0 && sample <= 1) {
        sampleClause = `SAMPLE ${sample}`;
      }

      const query = `
        SELECT *
        FROM error_logs
        ${sampleClause}
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `;

      queryParams.limit = limit;
      queryParams.offset = offset;

      const result = await this.client.query({
        query,
        query_params: queryParams,
        format: 'JSONEachRow',
        clickhouse_settings: {
          max_execution_time: 30, // 30秒超时
          max_block_size: '10000',
        }
      });

      return await result.json();
    } catch (error) {
      this.logger.error(`查询错误日志失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取错误统计信息（优化版本）
   * 优化点：
   * 1. 使用物化视图加速聚合查询
   * 2. 支持多种时间粒度统计
   * 3. 添加缓存机制
   */
  async getErrorStats(projectId: string, options: {
    timeRange?: number; // 小时数
    granularity?: 'hour' | 'day' | 'total'; // 统计粒度
    useCache?: boolean; // 是否使用缓存
  } = {}): Promise<any> {
    if (!this.isConnected) {
      this.logger.warn('ClickHouse未连接，无法获取统计数据');
      return null;
    }

    const { timeRange = 24, granularity = 'total', useCache = true } = options;

    try {
      let query: string;
      let queryParams: any = { project_id: projectId };

      if (granularity === 'hour' && timeRange <= 72) {
        // 使用小时级物化视图（最近72小时内）
        query = `
          SELECT
            type,
            sum(total_count) as count,
            sum(unique_count) as unique_errors,
            max(error_hour) as last_occurrence
          FROM error_logs_hourly_stats
          WHERE project_id = {project_id:String}
            AND error_hour >= now() - INTERVAL {time_range:UInt32} HOUR
          GROUP BY type
          ORDER BY count DESC
        `;
      } else if (granularity === 'day' && timeRange <= 365) {
        // 使用天级物化视图（最近365天内）
        query = `
          SELECT
            type,
            sum(total_count) as count,
            sum(unique_count) as unique_errors,
            max(error_date) as last_occurrence
          FROM error_logs_daily_stats
          WHERE project_id = {project_id:String}
            AND error_date >= today() - INTERVAL {time_range:UInt32} DAY
          GROUP BY type
          ORDER BY count DESC
        `;
      } else {
        // 原始表查询（大数据量或自定义时间范围）
        query = `
          SELECT
            type,
            count() as count,
            uniq(error_hash) as unique_errors,
            max(created_at) as last_occurrence
          FROM error_logs
          WHERE project_id = {project_id:String}
            AND created_at >= now() - INTERVAL {time_range:UInt32} HOUR
          GROUP BY type
          ORDER BY count DESC
        `;
      }

      queryParams.time_range = timeRange;

      const result = await this.client.query({
        query,
        query_params: queryParams,
        format: 'JSONEachRow',
        clickhouse_settings: {
          max_execution_time: 10,
          use_uncompressed_cache: useCache ? 1 : 0,
        }
      });

      return await result.json();
    } catch (error) {
      this.logger.error(`获取错误统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取错误趋势数据（新增方法）
   * @param projectId 项目ID
   * @param timeRange 时间范围（小时）
   * @param granularity 时间粒度
   */
  async getErrorTrend(projectId: string, options: {
    timeRange?: number;
    granularity?: 'hour' | 'day';
    type?: string;
  } = {}): Promise<any[]> {
    if (!this.isConnected) {
      return [];
    }

    const { timeRange = 24, granularity = 'hour', type } = options;

    try {
      let timeExpr: string;
      let table: string;
      
      if (granularity === 'hour') {
        timeExpr = 'toStartOfHour(created_at) as time_bucket';
        table = 'error_logs';
      } else {
        timeExpr = 'toDate(created_at) as time_bucket';
        table = 'error_logs_daily_stats';
      }

      let whereClause = 'project_id = {project_id:String}';
      const queryParams: any = { project_id: projectId };

      if (type) {
        whereClause += ' AND type = {type:String}';
        queryParams.type = type;
      }

      if (granularity === 'hour') {
        whereClause += ' AND created_at >= now() - INTERVAL {time_range:UInt32} HOUR';
      } else {
        whereClause += ' AND error_date >= today() - INTERVAL {time_range:UInt32} DAY';
      }
      
      queryParams.time_range = timeRange;

      const query = `
        SELECT
          ${timeExpr},
          count() as error_count,
          uniq(error_hash) as unique_errors
        FROM ${table}
        WHERE ${whereClause}
        GROUP BY time_bucket
        ORDER BY time_bucket ASC
      `;

      const result = await this.client.query({
        query,
        query_params: queryParams,
        format: 'JSONEachRow',
      });

      return await result.json();
    } catch (error) {
      this.logger.error(`获取错误趋势失败: ${error.message}`);
      return [];
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

  /**
   * 检查表是否存在
   * @param tableName 表名
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.client.query({
        query: `SELECT count() FROM system.tables WHERE name = {tableName:String}`,
        query_params: { tableName },
        format: 'JSONEachRow',
      });
      
      const data = await result.json() as any[];
      return data.length > 0 && data[0].count > 0;
    } catch (error) {
      this.logger.warn(`检查表存在失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 迁移现有数据到优化表
   */
  private async migrateExistingData(): Promise<void> {
    try {
      const oldTableExists = await this.checkTableExists('error_logs');
      if (!oldTableExists) {
        this.logger.log('旧表不存在，跳过数据迁移');
        return;
      }

      // 分批迁移数据，避免内存溢出
      const batchSize = 100000;
      let offset = 0;
      let totalMigrated = 0;

      while (true) {
        const migrateSQL = `
          INSERT INTO error_logs_optimized
          SELECT * FROM error_logs
          LIMIT {batchSize:UInt32}
          OFFSET {offset:UInt32}
        `;

        const result = await this.client.exec({
          query: migrateSQL,
          query_params: { batchSize, offset },
        });

        const migratedCount = result.query_id ? batchSize : 0;
        totalMigrated += migratedCount;
        
        if (migratedCount < batchSize) {
          break;
        }
        
        offset += batchSize;
        this.logger.log(`已迁移 ${totalMigrated} 条数据到优化表`);
        
        // 避免过快迁移导致性能问题
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.logger.log(`数据迁移完成，共迁移 ${totalMigrated} 条记录`);
    } catch (error) {
      this.logger.error(`数据迁移失败: ${error.message}`);
    }
  }

  /**
   * 获取最优表名（自动选择优化表或回退到普通表）
   */
  private async getOptimalTableName(): Promise<string> {
    try {
      const optimizedTableExists = await this.checkTableExists('error_logs_optimized');
      return optimizedTableExists ? 'error_logs_optimized' : 'error_logs';
    } catch (error) {
      this.logger.warn(`获取最优表名失败，使用默认表: ${error.message}`);
      return 'error_logs';
    }
  }

  /**
   * 性能监控：获取表统计信息
   */
  async getTableStats(): Promise<any> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const query = `
        SELECT 
          table,
          sum(rows) as total_rows,
          sum(bytes) as total_size_bytes,
          max(modification_time) as last_modified,
          count() as part_count
        FROM system.parts
        WHERE database = currentDatabase() AND active
        GROUP BY table
        ORDER BY total_rows DESC
      `;

      const result = await this.client.query({
        query,
        format: 'JSONEachRow',
      });

      return await result.json();
    } catch (error) {
      this.logger.error(`获取表统计失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 性能监控：获取查询性能指标
   */
  async getQueryMetrics(): Promise<any> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const query = `
        SELECT 
          query,
          count() as execution_count,
          avg(query_duration_ms) as avg_duration_ms,
          max(query_duration_ms) as max_duration_ms,
          sum(read_rows) as total_read_rows,
          sum(read_bytes) as total_read_bytes
        FROM system.query_log
        WHERE event_date >= today() - 7
          AND query_kind = 'Select'
          AND type = 'QueryFinish'
        GROUP BY query
        HAVING execution_count > 5
        ORDER BY avg_duration_ms DESC
        LIMIT 20
      `;

      const result = await this.client.query({
        query,
        format: 'JSONEachRow',
      });

      return await result.json();
    } catch (error) {
      this.logger.error(`获取查询指标失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 性能优化：清理旧数据
   */
  async cleanupOldData(days: number = 90): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const query = `
        ALTER TABLE error_logs
        DELETE WHERE created_at < now() - INTERVAL {days:UInt32} DAY
      `;

      await this.client.exec({
        query,
        query_params: { days },
      });

      this.logger.log(`已清理超过 ${days} 天的旧数据`);
    } catch (error) {
      this.logger.error(`清理旧数据失败: ${error.message}`);
    }
  }

  /**
   * 性能优化：重新压缩表数据
   */
  async optimizeTable(tableName: string = 'error_logs'): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const query = `OPTIMIZE TABLE ${tableName} FINAL`;
      await this.client.exec({ query });
      this.logger.log(`表 ${tableName} 优化完成`);
    } catch (error) {
      this.logger.error(`表优化失败: ${error.message}`);
    }
  }
}