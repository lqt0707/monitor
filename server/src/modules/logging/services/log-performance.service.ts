import { Injectable, Logger } from '@nestjs/common';

/**
 * 日志性能监控服务
 * 监控日志系统的性能指标
 */
@Injectable()
export class LogPerformanceService {
  private readonly logger = new Logger(LogPerformanceService.name);
  private metrics = {
    totalLogs: 0,
    errorLogs: 0,
    warnLogs: 0,
    infoLogs: 0,
    debugLogs: 0,
    verboseLogs: 0,
    avgWriteTime: 0,
    maxWriteTime: 0,
    minWriteTime: Infinity,
    failedWrites: 0,
    successfulWrites: 0,
    lastResetTime: new Date(),
  };

  private writeTimes: number[] = [];
  private readonly maxSamples = 1000; // 保留最近1000次写入时间

  /**
   * 记录日志写入性能
   * @param level 日志级别
   * @param writeTime 写入耗时（毫秒）
   * @param success 是否成功
   */
  recordLogWrite(level: string, writeTime: number, success: boolean): void {
    // 更新总计数
    this.metrics.totalLogs++;
    
    // 按级别计数
    switch (level) {
      case 'error':
        this.metrics.errorLogs++;
        break;
      case 'warn':
        this.metrics.warnLogs++;
        break;
      case 'info':
        this.metrics.infoLogs++;
        break;
      case 'debug':
        this.metrics.debugLogs++;
        break;
      case 'verbose':
        this.metrics.verboseLogs++;
        break;
    }

    // 记录写入结果
    if (success) {
      this.metrics.successfulWrites++;
    } else {
      this.metrics.failedWrites++;
    }

    // 记录写入时间
    if (success) {
      this.writeTimes.push(writeTime);
      
      // 保持样本数量在限制内
      if (this.writeTimes.length > this.maxSamples) {
        this.writeTimes.shift();
      }

      // 更新时间统计
      this.updateTimeMetrics();
    }
  }

  /**
   * 更新时间统计指标
   */
  private updateTimeMetrics(): void {
    if (this.writeTimes.length === 0) return;

    const sum = this.writeTimes.reduce((a, b) => a + b, 0);
    this.metrics.avgWriteTime = sum / this.writeTimes.length;
    this.metrics.maxWriteTime = Math.max(...this.writeTimes);
    this.metrics.minWriteTime = Math.min(...this.writeTimes);
  }

  /**
   * 获取性能指标
   */
  getMetrics(): {
    totalLogs: number;
    logsByLevel: {
      error: number;
      warn: number;
      info: number;
      debug: number;
      verbose: number;
    };
    performance: {
      avgWriteTime: number;
      maxWriteTime: number;
      minWriteTime: number;
      successRate: number;
    };
    uptime: number;
    lastResetTime: Date;
  } {
    const successRate = this.metrics.totalLogs > 0 
      ? (this.metrics.successfulWrites / this.metrics.totalLogs) * 100 
      : 0;

    const uptime = Date.now() - this.metrics.lastResetTime.getTime();

    return {
      totalLogs: this.metrics.totalLogs,
      logsByLevel: {
        error: this.metrics.errorLogs,
        warn: this.metrics.warnLogs,
        info: this.metrics.infoLogs,
        debug: this.metrics.debugLogs,
        verbose: this.metrics.verboseLogs,
      },
      performance: {
        avgWriteTime: Math.round(this.metrics.avgWriteTime * 100) / 100,
        maxWriteTime: this.metrics.maxWriteTime,
        minWriteTime: this.metrics.minWriteTime === Infinity ? 0 : this.metrics.minWriteTime,
        successRate: Math.round(successRate * 100) / 100,
      },
      uptime,
      lastResetTime: this.metrics.lastResetTime,
    };
  }

  /**
   * 重置性能指标
   */
  resetMetrics(): void {
    this.metrics = {
      totalLogs: 0,
      errorLogs: 0,
      warnLogs: 0,
      infoLogs: 0,
      debugLogs: 0,
      verboseLogs: 0,
      avgWriteTime: 0,
      maxWriteTime: 0,
      minWriteTime: Infinity,
      failedWrites: 0,
      successfulWrites: 0,
      lastResetTime: new Date(),
    };
    this.writeTimes = [];
    this.logger.log('性能指标已重置');
  }

  /**
   * 获取写入时间分布
   */
  getWriteTimeDistribution(): {
    '0-10ms': number;
    '10-50ms': number;
    '50-100ms': number;
    '100-500ms': number;
    '500ms+': number;
  } {
    const distribution = {
      '0-10ms': 0,
      '10-50ms': 0,
      '50-100ms': 0,
      '100-500ms': 0,
      '500ms+': 0,
    };

    this.writeTimes.forEach(time => {
      if (time <= 10) {
        distribution['0-10ms']++;
      } else if (time <= 50) {
        distribution['10-50ms']++;
      } else if (time <= 100) {
        distribution['50-100ms']++;
      } else if (time <= 500) {
        distribution['100-500ms']++;
      } else {
        distribution['500ms+']++;
      }
    });

    return distribution;
  }

  /**
   * 检查性能健康状态
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    const metrics = this.getMetrics();

    // 检查成功率
    if (metrics.performance.successRate < 95) {
      status = 'critical';
      issues.push(`日志写入成功率过低: ${metrics.performance.successRate}%`);
      recommendations.push('检查数据库连接和文件系统权限');
    } else if (metrics.performance.successRate < 98) {
      status = 'warning';
      issues.push(`日志写入成功率偏低: ${metrics.performance.successRate}%`);
      recommendations.push('监控系统资源使用情况');
    }

    // 检查平均写入时间
    if (metrics.performance.avgWriteTime > 100) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`平均写入时间过长: ${metrics.performance.avgWriteTime}ms`);
      recommendations.push('考虑优化数据库索引或增加缓存');
    }

    // 检查最大写入时间
    if (metrics.performance.maxWriteTime > 1000) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`最大写入时间过长: ${metrics.performance.maxWriteTime}ms`);
      recommendations.push('检查是否存在阻塞操作');
    }

    return {
      status,
      issues,
      recommendations,
    };
  }
}