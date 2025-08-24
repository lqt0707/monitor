import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platform } from '../entities/platform.entity';
import { CreatePlatformDto } from '../dto/create-platform.dto';
import { UpdatePlatformDto } from '../dto/update-platform.dto';
import { QueryPlatformDto } from '../dto/query-platform.dto';

/**
 * 平台管理服务
 */
@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(
    @InjectRepository(Platform)
    private platformRepository: Repository<Platform>,
  ) {}

  /**
   * 创建平台
   * @param createPlatformDto 创建平台DTO
   * @returns 创建的平台
   */
  async create(createPlatformDto: CreatePlatformDto): Promise<Platform> {
    try {
      const platform = this.platformRepository.create(createPlatformDto);
      return await this.platformRepository.save(platform);
    } catch (error) {
      this.logger.error('创建平台失败', error);
      throw error;
    }
  }

  /**
   * 获取所有平台
   * @param queryDto 查询参数
   * @returns 平台列表
   */
  async findAll(queryDto: QueryPlatformDto = {}) {
    const {
      platformCategory,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.platformRepository.createQueryBuilder('platform');

    // 添加查询条件
    if (platformCategory) {
      queryBuilder.andWhere('platform.platformCategory = :platformCategory', {
        platformCategory,
      });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('platform.isActive = :isActive', { isActive });
    }

    // 排序
    queryBuilder.orderBy(`platform.${sortBy}`, sortOrder);

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [platforms, total] = await queryBuilder.getManyAndCount();

    return {
      data: platforms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID获取平台
   * @param id 平台ID
   * @returns 平台信息
   */
  async findOne(id: number): Promise<Platform> {
    const platform = await this.platformRepository.findOne({ where: { id } });
    if (!platform) {
      throw new NotFoundException(`平台不存在: ${id}`);
    }
    return platform;
  }

  /**
   * 根据平台代码获取平台
   * @param platformCode 平台代码
   * @returns 平台信息
   */
  async findByCode(platformCode: string): Promise<Platform> {
    const platform = await this.platformRepository.findOne({
      where: { platformCode },
    });
    if (!platform) {
      throw new NotFoundException(`平台不存在: ${platformCode}`);
    }
    return platform;
  }

  /**
   * 更新平台
   * @param id 平台ID
   * @param updatePlatformDto 更新平台DTO
   * @returns 更新后的平台
   */
  async update(id: number, updatePlatformDto: UpdatePlatformDto): Promise<Platform> {
    try {
      const platform = await this.findOne(id);
      Object.assign(platform, updatePlatformDto);
      return await this.platformRepository.save(platform);
    } catch (error) {
      this.logger.error('更新平台失败', error);
      throw error;
    }
  }

  /**
   * 删除平台
   * @param id 平台ID
   */
  async remove(id: number): Promise<void> {
    try {
      const platform = await this.findOne(id);
      await this.platformRepository.remove(platform);
    } catch (error) {
      this.logger.error('删除平台失败', error);
      throw error;
    }
  }

  /**
   * 启用/禁用平台
   * @param id 平台ID
   * @param isActive 是否启用
   * @returns 更新后的平台
   */
  async toggleActive(id: number, isActive: boolean): Promise<Platform> {
    try {
      const platform = await this.findOne(id);
      platform.isActive = isActive;
      return await this.platformRepository.save(platform);
    } catch (error) {
      this.logger.error('切换平台状态失败', error);
      throw error;
    }
  }

  /**
   * 获取平台统计信息
   * @returns 统计信息
   */
  async getStatistics() {
    try {
      const total = await this.platformRepository.count();
      const activeCount = await this.platformRepository.count({
        where: { isActive: true },
      });

      // 按分类统计
      const categoryStats = await this.platformRepository
        .createQueryBuilder('platform')
        .select('platform.platformCategory', 'category')
        .addSelect('COUNT(*)', 'count')
        .groupBy('platform.platformCategory')
        .getRawMany();

      return {
        total,
        activeCount,
        inactiveCount: total - activeCount,
        categoryStats: categoryStats.map(item => ({
          category: item.category,
          count: parseInt(item.count),
        })),
      };
    } catch (error) {
      this.logger.error('获取平台统计信息失败', error);
      throw error;
    }
  }

  /**
   * 批量更新平台状态
   * @param ids 平台ID列表
   * @param isActive 是否启用
   * @returns 更新结果
   */
  async batchUpdateStatus(ids: number[], isActive: boolean) {
    try {
      const result = await this.platformRepository.update(
        { id: { $in: ids } as any },
        { isActive }
      );
      return {
        affected: result.affected,
        success: true,
      };
    } catch (error) {
      this.logger.error('批量更新平台状态失败', error);
      throw error;
    }
  }
}