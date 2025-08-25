import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
// 使用接口引用而不是具体类引用
import type { ProjectConfig } from "../../project-config/entities/project-config.entity";
import type { AlertHistory } from "./alert-history.entity";

/**
 * 告警规则类型
 */
export enum AlertRuleType {
  ERROR_COUNT = "error_count", // 错误数量告警
  ERROR_RATE = "error_rate", // 错误率告警
  PERFORMANCE = "performance", // 性能指标告警
  CUSTOM = "custom", // 自定义告警
}

/**
 * 告警动作类型
 */
export enum AlertActionType {
  EMAIL = "email", // 邮件告警
  WEBHOOK = "webhook", // Webhook告警
  SLACK = "slack", // Slack通知
  DINGTALK = "dingtalk", // 钉钉通知
}

/**
 * 告警规则实体
 * 用于配置项目的告警规则
 */
@Entity("alert_rules")
export class AlertRule {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 规则名称
   */
  @Column({ length: 100 })
  name: string;

  /**
   * 规则类型
   */
  @Column({
    type: "enum",
    enum: AlertRuleType,
    default: AlertRuleType.ERROR_COUNT,
  })
  type: AlertRuleType;

  /**
   * 规则描述
   */
  @Column({ type: "text", nullable: true })
  description?: string;

  /**
   * 触发条件
   */
  @Column({ length: 500 })
  condition: string;

  /**
   * 阈值
   */
  @Column({ type: "decimal", precision: 10, scale: 2 })
  threshold: number;

  /**
   * 时间窗口（秒）
   */
  @Column({ name: "time_window" })
  timeWindow: number;

  /**
   * 告警动作
   */
  @Column({
    type: "simple-array",
    transformer: {
      to: (value: AlertActionType[]) => value.join(","),
      from: (value: string) => value.split(",") as AlertActionType[],
    },
  })
  actions: AlertActionType[];

  /**
   * Webhook URL（可选）
   */
  @Column({ name: "webhook_url", length: 500, nullable: true })
  webhookUrl?: string;

  /**
   * 是否启用
   */
  @Column({ default: true })
  enabled: boolean;

  /**
   * 项目配置
   */
  @ManyToOne("ProjectConfig", (project: any) => project.alertRules)
  @JoinColumn({ name: "project_id" })
  project: ProjectConfig;

  /**
   * 项目ID
   */
  @Column({ name: "project_id" })
  projectId: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  /**
   * 告警历史记录
   */
  @OneToMany("AlertHistory", (alertHistory: any) => alertHistory.alertRule)
  alertHistories: AlertHistory[];
}
