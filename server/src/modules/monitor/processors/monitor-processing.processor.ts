import { Processor, Process } from "@nestjs/bull";
import { Job } from "bull";
import { Injectable, Logger } from "@nestjs/common";
import { QUEUE_NAMES, JOB_TYPES } from "../../../config/queue.config";
import { MonitorData } from "../entities/monitor-data.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QueueService } from "../services/queue.service";
import { ErrorLogService } from "../error-log.service";
import {
  CreateErrorLogDto,
  ErrorType,
  ErrorLevel,
} from "../dto/create-error-log.dto";
import { SourcemapResolverService } from "../services/sourcemap-resolver.service";

/**
 * 监控数据处理处理器
 * 负责处理监控数据队列中的任务
 */
@Processor(QUEUE_NAMES.MONITOR_PROCESSING)
@Injectable()
export class MonitorProcessingProcessor {
  private readonly logger = new Logger(MonitorProcessingProcessor.name);

  constructor(
    @InjectRepository(MonitorData)
    private readonly monitorDataRepository: Repository<MonitorData>,
    private readonly queueService: QueueService,
    private readonly errorLogService: ErrorLogService,
    private readonly sourcemapResolverService: SourcemapResolverService
  ) {}

  /**
   * 处理监控数据任务
   * @param job Bull任务对象
   */
  @Process(JOB_TYPES.PROCESS_MONITOR_DATA)
  async processMonitorData(
    job: Job<{ monitorData: MonitorData }>
  ): Promise<void> {
    const { monitorData } = job.data;

    try {
      this.logger.log(`开始处理监控数据: ${monitorData.id}`);

      // 1. 保存监控数据到数据库
      await this.monitorDataRepository.save(monitorData);

      // 2. 如果是jsError类型，转换为错误日志
      if (monitorData.type === "jsError" && monitorData.errorMessage) {
        await this.processJsError(monitorData);
      }

      // 3. 如果是performance类型，处理性能数据
      if (monitorData.type === "performance") {
        await this.processPerformanceData(monitorData);
      }

      // 4. 如果是resource类型，处理资源加载错误
      if (monitorData.type === "resource") {
        await this.processResourceError(monitorData);
      }

      this.logger.log(`监控数据处理完成: ${monitorData.id}`);
    } catch (error) {
      this.logger.error(
        `处理监控数据失败: ${monitorData.id}, 错误: ${error.message}`
      );
      throw error; // 让Bull进行重试
    }
  }

  /**
   * 处理JavaScript错误
   * 将MonitorData转换为ErrorLog并保存
   * @param monitorData 监控数据
   */
  private async processJsError(monitorData: MonitorData): Promise<void> {
    try {
      this.logger.log(
        `Processing JavaScript error: ${monitorData.errorMessage}`
      );

      // 解析JSON字符串数据
      const extraData = monitorData.extraData
        ? JSON.parse(monitorData.extraData)
        : {};
      const deviceInfo = monitorData.deviceInfo
        ? JSON.parse(monitorData.deviceInfo)
        : {};
      const networkInfo = monitorData.networkInfo
        ? JSON.parse(monitorData.networkInfo)
        : {};

      // 创建ErrorLog DTO
      const createErrorLogDto: CreateErrorLogDto = {
        projectId: monitorData.projectId,
        projectVersion: monitorData.projectVersion, // 添加项目版本号
        type: ErrorType.JS_ERROR,
        errorMessage: monitorData.errorMessage || "Unknown JavaScript error",
        errorStack: monitorData.errorStack,
        level: ErrorLevel.HIGH,
        sourceFile: extraData.sourceFile,
        sourceLine: extraData.sourceLine,
        sourceColumn: extraData.sourceColumn,
        pageUrl: monitorData.pageUrl,
        userId: monitorData.userId,
        userAgent: monitorData.userAgent,
        deviceInfo: deviceInfo,
        networkInfo: networkInfo,
        requestUrl: extraData.requestUrl,
        requestMethod: extraData.requestMethod,
        responseStatus: extraData.responseStatus,
        duration: monitorData.duration,
        extraData: extraData,
      };

      // 保存ErrorLog
      const errorLog =
        await this.errorLogService.createErrorLog(createErrorLogDto);
      this.logger.log(
        `Successfully converted MonitorData to ErrorLog for project: ${monitorData.projectId}`
      );

      // 尝试进行源代码定位
      if (errorLog && monitorData.errorStack) {
        try {
          await this.resolveSourceLocation(errorLog);
        } catch (resolveError) {
          this.logger.warn(
            `Failed to resolve source location for error ${errorLog.id}: ${resolveError.message}`
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to process JavaScript error: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * 处理性能数据
   * @param monitorData 监控数据
   */
  private async processPerformanceData(
    monitorData: MonitorData
  ): Promise<void> {
    try {
      // 这里可以添加性能数据处理逻辑
      // 例如：性能指标分析、阈值告警、数据聚合等
      this.logger.log(`性能数据处理完成: ${monitorData.id}`);
    } catch (error) {
      this.logger.error(`处理性能数据失败: ${error.message}`);
    }
  }

  /**
   * 处理资源加载错误
   * @param monitorData 监控数据
   */
  private async processResourceError(monitorData: MonitorData): Promise<void> {
    try {
      // 这里可以添加资源错误处理逻辑
      // 例如：资源监控、CDN优化建议等
      this.logger.log(`资源错误处理完成: ${monitorData.id}`);
    } catch (error) {
      this.logger.error(`处理资源错误失败: ${error.message}`);
    }
  }

  /**
   * 解析源代码位置
   * @param errorLog 错误日志
   */
  private async resolveSourceLocation(errorLog: any): Promise<void> {
    try {
      this.logger.log(`开始解析源代码位置，错误ID: ${errorLog.id}`);

      // 解析错误堆栈为堆栈帧
      const stackFrames = this.parseErrorStack(errorLog.errorStack);
      
      if (stackFrames.length === 0) {
        this.logger.warn(`无法解析错误堆栈，错误ID: ${errorLog.id}`);
        return;
      }

      // 调用源代码定位服务
      const resolveResult =
        await this.sourcemapResolverService.resolveErrorStack(
          errorLog.projectId,
          errorLog.projectVersion || "1.0.0",
          stackFrames
        );

      if (resolveResult && resolveResult.length > 0) {
        // 取第一个解析结果（通常是最相关的）
        const firstResult = resolveResult[0];

        // 更新错误日志记录
        await this.errorLogService.updateErrorLog(errorLog.id, {
          originalSourceFile: firstResult.originalSource,
          originalSourceLine: firstResult.originalLine,
          originalSourceColumn: firstResult.originalColumn,
          functionName: firstResult.originalName,
          isSourceResolved: true,
        });

        this.logger.log(
          `源代码定位成功，错误ID: ${errorLog.id}, 文件: ${firstResult.originalSource}:${firstResult.originalLine}`
        );
      } else {
        this.logger.warn(`未能解析源代码位置，错误ID: ${errorLog.id}`);
      }
    } catch (error) {
      this.logger.error(
        `解析源代码位置失败，错误ID: ${errorLog.id}, 错误: ${error.message}`
      );
    }
  }

  /**
   * 解析错误堆栈字符串为堆栈帧数组
   * @param errorStack 错误堆栈字符串
   * @returns 堆栈帧数组
   */
  private parseErrorStack(errorStack: string): any[] {
    if (!errorStack) return [];

    const stackFrames = [];
    const lines = errorStack.split('\n');

    for (const line of lines) {
      // 匹配堆栈行格式: at functionName (http://domain/file.js:line:column)
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        const [, functionName, fileName, lineNumber, columnNumber] = match;
        stackFrames.push({
          functionName: functionName.trim(),
          fileName: fileName.trim(),
          lineNumber: parseInt(lineNumber, 10),
          columnNumber: parseInt(columnNumber, 10),
        });
      }
    }

    return stackFrames;
  }
}
