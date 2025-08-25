import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ClickHouse数据模型优化迁移
 * 主要优化点：
 * 1. 使用LowCardinality优化高基数字符串字段
 * 2. 创建物化视图加速聚合查询
 * 3. 优化表结构和索引设置
 */
export class OptimizeClickHouseTables1704067200000 implements MigrationInterface {
  
  /**
   * 执行迁移
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查是否为ClickHouse数据库
    const isClickHouse = await this.isClickHouseDatabase(queryRunner);
    if (!isClickHouse) {
      console.log('非ClickHouse数据库，跳过ClickHouse优化迁移');
      return;
    }

    console.log('开始优化ClickHouse数据模型...');

    try {
      // 1. 创建优化后的错误日志表
      await this.createOptimizedErrorLogsTable(queryRunner);
      
      // 2. 创建物化视图
      await this.createMaterializedViews(queryRunner);
      
      // 3. 从旧表迁移数据到新表（如果存在旧表）
      await this.migrateDataFromOldTable(queryRunner);
      
      console.log('ClickHouse数据模型优化完成');
    } catch (error) {
      console.error('ClickHouse优化迁移失败:', error);
      throw error;
    }
  }

  /**
   * 回滚迁移
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const isClickHouse = await this.isClickHouseDatabase(queryRunner);
    if (!isClickHouse) {
      return;
    }

    console.log('回滚ClickHouse优化迁移...');

    try {
      // 删除物化视图
      await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS error_logs_hourly_stats`);
      await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS error_logs_daily_stats`);
      
      // 删除优化表（如果存在）
      await queryRunner.query(`DROP TABLE IF EXISTS error_logs_optimized`);
      
      console.log('ClickHouse优化迁移回滚完成');
    } catch (error) {
      console.error('ClickHouse优化迁移回滚失败:', error);
    }
  }

  /**
   * 检查是否为ClickHouse数据库
   */
  private async isClickHouseDatabase(queryRunner: QueryRunner): Promise<boolean> {
    try {
      const result = await queryRunner.query(`SELECT version() as db_version`);
      return result && result[0] && result[0].db_version.includes('ClickHouse');
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建优化后的错误日志表
   */
  private async createOptimizedErrorLogsTable(queryRunner: QueryRunner): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS error_logs_optimized (
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

    await queryRunner.query(createTableSQL);
  }

  /**
   * 创建物化视图
   */
  private async createMaterializedViews(queryRunner: QueryRunner): Promise<void> {
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
      FROM error_logs_optimized
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
      FROM error_logs_optimized
      GROUP BY project_id, error_date, type
    `;

    await queryRunner.query(hourlyStatsSQL);
    await queryRunner.query(dailyStatsSQL);
  }

  /**
   * 从旧表迁移数据
   */
  private async migrateDataFromOldTable(queryRunner: QueryRunner): Promise<void> {
    // 检查旧表是否存在
    const oldTableExists = await this.tableExists(queryRunner, 'error_logs');
    if (!oldTableExists) {
      console.log('旧表不存在，跳过数据迁移');
      return;
    }

    console.log('开始从旧表迁移数据到优化表...');

    // 分批迁移数据，避免内存溢出
    const batchSize = 10000;
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const migrateSQL = `
        INSERT INTO error_logs_optimized
        SELECT 
          id,
          project_id,
          type,
          error_hash,
          error_message,
          error_stack,
          page_url,
          user_id,
          user_agent,
          device_info,
          network_info,
          performance_data,
          source_file,
          source_line,
          source_column,
          extra_data,
          created_at
        FROM error_logs
        ORDER BY created_at
        LIMIT ${batchSize}
        OFFSET ${offset}
      `;

      const result = await queryRunner.query(migrateSQL);
      
      if (result && result.rows && result.rows.length < batchSize) {
        hasMoreData = false;
      }
      
      offset += batchSize;
      console.log(`已迁移 ${offset} 条数据`);
    }

    console.log('数据迁移完成');
  }

  /**
   * 检查表是否存在
   */
  private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    try {
      await queryRunner.query(`SELECT 1 FROM ${tableName} LIMIT 1`);
      return true;
    } catch (error) {
      return false;
    }
  }

  public name = 'OptimizeClickHouseTables1704067200000';
}