/**
 * 通用工具函数使用示例
 * 演示如何使用提取的通用工具函数重构现有代码
 */

import { 
  paginate, 
  PaginationResult,
  addLikeCondition,
  addEqualCondition,
  addBooleanCondition,
  resourceNotFound,
  findResource,
  safeAsyncOperation
} from './index';

// 示例：重构前的分页查询代码
/*
async findAllOld(queryDto: QueryDto): Promise<{ data: Entity[]; total: number }> {
  const { page = 1, limit = 10, name, isActive } = queryDto;
  const queryBuilder = this.repository.createQueryBuilder("entity");

  if (name) {
    queryBuilder.andWhere("entity.name LIKE :name", { name: `%${name}%` });
  }

  if (isActive !== undefined) {
    queryBuilder.andWhere("entity.isActive = :isActive", { isActive });
  }

  const [data, total] = await queryBuilder
    .skip((page - 1) * limit)
    .take(limit)
    .orderBy("entity.createdAt", "DESC")
    .getManyAndCount();

  return { data, total };
}
*/

// 示例：重构后的分页查询代码
/**
 * 使用通用工具函数的分页查询
 */
async function findAllNew(queryDto: any, repository: any): Promise<PaginationResult<any>> {
  const { page, pageSize, name, isActive } = queryDto;
  
  const queryBuilder = repository.createQueryBuilder("entity");
  
  // 使用通用条件添加函数
  addLikeCondition(queryBuilder, "name", name);
  addBooleanCondition(queryBuilder, "isActive", isActive);
  
  // 使用通用分页函数
  return await paginate(queryBuilder, {
    page,
    pageSize,
    sortBy: "createdAt",
    sortOrder: "DESC"
  });
}

// 示例：重构前的资源查找代码
/*
async findOneOld(id: number): Promise<Entity> {
  const entity = await this.repository.findOne({ where: { id } });
  if (!entity) {
    throw new NotFoundException(`资源不存在: ${id}`);
  }
  return entity;
}
*/

// 示例：重构后的资源查找代码
/**
 * 使用通用工具函数的资源查找
 */
async function findOneNew(id: number, repository: any, resourceName: string): Promise<any> {
  return await findResource(repository, id, resourceName);
}

// 示例：重构前的错误处理代码
/*
async updateOld(id: number, updateDto: any): Promise<Entity> {
  try {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return await this.repository.save(entity);
  } catch (error) {
    this.logger.error("更新失败", error);
    throw error;
  }
}
*/

// 示例：重构后的错误处理代码
/**
 * 使用通用工具函数的错误处理
 */
async function updateNew(
  id: number, 
  updateDto: any, 
  repository: any, 
  resourceName: string,
  logger: any
): Promise<any> {
  return await safeAsyncOperation(
    async () => {
      const entity = await findResource(repository, id, resourceName);
      Object.assign(entity, updateDto);
      return await repository.save(entity);
    },
    `更新${resourceName}失败`,
    logger
  );
}

// 示例：批量操作重构
/**
 * 使用通用工具函数的批量操作
 */
async function batchOperationNew(
  ids: number[],
  repository: any,
  resourceName: string,
  operation: (entity: any) => Promise<any>,
  logger: any
): Promise<any[]> {
  const operations = ids.map(id => 
    async () => {
      const entity = await findResource(repository, id, resourceName);
      return await operation(entity);
    }
  );
  
  return await safeAsyncOperation(
    async () => Promise.all(operations.map(op => op())),
    `批量操作${resourceName}失败`,
    logger
  );
}

// 导出示例函数
export {
  findAllNew,
  findOneNew,
  updateNew,
  batchOperationNew
};