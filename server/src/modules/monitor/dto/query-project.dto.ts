import { IsOptional, IsBoolean, IsInt, IsString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 查询项目DTO
 */
export class QueryProjectDto {
  /**
   * 团队ID
   */
  @ApiPropertyOptional({ description: '团队ID' })
  @IsOptional()
  @IsString()
  teamId?: string;

  /**
   * 负责人ID
   */
  @ApiPropertyOptional({ description: '负责人ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  /**
   * 是否启用
   */
  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  /**
   * 是否暂停
   */
  @ApiPropertyOptional({ description: '是否暂停' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPaused?: boolean;

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
    default: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'projectName', 'projectId']
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  /**
   * 排序顺序
   */
  @ApiPropertyOptional({ 
    description: '排序顺序', 
    default: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}