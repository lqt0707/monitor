import { ApiProperty } from "@nestjs/swagger";

/**
 * 日志响应DTO
 */
export class LogResponseDto {
  @ApiProperty({ description: "日志ID" })
  id: number;

  @ApiProperty({ description: "日志级别" })
  level: string;

  @ApiProperty({ description: "日志消息" })
  message: string;

  @ApiProperty({ description: "日志上下文", required: false })
  context?: string;

  @ApiProperty({ description: "项目ID", required: false })
  projectId?: string;

  @ApiProperty({ description: "跟踪ID", required: false })
  traceId?: string;

  @ApiProperty({ description: "用户ID", required: false })
  userId?: string;

  @ApiProperty({ description: "额外数据", required: false })
  extra?: Record<string, any>;

  @ApiProperty({ description: "创建时间" })
  createdAt: Date;
}

/**
 * 分页日志响应DTO
 */
export class PaginatedLogsResponseDto {
  @ApiProperty({ description: "日志列表", type: [LogResponseDto] })
  data: LogResponseDto[];

  @ApiProperty({ description: "总数量" })
  total: number;

  @ApiProperty({ description: "当前页码" })
  page: number;

  @ApiProperty({ description: "每页数量" })
  pageSize: number;

  @ApiProperty({ description: "总页数" })
  totalPages: number;

  @ApiProperty({ description: "是否有下一页" })
  hasNext: boolean;

  @ApiProperty({ description: "是否有上一页" })
  hasPrev: boolean;
}
