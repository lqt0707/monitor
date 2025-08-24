import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';

/**
 * 健康检查控制器
 */
@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * 基础健康检查
   * @returns 健康状态
   */
  @Get()
  @ApiOperation({ summary: '基础健康检查' })
  @ApiResponse({ 
    status: 200, 
    description: '服务健康',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'number', example: 1640995200000 }
      }
    }
  })
  async checkHealth() {
    return await this.healthService.getSimpleHealth();
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