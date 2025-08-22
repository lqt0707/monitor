import { IsString, IsOptional, IsNumber, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 监控数据上报DTO
 */
export class ReportDataDto {
  /**
   * 项目ID
   */
  @ApiProperty({ description: '项目ID', example: 'taro-wechat-mini' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  /**
   * 数据类型
   */
  @ApiProperty({ 
    description: '数据类型', 
    example: 'jsError',
    enum: ['jsError', 'reqError', 'slowHttpRequest', 'performanceInfoReady', 'unHandleRejection']
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * 错误消息
   */
  @ApiPropertyOptional({ description: '错误消息', example: 'TypeError: Cannot read property of undefined' })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  /**
   * 错误堆栈
   */
  @ApiPropertyOptional({ description: '错误堆栈' })
  @IsString()
  @IsOptional()
  errorStack?: string;

  /**
   * 页面URL
   */
  @ApiPropertyOptional({ description: '页面URL', example: '/pages/index/index' })
  @IsString()
  @IsOptional()
  pageUrl?: string;

  /**
   * 用户ID
   */
  @ApiPropertyOptional({ description: '用户ID', example: 'user_123' })
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * 用户代理
   */
  @ApiPropertyOptional({ description: '用户代理' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  /**
   * 设备信息
   */
  @ApiPropertyOptional({ description: '设备信息（JSON字符串）' })
  @IsString()
  @IsOptional()
  deviceInfo?: string;

  /**
   * 网络信息
   */
  @ApiPropertyOptional({ description: '网络信息（JSON字符串）' })
  @IsString()
  @IsOptional()
  networkInfo?: string;

  /**
   * 性能数据
   */
  @ApiPropertyOptional({ description: '性能数据（JSON字符串）' })
  @IsString()
  @IsOptional()
  performanceData?: string;

  /**
   * 请求URL
   */
  @ApiPropertyOptional({ description: '请求URL', example: 'https://api.example.com/data' })
  @IsString()
  @IsOptional()
  requestUrl?: string;

  /**
   * 请求方法
   */
  @ApiPropertyOptional({ description: '请求方法', example: 'GET' })
  @IsString()
  @IsOptional()
  requestMethod?: string;

  /**
   * 响应状态码
   */
  @ApiPropertyOptional({ description: '响应状态码', example: 500 })
  @IsNumber()
  @IsOptional()
  responseStatus?: number;

  /**
   * 请求耗时
   */
  @ApiPropertyOptional({ description: '请求耗时（毫秒）', example: 5000 })
  @IsNumber()
  @IsOptional()
  duration?: number;

  /**
   * 额外数据
   */
  @ApiPropertyOptional({ description: '额外数据（JSON字符串）' })
  @IsString()
  @IsOptional()
  extraData?: string;
}