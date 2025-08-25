import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AlertRuleService } from '../services/alert-rule.service';
import { CreateAlertRuleDto } from '../dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from '../dto/update-alert-rule.dto';
import { IAlertRule } from '../../../common/interfaces/alert-interfaces';

/**
 * 告警规则控制器
 * 提供告警规则的RESTful API接口
 */
@Controller('alert-rules')
export class AlertRuleController {
  constructor(private readonly alertRuleService: AlertRuleService) {}

  /**
   * 创建告警规则
   * @param createAlertRuleDto 创建告警规则DTO
   * @returns 创建的告警规则
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAlertRuleDto: CreateAlertRuleDto): Promise<IAlertRule> {
    return await this.alertRuleService.create(createAlertRuleDto);
  }

  /**
   * 查询所有告警规则
   * @returns 告警规则列表
   */
  @Get()
  async findAll(): Promise<IAlertRule[]> {
    return await this.alertRuleService.findAll();
  }

  /**
   * 根据项目ID查询告警规则
   * @param projectId 项目ID
   * @returns 项目相关的告警规则列表
   */
  @Get("project/:projectId")
  async findByProjectId(@Param("projectId") projectId: string): Promise<IAlertRule[]> {
    return await this.alertRuleService.findByProjectId(projectId);
  }

  /**
   * 根据ID查询告警规则
   * @param id 告警规则ID
   * @returns 告警规则详情
   */
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<IAlertRule> {
    return await this.alertRuleService.findOne(id);
  }

  /**
   * 更新告警规则
   * @param id 告警规则ID
   * @param updateAlertRuleDto 更新告警规则DTO
   * @returns 更新后的告警规则
   */
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateAlertRuleDto: UpdateAlertRuleDto,
  ): Promise<IAlertRule> {
    return await this.alertRuleService.update(id, updateAlertRuleDto);
  }

  /**
   * 删除告警规则
   * @param id 告警规则ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: number): Promise<void> {
    await this.alertRuleService.remove(id);
  }

  /**
   * 检查错误数量告警
   * @param projectId 项目ID
   * @param errorCount 错误数量
   * @returns 触发的告警规则列表
   */
  @Post("check-error-count/:projectId")
  async checkErrorCountAlerts(
    @Param("projectId") projectId: string,
    @Body("errorCount") errorCount: number,
  ): Promise<IAlertRule[]> {
    return await this.alertRuleService.checkErrorCountAlerts(projectId, errorCount);
  }

  /**
   * 检查错误率告警
   * @param projectId 项目ID
   * @param errorRate 错误率（百分比）
   * @returns 触发的告警规则列表
   */
  @Post("check-error-rate/:projectId")
  async checkErrorRateAlerts(
    @Param("projectId") projectId: string,
    @Body("errorRate") errorRate: number,
  ): Promise<IAlertRule[]> {
    return await this.alertRuleService.checkErrorRateAlerts(projectId, errorRate);
  }
}