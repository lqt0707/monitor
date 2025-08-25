import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 查询错误聚合DTO
 */
export class QueryErrorAggregationDto {
  @ApiPropertyOptional({ description: "项目ID" })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: "错误类型" })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: "状态 (0: 未解决, 1: 已解决, 2: 已忽略)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({
    description: "错误级别 (1: 低, 2: 中, 3: 高, 4: 严重)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4)
  errorLevel?: number;

  @ApiPropertyOptional({ description: "开始日期" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: "结束日期" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: "页码", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "每页数量", default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: "排序字段",
    enum: ["createdAt", "lastSeen", "occurrenceCount", "affectedUsers"],
    default: "lastSeen",
  })
  @IsOptional()
  @IsString()
  @IsEnum(["createdAt", "lastSeen", "occurrenceCount", "affectedUsers"])
  sortBy?: string = "lastSeen";

  @ApiPropertyOptional({
    description: "排序方向",
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsString()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: string = "DESC";
}
