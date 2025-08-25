# 通用工具函数库

本项目提供了一系列通用的工具函数，用于简化常见的开发任务，包括分页查询、错误处理、数据验证等。

## 安装和使用

### 安装

工具函数已经包含在项目中，无需额外安装。

### 导入

```typescript
// 导入所有工具函数
import {
  // 基础工具函数
  formatDate,
  generateRandomString,
  deepClone,
  debounce,
  throttle,
  isValidEmail,
  isValidPhone,
  getFileExtension,
  formatFileSize,
  sleep,
  safeJsonParse,
  safeJsonStringify,
  
  // 分页工具函数
  paginate,
  PaginationResult,
  PaginationParams,
  addLikeCondition,
  addEqualCondition,
  addBooleanCondition,
  addDateRangeCondition,
  
  // 错误处理工具函数
  resourceNotFound,
  resourceNotFoundCN,
  findResource,
  findResourceByField,
  findResources,
  validateResourceExists,
  safeAsyncOperation,
  safeBatchOperation
} from './utils';
```

## 工具函数分类

### 1. 基础工具函数

- **formatDate**: 日期格式化
- **generateRandomString**: 生成随机字符串
- **deepClone**: 深度克隆对象
- **debounce**: 防抖函数
- **throttle**: 节流函数
- **isValidEmail**: 验证邮箱格式
- **isValidPhone**: 验证手机号格式
- **getFileExtension**: 获取文件扩展名
- **formatFileSize**: 文件大小格式化
- **sleep**: 睡眠函数
- **safeJsonParse**: 安全的JSON解析
- **safeJsonStringify**: 安全的JSON字符串化

### 2. 分页工具函数

#### paginate
执行分页查询

```typescript
// 使用示例
const result = await paginate(queryBuilder, {
  page: 1,
  pageSize: 20,
  sortBy: 'createdAt',
  sortOrder: 'DESC'
});
```

#### 条件添加函数
- **addLikeCondition**: 添加LIKE条件
- **addEqualCondition**: 添加相等条件
- **addBooleanCondition**: 添加布尔条件
- **addDateRangeCondition**: 添加日期范围条件

### 3. 错误处理工具函数

#### resourceNotFound
生成资源不存在的异常

```typescript
// 使用示例
throw resourceNotFound('用户', 123);
// 输出: NotFoundException: 用户不存在: 123
```

#### findResource
通用的资源查找函数

```typescript
// 使用示例
const user = await findResource(userRepository, 123, '用户');
```

#### safeAsyncOperation
安全的异步操作包装器

```typescript
// 使用示例
const result = await safeAsyncOperation(
  () => userRepository.save(user),
  '保存用户失败',
  logger
);
```

## 代码重构示例

### 重构前

```typescript
// 分页查询
async findAll(queryDto: QueryDto): Promise<{ data: Entity[]; total: number }> {
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

// 资源查找
async findOne(id: number): Promise<Entity> {
  const entity = await this.repository.findOne({ where: { id } });
  if (!entity) {
    throw new NotFoundException(`资源不存在: ${id}`);
  }
  return entity;
}
```

### 重构后

```typescript
import { paginate, addLikeCondition, addBooleanCondition, findResource } from '../common/utils';

// 分页查询
async findAll(queryDto: QueryDto): Promise<PaginationResult<Entity>> {
  const { page, pageSize, name, isActive } = queryDto;
  const queryBuilder = this.repository.createQueryBuilder("entity");

  addLikeCondition(queryBuilder, "name", name);
  addBooleanCondition(queryBuilder, "isActive", isActive);

  return await paginate(queryBuilder, {
    page,
    pageSize,
    sortBy: "createdAt",
    sortOrder: "DESC"
  });
}

// 资源查找
async findOne(id: number): Promise<Entity> {
  return await findResource(this.repository, id, '资源');
}
```

## 优势

1. **代码复用**: 减少重复代码，提高开发效率
2. **一致性**: 确保整个项目的代码风格和模式一致
3. **可维护性**: 集中管理工具函数，便于维护和更新
4. **错误处理**: 统一的错误处理机制，提高代码健壮性
5. **类型安全**: 完整的TypeScript类型定义

## 最佳实践

1. 在新建的服务中优先使用这些工具函数
2. 在重构现有代码时逐步替换为工具函数
3. 根据需要扩展工具函数库
4. 保持工具函数的单一职责原则

## 扩展建议

如果需要添加新的工具函数，请：

1. 在相应的工具文件中添加函数
2. 在 `index.ts` 中导出新函数
3. 添加完整的类型定义和注释
4. 提供使用示例
5. 更新此文档

## 贡献

欢迎提交Pull Request来改进和扩展工具函数库。