import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MonitorController } from "./monitor.controller";
import { MonitorService } from "./monitor.service";
import { ErrorLogController } from "./error-log.controller";
import { ErrorLogService } from "./error-log.service";
import { ErrorAggregationController } from "./error-aggregation.controller";
import { ErrorAggregationService } from "./error-aggregation.service";
import { PerformanceMetricController } from "./controllers/performance-metric.controller";
import { PerformanceMetricService } from "./services/performance-metric.service";
import { MonitorData } from "./entities/monitor-data.entity";
import { ErrorLog } from "./entities/error-log.entity";
import { ErrorAggregation } from "./entities/error-aggregation.entity";
import { PerformanceMetric } from "./entities/performance-metric.entity";
import { ServicesModule } from "../../services/services.module";
import { ClickHouseModule } from "../clickhouse/clickhouse.module";

/**
 * 监控模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MonitorData,
      ErrorLog,
      ErrorAggregation,
      PerformanceMetric,
    ]),
    ServicesModule,
    ClickHouseModule,
  ],
  controllers: [
    MonitorController,
    ErrorLogController,
    ErrorAggregationController,
    PerformanceMetricController,
  ],
  providers: [
    MonitorService,
    ErrorLogService,
    ErrorAggregationService,
    PerformanceMetricService,
  ],
  exports: [
    MonitorService,
    ErrorLogService,
    ErrorAggregationService,
    PerformanceMetricService,
  ],
})
export class MonitorModule {}
