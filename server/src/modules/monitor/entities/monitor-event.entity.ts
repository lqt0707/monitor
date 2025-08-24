import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * 统一监控事件实体类
 * 替代原有的 monitor_data 表，支持多种事件类型和平台
 */
@Entity('monitor_events')
@Index(['projectId', 'eventTimestamp'])
@Index(['platformCode', 'eventTimestamp'])
@Index(['eventType', 'eventTimestamp'])
@Index(['sessionId'])
@Index(['userId'])
export class MonitorEvent {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  // ========== 基础标识 ==========

  /**
   * 项目ID
   */
  @Column({ name: 'project_id', length: 100 })
  projectId: string;

  /**
   * 平台代码
   */
  @Column({ name: 'platform_code', length: 50 })
  platformCode: string;

  /**
   * 事件类型
   */
  @Column({ 
    name: 'event_type', 
    type: 'enum', 
    enum: ['error', 'performance', 'user_action', 'network', 'custom'] 
  })
  eventType: 'error' | 'performance' | 'user_action' | 'network' | 'custom';

  /**
   * 事件子类型
   */
  @Column({ name: 'event_subtype', length: 50 })
  eventSubtype: string;

  // ========== 会话信息 ==========

  /**
   * 会话ID
   */
  @Column({ name: 'session_id', length: 100, nullable: true })
  sessionId?: string;

  /**
   * 用户ID
   */
  @Column({ name: 'user_id', length: 100, nullable: true })
  userId?: string;

  /**
   * 设备ID
   */
  @Column({ name: 'device_id', length: 100, nullable: true })
  deviceId?: string;

  // ========== 上下文信息 ==========

  /**
   * 页面URL
   */
  @Column({ name: 'page_url', length: 1000, nullable: true })
  pageUrl?: string;

  /**
   * 来源页面
   */
  @Column({ name: 'referrer_url', length: 1000, nullable: true })
  referrerUrl?: string;

  /**
   * 用户代理
   */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  // ========== 环境信息 ==========

  /**
   * 应用版本
   */
  @Column({ name: 'app_version', length: 50, nullable: true })
  appVersion?: string;

  /**
   * SDK版本
   */
  @Column({ name: 'sdk_version', length: 50, nullable: true })
  sdkVersion?: string;

  /**
   * 框架版本
   */
  @Column({ name: 'framework_version', length: 50, nullable: true })
  frameworkVersion?: string;

  // ========== 设备和网络信息 ==========

  /**
   * 设备信息（JSON格式）
   */
  @Column({ name: 'device_info', type: 'text', nullable: true })
  deviceInfo?: string;

  /**
   * 网络信息（JSON格式）
   */
  @Column({ name: 'network_info', type: 'text', nullable: true })
  networkInfo?: string;

  // ========== 地理位置 ==========

  /**
   * 国家代码
   */
  @Column({ name: 'country_code', length: 2, nullable: true })
  countryCode?: string;

  /**
   * 地区
   */
  @Column({ length: 100, nullable: true })
  region?: string;

  /**
   * 城市
   */
  @Column({ length: 100, nullable: true })
  city?: string;

  // ========== 事件数据 ==========

  /**
   * 事件具体数据（JSON格式）
   */
  @Column({ name: 'event_data', type: 'longtext' })
  eventData: string;

  /**
   * 扩展数据（JSON格式）
   */
  @Column({ name: 'extra_data', type: 'text', nullable: true })
  extraData?: string;

  // ========== 时间戳 ==========

  /**
   * 事件发生时间戳（毫秒）
   */
  @Column({ name: 'event_timestamp', type: 'bigint' })
  eventTimestamp: number;

  /**
   * 服务器接收时间
   */
  @CreateDateColumn({ name: 'received_at' })
  receivedAt: Date;

  // ========== 处理状态 ==========

  /**
   * 是否已处理
   */
  @Column({ name: 'is_processed', default: false })
  isProcessed: boolean;

  /**
   * 处理时间
   */
  @Column({ name: 'processed_at', type: 'datetime', nullable: true })
  processedAt?: Date;

  /**
   * 数据哈希（用于去重）
   */
  @Column({ name: 'data_hash', length: 64, nullable: true })
  dataHash?: string;
}