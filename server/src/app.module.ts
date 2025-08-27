import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { MonitorModule } from "./modules/monitor/monitor.module";
import { HealthModule } from "./modules/health/health.module";
import { ProcessorsModule } from "./processors/processors.module";
import { ClickHouseModule } from "./modules/clickhouse/clickhouse.module";
import { ClickHousePerformanceModule } from "./modules/clickhouse/clickhouse-performance.module";
import { ProjectConfigModule } from "./modules/project-config/project-config.module";
import { EmailModule } from "./modules/email/email.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SourcemapModule } from "./modules/sourcemap/sourcemap.module";
import { AlertModule } from "./modules/alert/alert.module";
import { LoggingModule } from "./modules/logging/logging.module";
import { AiDiagnosisModule } from "./modules/ai-diagnosis/ai-diagnosis.module";
import { DeepSeekModule } from "./modules/deepseek/deepseek.module";
import { MySQLDatabaseConfig } from "./config/database.config";
import { RedisConfigService } from "./config/redis.config";
import { ConfigModule } from "./common/config/config.module";

/**
 * 应用根模块
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule,

    // 数据库模块
    TypeOrmModule.forRootAsync({
      useClass: MySQLDatabaseConfig,
    }),

    // Redis和队列模块
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    }),

    // 业务模块
    AuthModule,
    MonitorModule,
    HealthModule,
    ProcessorsModule,
    ClickHouseModule,
    ClickHousePerformanceModule,
    ProjectConfigModule,
    EmailModule,
    SourcemapModule,
    AlertModule,
    LoggingModule,
    AiDiagnosisModule,
    DeepSeekModule,
  ],
})
export class AppModule {}
