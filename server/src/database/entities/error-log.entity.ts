import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * 错误日志实体类（存储在ClickHouse中的结构定义）
 */
@Entity('error_logs')
@Index(['projectId', 'createdAt'])
@Index(['type', 'createdAt'])
export class ErrorLog {
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
   * 错误类型
   */
  @Column({ length: 50 })
  type: string;

  /**
   * 错误哈希（用于聚合）
   */
  @Column({ name: 'error_hash', length: 1024 })
  errorHash: string;

  /**
   * 错误消息
   */
  @Column({ name: 'error_message', type: 'text' })
  errorMessage: string;

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
   * 设备信息（JSON字符串）
   */
  @Column({ name: 'device_info', type: 'text', nullable: true })
  deviceInfo?: string;

  /**
   * 网络信息（JSON字符串）
   */
  @Column({ name: 'network_info', type: 'text', nullable: true })
  networkInfo?: string;

  /**
   * 性能数据（JSON字符串）
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
   * 源文件名
   */
  @Column({ name: 'source_file', length: 255, nullable: true })
  sourceFile?: string;

  /**
   * 源代码行号
   */
  @Column({ name: 'source_line', nullable: true })
  sourceLine?: number;

  /**
   * 源代码列号
   */
  @Column({ name: 'source_column', nullable: true })
  sourceColumn?: number;

  /**
   * AI诊断结果
   */
  @Column({ name: 'ai_diagnosis', type: 'text', nullable: true })
  aiDiagnosis?: string;

  /**
   * 错误级别
   */
  @Column({ name: 'error_level', default: 1 })
  errorLevel: number;

  /**
   * 是否已处理
   */
  @Column({ name: 'is_processed', default: false })
  isProcessed: boolean;

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