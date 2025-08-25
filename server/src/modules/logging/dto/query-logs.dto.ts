import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsIn,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 查询日志DTO
 */
export class QueryLogsDto {
  /**
   * 日志级别
   */
  @ApiPropertyOptional({
    description: "日志级别",
    enum: ["error", "warn", "info", "debug", "verbose"],
  })
  @IsOptional()
  @IsString()
  @IsIn(["error", "warn", "info", "debug", "verbose"])
  level?: string;

  /**
   * 日志上下文
   */
  @ApiPropertyOptional({
    description: "日志上下文",
  })
  @IsOptional()
  @IsString()
  context?: string;

  /**
   * 项目ID
   */
  @ApiPropertyOptional({
    description: "项目ID",
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  /**
   * 用户ID
   */
  @ApiPropertyOptional({
    description: "用户ID",
  })
  @IsOptional()
  @IsString()
  userId?: string;

  /**
   * 跟踪ID
   */
  @ApiPropertyOptional({
    description: "跟踪ID",
  })
  @IsOptional()
  @IsString()
  traceId?: string;

  /**
   * 开始日期
   */
  @ApiPropertyOptional({
    description: "开始日期",
    example: "2024-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * 结束日期
   */
  @ApiPropertyOptional({
    description: "结束日期",
    example: "2024-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * 关键词搜索
   */
  @ApiPropertyOptional({
    description: "在消息中搜索关键词",
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  /**
   * 页码
   */
  @ApiPropertyOptional({
    description: "页码，从1开始",
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * 每页数量
   */
  @ApiPropertyOptional({
    description: "每页数量",
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  /**
   * 排序字段
   */
  @ApiPropertyOptional({
    description: "排序字段",
    enum: ["createdAt", "level", "context"],
    default: "createdAt",
  })
  @IsOptional()
  @IsString()
  @IsIn(["createdAt", "level", "context"])
  sortBy?: string = "createdAt";

  /**
   * 排序方向
   */
  @ApiPropertyOptional({
    description: "排序方向",
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsString()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";
}
