import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AlertHistory } from "../entities/alert-history.entity";
import {
  IAlertRule,
  IProjectConfig,
} from "../../../common/interfaces/alert-interfaces";

/**
 * 告警历史记录服务
 * 负责记录和管理告警规则的触发历史
 */
@Injectable()
export class AlertHistoryService {
  private readonly logger = new Logger(AlertHistoryService.name);

  constructor(
    @InjectRepository(AlertHistory)
    private readonly alertHistoryRepository: Repository<AlertHistory>
  ) {}

  /**
   * 创建告警历史记录
   * @param alertRule 告警规则
   * @param projectConfig 项目配置
   * @param triggeredValue 触发时的值
   * @param errorMessage 错误消息（可选）
   * @param errorLevel 错误级别（可选）
   * @returns 创建的告警历史记录
   */
  async createAlertHistory(
    alertRule: IAlertRule,
    projectConfig: IProjectConfig,
    triggeredValue: number,
    errorMessage?: string,
    errorLevel?: number
  ): Promise<AlertHistory> {
    try {
      const alertHistory = this.alertHistoryRepository.create({
        alertRuleId: alertRule.id,
        projectConfigId: projectConfig.id,
        type: alertRule.type,
        name: alertRule.name,
        triggeredValue,
        threshold: alertRule.threshold,
        timeWindow: alertRule.timeWindow,
        alertMessage: this.generateAlertMessage(alertRule, triggeredValue),
        errorMessage,
        errorLevel,
        status: "triggered",
      });

      const savedHistory = await this.alertHistoryRepository.save(alertHistory);

      this.logger.log(
        `告警历史记录已创建: 规则=${alertRule.name}, 项目=${projectConfig.name}, 触发值=${triggeredValue}`
      );

      return savedHistory;
    } catch (error) {
      this.logger.error(`创建告警历史记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据项目ID查询告警历史记录
   * @param projectConfigId 项目配置ID
   * @param limit 限制数量
   * @returns 告警历史记录列表
   */
  async findByProjectConfigId(
    projectConfigId: number,
    limit = 100
  ): Promise<AlertHistory[]> {
    return this.alertHistoryRepository.find({
      where: { projectConfigId },
      order: { createdAt: "DESC" },
      take: limit,
      relations: ["alertRule"],
    });
  }

  /**
   * 根据告警规则ID查询告警历史记录
   * @param alertRuleId 告警规则ID
   * @param limit 限制数量
   * @returns 告警历史记录列表
   */
  async findByAlertRuleId(
    alertRuleId: number,
    limit = 50
  ): Promise<AlertHistory[]> {
    return this.alertHistoryRepository.find({
      where: { alertRuleId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  /**
   * 更新告警历史记录状态
   * @param id 告警历史记录ID
   * @param status 新状态
   * @returns 更新后的告警历史记录
   */
  async updateStatus(id: number, status: string): Promise<AlertHistory> {
    await this.alertHistoryRepository.update(id, { status });
    return this.alertHistoryRepository.findOne({ where: { id } });
  }

  /**
   * 删除过期的告警历史记录
   * @param days 保留天数
   * @returns 删除的记录数量
   */
  async deleteExpiredHistories(days = 30): Promise<number> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - days);

    const result = await this.alertHistoryRepository
      .createQueryBuilder()
      .delete()
      .where("created_at < :expirationDate", { expirationDate })
      .execute();

    this.logger.log(`已删除 ${result.affected} 条过期告警历史记录`);
    return result.affected;
  }

  /**
   * 生成告警消息
   * @param alertRule 告警规则
   * @param triggeredValue 触发值
   * @returns 告警消息
   */
  private generateAlertMessage(
    alertRule: IAlertRule,
    triggeredValue: number
  ): string {
    const conditionMap = {
      GREATER_THAN: "超过",
      LESS_THAN: "低于",
      EQUAL: "等于",
      NOT_EQUAL: "不等于",
    };

    const typeMap = {
      ERROR_COUNT: "错误数量",
      ERROR_RATE: "错误率",
      PERFORMANCE: "性能指标",
      RESOURCE_USAGE: "资源使用率",
    };

    return `${typeMap[alertRule.type]} ${conditionMap[alertRule.condition]}阈值: ${triggeredValue} ${alertRule.condition === "GREATER_THAN" ? ">" : "<"} ${alertRule.threshold}`;
  }
}
