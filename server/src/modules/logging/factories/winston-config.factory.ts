import { Injectable, Inject } from '@nestjs/common';
import { WinstonModuleOptions, WinstonModuleOptionsFactory } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { LoggingConfig } from '../interfaces/logging-config.interface';

/**
 * Winston配置工厂
 * 负责创建winston日志配置
 */
@Injectable()
export class WinstonConfigFactory implements WinstonModuleOptionsFactory {
  constructor(
    @Inject('LOGGING_CONFIG') private readonly config: LoggingConfig
  ) {}

  /**
   * 创建Winston模块选项
   */
  createWinstonModuleOptions(): WinstonModuleOptions {
    const transports: winston.transport[] = [];

    // 控制台传输器
    if (this.config.consoleEnabled) {
      transports.push(this.createConsoleTransport());
    }

    // 文件传输器
    if (this.config.fileEnabled) {
      transports.push(this.createFileTransport());
    }

    return {
      level: this.config.level || 'info',
      format: this.createFormat(),
      transports,
      exitOnError: false
    };
  }

  /**
   * 创建控制台传输器
   */
  private createConsoleTransport(): winston.transport {
    return new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const contextPart = context ? ` [${context}]` : '';
          const metaPart = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}]${contextPart} ${level}: ${message}${metaPart}`;
        })
      )
    });
  }

  /**
   * 创建文件传输器
   */
  private createFileTransport(): winston.transport {
    return new winston.transports.DailyRotateFile({
      filename: `${this.config.fileDir || './logs'}/application-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: this.config.maxFileSize || '20m',
      maxFiles: this.config.maxFiles || '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    });
  }

  /**
   * 创建日志格式
   */
  private createFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );
  }

  /**
   * 创建错误文件传输器
   */
  private createErrorFileTransport(): winston.transport {
    return new winston.transports.DailyRotateFile({
      filename: `${this.config.fileDir || './logs'}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: this.config.maxFileSize || '20m',
      maxFiles: this.config.maxFiles || '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    });
  }

  /**
   * 创建HTTP请求日志传输器
   */
  private createHttpTransport(): winston.transport {
    return new winston.transports.DailyRotateFile({
      filename: `${this.config.fileDir || './logs'}/http-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      zippedArchive: true,
      maxSize: this.config.maxFileSize || '20m',
      maxFiles: this.config.maxFiles || '7d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    });
  }
}