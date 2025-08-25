import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsString,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PlatformCategory } from "./create-platform.dto";

/**
 * 查询平台DTO
 */
export class QueryPlatformDto {
  /**
   * 平台分类
   */
  @ApiPropertyOptional({
    description: "平台分类",
    enum: PlatformCategory,
  })
  @IsOptional()
  @IsEnum(PlatformCategory)
  platformCategory?: PlatformCategory;

  /**
   * 是否启用
   */
  @ApiPropertyOptional({ description: "是否启用" })
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  isActive?: boolean;

  /**
   * 页码
   */
  @ApiPropertyOptional({ description: "页码", default: 1, minimum: 1 })
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
    default: "createdAt",
    enum: ["createdAt", "updatedAt", "platformName", "platformCode"],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  /**
   * 排序顺序
   */
  @ApiPropertyOptional({
    description: "排序顺序",
    default: "DESC",
    enum: ["ASC", "DESC"],
  })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";
}
