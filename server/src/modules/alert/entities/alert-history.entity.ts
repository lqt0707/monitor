// 使用类型引用而不是接口引用
import type { ProjectConfig } from "../../project-config/entities/project-config.entity";
import type { AlertRule } from './alert-rule.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

/**
 * 告警历史记录实体
 * 记录告警规则的触发历史
 */
@Entity("alert_history")
export class AlertHistory {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 告警规则ID
   */
  @Column({ name: "alert_rule_id" })
  alertRuleId: number;

  /**
   * 项目配置ID
   */
  @Column({ name: "project_config_id" })
  projectConfigId: number;

  /**
   * 告警类型
   */
  @Column({ type: "varchar", length: 50 })
  type: string;

  /**
   * 告警名称
   */
  @Column({ type: "varchar", length: 255 })
  name: string;

  /**
   * 触发时的值
   */
  @Column({ type: "decimal", precision: 10, scale: 2, name: "triggered_value" })
  triggeredValue: number;

  /**
   * 告警阈值
   */
  @Column({ type: "decimal", precision: 10, scale: 2 })
  threshold: number;

  /**
   * 时间窗口（分钟）
   */
  @Column({ type: "int", name: "time_window" })
  timeWindow: number;

  /**
   * 告警消息
   */
  @Column({ type: "text", name: "alert_message" })
  alertMessage: string;

  /**
   * 错误消息（如果是错误告警）
   */
  @Column({ type: "text", name: "error_message", nullable: true })
  errorMessage?: string;

  /**
   * 错误级别（如果是错误告警）
   */
  @Column({ type: "int", name: "error_level", nullable: true })
  errorLevel?: number;

  /**
   * 告警状态
   */
  @Column({ type: "varchar", length: 20, default: "triggered" })
  status: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  /**
   * 告警规则
   */
  @ManyToOne("AlertRule", (alertRule: any) => alertRule.alertHistories)
  @JoinColumn({ name: "alert_rule_id" })
  alertRule: AlertRule;

  /**
   * 项目配置
   */
  @ManyToOne(
    "ProjectConfig",
    (projectConfig: any) => projectConfig.alertHistories
  )
  @JoinColumn({ name: "project_config_id" })
  projectConfig: ProjectConfig;
}
