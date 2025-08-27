import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * 错误聚合实体类（存储在MySQL中）
 */
@Entity("error_aggregations")
@Index(["projectId", "createdAt"])
export class ErrorAggregation {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 项目ID
   */
  @Column({ name: "project_id", length: 100 })
  projectId: string;

  /**
   * 错误哈希（MinHash指纹）
   */
  @Column({ name: "error_hash", length: 1024 })
  errorHash: string;

  /**
   * 错误类型
   */
  @Column({ length: 50 })
  type: string;

  /**
   * 错误消息
   */
  @Column({ name: "error_message", type: "text" })
  errorMessage: string;

  /**
   * 错误堆栈（代表性的）
   */
  @Column({ name: "error_stack", type: "text", nullable: true })
  errorStack?: string;

  /**
   * 首次出现时间
   */
  @Column({ name: "first_seen", type: "datetime" })
  firstSeen: Date;

  /**
   * 最后出现时间
   */
  @Column({ name: "last_seen", type: "datetime" })
  lastSeen: Date;

  /**
   * 出现次数
   */
  @Column({ name: "occurrence_count", default: 1 })
  occurrenceCount: number;

  /**
   * 影响用户数
   */
  @Column({ name: "affected_users", default: 1 })
  affectedUsers: number;

  /**
   * 错误级别
   */
  @Column({ name: "error_level", default: 1 })
  errorLevel: number;

  /**
   * 错误状态
   * 1: 新错误
   * 2: 已确认
   * 3: 修复中
   * 4: 已修复
   * 5: 已忽略
   */
  @Column({ default: 1 })
  status: number;

  /**
   * 源文件信息
   */
  @Column({ name: "source_file", length: 255, nullable: true })
  sourceFile?: string;

  /**
   * 源代码行号
   */
  @Column({ name: "source_line", nullable: true })
  sourceLine?: number;

  /**
   * 源代码列号
   */
  @Column({ name: "source_column", nullable: true })
  sourceColumn?: number;

  /**
   * AI诊断结果
   */
  @Column({ name: "ai_diagnosis", type: "text", nullable: true })
  aiDiagnosis?: string;

  /**
   * AI修复建议
   */
  @Column({ name: "ai_fix_suggestion", type: "text", nullable: true })
  aiFixSuggestion?: string;

  /**
   * AI诊断历史记录（JSON数组）
   * 格式: [{ timestamp: Date, analysis: string, fixSuggestion: string }]
   */
  @Column({ name: "ai_diagnosis_history", type: "text", nullable: true })
  aiDiagnosisHistory?: string;

  /**
   * 综合分析报告（JSON格式）
   * 包含错误根本原因、代码定位、修复建议等完整分析
   */
  @Column({
    name: "comprehensive_analysis_report",
    type: "text",
    nullable: true,
  })
  comprehensiveAnalysisReport?: string;

  /**
   * 综合分析报告生成时间
   */
  @Column({
    name: "comprehensive_analysis_generated_at",
    type: "datetime",
    nullable: true,
  })
  comprehensiveAnalysisGeneratedAt?: Date;

  /**
   * 综合分析报告版本
   */
  @Column({
    name: "comprehensive_analysis_version",
    length: 50,
    nullable: true,
  })
  comprehensiveAnalysisVersion?: string;

  /**
   * 是否已发送告警
   */
  @Column({ name: "alert_sent", default: false })
  alertSent: boolean;

  /**
   * 告警发送时间
   */
  @Column({ name: "alert_sent_at", type: "datetime", nullable: true })
  alertSentAt?: Date;

  /**
   * 标签（JSON数组）
   */
  @Column({ type: "text", nullable: true })
  tags?: string;

  /**
   * 备注
   */
  @Column({ type: "text", nullable: true })
  notes?: string;

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
}
