import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsObject, 
  IsNotEmpty, 
  MaxLength,
  IsInt,
  Min 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 事件类型枚举
 */
export enum EventType {
  ERROR = 'error',
  PERFORMANCE = 'performance',
  USER_ACTION = 'user_action',
  NETWORK = 'network',
  CUSTOM = 'custom',
}

/**
 * 创建监控事件DTO
 * 统一的多平台事件上报格式
 */
export class CreateMonitorEventDto {
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
   * 事件类型
   */
  @ApiProperty({ 
    description: '事件类型', 
    enum: EventType,
    example: EventType.ERROR 
  })
  @IsEnum(EventType)
  eventType: EventType;

  /**
   * 事件子类型
   */
  @ApiProperty({ 
    description: '事件子类型', 
    example: 'jsError',
    examples: {
      error: { value: 'jsError', description: 'JS错误' },
      performance: { value: 'pageLoad', description: '页面加载' },
      network: { value: 'httpError', description: 'HTTP错误' },
    }
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  eventSubtype: string;

  // ========== 会话信息 ==========

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
   * 设备ID
   */
  @ApiPropertyOptional({ description: '设备ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;

  // ========== 上下文信息 ==========

  /**
   * 页面URL
   */
  @ApiPropertyOptional({ description: '页面URL', example: '/pages/index/index' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  pageUrl?: string;

  /**
   * 来源页面
   */
  @ApiPropertyOptional({ description: '来源页面URL' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  referrerUrl?: string;

  /**
   * 用户代理
   */
  @ApiPropertyOptional({ description: '用户代理' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  // ========== 环境信息 ==========

  /**
   * 应用版本
   */
  @ApiPropertyOptional({ description: '应用版本', example: '1.0.0' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;

  /**
   * SDK版本
   */
  @ApiPropertyOptional({ description: 'SDK版本', example: '1.0.2' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sdkVersion?: string;

  /**
   * 框架版本
   */
  @ApiPropertyOptional({ description: '框架版本', example: 'Taro 3.6.0' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  frameworkVersion?: string;

  // ========== 设备和网络信息 ==========

  /**
   * 设备信息
   */
  @ApiPropertyOptional({ 
    description: '设备信息对象',
    example: {
      brand: 'iPhone',
      model: 'iPhone 12',
      system: 'iOS 15.0',
      platform: 'ios'
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

  // ========== 地理位置 ==========

  /**
   * 国家代码
   */
  @ApiPropertyOptional({ description: '国家代码', example: 'CN' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  /**
   * 地区
   */
  @ApiPropertyOptional({ description: '地区', example: '北京市' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  /**
   * 城市
   */
  @ApiPropertyOptional({ description: '城市', example: '北京市' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  // ========== 事件数据 ==========

  /**
   * 事件具体数据
   */
  @ApiProperty({ 
    description: '事件具体数据对象',
    example: {
      errorMessage: 'TypeError: Cannot read property',
      errorStack: 'at Object.fn (app.js:123:45)',
      severity: 'error'
    }
  })
  @IsObject()
  @IsNotEmpty()
  eventData: Record<string, any>;

  /**
   * 扩展数据
   */
  @ApiPropertyOptional({ 
    description: '扩展数据对象',
    example: {
      customTags: ['frontend', 'critical'],
      environment: 'production'
    }
  })
  @IsOptional()
  @IsObject()
  extraData?: Record<string, any>;

  // ========== 时间戳 ==========

  /**
   * 事件发生时间戳（毫秒）
   */
  @ApiProperty({ 
    description: '事件发生时间戳（毫秒）', 
    example: 1640995200000 
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  eventTimestamp: number;
}

/**
 * 批量创建监控事件DTO
 */
export class BatchCreateMonitorEventDto {
  /**
   * 事件列表
   */
  @ApiProperty({ 
    description: '事件列表',
    type: [CreateMonitorEventDto]
  })
  @IsNotEmpty()
  events: CreateMonitorEventDto[];
}