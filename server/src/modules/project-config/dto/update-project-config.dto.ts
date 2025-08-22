import { IsString, IsOptional, IsBoolean, IsEmail, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新项目配置DTO
 */
export class UpdateProjectConfigDto {
  @ApiProperty({ description: '项目ID', required: false, example: 'project-123' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ description: '项目名称', required: false, example: '前端监控系统' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '项目描述', required: false, example: '用于监控前端错误和性能' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'API密钥', required: false, example: 'api-key-123456' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({ description: '告警邮箱', required: false, example: 'alert@example.com' })
  @IsEmail()
  @IsOptional()
  alertEmail?: string;

  @ApiProperty({ description: '告警级别 (1-低级别, 2-中级别, 3-高级别)', required: false, example: 2 })
  @IsNumber()
  @Min(1)
  @Max(3)
  @IsOptional()
  alertLevel?: number;

  @ApiProperty({ description: '是否启用AI诊断', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  enableAiDiagnosis?: boolean;

  @ApiProperty({ description: '是否启用错误聚合', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  enableErrorAggregation?: boolean;

  @ApiProperty({ description: '是否启用SourceMap解析', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  enableSourcemap?: boolean;

  @ApiProperty({ description: 'SourceMap文件路径', required: false, example: '/path/to/sourcemaps' })
  @IsString()
  @IsOptional()
  sourcemapPath?: string;

  @ApiProperty({ description: '是否启用', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}