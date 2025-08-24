import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsNumber, 
  IsArray, 
  IsInt, 
  IsEmail,
  MaxLength, 
  Min, 
  Max,
  IsDecimal 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建项目DTO
 */
export class CreateProjectDto {
  /**
   * 项目唯一标识
   */
  @ApiProperty({ description: '项目唯一标识', example: 'my-app' })
  @IsString()
  @MaxLength(100)
  projectId: string;

  /**
   * 项目名称
   */
  @ApiProperty({ description: '项目名称', example: '我的应用' })
  @IsString()
  @MaxLength(200)
  projectName: string;

  /**
   * 项目描述
   */
  @ApiPropertyOptional({ description: '项目描述' })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 支持的平台ID列表
   */
  @ApiPropertyOptional({ description: '支持的平台ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  platformIds?: number[];

  /**
   * 项目负责人ID
   */
  @ApiPropertyOptional({ description: '项目负责人ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerId?: string;

  /**
   * 团队ID
   */
  @ApiPropertyOptional({ description: '团队ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamId?: string;

  /**
   * 项目域名
   */
  @ApiPropertyOptional({ description: '项目域名', example: 'https://example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  domain?: string;

  /**
   * 错误采样率
   */
  @ApiPropertyOptional({ description: '错误采样率 (0.0-1.0)', default: 1.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  errorSamplingRate?: number = 1.0;

  /**
   * 性能采样率
   */
  @ApiPropertyOptional({ description: '性能采样率 (0.0-1.0)', default: 0.1 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  performanceSamplingRate?: number = 0.1;

  /**
   * 会话采样率
   */
  @ApiPropertyOptional({ description: '会话采样率 (0.0-1.0)', default: 0.05 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  sessionSamplingRate?: number = 0.05;

  /**
   * 数据保留天数
   */
  @ApiPropertyOptional({ description: '数据保留天数', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  dataRetentionDays?: number = 30;

  /**
   * 告警规则配置
   */
  @ApiPropertyOptional({ description: '告警规则配置JSON字符串' })
  @IsOptional()
  @IsString()
  alertRules?: string;

  /**
   * 通知配置
   */
  @ApiPropertyOptional({ description: '通知配置JSON字符串' })
  @IsOptional()
  @IsString()
  notificationConfig?: string;

  /**
   * 告警阈值
   */
  @ApiPropertyOptional({ description: '告警阈值', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  alertThreshold?: number = 10;

  /**
   * 告警邮箱
   */
  @ApiPropertyOptional({ description: '告警邮箱' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  alertEmail?: string;

  /**
   * SourceMap配置
   */
  @ApiPropertyOptional({ description: 'SourceMap配置JSON字符串' })
  @IsOptional()
  @IsString()
  sourcemapConfig?: string;

  /**
   * IP白名单
   */
  @ApiPropertyOptional({ description: 'IP白名单JSON字符串' })
  @IsOptional()
  @IsString()
  ipWhitelist?: string;

  /**
   * 用户代理过滤规则
   */
  @ApiPropertyOptional({ description: '用户代理过滤规则JSON字符串' })
  @IsOptional()
  @IsString()
  userAgentFilters?: string;

  /**
   * 自定义标签
   */
  @ApiPropertyOptional({ description: '自定义标签JSON字符串' })
  @IsOptional()
  @IsString()
  customTags?: string;

  /**
   * 是否启用
   */
  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  /**
   * 是否暂停监控
   */
  @ApiPropertyOptional({ description: '是否暂停监控', default: false })
  @IsOptional()
  @IsBoolean()
  isPaused?: boolean = false;
}