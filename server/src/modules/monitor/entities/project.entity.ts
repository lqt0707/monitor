import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { Platform } from './platform.entity';

/**
 * 项目配置实体类（重构）
 * 支持多平台监控配置
 */
@Entity('projects')
@Index(['projectId'], { unique: true })
@Index(['teamId'])
export class Project {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 项目唯一标识
   */
  @Column({ name: 'project_id', length: 100, unique: true })
  projectId: string;

  /**
   * 项目名称
   */
  @Column({ name: 'project_name', length: 200 })
  projectName: string;

  /**
   * 项目描述
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * 支持的平台列表（关联表）
   */
  @ManyToMany(() => Platform)
  @JoinTable({
    name: 'project_platforms',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'platform_id', referencedColumnName: 'id' }
  })
  platforms: Platform[];

  /**
   * 项目负责人ID
   */
  @Column({ name: 'owner_id', length: 100, nullable: true })
  ownerId?: string;

  /**
   * 团队ID
   */
  @Column({ name: 'team_id', length: 100, nullable: true })
  teamId?: string;

  /**
   * 项目域名/URL
   */
  @Column({ length: 500, nullable: true })
  domain?: string;

  // ========== 监控配置 ==========

  /**
   * 错误采样率 (0.0-1.0)
   */
  @Column({ 
    name: 'error_sampling_rate', 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    default: 1.00 
  })
  errorSamplingRate: number;

  /**
   * 性能采样率 (0.0-1.0)
   */
  @Column({ 
    name: 'performance_sampling_rate', 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    default: 0.10 
  })
  performanceSamplingRate: number;

  /**
   * 会话采样率 (0.0-1.0)
   */
  @Column({ 
    name: 'session_sampling_rate', 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    default: 0.05 
  })
  sessionSamplingRate: number;

  /**
   * 数据保留天数
   */
  @Column({ name: 'data_retention_days', default: 30 })
  dataRetentionDays: number;

  // ========== 告警配置 ==========

  /**
   * 告警规则配置（JSON格式）
   */
  @Column({ name: 'alert_rules', type: 'text', nullable: true })
  alertRules?: string;

  /**
   * 通知配置（JSON格式）
   */
  @Column({ name: 'notification_config', type: 'text', nullable: true })
  notificationConfig?: string;

  /**
   * 告警阈值
   */
  @Column({ name: 'alert_threshold', default: 10 })
  alertThreshold: number;

  /**
   * 告警邮箱
   */
  @Column({ name: 'alert_email', length: 255, nullable: true })
  alertEmail?: string;

  // ========== SourceMap配置 ==========

  /**
   * SourceMap配置（JSON格式）
   */
  @Column({ name: 'sourcemap_config', type: 'text', nullable: true })
  sourcemapConfig?: string;

  // ========== 高级配置 ==========

  /**
   * IP白名单（JSON数组）
   */
  @Column({ name: 'ip_whitelist', type: 'text', nullable: true })
  ipWhitelist?: string;

  /**
   * 用户代理过滤规则（JSON数组）
   */
  @Column({ name: 'user_agent_filters', type: 'text', nullable: true })
  userAgentFilters?: string;

  /**
   * 自定义标签（JSON对象）
   */
  @Column({ name: 'custom_tags', type: 'text', nullable: true })
  customTags?: string;

  // ========== 状态管理 ==========

  /**
   * 是否启用
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * 是否暂停监控
   */
  @Column({ name: 'is_paused', default: false })
  isPaused: boolean;

  /**
   * API密钥
   */
  @Column({ name: 'api_key', length: 100, nullable: true })
  apiKey?: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}