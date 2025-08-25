import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateProjectConfigDto } from "./dto/create-project-config.dto";
import { ProjectConfig } from "./entities/project-config.entity";
import { UpdateProjectConfigDto } from "./dto/update-project-config.dto";
import { QueryProjectConfigDto } from "./dto/query-project-config.dto";

/**
 * 项目配置服务类
 * 负责管理项目配置的CRUD操作，包括SourceMap路径配置等
 */
@Injectable()
export class ProjectConfigService {
  constructor(
    @InjectRepository(ProjectConfig)
    private readonly projectConfigRepository: Repository<ProjectConfig>
  ) {}

  /**
   * 创建项目配置
   * @param createProjectConfigDto 创建项目配置的数据传输对象
   * @returns 创建的项目配置实体
   */
  async create(
    createProjectConfigDto: CreateProjectConfigDto
  ): Promise<ProjectConfig> {
    const projectConfig = this.projectConfigRepository.create(
      createProjectConfigDto
    );
    return await this.projectConfigRepository.save(projectConfig);
  }

  /**
   * 查询所有项目配置
   * @param queryDto 查询条件
   * @returns 项目配置列表和总数
   */
  async findAll(
    queryDto: QueryProjectConfigDto
  ): Promise<{ data: ProjectConfig[]; total: number }> {
    const { page = 1, limit = 10, projectName, enableSourcemap } = queryDto;
    const queryBuilder =
      this.projectConfigRepository.createQueryBuilder("config");

    if (projectName) {
      queryBuilder.andWhere("config.name LIKE :projectName", {
        projectName: `%${projectName}%`,
      });
    }

    if (enableSourcemap !== undefined) {
      queryBuilder.andWhere("config.enableSourcemap = :enableSourcemap", {
        enableSourcemap,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("config.createdAt", "DESC")
      .getManyAndCount();

    return { data, total };
  }

  /**
   * 根据ID查询项目配置
   * @param id 项目配置ID
   * @returns 项目配置实体
   */
  async findOne(id: number): Promise<ProjectConfig> {
    const projectConfig = await this.projectConfigRepository.findOne({
      where: { id },
    });

    if (!projectConfig) {
      throw new NotFoundException(`项目配置 ID ${id} 不存在`);
    }

    return projectConfig;
  }

  /**
   * 根据项目名称查询项目配置
   * @param projectName 项目名称
   * @returns 项目配置实体
   */
  async findByProjectName(projectName: string): Promise<ProjectConfig> {
    const projectConfig = await this.projectConfigRepository.findOne({
      where: { name: projectName },
    });

    if (!projectConfig) {
      throw new NotFoundException(`项目 ${projectName} 的配置不存在`);
    }

    return projectConfig;
  }

  /**
   * 根据API密钥查询项目配置
   * @param apiKey API密钥
   * @returns 项目配置实体
   */
  async findByApiKey(apiKey: string): Promise<ProjectConfig> {
    const projectConfig = await this.projectConfigRepository.findOne({
      where: { apiKey },
    });

    if (!projectConfig) {
      throw new NotFoundException(`API密钥 ${apiKey} 对应的项目配置不存在`);
    }

    return projectConfig;
  }

  /**
   * 根据项目ID查询项目配置
   * @param projectId 项目ID
   * @returns 项目配置实体
   */
  async findByProjectId(projectId: string): Promise<ProjectConfig> {
    const projectConfig = await this.projectConfigRepository.findOne({
      where: { projectId },
    });

    if (!projectConfig) {
      throw new NotFoundException(`项目ID ${projectId} 对应的项目配置不存在`);
    }

    return projectConfig;
  }

  /**
   * 更新项目配置
   * @param id 项目配置ID
   * @param updateProjectConfigDto 更新数据
   * @returns 更新后的项目配置实体
   */
  async update(
    id: number,
    updateProjectConfigDto: UpdateProjectConfigDto
  ): Promise<ProjectConfig> {
    const projectConfig = await this.findOne(id);

    Object.assign(projectConfig, updateProjectConfigDto);
    projectConfig.updatedAt = new Date();

    return await this.projectConfigRepository.save(projectConfig);
  }

  /**
   * 删除项目配置
   * @param id 项目配置ID
   */
  async remove(id: number): Promise<void> {
    const projectConfig = await this.findOne(id);
    await this.projectConfigRepository.remove(projectConfig);
  }

  /**
   * 获取项目的SourceMap配置
   * @param projectId 项目ID
   * @returns SourceMap配置信息
   */
  async getSourcemapConfig(
    projectId: string
  ): Promise<{ enableSourcemap: boolean; sourcemapPath: string }> {
    const projectConfig = await this.findByProjectId(projectId);
    return {
      enableSourcemap: projectConfig.enableSourcemap,
      sourcemapPath: projectConfig.sourcemapPath,
    };
  }

  /**
   * 更新项目的SourceMap配置
   * @param projectId 项目ID
   * @param enableSourcemap 是否启用SourceMap
   * @param sourcemapPath SourceMap文件路径
   * @returns 更新后的项目配置
   */
  async updateSourcemapConfig(
    projectId: string,
    enableSourcemap: boolean,
    sourcemapPath: string
  ): Promise<ProjectConfig> {
    const config = await this.findByProjectId(projectId);
    return await this.update(config.id, {
      enableSourcemap,
      sourcemapPath,
    });
  }
}
