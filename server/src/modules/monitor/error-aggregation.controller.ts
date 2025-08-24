import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { ErrorAggregationService } from "./error-aggregation.service";
import { QueryErrorAggregationDto } from "./dto/query-error-aggregation.dto";
import { UpdateErrorAggregationDto } from "./dto/update-error-aggregation.dto";

/**
 * 错误聚合控制器
 */
@ApiTags("错误聚合")
@Controller("error-aggregations")
export class ErrorAggregationController {
  constructor(
    private readonly errorAggregationService: ErrorAggregationService
  ) {}

  /**
   * 查询错误聚合列表
   * @param queryDto 查询参数
   * @returns 错误聚合列表
   */
  @Get()
  @ApiOperation({ summary: "查询错误聚合列表" })
  @ApiResponse({ status: 200, description: "查询成功" })
  async getErrorAggregations(@Query() queryDto: QueryErrorAggregationDto) {
    try {
      const result =
        await this.errorAggregationService.findErrorAggregations(queryDto);
      return {
        success: true,
        message: "查询成功",
        data: result,
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
   * 获取错误聚合详情
   * @param id 错误聚合ID
   * @returns 错误聚合详情
   */
  @Get(":id")
  @ApiOperation({ summary: "获取错误聚合详情" })
  @ApiParam({ name: "id", description: "错误聚合ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 404, description: "错误聚合不存在" })
  async getErrorAggregation(@Param("id") id: string) {
    try {
      const result =
        await this.errorAggregationService.findErrorAggregationById(
          parseInt(id)
        );
      if (!result) {
        return {
          success: false,
          message: "错误聚合不存在",
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
   * 更新错误聚合状态
   * @param id 错误聚合ID
   * @param updateDto 更新数据
   * @returns 更新结果
   */
  @Put(":id")
  @ApiOperation({ summary: "更新错误聚合状态" })
  @ApiParam({ name: "id", description: "错误聚合ID" })
  @ApiResponse({ status: 200, description: "更新成功" })
  @ApiResponse({ status: 404, description: "错误聚合不存在" })
  async updateErrorAggregation(
    @Param("id") id: string,
    @Body() updateDto: UpdateErrorAggregationDto
  ) {
    try {
      const result = await this.errorAggregationService.updateErrorAggregation(
        parseInt(id),
        updateDto
      );
      return {
        success: true,
        message: "更新成功",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "更新失败",
        error: error.message,
      };
    }
  }

  /**
   * 删除错误聚合
   * @param id 错误聚合ID
   * @returns 删除结果
   */
  @Delete(":id")
  @ApiOperation({ summary: "删除错误聚合" })
  @ApiParam({ name: "id", description: "错误聚合ID" })
  @ApiResponse({ status: 200, description: "删除成功" })
  @ApiResponse({ status: 404, description: "错误聚合不存在" })
  async deleteErrorAggregation(@Param("id") id: string) {
    try {
      await this.errorAggregationService.deleteErrorAggregation(parseInt(id));
      return {
        success: true,
        message: "删除成功",
      };
    } catch (error) {
      return {
        success: false,
        message: "删除失败",
        error: error.message,
      };
    }
  }

  /**
   * 获取错误聚合统计信息
   * @param projectId 项目ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 统计信息
   */
  @Get("stats/summary")
  @ApiOperation({ summary: "获取错误聚合统计信息" })
  @ApiQuery({ name: "projectId", required: false, description: "项目ID" })
  @ApiQuery({ name: "startDate", required: false, description: "开始日期" })
  @ApiQuery({ name: "endDate", required: false, description: "结束日期" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getErrorAggregationStats(
    @Query("projectId") projectId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    try {
      const result =
        await this.errorAggregationService.getErrorAggregationStats({
          projectId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });
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
   * 触发错误聚合任务
   * @param projectId 项目ID
   * @returns 触发结果
   */
  @Post("trigger-aggregation")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "触发错误聚合任务" })
  @ApiQuery({ name: "projectId", required: true, description: "项目ID" })
  @ApiResponse({ status: 200, description: "触发成功" })
  async triggerAggregation(@Query("projectId") projectId: string) {
    try {
      await this.errorAggregationService.triggerAggregation(projectId);
      return {
        success: true,
        message: "聚合任务已触发",
      };
    } catch (error) {
      return {
        success: false,
        message: "触发失败",
        error: error.message,
      };
    }
  }

  /**
   * 重新分析错误（AI诊断）
   * @param id 错误聚合ID
   * @returns 分析结果
   */
  @Post(":id/reanalyze")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "重新分析错误（AI诊断）" })
  @ApiParam({ name: "id", description: "错误聚合ID" })
  @ApiResponse({ status: 200, description: "分析任务已触发" })
  async reanalyzeError(@Param("id") id: string) {
    try {
      await this.errorAggregationService.triggerReanalysis(parseInt(id));
      return {
        success: true,
        message: "AI诊断任务已触发",
      };
    } catch (error) {
      return {
        success: false,
        message: "触发失败",
        error: error.message,
      };
    }
  }
}
