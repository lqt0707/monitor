import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Platform } from '../entities/platform.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { QueryProjectDto } from '../dto/query-project.dto';
import * as crypto from 'crypto';

/**
 * 项目管理服务
 */
@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Platform)
    private platformRepository: Repository<Platform>,
  ) {}

  /**
   * 创建项目
   * @param createProjectDto 创建项目DTO
   * @returns 创建的项目
   */
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    try {
      // 检查项目ID是否已存在
      const existingProject = await this.projectRepository.findOne({
        where: { projectId: createProjectDto.projectId },
      });

      if (existingProject) {
        throw new BadRequestException(`项目ID已存在: ${createProjectDto.projectId}`);
      }

      // 验证平台ID
      if (createProjectDto.platformIds && createProjectDto.platformIds.length > 0) {
        const platforms = await this.platformRepository.findBy({
          id: In(createProjectDto.platformIds),
        });

        if (platforms.length !== createProjectDto.platformIds.length) {
          throw new BadRequestException('存在无效的平台ID');
        }
      }

      // 生成API密钥
      const apiKey = this.generateApiKey();

      const project = this.projectRepository.create({
        ...createProjectDto,
        apiKey,
      });

      // 关联平台
      if (createProjectDto.platformIds && createProjectDto.platformIds.length > 0) {
        const platforms = await this.platformRepository.findBy({
          id: In(createProjectDto.platformIds),
        });
        project.platforms = platforms;
      }

      return await this.projectRepository.save(project);
    } catch (error) {
      this.logger.error('创建项目失败', error);
      throw error;
    }
  }

  /**
   * 获取所有项目
   * @param queryDto 查询参数
   * @returns 项目列表
   */
  async findAll(queryDto: QueryProjectDto = {}) {
    const {
      teamId,
      ownerId,
      isActive,
      isPaused,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.projectRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.platforms', 'platform');

    // 添加查询条件
    if (teamId) {
      queryBuilder.andWhere('project.teamId = :teamId', { teamId });
    }

    if (ownerId) {
      queryBuilder.andWhere('project.ownerId = :ownerId', { ownerId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('project.isActive = :isActive', { isActive });
    }

    if (isPaused !== undefined) {
      queryBuilder.andWhere('project.isPaused = :isPaused', { isPaused });
    }

    // 排序
    queryBuilder.orderBy(`project.${sortBy}`, sortOrder);

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [projects, total] = await queryBuilder.getManyAndCount();

    return {
      data: projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID获取项目
   * @param id 项目ID
   * @returns 项目信息
   */
  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['platforms'],
    });
    if (!project) {
      throw new NotFoundException(`项目不存在: ${id}`);
    }
    return project;
  }

  /**
   * 根据项目标识获取项目
   * @param projectId 项目标识
   * @returns 项目信息
   */
  async findByProjectId(projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { projectId },
      relations: ['platforms'],
    });
    if (!project) {
      throw new NotFoundException(`项目不存在: ${projectId}`);
    }
    return project;
  }

  /**
   * 更新项目
   * @param id 项目ID
   * @param updateProjectDto 更新项目DTO
   * @returns 更新后的项目
   */
  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    try {
      const project = await this.findOne(id);
      
      // 更新基础信息
      Object.assign(project, updateProjectDto);

      // 更新关联平台
      if (updateProjectDto.platformIds !== undefined) {
        if (updateProjectDto.platformIds.length > 0) {
          const platforms = await this.platformRepository.findBy({
            id: In(updateProjectDto.platformIds),
          });
          project.platforms = platforms;
        } else {
          project.platforms = [];
        }
      }

      return await this.projectRepository.save(project);
    } catch (error) {
      this.logger.error('更新项目失败', error);
      throw error;
    }
  }

  /**
   * 删除项目
   * @param id 项目ID
   */
  async remove(id: number): Promise<void> {
    try {
      const project = await this.findOne(id);
      await this.projectRepository.remove(project);
    } catch (error) {
      this.logger.error('删除项目失败', error);
      throw error;
    }
  }

  /**
   * 启用/禁用项目
   * @param id 项目ID
   * @param isActive 是否启用
   * @returns 更新后的项目
   */
  async toggleActive(id: number, isActive: boolean): Promise<Project> {
    try {
      const project = await this.findOne(id);
      project.isActive = isActive;
      return await this.projectRepository.save(project);
    } catch (error) {
      this.logger.error('切换项目状态失败', error);
      throw error;
    }
  }

  /**
   * 暂停/恢复项目监控
   * @param id 项目ID
   * @param isPaused 是否暂停
   * @returns 更新后的项目
   */
  async togglePause(id: number, isPaused: boolean): Promise<Project> {
    try {
      const project = await this.findOne(id);
      project.isPaused = isPaused;
      return await this.projectRepository.save(project);
    } catch (error) {
      this.logger.error('切换项目监控状态失败', error);
      throw error;
    }
  }

  /**
   * 重新生成API密钥
   * @param id 项目ID
   * @returns 更新后的项目
   */
  async regenerateApiKey(id: number): Promise<Project> {
    try {
      const project = await this.findOne(id);
      project.apiKey = this.generateApiKey();
      return await this.projectRepository.save(project);
    } catch (error) {
      this.logger.error('重新生成API密钥失败', error);
      throw error;
    }
  }

  /**
   * 获取项目统计信息
   * @returns 统计信息
   */
  async getStatistics() {
    try {
      const total = await this.projectRepository.count();
      const activeCount = await this.projectRepository.count({
        where: { isActive: true },
      });
      const pausedCount = await this.projectRepository.count({
        where: { isPaused: true },
      });

      // 按团队统计
      const teamStats = await this.projectRepository
        .createQueryBuilder('project')
        .select('project.teamId', 'teamId')
        .addSelect('COUNT(*)', 'count')
        .where('project.teamId IS NOT NULL')
        .groupBy('project.teamId')
        .getRawMany();

      return {
        total,
        activeCount,
        inactiveCount: total - activeCount,
        pausedCount,
        teamStats: teamStats.map(item => ({
          teamId: item.teamId,
          count: parseInt(item.count),
        })),
      };
    } catch (error) {
      this.logger.error('获取项目统计信息失败', error);
      throw error;
    }
  }

  /**
   * 添加平台到项目
   * @param projectId 项目ID
   * @param platformIds 平台ID列表
   * @returns 更新后的项目
   */
  async addPlatforms(projectId: number, platformIds: number[]): Promise<Project> {
    try {
      const project = await this.findOne(projectId);
      const platforms = await this.platformRepository.findBy({
        id: In(platformIds),
      });

      if (platforms.length !== platformIds.length) {
        throw new BadRequestException('存在无效的平台ID');
      }

      // 合并现有平台和新平台
      const existingPlatformIds = project.platforms.map(p => p.id);
      const newPlatforms = platforms.filter(p => !existingPlatformIds.includes(p.id));
      
      project.platforms = [...project.platforms, ...newPlatforms];
      return await this.projectRepository.save(project);
    } catch (error) {
      this.logger.error('添加平台到项目失败', error);
      throw error;
    }
  }

  /**
   * 从项目中移除平台
   * @param projectId 项目ID
   * @param platformIds 平台ID列表
   * @returns 更新后的项目
   */
  async removePlatforms(projectId: number, platformIds: number[]): Promise<Project> {
    try {
      const project = await this.findOne(projectId);
      project.platforms = project.platforms.filter(p => !platformIds.includes(p.id));
      return await this.projectRepository.save(project);
    } catch (error) {
      this.logger.error('从项目中移除平台失败', error);
      throw error;
    }
  }

  /**
   * 生成API密钥
   * @returns API密钥
   */
  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 验证API密钥
   * @param projectId 项目标识
   * @param apiKey API密钥
   * @returns 是否有效
   */
  async validateApiKey(projectId: string, apiKey: string): Promise<boolean> {
    try {
      const project = await this.projectRepository.findOne({
        where: { projectId, apiKey },
      });
      return !!project && project.isActive && !project.isPaused;
    } catch (error) {
      this.logger.error('验证API密钥失败', error);
      return false;
    }
  }
}