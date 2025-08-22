import { IsString, IsOptional, IsBoolean, IsEmail, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建项目配置DTO
 */
export class CreateProjectConfigDto {
  @ApiProperty({ description: '项目ID', example: 'project-123' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: '项目名称', example: '前端监控系统' })
  @IsString()
  name: string;

  @ApiProperty({ description: '项目描述', required: false, example: '用于监控前端错误和性能' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'API密钥', example: 'api-key-123456' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: '告警邮箱', required: false, example: 'alert@example.com' })
  @IsEmail()
  @IsOptional()
  alertEmail?: string;

  @ApiProperty({ description: '告警级别 (1-低级别, 2-中级别, 3-高级别)', default: 2, example: 2 })
  @IsNumber()
  @Min(1)
  @Max(3)
  @IsOptional()
  alertLevel?: number;

  @ApiProperty({ description: '是否启用AI诊断', default: false, example: true })
  @IsBoolean()
  @IsOptional()
  enableAiDiagnosis?: boolean;

  @ApiProperty({ description: '是否启用错误聚合', default: true, example: true })
  @IsBoolean()
  @IsOptional()
  enableErrorAggregation?: boolean;

  @ApiProperty({ description: '是否启用SourceMap解析', default: false, example: true })
  @IsBoolean()
  @IsOptional()
  enableSourcemap?: boolean;

  @ApiProperty({ description: 'SourceMap文件路径', required: false, example: '/path/to/sourcemaps' })
  @IsString()
  @IsOptional()
  sourcemapPath?: string;

  @ApiProperty({ description: '是否启用', default: true, example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}