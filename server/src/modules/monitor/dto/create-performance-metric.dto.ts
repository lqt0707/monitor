import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsObject, 
  IsNotEmpty, 
  MaxLength,
  IsInt,
  Min,
  Max
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 性能指标类型枚举
 */
export enum PerformanceMetricType {
  PAGE_LOAD = 'page_load',
  API_RESPONSE = 'api_response',
  RESOURCE_LOAD = 'resource_load',
  USER_INTERACTION = 'user_interaction',
  MEMORY_USAGE = 'memory_usage',
  CUSTOM = 'custom',
}

/**
 * 创建性能指标DTO
 */
export class CreatePerformanceMetricDto {
  /**
   * 项目ID
   */
  @ApiProperty({ description: '项目ID', example: 'my-app' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  projectId: string;

  /**
   * 平台代码
   */
  @ApiProperty({ description: '平台代码', example: 'weapp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  platformCode: string;

  /**
   * 会话ID
   */
  @ApiPropertyOptional({ description: '会话ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;

  /**
   * 用户ID
   */
  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  userId?: string;

  /**
   * 指标类型
   */
  @ApiProperty({ 
    description: '指标类型', 
    enum: PerformanceMetricType,
    example: PerformanceMetricType.PAGE_LOAD 
  })
  @IsEnum(PerformanceMetricType)
  metricType: PerformanceMetricType;

  /**
   * 指标名称
   */
  @ApiProperty({ 
    description: '指标名称', 
    example: 'page_load_time',
    examples: {
      pageLoad: { value: 'page_load_time', description: '页面加载时间' },
      apiResponse: { value: 'api_response_time', description: 'API响应时间' },
      memoryUsage: { value: 'memory_usage', description: '内存使用' },
    }
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  metricName: string;

  // ========== 页面信息 ==========

  /**
   * 页面URL
   */
  @ApiPropertyOptional({ description: '页面URL', example: '/pages/index/index' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  pageUrl?: string;

  /**
   * 页面标题
   */
  @ApiPropertyOptional({ description: '页面标题' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pageTitle?: string;

  // ========== 核心性能指标 ==========

  /**
   * First Contentful Paint (FCP)
   */
  @ApiPropertyOptional({ 
    description: 'First Contentful Paint 首次内容绘制时间（毫秒）',
    example: 1200
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  fcp?: number;

  /**
   * Largest Contentful Paint (LCP)
   */
  @ApiPropertyOptional({ 
    description: 'Largest Contentful Paint 最大内容绘制时间（毫秒）',
    example: 2500
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lcp?: number;

  /**
   * First Input Delay (FID)
   */
  @ApiPropertyOptional({ 
    description: 'First Input Delay 首次输入延迟（毫秒）',
    example: 100
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  fid?: number;

  /**
   * Cumulative Layout Shift (CLS)
   */
  @ApiPropertyOptional({ 
    description: 'Cumulative Layout Shift 累积布局偏移',
    example: 0.1
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  cls?: number;

  /**
   * Time to First Byte (TTFB)
   */
  @ApiPropertyOptional({ 
    description: 'Time to First Byte 首字节时间（毫秒）',
    example: 500
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ttfb?: number;

  // ========== 页面加载性能 ==========

  /**
   * DOM Ready 时间
   */
  @ApiPropertyOptional({ description: 'DOM Ready时间（毫秒）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  domReady?: number;

  /**
   * 完整页面加载时间
   */
  @ApiPropertyOptional({ description: '完整页面加载时间（毫秒）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  loadComplete?: number;

  /**
   * 白屏时间
   */
  @ApiPropertyOptional({ description: '白屏时间（毫秒）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  firstPaint?: number;

  // ========== 资源加载性能 ==========

  /**
   * DNS解析时间
   */
  @ApiPropertyOptional({ description: 'DNS解析时间（毫秒）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  dnsLookup?: number;

  /**
   * TCP连接时间
   */
  @ApiPropertyOptional({ description: 'TCP连接时间（毫秒）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  tcpConnect?: number;

  /**
   * SSL握手时间
   */
  @ApiPropertyOptional({ description: 'SSL握手时间（毫秒）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sslConnect?: number;

  /**
   * 请求响应时间
   */
  @ApiPropertyOptional({ description: '请求响应时间（毫秒）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  responseTime?: number;

  // ========== API性能 ==========

  /**
   * API URL
   */
  @ApiPropertyOptional({ description: 'API URL' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  apiUrl?: string;

  /**
   * HTTP方法
   */
  @ApiPropertyOptional({ description: 'HTTP方法', example: 'GET' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  httpMethod?: string;

  /**
   * 响应状态码
   */
  @ApiPropertyOptional({ description: '响应状态码', example: 200 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  statusCode?: number;

  /**
   * 请求大小
   */
  @ApiPropertyOptional({ description: '请求大小（字节）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  requestSize?: number;

  /**
   * 响应大小
   */
  @ApiPropertyOptional({ description: '响应大小（字节）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  responseSize?: number;

  // ========== 内存性能 ==========

  /**
   * 已使用内存
   */
  @ApiPropertyOptional({ description: '已使用内存（MB）' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  memoryUsed?: number;

  /**
   * 总内存
   */
  @ApiPropertyOptional({ description: '总内存（MB）' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  memoryTotal?: number;

  /**
   * 内存使用率
   */
  @ApiPropertyOptional({ description: '内存使用率（%）' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  memoryUsagePercent?: number;

  // ========== 环境信息 ==========

  /**
   * 设备信息
   */
  @ApiPropertyOptional({ 
    description: '设备信息对象',
    example: {
      brand: 'iPhone',
      model: 'iPhone 12',
      system: 'iOS 15.0'
    }
  })
  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, any>;

  /**
   * 网络信息
   */
  @ApiPropertyOptional({ 
    description: '网络信息对象',
    example: {
      type: 'wifi',
      downlink: 10,
      effectiveType: '4g'
    }
  })
  @IsOptional()
  @IsObject()
  networkInfo?: Record<string, any>;

  /**
   * 用户代理
   */
  @ApiPropertyOptional({ description: '用户代理' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  // ========== 自定义数据 ==========

  /**
   * 自定义指标数据
   */
  @ApiPropertyOptional({ 
    description: '自定义指标数据对象',
    example: {
      customMetric1: 123.45,
      customMetric2: 'value'
    }
  })
  @IsOptional()
  @IsObject()
  customMetrics?: Record<string, any>;

  /**
   * 扩展数据
   */
  @ApiPropertyOptional({ 
    description: '扩展数据对象',
    example: {
      environment: 'production',
      feature: 'new-ui'
    }
  })
  @IsOptional()
  @IsObject()
  extraData?: Record<string, any>;

  // ========== 时间戳 ==========

  /**
   * 指标发生时间戳（毫秒）
   */
  @ApiProperty({ 
    description: '指标发生时间戳（毫秒）', 
    example: 1640995200000 
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  metricTimestamp: number;
}

/**
 * 批量创建性能指标DTO
 */
export class BatchCreatePerformanceMetricDto {
  /**
   * 性能指标列表
   */
  @ApiProperty({ 
    description: '性能指标列表',
    type: [CreatePerformanceMetricDto]
  })
  @IsNotEmpty()
  metrics: CreatePerformanceMetricDto[];
}