import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * 监控数据实体类
 */
@Entity('monitor_data')
@Index(['type', 'createdAt'])
@Index(['projectId', 'createdAt'])
export class MonitorData {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 项目ID
   */
  @Column({ name: 'project_id', length: 100 })
  projectId: string;

  /**
   * 数据类型：jsError, reqError, slowHttpRequest, performanceInfoReady等
   */
  @Column({ length: 50 })
  type: string;

  /**
   * 错误消息
   */
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  /**
   * 错误堆栈
   */
  @Column({ name: 'error_stack', type: 'text', nullable: true })
  errorStack?: string;

  /**
   * 页面URL
   */
  @Column({ name: 'page_url', length: 500, nullable: true })
  pageUrl?: string;

  /**
   * 用户ID
   */
  @Column({ name: 'user_id', length: 100, nullable: true })
  userId?: string;

  /**
   * 用户代理
   */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  /**
   * 设备信息
   */
  @Column({ name: 'device_info', type: 'text', nullable: true })
  deviceInfo?: string;

  /**
   * 网络信息
   */
  @Column({ name: 'network_info', type: 'text', nullable: true })
  networkInfo?: string;

  /**
   * 性能数据
   */
  @Column({ name: 'performance_data', type: 'text', nullable: true })
  performanceData?: string;

  /**
   * 请求URL（用于网络错误）
   */
  @Column({ name: 'request_url', length: 500, nullable: true })
  requestUrl?: string;

  /**
   * 请求方法
   */
  @Column({ name: 'request_method', length: 10, nullable: true })
  requestMethod?: string;

  /**
   * 响应状态码
   */
  @Column({ name: 'response_status', nullable: true })
  responseStatus?: number;

  /**
   * 请求耗时（毫秒）
   */
  @Column({ nullable: true })
  duration?: number;

  /**
   * 额外数据（JSON格式）
   */
  @Column({ name: 'extra_data', type: 'text', nullable: true })
  extraData?: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}