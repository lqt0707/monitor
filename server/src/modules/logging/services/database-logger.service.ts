import { Injectable, Inject, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Log } from "../entities/log.entity";
import { LoggingConfig } from "../interfaces/logging-config.interface";

/**
 * 数据库日志服务
 * 负责将日志保存到数据库
 */
@Injectable()
export class DatabaseLoggerService {
  private readonly logger = new Logger(DatabaseLoggerService.name);

  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
    @Inject("LOGGING_CONFIG")
    private readonly config: LoggingConfig
  ) {}

  /**
   * 保存日志到数据库
   */
  async saveToDatabase(
    level: string,
    message: string,
    context?: string,
    extra?: Record<string, any>,
    projectId?: string,
    traceId?: string,
    userId?: string
  ): Promise<void> {
    try {
      const logEntry = this.logRepository.create({
        level,
        message,
        context,
        extra,
        projectId,
        traceId,
        userId,
      });

      await this.logRepository.save(logEntry);
    } catch (error) {
      this.logger.error(`保存日志到数据库失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量保存日志到数据库
   */
  async batchSaveToDatabase(
    logs: Array<{
      level: string;
      message: string;
      context?: string;
      extra?: Record<string, any>;
      projectId?: string;
      traceId?: string;
      userId?: string;
    }>
  ): Promise<void> {
    try {
      const logEntries = logs.map((log) =>
        this.logRepository.create({
          ...log,
        })
      );

      await this.logRepository.save(logEntries);
    } catch (error) {
      this.logger.error(`批量保存日志到数据库失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查询日志
   */
  async queryLogs(params: {
    page?: number;
    pageSize?: number;
    level?: string;
    context?: string;
    startDate?: Date;
    endDate?: Date;
    projectId?: string;
    traceId?: string;
    userId?: string;
  }): Promise<[Log[], number]> {
    try {
      const {
        page = 1,
        pageSize = 20,
        level,
        context,
        startDate,
        endDate,
        projectId,
        traceId,
        userId,
      } = params;

      let query: SelectQueryBuilder<Log> = this.logRepository
        .createQueryBuilder("log")
        .orderBy("log.timestamp", "DESC");

      // 添加过滤条件
      if (level) {
        query = query.andWhere("log.level = :level", { level });
      }

      if (context) {
        query = query.andWhere("log.context LIKE :context", {
          context: `%${context}%`,
        });
      }

      if (startDate) {
        query = query.andWhere("log.timestamp >= :startDate", { startDate });
      }

      if (endDate) {
        query = query.andWhere("log.timestamp <= :endDate", { endDate });
      }

      if (projectId) {
        query = query.andWhere("log.projectId = :projectId", { projectId });
      }

      if (traceId) {
        query = query.andWhere("log.traceId = :traceId", { traceId });
      }

      if (userId) {
        query = query.andWhere("log.userId = :userId", { userId });
      }

      // 分页
      const offset = (page - 1) * pageSize;
      query = query.skip(offset).take(pageSize);

      return await query.getManyAndCount();
    } catch (error) {
      this.logger.error(`查询日志失败: ${error.message}`);
      return [[], 0];
    }
  }

  /**
   * 清理过期日志
   */
  async cleanupOldLogs(retentionDays?: number): Promise<number> {
    try {
      const days = retentionDays || this.config.retentionDays;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.logRepository
        .createQueryBuilder()
        .delete()
        .where("timestamp < :cutoffDate", { cutoffDate })
        .execute();

      this.logger.log(`清理了 ${result.affected} 条过期日志`);
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`清理过期日志失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取日志统计信息
   */
  async getLogStats(): Promise<{
    total: number;
    byLevel: Record<string, number>;
    byContext: Record<string, number>;
  }> {
    try {
      const total = await this.logRepository.count();

      const levelStats = await this.logRepository
        .createQueryBuilder("log")
        .select("log.level", "level")
        .addSelect("COUNT(*)", "count")
        .groupBy("log.level")
        .getRawMany();

      const contextStats = await this.logRepository
        .createQueryBuilder("log")
        .select("log.context", "context")
        .addSelect("COUNT(*)", "count")
        .where("log.context IS NOT NULL")
        .groupBy("log.context")
        .getRawMany();

      return {
        total,
        byLevel: levelStats.reduce((acc, stat) => {
          acc[stat.level] = parseInt(stat.count);
          return acc;
        }, {}),
        byContext: contextStats.reduce((acc, stat) => {
          acc[stat.context] = parseInt(stat.count);
          return acc;
        }, {}),
      };
    } catch (error) {
      this.logger.error(`获取日志统计失败: ${error.message}`);
      throw error;
    }
  }
}
