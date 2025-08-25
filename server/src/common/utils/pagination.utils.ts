/**
 * 分页工具函数库
 * 包含TypeORM分页查询的通用工具函数
 */

/**
 * 分页查询结果接口
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 分页查询参数接口
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 执行分页查询
 * @param queryBuilder TypeORM QueryBuilder实例
 * @param params 分页参数
 * @returns 分页查询结果
 */
export async function paginate<T>(
  queryBuilder: any,
  params: PaginationParams = {}
): Promise<PaginationResult<T>> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = params;

  // 设置排序
  if (sortBy) {
    queryBuilder.orderBy(`entity.${sortBy}`, sortOrder);
  }

  // 设置分页
  const skip = (page - 1) * pageSize;
  queryBuilder.skip(skip).take(pageSize);

  // 执行查询
  const [data, total] = await queryBuilder.getManyAndCount();

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

/**
 * 构建基础分页查询
 * @param repository TypeORM Repository实例
 * @param alias 查询别名
 * @returns QueryBuilder实例
 */
export function createPaginationQueryBuilder<T>(
  repository: any,
  alias: string = 'entity'
): any {
  return repository.createQueryBuilder(alias);
}

/**
 * 添加LIKE条件查询
 * @param queryBuilder QueryBuilder实例
 * @param field 字段名
 * @param value 查询值
 * @param alias 表别名
 */
export function addLikeCondition(
  queryBuilder: any,
  field: string,
  value: string,
  alias: string = 'entity'
): void {
  if (value) {
    queryBuilder.andWhere(`${alias}.${field} LIKE :${field}`, {
      [field]: `%${value}%`
    });
  }
}

/**
 * 添加相等条件查询
 * @param queryBuilder QueryBuilder实例
 * @param field 字段名
 * @param value 查询值
 * @param alias 表别名
 */
export function addEqualCondition(
  queryBuilder: any,
  field: string,
  value: any,
  alias: string = 'entity'
): void {
  if (value !== undefined && value !== null) {
    queryBuilder.andWhere(`${alias}.${field} = :${field}`, { [field]: value });
  }
}

/**
 * 添加布尔条件查询
 * @param queryBuilder QueryBuilder实例
 * @param field 字段名
 * @param value 布尔值
 * @param alias 表别名
 */
export function addBooleanCondition(
  queryBuilder: any,
  field: string,
  value: boolean,
  alias: string = 'entity'
): void {
  if (value !== undefined) {
    queryBuilder.andWhere(`${alias}.${field} = :${field}`, { [field]: value });
  }
}

/**
 * 添加日期范围条件查询
 * @param queryBuilder QueryBuilder实例
 * @param field 日期字段名
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param alias 表别名
 */
export function addDateRangeCondition(
  queryBuilder: any,
  field: string,
  startDate: Date | string,
  endDate: Date | string,
  alias: string = 'entity'
): void {
  if (startDate && endDate) {
    queryBuilder.andWhere(
      `${alias}.${field} BETWEEN :startDate AND :endDate`,
      {
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime()
      }
    );
  } else if (startDate) {
    queryBuilder.andWhere(`${alias}.${field} >= :startDate`, {
      startDate: new Date(startDate).getTime()
    });
  } else if (endDate) {
    queryBuilder.andWhere(`${alias}.${field} <= :endDate`, {
      endDate: new Date(endDate).getTime()
    });
  }
}