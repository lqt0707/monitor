import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthService } from "./health.service";

/**
 * 健康检查控制器
 */
@ApiTags("健康检查")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * 健康检查
   * @returns 健康状态
   */
  @Get()
  @ApiOperation({ summary: "健康检查" })
  @ApiResponse({ status: 200, description: "服务正常" })
  async checkHealth() {
    return this.healthService.checkHealth();
  }

  /**
   * 数据库连接检查
   * @returns 数据库连接状态
   */
  @Get("database")
  @ApiOperation({ summary: "数据库连接检查" })
  @ApiResponse({ status: 200, description: "数据库连接正常" })
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }
}
