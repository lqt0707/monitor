import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ClickHouseService } from '../services/clickhouse.service';

/**
 * ClickHouse性能监控控制器
 * 提供性能监控和查询优化的API接口
 */
@Controller('clickhouse/performance')
export class ClickHousePerformanceController {
  private readonly logger = new Logger(ClickHousePerformanceController.name);

  constructor(private readonly clickHouseService: ClickHouseService) {}

  /**
   * 获取表统计信息
   * @returns 表统计信息
   */
  @Get('table-stats')
  async getTableStats() {
    try {
      const stats = await this.clickHouseService.getTableStats();
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`获取表统计失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取查询性能指标
   * @returns 查询性能指标
   */
  @Get('query-metrics')
  async getQueryMetrics() {
    try {
      const metrics = await this.clickHouseService.getQueryMetrics();
      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`获取查询指标失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 清理旧数据
   * @param days 保留天数
   * @returns 清理结果
   */
  @Get('cleanup')
  async cleanupOldData(@Query('days') days: number = 90) {
    try {
      await this.clickHouseService.cleanupOldData(days);
      return {
        success: true,
        message: `已清理超过 ${days} 天的旧数据`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`清理旧数据失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 优化表数据
   * @param table 表名
   * @returns 优化结果
   */
  @Get('optimize-table')
  async optimizeTable(@Query('table') table: string = 'error_logs') {
    try {
      await this.clickHouseService.optimizeTable(table);
      return {
        success: true,
        message: `表 ${table} 优化完成`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`表优化失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取健康状态
   * @returns 健康状态
   */
  @Get('health')
  async getHealth() {
    try {
      const health = await this.clickHouseService.checkHealth();
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`健康检查失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取性能监控仪表板数据
   * @returns 综合性能数据
   */
  @Get('dashboard')
  async getPerformanceDashboard() {
    try {
      const [tableStats, queryMetrics, health] = await Promise.all([
        this.clickHouseService.getTableStats(),
        this.clickHouseService.getQueryMetrics(),
        this.clickHouseService.checkHealth()
      ]);

      return {
        success: true,
        data: {
          table_stats: tableStats,
          query_metrics: queryMetrics,
          health_status: health,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`获取性能仪表板失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}