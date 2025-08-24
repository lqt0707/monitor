import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PerformanceMetricType } from './create-performance-metric.dto';

/**
 * 查询性能指标DTO
 */
export class QueryPerformanceMetricDto {
  /**
   * 项目ID
   */
  @ApiPropertyOptional({ description: '项目ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  /**
   * 平台代码
   */
  @ApiPropertyOptional({ description: '平台代码' })
  @IsOptional()
  @IsString()
  platformCode?: string;

  /**
   * 指标类型
   */
  @ApiPropertyOptional({ 
    description: '指标类型', 
    enum: PerformanceMetricType 
  })
  @IsOptional()
  @IsEnum(PerformanceMetricType)
  metricType?: PerformanceMetricType;

  /**
   * 指标名称
   */
  @ApiPropertyOptional({ description: '指标名称' })
  @IsOptional()
  @IsString()
  metricName?: string;

  /**
   * 页面URL
   */
  @ApiPropertyOptional({ description: '页面URL' })
  @IsOptional()
  @IsString()
  pageUrl?: string;

  /**
   * 开始日期
   */
  @ApiPropertyOptional({ description: '开始日期', example: '2023-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  /**
   * 结束日期
   */
  @ApiPropertyOptional({ description: '结束日期', example: '2023-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  /**
   * 页码
   */
  @ApiPropertyOptional({ description: '页码', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * 每页数量
   */
  @ApiPropertyOptional({ description: '每页数量', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * 排序字段
   */
  @ApiPropertyOptional({ 
    description: '排序字段', 
    default: 'metricTimestamp',
    enum: ['metricTimestamp', 'receivedAt', 'metricName', 'metricType', 'responseTime', 'loadComplete']
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'metricTimestamp';

  /**
   * 排序顺序
   */
  @ApiPropertyOptional({ 
    description: '排序顺序', 
    default: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}