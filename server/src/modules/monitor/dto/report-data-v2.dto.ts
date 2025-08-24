import { IsString, IsOptional, IsNumber, IsObject, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 监控数据上报DTO (V2版本)
 * 兼容原有格式，增加多平台支持
 */
export class ReportDataV2Dto {
  /**
   * 项目ID
   */
  @ApiProperty({ description: '项目ID', example: 'taro-wechat-mini' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  /**
   * 平台代码（新增）
   */
  @ApiPropertyOptional({ 
    description: '平台代码', 
    example: 'weapp',
    default: 'web'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  platformCode?: string = 'web';

  /**
   * 数据类型
   */
  @ApiProperty({ 
    description: '数据类型', 
    example: 'jsError',
    enum: ['jsError', 'reqError', 'slowHttpRequest', 'performanceInfoReady', 'unHandleRejection', 'custom']
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  // ========== 会话和用户信息 ==========

  /**
   * 会话ID（新增）
   */
  @ApiPropertyOptional({ description: '会话ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  /**
   * 用户ID
   */
  @ApiPropertyOptional({ description: '用户ID', example: 'user_123' })
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * 设备ID（新增）
   */
  @ApiPropertyOptional({ description: '设备ID' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  // ========== 错误信息 ==========

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

  // ========== 页面信息 ==========

  /**
   * 页面URL
   */
  @ApiPropertyOptional({ description: '页面URL', example: '/pages/index/index' })
  @IsString()
  @IsOptional()
  pageUrl?: string;

  /**
   * 来源页面（新增）
   */
  @ApiPropertyOptional({ description: '来源页面URL' })
  @IsOptional()
  @IsString()
  referrerUrl?: string;

  // ========== 环境信息 ==========

  /**
   * 用户代理
   */
  @ApiPropertyOptional({ description: '用户代理' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  /**
   * 应用版本（新增）
   */
  @ApiPropertyOptional({ description: '应用版本' })
  @IsOptional()
  @IsString()
  appVersion?: string;

  /**
   * SDK版本（新增）
   */
  @ApiPropertyOptional({ description: 'SDK版本' })
  @IsOptional()
  @IsString()
  sdkVersion?: string;

  /**
   * 框架版本（新增）
   */
  @ApiPropertyOptional({ description: '框架版本' })
  @IsOptional()
  @IsString()
  frameworkVersion?: string;

  // ========== 设备和网络信息 ==========

  /**
   * 设备信息（兼容字符串和对象）
   */
  @ApiPropertyOptional({ 
    description: '设备信息（JSON字符串或对象）',
    oneOf: [
      { type: 'string', description: 'JSON字符串格式（兼容旧版）' },
      { type: 'object', description: '对象格式（推荐）' }
    ]
  })
  @IsOptional()
  deviceInfo?: string | Record<string, any>;

  /**
   * 网络信息（兼容字符串和对象）
   */
  @ApiPropertyOptional({ 
    description: '网络信息（JSON字符串或对象）',
    oneOf: [
      { type: 'string', description: 'JSON字符串格式（兼容旧版）' },
      { type: 'object', description: '对象格式（推荐）' }
    ]
  })
  @IsOptional()
  networkInfo?: string | Record<string, any>;

  /**
   * 性能数据（兼容字符串和对象）
   */
  @ApiPropertyOptional({ 
    description: '性能数据（JSON字符串或对象）',
    oneOf: [
      { type: 'string', description: 'JSON字符串格式（兼容旧版）' },
      { type: 'object', description: '对象格式（推荐）' }
    ]
  })
  @IsOptional()
  performanceData?: string | Record<string, any>;

  // ========== 网络请求信息 ==========

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

  // ========== 地理位置（新增） ==========

  /**
   * 国家代码
   */
  @ApiPropertyOptional({ description: '国家代码', example: 'CN' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  /**
   * 地区
   */
  @ApiPropertyOptional({ description: '地区' })
  @IsOptional()
  @IsString()
  region?: string;

  /**
   * 城市
   */
  @ApiPropertyOptional({ description: '城市' })
  @IsOptional()
  @IsString()
  city?: string;

  // ========== 扩展数据 ==========

  /**
   * 额外数据（兼容字符串和对象）
   */
  @ApiPropertyOptional({ 
    description: '额外数据（JSON字符串或对象）',
    oneOf: [
      { type: 'string', description: 'JSON字符串格式（兼容旧版）' },
      { type: 'object', description: '对象格式（推荐）' }
    ]
  })
  @IsOptional()
  extraData?: string | Record<string, any>;

  // ========== 时间戳（新增） ==========

  /**
   * 事件时间戳
   */
  @ApiPropertyOptional({ 
    description: '事件发生时间戳（毫秒）',
    example: 1640995200000
  })
  @IsOptional()
  @IsNumber()
  eventTimestamp?: number;
}