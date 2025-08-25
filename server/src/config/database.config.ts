import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
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

/**
 * MySQL数据库配置（存储元数据）
 */
@Injectable()
export class MySQLDatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  /**
   * 创建MySQL TypeORM配置选项
   * @returns MySQL TypeORM配置
   */
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      name: "mysql",
      type: "mysql",
      host: this.configService.get<string>("MYSQL_HOST", "localhost"),
      port: this.configService.get<number>("MYSQL_PORT", 3306),
      username: this.configService.get<string>("MYSQL_USERNAME", "root"),
      password: this.configService.get<string>("MYSQL_PASSWORD", ""),
      database: this.configService.get<string>("MYSQL_DATABASE", "monitor"),
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
      synchronize: this.configService.get<boolean>("MYSQL_SYNCHRONIZE", false),
      logging: this.configService.get<boolean>("MYSQL_LOGGING", false),
      migrations: ["dist/database/migrations/mysql/*.js"],
      migrationsRun: false,
      charset: "utf8mb4",
      timezone: "+08:00",
    };
  }
}

/**
 * ClickHouse配置（存储海量日志数据）
 */
@Injectable()
export class ClickHouseConfig {
  constructor(private configService: ConfigService) {}

  /**
   * 获取ClickHouse客户端配置
   * @returns ClickHouse配置
   */
  getClickHouseConfig() {
    return {
      host: `http://${this.configService.get<string>(
        "CLICKHOUSE_HOST",
        "localhost"
      )}:${this.configService.get<string>("CLICKHOUSE_PORT", "8123")}`,
      username: this.configService.get<string>(
        "CLICKHOUSE_USERNAME",
        "default"
      ),
      password: this.configService.get<string>("CLICKHOUSE_PASSWORD", ""),
      database: this.configService.get<string>(
        "CLICKHOUSE_DATABASE",
        "monitor_logs"
      ),
    };
  }
}
