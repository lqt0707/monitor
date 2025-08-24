import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PerformanceMetricService } from '../services/performance-metric.service';
import { CreatePerformanceMetricDto, BatchCreatePerformanceMetricDto } from '../dto/create-performance-metric.dto';
import { QueryPerformanceMetricDto } from '../dto/query-performance-metric.dto';

/**
 * 性能指标控制器
 */
@ApiTags('性能监控')
@Controller('performance-metrics')
export class PerformanceMetricController {
  constructor(private readonly performanceMetricService: PerformanceMetricService) {}

  /**
   * 上报性能指标
   * @param createDto 性能指标数据
   * @returns 上报结果
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '上报性能指标' })
  @ApiResponse({ status: 201, description: '上报成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() createDto: CreatePerformanceMetricDto) {
    try {
      const result = await this.performanceMetricService.create(createDto);
      return {
        success: true,
        message: '性能指标上报成功',
        data: { id: result.id },
      };
    } catch (error) {
      return {
        success: false,
        message: '性能指标上报失败',
        error: error.message,
      };
    }
  }

  /**
   * 批量上报性能指标
   * @param batchDto 批量性能指标数据
   * @returns 上报结果
   */
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量上报性能指标' })
  @ApiResponse({ status: 201, description: '批量上报成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async createBatch(@Body() batchDto: BatchCreatePerformanceMetricDto) {
    try {
      const results = await this.performanceMetricService.createBatch(batchDto);
      return {
        success: true,
        message: '性能指标批量上报成功',
        data: { count: results.length },
      };
    } catch (error) {
      return {
        success: false,
        message: '性能指标批量上报失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取性能指标列表
   * @param queryDto 查询参数
   * @returns 性能指标列表
   */
  @Get()
  @ApiOperation({ summary: '获取性能指标列表' })
  @ApiQuery({ name: 'projectId', required: false, description: '项目ID' })
  @ApiQuery({ name: 'platformCode', required: false, description: '平台代码' })
  @ApiQuery({ name: 'metricType', required: false, description: '指标类型' })
  @ApiQuery({ name: 'metricName', required: false, description: '指标名称' })
  @ApiQuery({ name: 'pageUrl', required: false, description: '页面URL' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 20 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() queryDto: QueryPerformanceMetricDto) {
    try {
      const result = await this.performanceMetricService.findAll(queryDto);
      return {
        success: true,
        message: '获取性能指标列表成功',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: '获取性能指标列表失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取性能指标详情
   * @param id 性能指标ID
   * @returns 性能指标详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取性能指标详情' })
  @ApiParam({ name: 'id', description: '性能指标ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '性能指标不存在' })
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.performanceMetricService.findOne(id);
      return {
        success: true,
        message: '获取性能指标详情成功',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: '获取性能指标详情失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取性能统计数据
   * @param projectId 项目ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 统计数据
   */
  @Get('stats/summary')
  @ApiOperation({ summary: '获取性能统计数据' })
  @ApiQuery({ name: 'projectId', required: false, description: '项目ID' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStatistics(
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const result = await this.performanceMetricService.getStatistics(
        projectId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
      return {
        success: true,
        message: '获取性能统计数据成功',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: '获取性能统计数据失败',
        error: error.message,
      };
    }
  }

  /**
   * 获取性能趋势数据
   * @param projectId 项目ID
   * @param days 天数
   * @returns 趋势数据
   */
  @Get('stats/trends')
  @ApiOperation({ summary: '获取性能趋势数据' })
  @ApiQuery({ name: 'projectId', required: false, description: '项目ID' })
  @ApiQuery({ name: 'days', required: false, description: '天数', type: 'number', example: 7 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTrends(
    @Query('projectId') projectId?: string,
    @Query('days') days?: number,
  ) {
    try {
      const result = await this.performanceMetricService.getTrends(
        projectId,
        days || 7,
      );
      return {
        success: true,
        message: '获取性能趋势数据成功',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: '获取性能趋势数据失败',
        error: error.message,
      };
    }
  }

  /**
   * 删除性能指标
   * @param id 性能指标ID
   * @returns 删除结果
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除性能指标' })
  @ApiParam({ name: 'id', description: '性能指标ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string) {
    try {
      await this.performanceMetricService.remove(id);
      return {
        success: true,
        message: '删除性能指标成功',
      };
    } catch (error) {
      return {
        success: false,
        message: '删除性能指标失败',
        error: error.message,
      };
    }
  }

  /**
   * 清理过期数据
   * @param days 保留天数
   * @returns 清理结果
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '清理过期性能数据' })
  @ApiQuery({ name: 'days', required: false, description: '保留天数', type: 'number', example: 30 })
  @ApiResponse({ status: 200, description: '清理成功' })
  async cleanup(@Query('days') days?: number) {
    try {
      const result = await this.performanceMetricService.cleanupExpiredData(days || 30);
      return {
        success: true,
        message: `清理过期性能数据成功，清理了 ${result.affected} 条记录`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: '清理过期性能数据失败',
        error: error.message,
      };
    }
  }
}