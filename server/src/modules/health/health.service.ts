import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitorData } from '../monitor/entities/monitor-data.entity';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  version: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    redis?: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    clickhouse?: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    queue?: {
      status: 'healthy' | 'unhealthy';
      error?: string;
    };
  };
  metrics: {
    totalErrors: number;
    errorRate: number;
    avgResponseTime: number;
  };
}

/**
 * 健康检查服务
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectRepository(MonitorData)
    private monitorDataRepository: Repository<MonitorData>,
  ) {}

  /**
   * 执行健康检查
   * @returns 健康检查结果
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const timestamp = Date.now();
    const uptime = timestamp - this.startTime;

    try {
      // 检查数据库连接
      const databaseCheck = await this.checkDatabase();
      
      // 获取基础指标
      const metrics = await this.getBasicMetrics();

      // 确定整体状态
      const overallStatus = this.determineOverallStatus([
        databaseCheck.status
      ]);

      return {
        status: overallStatus,
        timestamp,
        uptime,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: databaseCheck,
        },
        metrics,
      };
    } catch (error) {
      this.logger.error('健康检查失败', error);
      return {
        status: 'unhealthy',
        timestamp,
        uptime,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: {
            status: 'unhealthy',
            error: error.message,
          },
        },
        metrics: {
          totalErrors: 0,
          errorRate: 0,
          avgResponseTime: 0,
        },
      };
    }
  }

  /**
   * 检查数据库健康状态
   * @returns 数据库健康状态
   */
  private async checkDatabase(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      // 执行简单查询测试数据库连接
      await this.monitorDataRepository.createQueryBuilder()
        .select('COUNT(*)', 'count')
        .getRawOne();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'unhealthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * 获取基础指标
   * @returns 基础指标
   */
  private async getBasicMetrics(): Promise<{
    totalErrors: number;
    errorRate: number;
    avgResponseTime: number;
  }> {
    try {
      // 最近1小时的错误统计
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const errorStats = await this.monitorDataRepository
        .createQueryBuilder('monitor')
        .select('COUNT(*)', 'total')
        .addSelect('AVG(monitor.duration)', 'avgDuration')
        .where('monitor.createdAt >= :oneHourAgo', { oneHourAgo })
        .getRawOne();

      const totalErrors = parseInt(errorStats?.total || '0');
      const avgResponseTime = parseFloat(errorStats?.avgDuration || '0');
      
      // 计算错误率（假设正常情况下每小时不超过100个错误）
      const errorRate = Math.min(totalErrors / 100, 1);

      return {
        totalErrors,
        errorRate,
        avgResponseTime,
      };
    } catch (error) {
      this.logger.error('获取基础指标失败', error);
      return {
        totalErrors: 0,
        errorRate: 0,
        avgResponseTime: 0,
      };
    }
  }

  /**
   * 确定整体健康状态
   * @param serviceStatuses 服务状态列表
   * @returns 整体状态
   */
  private determineOverallStatus(
    serviceStatuses: ('healthy' | 'unhealthy')[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = serviceStatuses.filter(status => status === 'unhealthy').length;
    
    if (unhealthyCount === 0) {
      return 'healthy';
    } else if (unhealthyCount < serviceStatuses.length) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  /**
   * 获取简单健康状态
   * @returns 简单健康状态
   */
  async getSimpleHealth(): Promise<{ status: string; timestamp: number }> {
    try {
      await this.monitorDataRepository.createQueryBuilder()
        .select('1')
        .limit(1)
        .getRawOne();
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 获取系统信息
   * @returns 系统信息
   */
  getSystemInfo() {
    const used = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      node: {
        version: process.version,
        uptime: process.uptime(),
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        rss: Math.round(used.rss / 1024 / 1024),
        heapTotal: Math.round(used.heapTotal / 1024 / 1024),
        heapUsed: Math.round(used.heapUsed / 1024 / 1024),
        external: Math.round(used.external / 1024 / 1024),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      env: process.env.NODE_ENV || 'development',
      pid: process.pid,
    };
  }
}