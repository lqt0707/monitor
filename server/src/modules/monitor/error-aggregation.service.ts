import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThan, LessThan } from "typeorm";
import { ErrorAggregation } from "../../database/entities/error-aggregation.entity";
import { QueryErrorAggregationDto } from "./dto/query-error-aggregation.dto";
import { UpdateErrorAggregationDto } from "./dto/update-error-aggregation.dto";
import { QueueService } from "./services/queue.service";

/**
 * 错误聚合服务
 */
@Injectable()
export class ErrorAggregationService {
  private readonly logger = new Logger(ErrorAggregationService.name);

  constructor(
    @InjectRepository(ErrorAggregation)
    private readonly errorAggregationRepository: Repository<ErrorAggregation>,
    private readonly queueService: QueueService
  ) {}

  /**
   * 查询错误聚合列表
   * @param queryDto 查询参数
   * @returns 错误聚合列表和分页信息
   */
  async findErrorAggregations(queryDto: QueryErrorAggregationDto) {
    const {
      projectId,
      type,
      status,
      errorLevel,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = "lastSeen",
      sortOrder = "DESC",
    } = queryDto;

    const queryBuilder =
      this.errorAggregationRepository.createQueryBuilder("aggregation");

    // 添加查询条件
    if (projectId) {
      queryBuilder.andWhere("aggregation.projectId = :projectId", {
        projectId,
      });
    }

    if (type) {
      queryBuilder.andWhere("aggregation.type = :type", { type });
    }

    if (status !== undefined) {
      queryBuilder.andWhere("aggregation.status = :status", { status });
    }

    if (errorLevel !== undefined) {
      queryBuilder.andWhere("aggregation.errorLevel = :errorLevel", {
        errorLevel,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        "aggregation.createdAt BETWEEN :startDate AND :endDate",
        {
          startDate,
          endDate,
        }
      );
    } else if (startDate) {
      queryBuilder.andWhere("aggregation.createdAt >= :startDate", {
        startDate,
      });
    } else if (endDate) {
      queryBuilder.andWhere("aggregation.createdAt <= :endDate", { endDate });
    }

    // 排序
    queryBuilder.orderBy(`aggregation.${sortBy}`, sortOrder as "ASC" | "DESC");

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID查询错误聚合详情
   * @param id 错误聚合ID
   * @returns 错误聚合详情
   */
  async findErrorAggregationById(id: number): Promise<ErrorAggregation | null> {
    return await this.errorAggregationRepository.findOne({
      where: { id },
    });
  }

  /**
   * 更新错误聚合
   * @param id 错误聚合ID
   * @param updateDto 更新数据
   * @returns 更新后的错误聚合
   */
  async updateErrorAggregation(
    id: number,
    updateDto: UpdateErrorAggregationDto
  ): Promise<ErrorAggregation> {
    await this.errorAggregationRepository.update(id, updateDto);
    const updated = await this.findErrorAggregationById(id);
    if (!updated) {
      throw new Error("错误聚合不存在");
    }
    return updated;
  }

  /**
   * 删除错误聚合
   * @param id 错误聚合ID
   */
  async deleteErrorAggregation(id: number): Promise<void> {
    const result = await this.errorAggregationRepository.delete(id);
    if (result.affected === 0) {
      throw new Error("错误聚合不存在");
    }
  }

  /**
   * 获取错误聚合统计信息
   * @param params 统计参数
   * @returns 统计信息
   */
  async getErrorAggregationStats(params: {
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { projectId, startDate, endDate } = params;

    const queryBuilder =
      this.errorAggregationRepository.createQueryBuilder("aggregation");

    // 添加查询条件
    if (projectId) {
      queryBuilder.andWhere("aggregation.projectId = :projectId", {
        projectId,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        "aggregation.createdAt BETWEEN :startDate AND :endDate",
        {
          startDate,
          endDate,
        }
      );
    } else if (startDate) {
      queryBuilder.andWhere("aggregation.createdAt >= :startDate", {
        startDate,
      });
    } else if (endDate) {
      queryBuilder.andWhere("aggregation.createdAt <= :endDate", { endDate });
    }

    // 获取基础统计
    const totalCount = await queryBuilder.getCount();
    const totalOccurrences = await queryBuilder
      .select("SUM(aggregation.occurrenceCount)", "total")
      .getRawOne();
    const totalAffectedUsers = await queryBuilder
      .select("SUM(aggregation.affectedUsers)", "total")
      .getRawOne();

    // 按状态统计
    const statusStats = await this.errorAggregationRepository
      .createQueryBuilder("aggregation")
      .select("aggregation.status", "status")
      .addSelect("COUNT(*)", "count")
      .where(projectId ? "aggregation.projectId = :projectId" : "1=1", {
        projectId,
      })
      .andWhere(
        startDate && endDate
          ? "aggregation.createdAt BETWEEN :startDate AND :endDate"
          : startDate
            ? "aggregation.createdAt >= :startDate"
            : endDate
              ? "aggregation.createdAt <= :endDate"
              : "1=1",
        { startDate, endDate }
      )
      .groupBy("aggregation.status")
      .getRawMany();

    // 按错误级别统计
    const levelStats = await this.errorAggregationRepository
      .createQueryBuilder("aggregation")
      .select("aggregation.errorLevel", "level")
      .addSelect("COUNT(*)", "count")
      .where(projectId ? "aggregation.projectId = :projectId" : "1=1", {
        projectId,
      })
      .andWhere(
        startDate && endDate
          ? "aggregation.createdAt BETWEEN :startDate AND :endDate"
          : startDate
            ? "aggregation.createdAt >= :startDate"
            : endDate
              ? "aggregation.createdAt <= :endDate"
              : "1=1",
        { startDate, endDate }
      )
      .groupBy("aggregation.errorLevel")
      .getRawMany();

    // 按类型统计
    const typeStats = await this.errorAggregationRepository
      .createQueryBuilder("aggregation")
      .select("aggregation.type", "type")
      .addSelect("COUNT(*)", "count")
      .where(projectId ? "aggregation.projectId = :projectId" : "1=1", {
        projectId,
      })
      .andWhere(
        startDate && endDate
          ? "aggregation.createdAt BETWEEN :startDate AND :endDate"
          : startDate
            ? "aggregation.createdAt >= :startDate"
            : endDate
              ? "aggregation.createdAt <= :endDate"
              : "1=1",
        { startDate, endDate }
      )
      .groupBy("aggregation.type")
      .getRawMany();

    return {
      totalCount,
      totalOccurrences: parseInt(totalOccurrences?.total || "0"),
      totalAffectedUsers: parseInt(totalAffectedUsers?.total || "0"),
      statusStats: statusStats.map((item) => ({
        status: parseInt(item.status),
        count: parseInt(item.count),
      })),
      levelStats: levelStats.map((item) => ({
        level: parseInt(item.level),
        count: parseInt(item.count),
      })),
      typeStats: typeStats.map((item) => ({
        type: item.type,
        count: parseInt(item.count),
      })),
    };
  }

  /**
   * 触发错误聚合任务
   * @param projectId 项目ID
   */
  async triggerAggregation(projectId: string): Promise<void> {
    try {
      // 创建一个临时的ErrorLog对象用于触发聚合
      const tempErrorLog = {
        id: 0,
        projectId,
        errorHash: "manual-trigger",
      } as any;

      await this.queueService.addErrorAggregationJob(tempErrorLog);
      this.logger.log(`错误聚合任务已添加到队列: ${projectId}`);
    } catch (error) {
      this.logger.error(`添加错误聚合任务失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 触发AI重新分析
   * @param aggregationId 错误聚合ID
   */
  async triggerReanalysis(aggregationId: number): Promise<void> {
    try {
      // 先查找错误聚合
      const aggregation = await this.findErrorAggregationById(aggregationId);
      if (!aggregation) {
        throw new Error("错误聚合不存在");
      }

      await this.queueService.addAiDiagnosisJob(aggregation);
      this.logger.log(`AI重新分析任务已添加到队列: ${aggregationId}`);
    } catch (error) {
      this.logger.error(
        `添加AI重新分析任务失败: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
