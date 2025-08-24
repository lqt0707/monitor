import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * 平台信息实体类
 * 用于管理多平台监控支持
 */
@Entity('platforms')
@Index(['platformCode'], { unique: true })
export class Platform {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 平台代码
   */
  @Column({ name: 'platform_code', length: 50, unique: true })
  platformCode: string;

  /**
   * 平台名称
   */
  @Column({ name: 'platform_name', length: 100 })
  platformName: string;

  /**
   * 平台分类
   */
  @Column({ 
    name: 'platform_category', 
    type: 'enum', 
    enum: ['web', 'mobile', 'desktop', 'server'] 
  })
  platformCategory: 'web' | 'mobile' | 'desktop' | 'server';

  /**
   * SDK版本要求
   */
  @Column({ name: 'sdk_version', length: 50, nullable: true })
  sdkVersion?: string;

  /**
   * 平台图标
   */
  @Column({ name: 'platform_icon', length: 255, nullable: true })
  platformIcon?: string;

  /**
   * 平台描述
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * 特殊配置（JSON格式）
   */
  @Column({ name: 'special_config', type: 'text', nullable: true })
  specialConfig?: string;

  /**
   * 是否启用
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

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