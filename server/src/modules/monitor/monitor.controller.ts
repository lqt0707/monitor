import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { MonitorService } from "./monitor.service";
import { ReportDataDto } from "./dto/report-data.dto";

/**
 * 监控数据控制器
 */
@ApiTags("监控数据")
@Controller("monitor")
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  /**
   * 上报监控数据
   * @param reportData 监控数据
   * @returns 上报结果
   */
  @Post("report")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "上报监控数据" })
  @ApiResponse({ status: 200, description: "上报成功" })
  @ApiResponse({ status: 400, description: "参数错误" })
  async reportData(@Body() reportData: ReportDataDto) {
    try {
      const result = await this.monitorService.saveMonitorData(reportData);
      return {
        success: true,
        message: "数据上报成功",
        data: { id: result.id },
      };
    } catch (error) {
      return {
        success: false,
        message: "数据上报失败",
        error: error.message,
      };
    }
  }

  /**
   * 获取监控数据列表
   * @param projectId 项目ID
   * @param type 数据类型
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param page 页码
   * @param limit 每页数量
   * @returns 监控数据列表
   */
  @Get("data")
  @ApiOperation({ summary: "获取监控数据列表" })
  @ApiQuery({ name: "projectId", required: false, description: "项目ID" })
  @ApiQuery({ name: "type", required: false, description: "数据类型" })
  @ApiQuery({ name: "startDate", required: false, description: "开始日期" })
  @ApiQuery({ name: "endDate", required: false, description: "结束日期" })
  @ApiQuery({ name: "page", required: false, description: "页码", example: 1 })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "每页数量",
    example: 20,
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMonitorData(
    @Query("projectId") projectId?: string,
    @Query("type") type?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    try {
      const pageNum = page ? parseInt(page) : 1;
      const limitNum = limit ? parseInt(limit) : 20;
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const result = await this.monitorService.getMonitorData(
        projectId,
        type,
        start,
        end,
        pageNum,
        limitNum
      );

      return {
        success: true,
        message: "获取数据成功",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "获取数据失败",
        error: error.message,
      };
    }
  }

  /**
   * 获取监控数据统计
   * @param projectId 项目ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 统计数据
   */
  @Get("stats")
  @ApiOperation({ summary: "获取监控数据统计" })
  @ApiQuery({ name: "projectId", required: false, description: "项目ID" })
  @ApiQuery({ name: "startDate", required: false, description: "开始日期" })
  @ApiQuery({ name: "endDate", required: false, description: "结束日期" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMonitorStats(
    @Query("projectId") projectId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const result = await this.monitorService.getMonitorStats(
        projectId,
        start,
        end
      );

      return {
        success: true,
        message: "获取统计数据成功",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "获取统计数据失败",
        error: error.message,
      };
    }
  }
}
