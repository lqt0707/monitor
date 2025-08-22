import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsNotEmpty,
  IsArray,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

/**
 * 错误类型枚举
 */
export enum ErrorType {
  JS_ERROR = "jsError",
  PROMISE_REJECTION = "promiseRejection",
  RESOURCE_ERROR = "resourceError",
  HTTP_ERROR = "httpError",
  CUSTOM_ERROR = "customError",
}

/**
 * 错误级别枚举
 */
export enum ErrorLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

/**
 * 创建 JavaScript 错误日志 DTO
 */
export class CreateJsErrorLogDto {
  /**
   * 项目ID
   */
  @ApiProperty({ description: "项目ID", example: "taro-wechat-mini" })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  /**
   * 错误类型
   */
  @ApiProperty({
    description: "错误类型",
    enum: ErrorType,
    example: ErrorType.JS_ERROR,
  })
  @IsEnum(ErrorType)
  type: ErrorType;

  /**
   * 错误消息
   */
  @ApiProperty({
    description: "错误消息",
    example: "TypeError: Cannot read property of undefined",
  })
  @IsString()
  @IsNotEmpty()
  errorMessage: string;

  /**
   * 错误堆栈
   */
  @ApiPropertyOptional({ description: "错误堆栈" })
  @IsString()
  @IsOptional()
  errorStack?: string;

  /**
   * 错误级别
   */
  @ApiPropertyOptional({
    description: "错误级别",
    enum: ErrorLevel,
    example: ErrorLevel.HIGH,
  })
  @IsEnum(ErrorLevel)
  @IsOptional()
  level?: ErrorLevel;

  /**
   * 源文件路径
   */
  @ApiPropertyOptional({
    description: "源文件路径",
    example: "/src/pages/index.js",
  })
  @IsString()
  @IsOptional()
  sourceFile?: string;

  /**
   * 源文件行号
   */
  @ApiPropertyOptional({ description: "源文件行号", example: 25 })
  @IsNumber()
  @IsOptional()
  sourceLine?: number;

  /**
   * 源文件列号
   */
  @ApiPropertyOptional({ description: "源文件列号", example: 10 })
  @IsNumber()
  @IsOptional()
  sourceColumn?: number;

  /**
   * 页面URL
   */
  @ApiPropertyOptional({
    description: "页面URL",
    example: "/pages/index/index",
  })
  @IsString()
  @IsOptional()
  pageUrl?: string;

  /**
   * 用户ID
   */
  @ApiPropertyOptional({ description: "用户ID", example: "user_123" })
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * 用户代理
   */
  @ApiPropertyOptional({ description: "用户代理" })
  @IsString()
  @IsOptional()
  userAgent?: string;

  /**
   * 设备信息
   */
  @ApiPropertyOptional({ description: "设备信息" })
  @IsObject()
  @IsOptional()
  deviceInfo?: Record<string, any>;

  /**
   * 网络信息
   */
  @ApiPropertyOptional({ description: "网络信息" })
  @IsObject()
  @IsOptional()
  networkInfo?: Record<string, any>;

  /**
   * 面包屑数据
   */
  @ApiPropertyOptional({ description: "面包屑数据" })
  @IsArray()
  @IsOptional()
  breadcrumbs?: Array<{
    timestamp: number;
    type: string;
    category: string;
    message: string;
    data?: Record<string, any>;
  }>;

  /**
   * 标签
   */
  @ApiPropertyOptional({
    description: "标签",
    example: ["frontend", "critical"],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  /**
   * 额外数据
   */
  @ApiPropertyOptional({ description: "额外数据" })
  @IsObject()
  @IsOptional()
  extraData?: Record<string, any>;

  /**
   * 发生时间戳
   */
  @ApiPropertyOptional({ description: "发生时间戳", example: 1640995200000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  timestamp?: number;
}
