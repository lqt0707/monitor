import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ErrorLog } from "../../database/entities/error-log.entity";
import { CreateErrorLogDto } from "./dto/create-error-log.dto";
import { QueryErrorLogDto } from "./dto/query-error-log.dto";
import { ClickHouseService } from "../clickhouse/services/clickhouse.service";
import { ErrorLevel } from "./dto/create-error-log.dto";
import { QueueService } from "./services/queue.service";
import { ErrorHashService } from "./services/error-hash.service";

/**
 * 错误日志服务
 * 处理错误日志的创建、查询和统计
 */
@Injectable()
export class ErrorLogService {
  private readonly logger = new Logger(ErrorLogService.name);

  constructor(
    @InjectRepository(ErrorLog)
    private errorLogRepository: Repository<ErrorLog>,
    private errorHashService: ErrorHashService,
    private queueService: QueueService,
    private clickHouseService: ClickHouseService
  ) {}

  /**
   * 将错误级别枚举转换为数字
   * @param level 错误级别枚举
   * @returns 错误级别数字
   */
  private getErrorLevelNumber(level: ErrorLevel): number {
    return level || ErrorLevel.MEDIUM;
  }

  /**
   * 创建单个错误日志
   * @param createErrorLogDto 创建错误日志DTO
   * @returns 创建的错误日志
   */
  async createErrorLog(
    createErrorLogDto: CreateErrorLogDto
  ): Promise<ErrorLog> {
    try {
      // 生成错误哈希
      const errorHash = this.errorHashService.calculateMinHash(
        createErrorLogDto.errorStack || "",
        createErrorLogDto.errorMessage,
        createErrorLogDto.sourceFile
      );

      // 创建错误日志
      const errorLog = this.errorLogRepository.create({
        projectId: createErrorLogDto.projectId,
        type: createErrorLogDto.type,
        errorHash,
        errorMessage: createErrorLogDto.errorMessage,
        errorStack: createErrorLogDto.errorStack,
        errorLevel: this.getErrorLevelNumber(
          createErrorLogDto.level || ErrorLevel.MEDIUM
        ),
        sourceFile: createErrorLogDto.sourceFile,
        sourceLine: createErrorLogDto.sourceLine,
        sourceColumn: createErrorLogDto.sourceColumn,
        pageUrl: createErrorLogDto.pageUrl,
        userId: createErrorLogDto.userId,
        userAgent: createErrorLogDto.userAgent,
        deviceInfo: createErrorLogDto.deviceInfo
          ? JSON.stringify(createErrorLogDto.deviceInfo)
          : null,
        networkInfo: createErrorLogDto.networkInfo
          ? JSON.stringify(createErrorLogDto.networkInfo)
          : null,
        requestUrl: createErrorLogDto.requestUrl,
        requestMethod: createErrorLogDto.requestMethod,
        responseStatus: createErrorLogDto.responseStatus,
        duration: createErrorLogDto.duration,
        extraData: createErrorLogDto.extraData
          ? JSON.stringify(createErrorLogDto.extraData)
          : null,
        isProcessed: false,
      });

      // 保存错误日志到MySQL
      const savedErrorLog = await this.errorLogRepository.save(errorLog);

      // 同时保存到ClickHouse
      try {
        await this.clickHouseService.insertErrorLog(savedErrorLog);
      } catch (clickhouseError) {
        this.logger.error("保存到ClickHouse失败", clickhouseError);
        // 继续执行，不影响主流程
      }

      // 添加到处理队列
      await this.queueService.addErrorProcessingJob(savedErrorLog);

      // 如果有源码映射信息但没有源文件位置，添加到源码映射处理队列
      if (!savedErrorLog.sourceFile && savedErrorLog.errorStack) {
        await this.queueService.addSourcemapProcessingJob(savedErrorLog);
      }

      // 添加到错误聚合队列
      await this.queueService.addErrorAggregationJob(savedErrorLog);

      return savedErrorLog;
    } catch (error) {
      this.logger.error("创建错误日志失败", error);
      throw error;
    }
  }

  /**
   * 批量创建错误日志
   * @param createErrorLogDtos 创建错误日志DTO数组
   * @returns 创建的错误日志数组
   */
  async createErrorLogs(
    createErrorLogDtos: CreateErrorLogDto[]
  ): Promise<ErrorLog[]> {
    try {
      const errorLogs: ErrorLog[] = [];

      for (const dto of createErrorLogDtos) {
        // 生成错误哈希
        const errorHash = this.errorHashService.calculateMinHash(
          dto.errorStack || "",
          dto.errorMessage,
          dto.sourceFile
        );

        // 创建错误日志
        const errorLog = this.errorLogRepository.create({
          projectId: dto.projectId,
          type: dto.type,
          errorHash,
          errorMessage: dto.errorMessage,
          errorStack: dto.errorStack,
          errorLevel: this.getErrorLevelNumber(dto.level || ErrorLevel.MEDIUM),
          sourceFile: dto.sourceFile,
          sourceLine: dto.sourceLine,
          sourceColumn: dto.sourceColumn,
          pageUrl: dto.pageUrl,
          userId: dto.userId,
          userAgent: dto.userAgent,
          deviceInfo: dto.deviceInfo ? JSON.stringify(dto.deviceInfo) : null,
          networkInfo: dto.networkInfo ? JSON.stringify(dto.networkInfo) : null,
          requestUrl: dto.requestUrl,
          requestMethod: dto.requestMethod,
          responseStatus: dto.responseStatus,
          duration: dto.duration,
          extraData: dto.extraData ? JSON.stringify(dto.extraData) : null,
          isProcessed: false,
        });

        errorLogs.push(errorLog);
      }

      // 批量保存错误日志到MySQL
      const savedErrorLogs = await this.errorLogRepository.save(errorLogs);

      // 同时批量保存到ClickHouse
      try {
        await this.clickHouseService.insertErrorLogs(savedErrorLogs);
      } catch (clickhouseError) {
        this.logger.error("批量保存到ClickHouse失败", clickhouseError);
        // 继续执行，不影响主流程
      }

      // 批量添加队列任务
      for (const errorLog of savedErrorLogs) {
        // 添加到错误处理队列
        await this.queueService.addErrorProcessingJob(errorLog);

        // 如果有源码映射信息但没有源文件位置，添加到源码映射处理队列
        if (!errorLog.sourceFile && errorLog.errorStack) {
          await this.queueService.addSourcemapProcessingJob(errorLog);
        }

        // 添加到错误聚合队列
        await this.queueService.addErrorAggregationJob(errorLog);
      }

      return savedErrorLogs;
    } catch (error) {
      this.logger.error("批量创建错误日志失败", error);
      throw error;
    }
  }

  /**
   * 查询错误日志列表
   * @param query 查询参数
   * @returns 错误日志列表和总数
   */
  async findErrorLogs(
    query: QueryErrorLogDto
  ): Promise<{ data: ErrorLog[]; total: number }> {
    try {
      const queryBuilder =
        this.errorLogRepository.createQueryBuilder("errorLog");

      // 项目ID过滤
      if (query.projectId) {
        queryBuilder.andWhere("errorLog.projectId = :projectId", {
          projectId: query.projectId,
        });
      }

      // 错误类型过滤
      if (query.type) {
        queryBuilder.andWhere("errorLog.type = :type", { type: query.type });
      }

      // 错误级别过滤
      if (query.level) {
        queryBuilder.andWhere("errorLog.errorLevel = :level", {
          level: query.level,
        });
      }

      // 关键词搜索
      if (query.keyword) {
        queryBuilder.andWhere(
          "(errorLog.errorMessage LIKE :keyword OR errorLog.errorStack LIKE :keyword)",
          { keyword: `%${query.keyword}%` }
        );
      }

      // 时间范围过滤
      if (query.startDate) {
        queryBuilder.andWhere("errorLog.createdAt >= :startDate", {
          startDate: new Date(query.startDate),
        });
      }
      if (query.endDate) {
        queryBuilder.andWhere("errorLog.createdAt <= :endDate", {
          endDate: new Date(query.endDate),
        });
      }

      // 排序
      const sortField = query.sortField || "createdAt";
      const sortOrder = query.sortOrder || "DESC";
      queryBuilder.orderBy(
        `errorLog.${sortField}`,
        sortOrder as "ASC" | "DESC"
      );

      // 分页
      const page = query.page || 1;
      const limit = query.limit || 20;
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      return { data, total };
    } catch (error) {
      this.logger.error("查询错误日志失败", error);
      throw error;
    }
  }

  /**
   * 根据ID查询错误日志详情
   * @param id 错误日志ID
   * @returns 错误日志详情
   */
  async findErrorLogById(id: number): Promise<ErrorLog | null> {
    try {
      return await this.errorLogRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error("查询错误日志详情失败", error);
      throw error;
    }
  }

  /**
   * 获取错误统计信息
   * @param projectId 项目ID（可选）
   * @returns 错误统计信息
   */
  async getErrorStats(projectId?: string): Promise<any> {
    try {
      const baseQuery = this.errorLogRepository.createQueryBuilder("errorLog");

      if (projectId) {
        baseQuery.andWhere("errorLog.projectId = :projectId", { projectId });
      }

      // 总错误数
      const totalErrors = await baseQuery.getCount();

      // 按错误级别统计
      const errorsByLevelQuery = this.errorLogRepository
        .createQueryBuilder("errorLog")
        .select("errorLog.errorLevel", "level")
        .addSelect("COUNT(errorLog.id)", "count")
        .groupBy("errorLog.errorLevel");

      if (projectId) {
        errorsByLevelQuery.andWhere("errorLog.projectId = :projectId", {
          projectId,
        });
      }

      const errorsByLevel = await errorsByLevelQuery.getRawMany();

      // 按错误类型统计
      const errorsByTypeQuery = this.errorLogRepository
        .createQueryBuilder("errorLog")
        .select("errorLog.type", "type")
        .addSelect("COUNT(errorLog.id)", "count")
        .groupBy("errorLog.type")
        .orderBy("count", "DESC")
        .limit(10);

      if (projectId) {
        errorsByTypeQuery.andWhere("errorLog.projectId = :projectId", {
          projectId,
        });
      }

      const errorsByType = await errorsByTypeQuery.getRawMany();

      return {
        totalErrors,
        errorsByLevel,
        errorsByType,
      };
    } catch (error) {
      this.logger.error("获取错误统计信息失败", error);
      throw error;
    }
  }

  /**
   * 获取错误趋势数据
   * @param projectId 项目ID（可选）
   * @param days 天数（默认7天）
   * @returns 错误趋势数据
   */
  async getErrorTrends(projectId?: string, days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trendsQuery = this.errorLogRepository
        .createQueryBuilder("errorLog")
        .select("DATE(errorLog.createdAt)", "date")
        .addSelect("COUNT(errorLog.id)", "count")
        .where("errorLog.createdAt >= :startDate", { startDate })
        .groupBy("DATE(errorLog.createdAt)")
        .orderBy("date", "ASC");

      if (projectId) {
        trendsQuery.andWhere("errorLog.projectId = :projectId", { projectId });
      }

      const trends = await trendsQuery.getRawMany();

      return trends;
    } catch (error) {
      this.logger.error("获取错误趋势数据失败", error);
      throw error;
    }
  }
}
