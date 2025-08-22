import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 查询项目配置DTO
 */
export class QueryProjectConfigDto {
  @ApiProperty({ description: '页码', required: false, default: 1, example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 10, example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ description: '项目名称', required: false, example: '前端监控系统' })
  @IsString()
  @IsOptional()
  projectName?: string;

  @ApiProperty({ description: '是否启用SourceMap解析', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  enableSourcemap?: boolean;

  @ApiProperty({ description: '是否启用AI诊断', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  enableAiDiagnosis?: boolean;

  @ApiProperty({ description: '是否启用错误聚合', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  enableErrorAggregation?: boolean;

  @ApiProperty({ description: '是否启用', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  enabled?: boolean;
}