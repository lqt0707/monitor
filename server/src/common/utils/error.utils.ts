/**
 * 错误处理工具函数库
 * 包含项目中常用的错误处理工具函数
 */

import { NotFoundException } from '@nestjs/common';

/**
 * 生成资源不存在的异常
 * @param resourceName 资源名称
 * @param identifier 资源标识符
 * @returns NotFoundException
 */
export function resourceNotFound(
  resourceName: string,
  identifier: string | number
): NotFoundException {
  return new NotFoundException(`${resourceName}不存在: ${identifier}`);
}

/**
 * 生成资源不存在的异常（带中文资源名）
 * @param resourceName 资源中文名称
 * @param identifier 资源标识符
 * @returns NotFoundException
 */
export function resourceNotFoundCN(
  resourceName: string,
  identifier: string | number
): NotFoundException {
  return new NotFoundException(`${resourceName}不存在: ${identifier}`);
}

/**
 * 通用的资源查找函数
 * @param repository TypeORM Repository实例
 * @param id 资源ID
 * @param resourceName 资源名称
 * @param relations 关联关系
 * @returns 找到的资源实体
 * @throws NotFoundException 如果资源不存在
 */
export async function findResource<T>(
  repository: any,
  id: number,
  resourceName: string,
  relations?: string[]
): Promise<T> {
  const options: any = { where: { id } };
  if (relations && relations.length > 0) {
    options.relations = relations;
  }

  const resource = await repository.findOne(options);
  if (!resource) {
    throw resourceNotFound(resourceName, id);
  }
  return resource;
}

/**
 * 通过字段查找资源
 * @param repository TypeORM Repository实例
 * @param field 字段名
 * @param value 字段值
 * @param resourceName 资源名称
 * @param relations 关联关系
 * @returns 找到的资源实体
 * @throws NotFoundException 如果资源不存在
 */
export async function findResourceByField<T>(
  repository: any,
  field: string,
  value: string | number,
  resourceName: string,
  relations?: string[]
): Promise<T> {
  const whereCondition = { [field]: value };
  const options: any = { where: whereCondition };
  if (relations && relations.length > 0) {
    options.relations = relations;
  }

  const resource = await repository.findOne(options);
  if (!resource) {
    throw resourceNotFound(resourceName, value);
  }
  return resource;
}

/**
 * 批量查找资源
 * @param repository TypeORM Repository实例
 * @param ids 资源ID列表
 * @param resourceName 资源名称
 * @returns 找到的资源实体列表
 * @throws NotFoundException 如果有资源不存在
 */
export async function findResources<T>(
  repository: any,
  ids: number[],
  resourceName: string
): Promise<T[]> {
  const resources = await repository.find({
    where: { id: { $in: ids } } as any
  });

  if (resources.length !== ids.length) {
    const foundIds = resources.map(resource => resource.id);
    const missingIds = ids.filter(id => !foundIds.includes(id));
    throw resourceNotFound(`${resourceName}(多个)`, missingIds.join(', '));
  }

  return resources;
}

/**
 * 验证资源是否存在
 * @param repository TypeORM Repository实例
 * @param id 资源ID
 * @param resourceName 资源名称
 * @returns 如果资源存在返回true，否则抛出异常
 * @throws NotFoundException 如果资源不存在
 */
export async function validateResourceExists(
  repository: any,
  id: number,
  resourceName: string
): Promise<boolean> {
  const exists = await repository.exist({ where: { id } });
  if (!exists) {
    throw resourceNotFound(resourceName, id);
  }
  return true;
}

/**
 * 安全的异步操作包装器
 * @param operation 异步操作函数
 * @param errorMessage 错误消息
 * @param logger 日志记录器（可选）
 * @returns 操作结果
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  logger?: any
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (logger) {
      logger.error(errorMessage, error);
    }
    throw error;
  }
}

/**
 * 批量操作包装器
 * @param operations 异步操作函数数组
 * @param errorMessage 错误消息
 * @param logger 日志记录器（可选）
 * @returns 操作结果数组
 */
export async function safeBatchOperation<T>(
  operations: Array<() => Promise<T>>,
  errorMessage: string,
  logger?: any
): Promise<T[]> {
  try {
    return await Promise.all(operations.map(op => op()));
  } catch (error) {
    if (logger) {
      logger.error(errorMessage, error);
    }
    throw error;
  }
}