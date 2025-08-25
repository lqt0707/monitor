import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
// 使用接口引用而不是具体类引用
import type { AlertRule } from "../../alert/entities/alert-rule.entity";
import type { AlertHistory } from "../../alert/entities/alert-history.entity";

/**
 * 项目配置实体类
 */
@Entity("project_configs")
export class ProjectConfig {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 项目ID
   */
  @Column({ name: "project_id", length: 100, unique: true })
  projectId: string;

  /**
   * 项目名称
   */
  @Column({ length: 100 })
  name: string;

  /**
   * 项目描述
   */
  @Column({ type: "text", nullable: true })
  description?: string;

  /**
   * 项目密钥
   */
  @Column({ name: "api_key", length: 64, unique: true })
  apiKey: string;

  /**
   * 告警邮箱
   */
  @Column({ name: "alert_email", length: 255, nullable: true })
  alertEmail?: string;

  /**
   * 告警级别
   * 1: 低级别 - 只记录
   * 2: 中级别 - 聚合后告警
   * 3: 高级别 - 立即告警
   */
  @Column({ name: "alert_level", default: 2 })
  alertLevel: number;

  /**
   * 是否启用AI诊断
   */
  @Column({ name: "enable_ai_diagnosis", default: false })
  enableAiDiagnosis: boolean;

  /**
   * 是否启用错误聚合
   */
  @Column({ name: "enable_error_aggregation", default: true })
  enableErrorAggregation: boolean;

  /**
   * 是否启用SourceMap解析
   */
  @Column({ name: "enable_sourcemap", default: false })
  enableSourcemap: boolean;

  /**
   * SourceMap文件路径
   */
  @Column({ name: "sourcemap_path", type: "text", nullable: true })
  sourcemapPath?: string;

  /**
   * 是否启用
   */
  @Column({ default: true })
  enabled: boolean;

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
   * 告警规则列表
   */
  @OneToMany('AlertRule', (alertRule: any) => alertRule.project)
  alertRules: AlertRule[];

  /**
   * 告警历史记录
   */
  @OneToMany('AlertHistory', (alertHistory: any) => alertHistory.projectConfig)
  alertHistories: AlertHistory[];
}
