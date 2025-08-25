import { Controller, Get, Query, Param } from '@nestjs/common';
import { AlertHistoryService } from '../services/alert-history.service';

/**
 * 告警历史记录控制器
 * 提供告警历史记录的查询接口
 */
@Controller('alert-history')
export class AlertHistoryController {
  constructor(private readonly alertHistoryService: AlertHistoryService) {}

  /**
   * 根据项目配置ID查询告警历史记录
   * @param projectConfigId 项目配置ID
   * @param limit 限制数量
   * @returns 告警历史记录列表
   */
  @Get('project/:projectConfigId')
  async findByProjectConfigId(
    @Param('projectConfigId') projectConfigId: string,
    @Query('limit') limit = 100,
  ) {
    return this.alertHistoryService.findByProjectConfigId(
      parseInt(projectConfigId),
      limit,
    );
  }

  /**
   * 根据告警规则ID查询告警历史记录
   * @param alertRuleId 告警规则ID
   * @param limit 限制数量
   * @returns 告警历史记录列表
   */
  @Get('rule/:alertRuleId')
  async findByAlertRuleId(
    @Param('alertRuleId') alertRuleId: string,
    @Query('limit') limit = 50,
  ) {
    return this.alertHistoryService.findByAlertRuleId(
      parseInt(alertRuleId),
      limit,
    );
  }

  /**
   * 获取最近的告警历史记录
   * @param limit 限制数量
   * @returns 告警历史记录列表
   */
  @Get('recent')
  async findRecent(@Query('limit') limit = 50) {
    // 这里可以添加获取最近告警的逻辑
    // 暂时返回空数组，后续可以根据需要实现
    return [];
  }
}