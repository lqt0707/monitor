import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 更新错误聚合DTO
 */
export class UpdateErrorAggregationDto {
  @ApiPropertyOptional({ description: '状态 (0: 未解决, 1: 已解决, 2: 已忽略)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: '错误级别 (1: 低, 2: 中, 3: 高, 4: 严重)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  errorLevel?: number;

  @ApiPropertyOptional({ description: '备注信息' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: '分配给的用户ID' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: '标签，多个标签用逗号分隔' })
  @IsOptional()
  @IsString()
  tags?: string;
}