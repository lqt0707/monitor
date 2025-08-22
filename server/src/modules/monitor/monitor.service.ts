import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MonitorData } from './entities/monitor-data.entity';
import { ReportDataDto } from './dto/report-data.dto';

/**
 * 监控数据服务
 */
@Injectable()
export class MonitorService {
  constructor(
    @InjectRepository(MonitorData)
    private readonly monitorDataRepository: Repository<MonitorData>,
  ) {}

  /**
   * 保存监控数据
   * @param reportData 上报的监控数据
   * @returns 保存的数据
   */
  async saveMonitorData(reportData: ReportDataDto): Promise<MonitorData> {
    const monitorData = this.monitorDataRepository.create({
      projectId: reportData.projectId,
      type: reportData.type,
      errorMessage: reportData.errorMessage,
      errorStack: reportData.errorStack,
      pageUrl: reportData.pageUrl,
      userId: reportData.userId,
      userAgent: reportData.userAgent,
      deviceInfo: reportData.deviceInfo,
      networkInfo: reportData.networkInfo,
      performanceData: reportData.performanceData,
      requestUrl: reportData.requestUrl,
      requestMethod: reportData.requestMethod,
      responseStatus: reportData.responseStatus,
      duration: reportData.duration,
      extraData: reportData.extraData,
    });

    return await this.monitorDataRepository.save(monitorData);
  }

  /**
   * 获取监控数据列表
   * @param projectId 项目ID
   * @param type 数据类型
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param page 页码
   * @param limit 每页数量
   * @returns 监控数据列表
   */
  async getMonitorData(
    projectId?: string,
    type?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 20,
  ) {
    const queryBuilder = this.monitorDataRepository.createQueryBuilder('monitor');

    if (projectId) {
      queryBuilder.andWhere('monitor.projectId = :projectId', { projectId });
    }

    if (type) {
      queryBuilder.andWhere('monitor.type = :type', { type });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('monitor.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('monitor.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取监控数据统计
   * @param projectId 项目ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 统计数据
   */
  async getMonitorStats(
    projectId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.monitorDataRepository.createQueryBuilder('monitor');

    if (projectId) {
      queryBuilder.andWhere('monitor.projectId = :projectId', { projectId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('monitor.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const stats = await queryBuilder
      .select('monitor.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('monitor.type')
      .getRawMany();

    const total = await queryBuilder.getCount();

    return {
      total,
      byType: stats.reduce((acc, stat) => {
        acc[stat.type] = parseInt(stat.count);
        return acc;
      }, {}),
    };
  }

  /**
   * 删除过期数据
   * @param days 保留天数
   * @returns 删除的记录数
   */
  async cleanupOldData(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.monitorDataRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}