import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { MonitorData } from "../modules/monitor/entities/monitor-data.entity";
import { ErrorLog } from "../modules/monitor/entities/error-log.entity";
import { ErrorAggregation } from "../modules/monitor/entities/error-aggregation.entity";
import { PerformanceMetric } from "../modules/monitor/entities/performance-metric.entity";
import { ProjectConfig } from "../modules/project-config/entities/project-config.entity";
import { User } from "../modules/auth/entities/user.entity";
import { AlertRule } from "../modules/alert/entities/alert-rule.entity";
import { AlertHistory } from "../modules/alert/entities/alert-history.entity";
import { SourceCodeVersion } from "../modules/monitor/entities/source-code-version.entity";
import { SourceCodeFile } from "../modules/monitor/entities/source-code-file.entity";

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  name: "mysql",
  type: "mysql",
  host: configService.get<string>("MYSQL_HOST", "localhost"),
  port: configService.get<number>("MYSQL_PORT", 3306),
  username: configService.get<string>("MYSQL_USERNAME", "monitor"),
  password: configService.get<string>("MYSQL_PASSWORD", "monitor123"),
  database: configService.get<string>("MYSQL_DATABASE", "monitor"),
  entities: [
    MonitorData,
    ErrorLog,
    ErrorAggregation,
    PerformanceMetric,
    ProjectConfig,
    User,
    AlertRule,
    AlertHistory,
    SourceCodeVersion,
    SourceCodeFile,
  ],
  synchronize: configService.get<boolean>("MYSQL_SYNCHRONIZE", true),
  logging: configService.get<boolean>("MYSQL_LOGGING", false),
  migrations: ["dist/database/migrations/*.js"],
  migrationsRun: false,
  charset: "utf8mb4",
  timezone: "+08:00",
});
