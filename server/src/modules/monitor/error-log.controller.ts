import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { ErrorLogService } from "./error-log.service";
import { CreateErrorLogDto } from "./dto/create-error-log.dto";
import { CreateJsErrorLogDto } from "./dto/create-js-error-log.dto";
import { QueryErrorLogDto } from "./dto/query-error-log.dto";

/**
 * 错误日志控制器
 */
@ApiTags("错误日志")
@Controller("error-logs")
export class ErrorLogController {
  constructor(private readonly errorLogService: ErrorLogService) {}

  /**
   * 上报错误日志
   * @param createErrorLogDto 错误日志数据
   * @returns 上报结果
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "上报错误日志" })
  @ApiResponse({ status: 201, description: "上报成功" })
  @ApiResponse({ status: 400, description: "参数错误" })
  async createErrorLog(@Body() createErrorLogDto: CreateErrorLogDto) {
    try {
      const result =
        await this.errorLogService.createErrorLog(createErrorLogDto);
      return {
        success: true,
        message: "错误日志上报成功",
        data: { id: result.id },
      };
    } catch (error) {
      return {
        success: false,
        message: "错误日志上报失败",
        error: error.message,
      };
    }
  }

  /**
   * 批量上报错误日志
   * @param createErrorLogDtos 错误日志数据数组
   * @returns 上报结果
   */
  @Post("batch")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "批量上报错误日志" })
  @ApiResponse({ status: 201, description: "批量上报成功" })
  @ApiResponse({ status: 400, description: "参数错误" })
  async createErrorLogsBatch(
    @Body() createErrorLogDtos: (CreateErrorLogDto | CreateJsErrorLogDto)[]
  ) {
    try {
      // 转换 CreateJsErrorLogDto 为 CreateErrorLogDto
      const convertedDtos = createErrorLogDtos.map((dto) => {
        if (dto.constructor.name === "CreateJsErrorLogDto") {
          const convertedDto = new CreateErrorLogDto();
          Object.assign(convertedDto, dto);
          return convertedDto;
        }
        return dto;
      });

      const results = await this.errorLogService.createErrorLogs(convertedDtos);
      return {
        success: true,
        message: "错误日志批量上报成功",
        data: { count: results.length },
      };
    } catch (error) {
      return {
        success: false,
        message: "错误日志批量上报失败",
        error: error.message,
      };
    }
  }

  /**
   * 查询错误日志列表
   * @param queryDto 查询参数
   * @returns 错误日志列表
   */
  @Get()
  @ApiOperation({ summary: "查询错误日志列表" })
  @ApiResponse({ status: 200, description: "查询成功" })
  async getErrorLogs(@Query() queryDto: QueryErrorLogDto) {
    try {
      const [data, total] = await this.errorLogService.findErrorLogs(queryDto);
      return {
        success: true,
        message: "查询成功",
        data,
        total,
      };
    } catch (error) {
      return {
        success: false,
        message: "查询失败",
        error: error.message,
      };
    }
  }

  /**
   * 获取错误日志详情
   * @param id 错误日志ID
   * @returns 错误日志详情
   */
  @Get(":id")
  @ApiOperation({ summary: "获取错误日志详情" })
  @ApiParam({ name: "id", description: "错误日志ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 404, description: "错误日志不存在" })
  async getErrorLogById(@Param("id") id: string) {
    try {
      const result = await this.errorLogService.findErrorLogById(
        parseInt(id, 10)
      );
      if (!result) {
        return {
          success: false,
          message: "错误日志不存在",
        };
      }
      return {
        success: true,
        message: "获取成功",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "获取失败",
        error: error.message,
      };
    }
  }

  /**
   * 获取错误统计信息
   * @param projectId 项目ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 错误统计信息
   */
  @Get("stats/summary")
  @ApiOperation({ summary: "获取错误统计信息" })
  @ApiQuery({ name: "projectId", required: false, description: "项目ID" })
  @ApiQuery({ name: "startDate", required: false, description: "开始日期" })
  @ApiQuery({ name: "endDate", required: false, description: "结束日期" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getErrorStats(
    @Query("projectId") projectId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    try {
      const result = await this.errorLogService.getErrorStats(projectId);
      return {
        success: true,
        message: "获取成功",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "获取失败",
        error: error.message,
      };
    }
  }

  /**
   * 获取错误趋势数据
   * @param projectId 项目ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param interval 时间间隔（hour, day, week）
   * @returns 错误趋势数据
   */
  @Get("stats/trend")
  @ApiOperation({ summary: "获取错误趋势数据" })
  @ApiQuery({ name: "projectId", required: false, description: "项目ID" })
  @ApiQuery({ name: "startDate", required: false, description: "开始日期" })
  @ApiQuery({ name: "endDate", required: false, description: "结束日期" })
  @ApiQuery({
    name: "days",
    required: false,
    description: "天数",
    type: "number",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getErrorTrend(
    @Query("projectId") projectId?: string,
    @Query("days") days?: number
  ) {
    try {
      const result = await this.errorLogService.getErrorTrends(
        projectId,
        days || 7
      );
      return {
        success: true,
        message: "获取成功",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "获取失败",
        error: error.message,
      };
    }
  }
}
