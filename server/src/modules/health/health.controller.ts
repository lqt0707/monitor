import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';

/**
 * 健康检查控制器
 */
@ApiTags('健康检查')
@Controller(['health', 'api/health'])
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * 基础健康检查
   * 用于Docker健康检查和系统状态监控
   * @returns 健康状态
   */
  @Get()
  @ApiOperation({ summary: '基础健康检查', description: '用于Docker健康检查和系统状态监控' })
  @ApiResponse({ 
    status: 200, 
    description: '服务健康',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        service: { type: 'string', example: 'monitor-server' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: '服务不可用'
  })
  async checkHealth() {
    const health = await this.healthService.getSimpleHealth();
    return {
      status: health.status === 'healthy' ? 'ok' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'monitor-server',
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  /**
   * 详细健康检查
   * @returns 详细健康状态
   */
  @Get('detailed')
  @ApiOperation({ summary: '详细健康检查' })
  @ApiResponse({ 
    status: 200, 
    description: '详细健康状态',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        timestamp: { type: 'number' },
        uptime: { type: 'number' },
        version: { type: 'string' },
        services: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                responseTime: { type: 'number' }
              }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            totalErrors: { type: 'number' },
            errorRate: { type: 'number' },
            avgResponseTime: { type: 'number' }
          }
        }
      }
    }
  })
  async checkDetailedHealth(): Promise<HealthCheckResult> {
    return await this.healthService.checkHealth();
  }

  /**
   * 系统信息
   * @returns 系统信息
   */
  @Get('system')
  @ApiOperation({ summary: '获取系统信息' })
  @ApiResponse({ 
    status: 200, 
    description: '系统信息',
    schema: {
      type: 'object',
      properties: {
        node: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            uptime: { type: 'number' },
            platform: { type: 'string' },
            arch: { type: 'string' }
          }
        },
        memory: {
          type: 'object',
          properties: {
            rss: { type: 'number' },
            heapTotal: { type: 'number' },
            heapUsed: { type: 'number' },
            external: { type: 'number' }
          }
        },
        cpu: {
          type: 'object',
          properties: {
            user: { type: 'number' },
            system: { type: 'number' }
          }
        },
        env: { type: 'string' },
        pid: { type: 'number' }
      }
    }
  })
  getSystemInfo() {
    return this.healthService.getSystemInfo();
  }

  /**
   * 存活检查
   * @returns 存活状态
   */
  @Get('liveness')
  @ApiOperation({ summary: '存活检查' })
  @ApiResponse({ 
    status: 200, 
    description: '服务存活',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'alive' },
        timestamp: { type: 'number' }
      }
    }
  })
  checkLiveness() {
    return {
      status: 'alive',
      timestamp: Date.now(),
    };
  }

  /**
   * 就绪检查
   * @returns 就绪状态
   */
  @Get('readiness')
  @ApiOperation({ summary: '就绪检查' })
  @ApiResponse({ 
    status: 200, 
    description: '服务就绪',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ready' },
        timestamp: { type: 'number' }
      }
    }
  })
  async checkReadiness() {
    const health = await this.healthService.getSimpleHealth();
    return {
      status: health.status === 'healthy' ? 'ready' : 'not_ready',
      timestamp: health.timestamp,
    };
  }
}