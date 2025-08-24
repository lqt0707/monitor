import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { ClickHouseModule } from "../clickhouse/clickhouse.module";
import { MonitorData } from "../monitor/entities/monitor-data.entity";

/**
 * 健康检查模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([MonitorData]), ClickHouseModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
