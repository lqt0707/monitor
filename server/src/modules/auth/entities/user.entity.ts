import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 用户实体类
 * 用于存储系统用户信息
 */
@Entity('users')
@Index(['username'], { unique: true })
@Index(['email'], { unique: true })
export class User {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 用户名
   */
  @Column({ length: 50, unique: true })
  username: string;

  /**
   * 邮箱地址
   */
  @Column({ length: 100, unique: true })
  email: string;

  /**
   * 密码（加密后）
   */
  @Column({ length: 255 })
  password: string;

  /**
   * 用户角色
   * admin: 管理员
   * user: 普通用户
   */
  @Column({ length: 20, default: 'user' })
  role: string;

  /**
   * 用户状态
   * true: 启用
   * false: 禁用
   */
  @Column({ default: true })
  enabled: boolean;

  /**
   * 最后登录时间
   */
  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  /**
   * 最后登录IP
   */
  @Column({ name: 'last_login_ip', length: 45, nullable: true })
  lastLoginIp?: string;

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