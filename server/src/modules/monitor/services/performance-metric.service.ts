import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PerformanceMetric } from '../entities/performance-metric.entity';
import { CreatePerformanceMetricDto, BatchCreatePerformanceMetricDto } from '../dto/create-performance-metric.dto';
import { QueryPerformanceMetricDto } from '../dto/query-performance-metric.dto';

/**
 * 性能指标服务
 */
@Injectable()
export class PerformanceMetricService {
  private readonly logger = new Logger(PerformanceMetricService.name);

  constructor(
    @InjectRepository(PerformanceMetric)
    private performanceMetricRepository: Repository<PerformanceMetric>,
  ) {}

  /**
   * 创建单个性能指标
   * @param createDto 创建性能指标DTO
   * @returns 创建的性能指标
   */
  async create(createDto: CreatePerformanceMetricDto): Promise<PerformanceMetric> {
    try {
      // 处理JSON字段
      const metricData = {
        ...createDto,
        deviceInfo: createDto.deviceInfo ? JSON.stringify(createDto.deviceInfo) : null,
        networkInfo: createDto.networkInfo ? JSON.stringify(createDto.networkInfo) : null,
        customMetrics: createDto.customMetrics ? JSON.stringify(createDto.customMetrics) : null,
        extraData: createDto.extraData ? JSON.stringify(createDto.extraData) : null,
      };

      const metric = this.performanceMetricRepository.create(metricData);
      return await this.performanceMetricRepository.save(metric);
    } catch (error) {
      this.logger.error('创建性能指标失败', error);
      throw error;
    }
  }

  /**
   * 批量创建性能指标
   * @param batchDto 批量创建DTO
   * @returns 创建的性能指标列表
   */
  async createBatch(batchDto: BatchCreatePerformanceMetricDto): Promise<PerformanceMetric[]> {
    try {
      const metrics = batchDto.metrics.map(dto => {
        const metricData = {
          ...dto,
          deviceInfo: dto.deviceInfo ? JSON.stringify(dto.deviceInfo) : null,
          networkInfo: dto.networkInfo ? JSON.stringify(dto.networkInfo) : null,
          customMetrics: dto.customMetrics ? JSON.stringify(dto.customMetrics) : null,
          extraData: dto.extraData ? JSON.stringify(dto.extraData) : null,
        };
        return this.performanceMetricRepository.create(metricData);
      });

      return await this.performanceMetricRepository.save(metrics);
    } catch (error) {
      this.logger.error('批量创建性能指标失败', error);
      throw error;
    }
  }

  /**
   * 查询性能指标列表
   * @param queryDto 查询参数
   * @returns 性能指标列表和分页信息
   */
  async findAll(queryDto: QueryPerformanceMetricDto) {
    const {
      projectId,
      platformCode,
      metricType,
      metricName,
      pageUrl,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'metricTimestamp',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.performanceMetricRepository.createQueryBuilder('metric');

    // 添加查询条件
    if (projectId) {
      queryBuilder.andWhere('metric.projectId = :projectId', { projectId });
    }

    if (platformCode) {
      queryBuilder.andWhere('metric.platformCode = :platformCode', { platformCode });
    }

    if (metricType) {
      queryBuilder.andWhere('metric.metricType = :metricType', { metricType });
    }

    if (metricName) {
      queryBuilder.andWhere('metric.metricName = :metricName', { metricName });
    }

    if (pageUrl) {
      queryBuilder.andWhere('metric.pageUrl LIKE :pageUrl', { pageUrl: `%${pageUrl}%` });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('metric.metricTimestamp BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
      });
    } else if (startDate) {
      queryBuilder.andWhere('metric.metricTimestamp >= :startDate', {
        startDate: new Date(startDate).getTime(),
      });
    } else if (endDate) {
      queryBuilder.andWhere('metric.metricTimestamp <= :endDate', {
        endDate: new Date(endDate).getTime(),
      });
    }

    // 排序
    queryBuilder.orderBy(`metric.${sortBy}`, sortOrder);

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID获取性能指标
   * @param id 性能指标ID
   * @returns 性能指标
   */
  async findOne(id: string): Promise<PerformanceMetric> {
    const metric = await this.performanceMetricRepository.findOne({ where: { id } });
    if (!metric) {
      throw new NotFoundException(`性能指标不存在: ${id}`);
    }
    return metric;
  }

  /**
   * 获取性能统计数据
   * @param projectId 项目ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 统计数据
   */
  async getStatistics(projectId?: string, startDate?: Date, endDate?: Date) {
    try {
      const queryBuilder = this.performanceMetricRepository.createQueryBuilder('metric');

      if (projectId) {
        queryBuilder.andWhere('metric.projectId = :projectId', { projectId });
      }

      if (startDate && endDate) {
        queryBuilder.andWhere('metric.metricTimestamp BETWEEN :startDate AND :endDate', {
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
        });
      }

      // 总数统计
      const total = await queryBuilder.getCount();

      // 按指标类型统计
      const typeStats = await this.performanceMetricRepository
        .createQueryBuilder('metric')
        .select('metric.metricType', 'type')
        .addSelect('COUNT(*)', 'count')
        .addSelect('AVG(metric.responseTime)', 'avgResponseTime')
        .addSelect('AVG(metric.loadComplete)', 'avgLoadTime')
        .where(projectId ? 'metric.projectId = :projectId' : '1=1', { projectId })
        .andWhere(
          startDate && endDate
            ? 'metric.metricTimestamp BETWEEN :startDate AND :endDate'
            : '1=1',
          {
            startDate: startDate?.getTime(),
            endDate: endDate?.getTime(),
          }
        )
        .groupBy('metric.metricType')
        .getRawMany();

      // 按平台统计
      const platformStats = await this.performanceMetricRepository
        .createQueryBuilder('metric')
        .select('metric.platformCode', 'platform')
        .addSelect('COUNT(*)', 'count')
        .where(projectId ? 'metric.projectId = :projectId' : '1=1', { projectId })
        .andWhere(
          startDate && endDate
            ? 'metric.metricTimestamp BETWEEN :startDate AND :endDate'
            : '1=1',
          {
            startDate: startDate?.getTime(),
            endDate: endDate?.getTime(),
          }
        )
        .groupBy('metric.platformCode')
        .getRawMany();

      // 核心Web性能指标统计
      const webVitalsStats = await this.performanceMetricRepository
        .createQueryBuilder('metric')
        .select('AVG(metric.fcp)', 'avgFcp')
        .addSelect('AVG(metric.lcp)', 'avgLcp')
        .addSelect('AVG(metric.fid)', 'avgFid')
        .addSelect('AVG(metric.cls)', 'avgCls')
        .addSelect('AVG(metric.ttfb)', 'avgTtfb')
        .where(projectId ? 'metric.projectId = :projectId' : '1=1', { projectId })
        .andWhere('metric.metricType = :metricType', { metricType: 'page_load' })
        .andWhere(
          startDate && endDate
            ? 'metric.metricTimestamp BETWEEN :startDate AND :endDate'
            : '1=1',
          {
            startDate: startDate?.getTime(),
            endDate: endDate?.getTime(),
          }
        )
        .getRawOne();

      return {
        total,
        typeStats: typeStats.map(item => ({
          type: item.type,
          count: parseInt(item.count),
          avgResponseTime: parseFloat(item.avgResponseTime || '0'),
          avgLoadTime: parseFloat(item.avgLoadTime || '0'),
        })),
        platformStats: platformStats.map(item => ({
          platform: item.platform,
          count: parseInt(item.count),
        })),
        webVitals: {
          avgFcp: parseFloat(webVitalsStats?.avgFcp || '0'),
          avgLcp: parseFloat(webVitalsStats?.avgLcp || '0'),
          avgFid: parseFloat(webVitalsStats?.avgFid || '0'),
          avgCls: parseFloat(webVitalsStats?.avgCls || '0'),
          avgTtfb: parseFloat(webVitalsStats?.avgTtfb || '0'),
        },
      };
    } catch (error) {
      this.logger.error('获取性能统计数据失败', error);
      throw error;
    }
  }

  /**
   * 获取性能趋势数据
   * @param projectId 项目ID
   * @param days 天数
   * @returns 趋势数据
   */
  async getTrends(projectId?: string, days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const queryBuilder = this.performanceMetricRepository
        .createQueryBuilder('metric')
        .select('DATE(FROM_UNIXTIME(metric.metricTimestamp / 1000))', 'date')
        .addSelect('COUNT(*)', 'count')
        .addSelect('AVG(metric.responseTime)', 'avgResponseTime')
        .addSelect('AVG(metric.loadComplete)', 'avgLoadTime')
        .addSelect('AVG(metric.fcp)', 'avgFcp')
        .addSelect('AVG(metric.lcp)', 'avgLcp')
        .where('metric.metricTimestamp BETWEEN :startDate AND :endDate', {
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
        });

      if (projectId) {
        queryBuilder.andWhere('metric.projectId = :projectId', { projectId });
      }

      queryBuilder
        .groupBy('date')
        .orderBy('date', 'ASC');

      const trends = await queryBuilder.getRawMany();

      return trends.map(item => ({
        date: item.date,
        count: parseInt(item.count),
        avgResponseTime: parseFloat(item.avgResponseTime || '0'),
        avgLoadTime: parseFloat(item.avgLoadTime || '0'),
        avgFcp: parseFloat(item.avgFcp || '0'),
        avgLcp: parseFloat(item.avgLcp || '0'),
      }));
    } catch (error) {
      this.logger.error('获取性能趋势数据失败', error);
      throw error;
    }
  }

  /**
   * 删除性能指标
   * @param id 性能指标ID
   */
  async remove(id: string): Promise<void> {
    try {
      const metric = await this.findOne(id);
      await this.performanceMetricRepository.remove(metric);
    } catch (error) {
      this.logger.error('删除性能指标失败', error);
      throw error;
    }
  }

  /**
   * 清理过期数据
   * @param days 保留天数
   * @returns 清理结果
   */
  async cleanupExpiredData(days: number = 30) {
    try { 
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.performanceMetricRepository
        .createQueryBuilder()
        .delete()
        .where('metricTimestamp < :cutoffDate', { cutoffDate: cutoffDate.getTime() })
        .execute();

      this.logger.log(`清理了 ${result.affected} 条过期性能数据`);
      return { affected: result.affected };
    } catch (error) {
      this.logger.error('清理过期性能数据失败', error);
      throw error;
    }
  }
}