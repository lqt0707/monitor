import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRule, AlertRuleType, AlertActionType } from '../entities/alert-rule.entity';
import { CreateAlertRuleDto } from '../dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from '../dto/update-alert-rule.dto';

/**
 * 告警规则服务
 * 提供告警规则的CRUD操作和告警触发逻辑
 */
@Injectable()
export class AlertRuleService {
  constructor(
    @InjectRepository(AlertRule)
    private readonly alertRuleRepository: Repository<AlertRule>,
  ) {}

  /**
   * 创建告警规则
   * @param createAlertRuleDto 创建告警规则DTO
   * @returns 创建的告警规则
   */
  async create(createAlertRuleDto: CreateAlertRuleDto): Promise<AlertRule> {
    const alertRule = this.alertRuleRepository.create(createAlertRuleDto);
    return await this.alertRuleRepository.save(alertRule);
  }

  /**
   * 查询所有告警规则
   * @returns 告警规则列表
   */
  async findAll(): Promise<AlertRule[]> {
    return await this.alertRuleRepository.find({
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据项目ID查询告警规则
   * @param projectId 项目ID
   * @returns 项目相关的告警规则列表
   */
  async findByProjectId(projectId: string): Promise<AlertRule[]> {
    return await this.alertRuleRepository.find({
      where: { projectId },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据ID查询告警规则
   * @param id 告警规则ID
   * @returns 告警规则详情
   */
  async findOne(id: number): Promise<AlertRule> {
    const alertRule = await this.alertRuleRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!alertRule) {
      throw new NotFoundException(`告警规则 #${id} 不存在`);
    }

    return alertRule;
  }

  /**
   * 更新告警规则
   * @param id 告警规则ID
   * @param updateAlertRuleDto 更新告警规则DTO
   * @returns 更新后的告警规则
   */
  async update(id: number, updateAlertRuleDto: UpdateAlertRuleDto): Promise<AlertRule> {
    const alertRule = await this.findOne(id);
    
    Object.assign(alertRule, updateAlertRuleDto);
    return await this.alertRuleRepository.save(alertRule);
  }

  /**
   * 删除告警规则
   * @param id 告警规则ID
   */
  async remove(id: number): Promise<void> {
    const alertRule = await this.findOne(id);
    await this.alertRuleRepository.remove(alertRule);
  }

  /**\极速监控 检查错误数量告警
   * @param projectId 项目ID
   * @param errorCount 错误数量
   * @returns 触发的告警规则列表
   */
  async checkErrorCountAlerts(projectId: string, errorCount: number): Promise<AlertRule[]> {
    const rules = await this.alertRuleRepository.find({
      where: {
        projectId,
        type: AlertRuleType.ERROR_COUNT,
        enabled: true,
      },
    });

    return rules.filter(rule => errorCount > rule.threshold);
  }

  /**
   * 检查错误率告警
   * @param projectId 项目ID
   * @param errorRate 错误率（百分比）
   * @returns 触发的告警规则列表
   */
  async checkErrorRateAlerts(projectId: string, errorRate: number): Promise<AlertRule[]> {
    const rules = await this.alertRuleRepository.find({
      where: {
        projectId,
        type: AlertRuleType.ERROR_RATE,
        enabled: true,
      },
    });

    return rules.filter(rule => errorRate > rule.threshold);
  }

  /**
   * 检查性能指标告警
   * @param projectId 项目ID
  极速监控 * @param metricName 指标名称
   * @param metricValue 指标值
   * @returns 触发的告警规则列表
   */
  async checkPerformanceAlerts(
    projectId: string,
    metricName: string,
    metricValue: number,
  ): Promise<AlertRule[]> {
    const rules = await this.alertRuleRepository.find({
      where: {
        projectId,
        type: AlertRuleType.PERFORMANCE,
        enabled: true,
      },
    });

    return rules.filter(rule => {
      // 检查条件是否匹配当前指标
      const condition = rule.condition.toLowerCase();
      return condition.includes(metricName.toLowerCase()) && 
             this.evaluateCondition(condition, metricValue, rule.threshold);
    });
  }

  /**
   * 评估条件表达式
   * @param condition 条件表达式
   * @param value 当前值
   * @param threshold 阈值
   * @returns 是否满足条件
   */
  private evaluateCondition(condition: string, value: number, threshold: number): boolean {
    if (condition.includes('>')) {
      return value > threshold;
    } else if (condition.includes('<')) {
      return value < threshold;
    } else if (condition.includes('>=')) {
      return value >= threshold;
    } else if (condition.includes('<=')) {
      return value <= threshold;
    } else if (condition.includes('==')) {
      return value === threshold;
    }
    
    return false;
  }
}