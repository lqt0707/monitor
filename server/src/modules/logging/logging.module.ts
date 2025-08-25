import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { WinstonModule } from "nest-winston";
import { Log } from "./entities/log.entity";
import { FileLoggerService } from "./services/file-logger.service";
import { DatabaseLoggerService } from "./services/database-logger.service";
import { LoggingService } from "./services/logging.service";
import { LoggingConfigService } from "./services/logging-config.service";
import { WinstonLoggerService } from "./services/winston-logger.service";
import { WinstonConfigFactory } from "./factories/winston-config.factory";
import { LoggingController } from "./controllers/logging.controller";
import { LogCleanupService } from "./services/log-cleanup.service";
import { LogPerformanceService } from "./services/log-performance.service";

/**
 * 日志模块
 * 提供完整的日志记录和管理功能
 * 集成nest-winston提供更强大的日志功能
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Log]),
    ScheduleModule.forRoot(),
    ConfigModule,
    WinstonModule.forRoot({
      level: "info",
      format: require("winston").format.combine(
        require("winston").format.timestamp(),
        require("winston").format.errors({ stack: true }),
        require("winston").format.json()
      ),
      transports: [
        new (require("winston").transports.Console)({
          format: require("winston").format.combine(
            require("winston").format.colorize(),
            require("winston").format.timestamp(),
            require("winston").format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                const contextPart = context ? ` [${context}]` : "";
                const metaPart =
                  Object.keys(meta).length > 0
                    ? ` ${JSON.stringify(meta)}`
                    : "";
                return `[${timestamp}]${contextPart} ${level}: ${message}${metaPart}`;
              }
            )
          ),
        }),
        new (require("winston-daily-rotate-file"))({
          filename: "./logs/application-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          format: require("winston").format.combine(
            require("winston").format.timestamp(),
            require("winston").format.json()
          ),
        }),
      ],
      exitOnError: false,
    }),
  ],
  controllers: [LoggingController],
  providers: [
    LoggingConfigService,
    {
      provide: "LOGGING_CONFIG",
      useFactory: (configService: LoggingConfigService) =>
        configService.getConfig(),
      inject: [LoggingConfigService],
    },
    LoggingService,
    LogCleanupService,
    LogPerformanceService,
    FileLoggerService,
    DatabaseLoggerService,
    WinstonLoggerService,
    {
      provide: "WINSTON_LOGGER",
      useExisting: WinstonLoggerService,
    },
  ],
  exports: [
    LoggingService,
    WinstonLoggerService,
    FileLoggerService,
    DatabaseLoggerService,
    "WINSTON_LOGGER",
  ],
})
export class LoggingModule {}
