import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { MonitorModule } from "./modules/monitor/monitor.module";
import { HealthModule } from "./modules/health/health.module";
import { ProcessorsModule } from "./processors/processors.module";
import { ClickHouseModule } from "./modules/clickhouse/clickhouse.module";
import { ProjectConfigModule } from "./modules/project-config/project-config.module";
import { EmailModule } from "./modules/email/email.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MySQLDatabaseConfig } from "./config/database.config";
import { RedisConfigService } from "./config/redis.config";

/**
 * 应用根模块
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

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
    ProjectConfigModule,
    EmailModule,
  ],
})
export class AppModule {}
