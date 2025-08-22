import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { ErrorType, ErrorLevel } from './create-error-log.dto';

/**
 * 排序字段枚举
 */
export enum SortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LEVEL = 'level',
  OCCURRENCE_COUNT = 'occurrenceCount',
}

/**
 * 排序方向枚举
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * 查询错误日志DTO
 */
export class QueryErrorLogDto {
  /**
   * 项目ID
   */
  @ApiPropertyOptional({ description: '项目ID', example: 'taro-wechat-mini' })
  @IsString()
  @IsOptional()
  projectId?: string;

  /**
   * 错误类型
   */
  @ApiPropertyOptional({ 
    description: '错误类型', 
    enum: ErrorType,
    example: ErrorType.JS_ERROR
  })
  @IsEnum(ErrorType)
  @IsOptional()
  type?: ErrorType;

  /**
   * 错误级别
   */
  @ApiPropertyOptional({ 
    description: '错误级别', 
    enum: ErrorLevel,
    example: ErrorLevel.HIGH
  })
  @IsEnum(ErrorLevel)
  @IsOptional()
  level?: ErrorLevel;

  /**
   * 错误消息关键词搜索
   */
  @ApiPropertyOptional({ description: '错误消息关键词搜索', example: 'TypeError' })
  @IsString()
  @IsOptional()
  keyword?: string;

  /**
   * 源文件路径
   */
  @ApiPropertyOptional({ description: '源文件路径', example: '/src/pages/index.js' })
  @IsString()
  @IsOptional()
  sourceFile?: string;

  /**
   * 页面URL
   */
  @ApiPropertyOptional({ description: '页面URL', example: '/pages/index/index' })
  @IsString()
  @IsOptional()
  pageUrl?: string;

  /**
   * 用户ID
   */
  @ApiPropertyOptional({ description: '用户ID', example: 'user_123' })
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * 标签
   */
  @ApiPropertyOptional({ description: '标签', example: 'critical' })
  @IsString()
  @IsOptional()
  tag?: string;

  /**
   * 开始日期
   */
  @ApiPropertyOptional({ description: '开始日期', example: '2024-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  /**
   * 结束日期
   */
  @ApiPropertyOptional({ description: '结束日期', example: '2024-01-31T23:59:59.999Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  /**
   * 页码
   */
  @ApiPropertyOptional({ description: '页码', example: 1, minimum: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => Math.max(1, parseInt(value) || 1))
  page?: number = 1;

  /**
   * 每页数量
   */
  @ApiPropertyOptional({ description: '每页数量', example: 20, minimum: 1, maximum: 100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => Math.min(100, Math.max(1, parseInt(value) || 20)))
  limit?: number = 20;

  /**
   * 排序字段
   */
  @ApiPropertyOptional({ 
    description: '排序字段', 
    enum: SortField,
    example: SortField.CREATED_AT
  })
  @IsEnum(SortField)
  @IsOptional()
  sortField?: SortField = SortField.CREATED_AT;

  /**
   * 排序方向
   */
  @ApiPropertyOptional({ 
    description: '排序方向', 
    enum: SortOrder,
    example: SortOrder.DESC
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  /**
   * 是否只查询已聚合的错误
   */
  @ApiPropertyOptional({ description: '是否只查询已聚合的错误', example: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  aggregatedOnly?: boolean = false;

  /**
   * 是否包含AI诊断信息
   */
  @ApiPropertyOptional({ description: '是否包含AI诊断信息', example: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  includeAiDiagnosis?: boolean = false;
}