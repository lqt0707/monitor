import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

/**
 * 上传源代码版本 DTO
 */
export class UploadSourceCodeVersionDto {
  /**
   * 项目ID
   */
  @ApiProperty({ description: "项目ID", example: "taro-wechat-mini" })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  /**
   * 版本号（可选，未提供时以 manifest 或服务端生成为准）
   */
  @ApiPropertyOptional({
    description: "版本号（可选，未提供时以 manifest 或服务端生成为准）",
    example: "1.0.0",
  })
  @IsString()
  @IsOptional()
  version?: string;

  /**
   * 构建ID或Git提交哈希
   */
  @ApiPropertyOptional({
    description: "构建ID或Git提交哈希",
    example: "abc123def456",
  })
  @IsString()
  @IsOptional()
  buildId?: string;

  /**
   * 分支名称
   */
  @ApiPropertyOptional({
    description: "分支名称",
    example: "main",
  })
  @IsString()
  @IsOptional()
  branchName?: string;

  /**
   * 提交信息
   */
  @ApiPropertyOptional({
    description: "提交信息",
    example: "feat: add new feature",
  })
  @IsString()
  @IsOptional()
  commitMessage?: string;

  /**
   * 压缩包内容（base64，兼容旧版；优先使用 multipart 文件流）
   */
  @ApiPropertyOptional({
    description: "压缩包内容（base64，兼容旧版；优先使用 multipart 文件流）",
    example: "UEsDBBQAAAAIAA...",
  })
  @IsString()
  @IsOptional()
  archiveContent?: string;

  /**
   * 压缩包文件名
   */
  @ApiProperty({
    description: "压缩包文件名",
    example: "source-code-v1.0.0.zip",
  })
  @IsString()
  @IsNotEmpty()
  archiveName: string;

  /**
   * 上传者
   */
  @ApiPropertyOptional({
    description: "上传者",
    example: "developer@example.com",
  })
  @IsString()
  @IsOptional()
  uploadedBy?: string;

  /**
   * 描述信息
   */
  @ApiPropertyOptional({
    description: "描述信息",
    example: "生产环境版本 1.0.0",
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * 是否设为活跃版本
   */
  @ApiPropertyOptional({
    description: "是否设为活跃版本",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  setAsActive?: boolean;
}

/**
 * 查询源代码版本 DTO
 */
export class QuerySourceCodeVersionDto {
  /**
   * 项目ID
   */
  @ApiProperty({ description: "项目ID", example: "taro-wechat-mini" })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  /**
   * 版本号（可选，用于精确查询）
   */
  @ApiPropertyOptional({
    description: "版本号",
    example: "1.0.0",
  })
  @IsString()
  @IsOptional()
  version?: string;

  /**
   * 页码
   */
  @ApiPropertyOptional({ description: "页码", example: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  /**
   * 每页数量
   */
  @ApiPropertyOptional({ description: "每页数量", example: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}

/**
 * 查询源代码文件 DTO
 */
export class QuerySourceCodeFileDto {
  /**
   * 版本ID（可选）
   */
  @ApiPropertyOptional({ description: "版本ID", example: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  versionId?: number;

  /**
   * 项目ID（可选）
   */
  @ApiPropertyOptional({ description: "项目ID", example: "taro-wechat-mini" })
  @IsString()
  @IsOptional()
  projectId?: string;

  /**
   * 版本号（可选）
   */
  @ApiPropertyOptional({ description: "版本号", example: "1.0.0" })
  @IsString()
  @IsOptional()
  version?: string;

  /**
   * 文件名（可选，用于模糊搜索）
   */
  @ApiPropertyOptional({
    description: "文件名",
    example: "index.js",
  })
  @IsString()
  @IsOptional()
  fileName?: string;

  /**
   * 页码
   */
  @ApiPropertyOptional({ description: "页码", example: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  /**
   * 每页数量
   */
  @ApiPropertyOptional({ description: "每页数量", example: 50 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 50;
}
