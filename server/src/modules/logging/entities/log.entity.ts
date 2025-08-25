import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * 日志实体类
 * 用于持久化存储应用程序日志
 */
@Entity('logs')
@Index(['level', 'createdAt'])
@Index(['context', 'createdAt'])
@Index(['projectId', 'createdAt'])
export class Log {
  /**
   * 日志ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 日志级别
   * error, warn, info, debug, verbose
   */
  @Column({ type: 'varchar', length: 20 })
  level: string;

  /**
   * 日志消息
   */
  @Column({ type: 'text' })
  message: string;

  /**
   * 日志上下文
   * 用于标识日志来源，如模块名、服务名等
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  context: string;

  /**
   * 项目ID
   * 用于多项目环境下的日志区分
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  projectId: string;

  /**
   * 跟踪ID
   * 用于请求链路的日志追踪
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  traceId: string;

  /**
   * 用户ID
   * 记录操作用户信息
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  userId: string;

  /**
   * 额外数据
   * 以JSON格式存储的额外日志信息
   */
  @Column({ type: 'json', nullable: true })
  extra: Record<string, any>;

  /**
   * 创建时间
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 创建日志实体实例
   * @param level 日志级别
   * @param message 日志消息
   * @param context 日志上下文
   * @param extra 额外数据
   */
  constructor(level: string, message: string, context?: string, extra?: Record<string, any>) {
    this.level = level;
    this.message = message;
    this.context = context;
    this.extra = extra;
  }
}