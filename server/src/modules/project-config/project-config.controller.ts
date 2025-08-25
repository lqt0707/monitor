import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { ProjectConfigService } from "./project-config.service";
import { CreateProjectConfigDto } from "./dto/create-project-config.dto";
import { UpdateProjectConfigDto } from "./dto/update-project-config.dto";
import { QueryProjectConfigDto } from "./dto/query-project-config.dto";
import { ProjectConfig } from "./entities/project-config.entity";

/**
 * 项目配置控制器
 * 提供项目配置管理的API接口，包括SourceMap配置等
 */
@ApiTags("项目配置管理")
@Controller("project-config")
export class ProjectConfigController {
  constructor(private readonly projectConfigService: ProjectConfigService) {}

  /**
   * 创建项目配置
   * @param createProjectConfigDto 创建项目配置的数据
   * @returns 创建的项目配置
   */
  @Post()
  @ApiOperation({ summary: "创建项目配置" })
  @ApiResponse({ status: 201, description: "创建成功", type: ProjectConfig })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  async create(
    @Body() createProjectConfigDto: CreateProjectConfigDto
  ): Promise<ProjectConfig> {
    return await this.projectConfigService.create(createProjectConfigDto);
  }

  /**
   * 查询项目配置列表
   * @param queryDto 查询条件
   * @returns 项目配置列表和总数
   */
  @Get()
  @ApiOperation({ summary: "查询项目配置列表" })
  @ApiResponse({ status: 200, description: "查询成功" })
  @ApiQuery({ name: "page", required: false, description: "页码", example: 1 })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "每页数量",
    example: 10,
  })
  @ApiQuery({
    name: "projectName",
    required: false,
    description: "项目名称",
    example: "前端监控系统",
  })
  @ApiQuery({
    name: "enableSourcemap",
    required: false,
    description: "是否启用SourceMap",
    example: true,
  })
  async findAll(@Query() queryDto: QueryProjectConfigDto) {
    return await this.projectConfigService.findAll(queryDto);
  }

  /**
   * 根据ID查询项目配置
   * @param id 项目配置ID
   * @returns 项目配置详情
   */
  @Get(":id")
  @ApiOperation({ summary: "根据ID查询项目配置" })
  @ApiParam({ name: "id", description: "项目配置ID", example: 1 })
  @ApiResponse({ status: 200, description: "查询成功", type: ProjectConfig })
  @ApiResponse({ status: 404, description: "项目配置不存在" })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<ProjectConfig> {
    return await this.projectConfigService.findOne(id);
  }

  /**
   * 根据项目名称查询项目配置
   * @param projectName 项目名称
   * @returns 项目配置详情
   */
  @Get("by-name/:projectName")
  @ApiOperation({ summary: "根据项目名称查询项目配置" })
  @ApiParam({
    name: "projectName",
    description: "项目名称",
    example: "前端监控系统",
  })
  @ApiResponse({ status: 200, description: "查询成功", type: ProjectConfig })
  @ApiResponse({ status: 404, description: "项目配置不存在" })
  async findByProjectName(
    @Param("projectName") projectName: string
  ): Promise<ProjectConfig> {
    return await this.projectConfigService.findByProjectName(projectName);
  }

  /**
   * 根据API密钥查询项目配置
   * @param apiKey API密钥
   * @returns 项目配置详情
   */
  @Get("by-api-key/:apiKey")
  @ApiOperation({ summary: "根据API密钥查询项目配置" })
  @ApiParam({
    name: "apiKey",
    description: "API密钥",
    example: "api-key-123456",
  })
  @ApiResponse({ status: 200, description: "查询成功", type: ProjectConfig })
  @ApiResponse({ status: 404, description: "项目配置不存在" })
  async findByApiKey(@Param("apiKey") apiKey: string): Promise<ProjectConfig> {
    return await this.projectConfigService.findByApiKey(apiKey);
  }

  /**
   * 更新项目配置
   * @param id 项目配置ID
   * @param updateProjectConfigDto 更新数据
   * @returns 更新后的项目配置
   */
  @Patch(":id")
  @ApiOperation({ summary: "更新项目配置" })
  @ApiParam({ name: "id", description: "项目配置ID", example: 1 })
  @ApiResponse({ status: 200, description: "更新成功", type: ProjectConfig })
  @ApiResponse({ status: 404, description: "项目配置不存在" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateProjectConfigDto: UpdateProjectConfigDto
  ): Promise<ProjectConfig> {
    return await this.projectConfigService.update(id, updateProjectConfigDto);
  }

  /**
   * 删除项目配置
   * @param id 项目配置ID
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "删除项目配置" })
  @ApiParam({ name: "id", description: "项目配置ID", example: 1 })
  @ApiResponse({ status: 204, description: "删除成功" })
  @ApiResponse({ status: 404, description: "项目配置不存在" })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return await this.projectConfigService.remove(id);
  }

  /**
   * 获取项目的SourceMap配置
   * @param id 项目ID
   * @returns SourceMap配置信息
   */
  @Get(":id/sourcemap-config")
  @ApiOperation({ summary: "获取项目的SourceMap配置" })
  @ApiParam({ name: "id", description: "项目ID", example: 1 })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 404, description: "项目配置不存在" })
  async getSourcemapConfig(@Param("id") id: string) {
    return await this.projectConfigService.getSourcemapConfig(id);
  }

  /**
   * 更新项目的SourceMap配置
   * @param id 项目ID
   * @param body SourceMap配置数据
   * @returns 更新后的项目配置
   */
  @Patch(":id/sourcemap-config")
  @ApiOperation({ summary: "更新项目的SourceMap配置" })
  @ApiParam({ name: "id", description: "项目ID", example: 1 })
  @ApiResponse({ status: 200, description: "更新成功", type: ProjectConfig })
  @ApiResponse({ status: 404, description: "项目配置不存在" })
  async updateSourcemapConfig(
    @Param("id") id: string,
    @Body() body: { enableSourcemap: boolean; sourcemapPath: string }
  ): Promise<ProjectConfig> {
    const { enableSourcemap, sourcemapPath } = body;
    return await this.projectConfigService.updateSourcemapConfig(
      id,
      enableSourcemap,
      sourcemapPath
    );
  }
}
