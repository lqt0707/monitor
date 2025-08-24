import { IsString, IsEnum, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PlatformCategory {
  WEB = 'web',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  SERVER = 'server',
}

/**
 * 创建平台DTO
 */
export class CreatePlatformDto {
  /**
   * 平台代码
   */
  @ApiProperty({ description: '平台代码', example: 'weapp' })
  @IsString()
  @MaxLength(50)
  platformCode: string;

  /**
   * 平台名称
   */
  @ApiProperty({ description: '平台名称', example: '微信小程序' })
  @IsString()
  @MaxLength(100)
  platformName: string;

  /**
   * 平台分类
   */
  @ApiProperty({ 
    description: '平台分类', 
    enum: PlatformCategory,
    example: PlatformCategory.MOBILE 
  })
  @IsEnum(PlatformCategory)
  platformCategory: PlatformCategory;

  /**
   * SDK版本要求
   */
  @ApiPropertyOptional({ description: 'SDK版本要求', example: '>=1.0.0' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sdkVersion?: string;

  /**
   * 平台图标
   */
  @ApiPropertyOptional({ description: '平台图标URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  platformIcon?: string;

  /**
   * 平台描述
   */
  @ApiPropertyOptional({ description: '平台描述' })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 特殊配置
   */
  @ApiPropertyOptional({ description: '特殊配置JSON字符串' })
  @IsOptional()
  @IsString()
  specialConfig?: string;

  /**
   * 是否启用
   */
  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}