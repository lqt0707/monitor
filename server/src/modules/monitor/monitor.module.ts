import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
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
import { QUEUE_NAMES, QUEUE_OPTIONS } from "../../config/queue.config";
import { QueueService } from "./services/queue.service";
import { MonitorProcessingProcessor } from "./processors/monitor-processing.processor";

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
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.MONITOR_PROCESSING,
        ...QUEUE_OPTIONS[QUEUE_NAMES.MONITOR_PROCESSING],
      },
    ),
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
    QueueService,
  ],
  exports: [
    MonitorService,
    ErrorLogService,
    ErrorAggregationService,
    PerformanceMetricService,
    QueueService,
  ],
})
export class MonitorModule {}
