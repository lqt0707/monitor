# 解决循环依赖问题指南

## 发现的循环依赖问题

通过 Madge 工具分析，发现了以下 3 个循环依赖：

1. `alert-history.entity.ts` ↔ `alert-rule.entity.ts`
2. `project-config.entity.ts` ↔ `alert-history.entity.ts` ↔ `alert-rule.entity.ts`
3. `project-config.entity.ts` ↔ `alert-history.entity.ts`

## 循环依赖原因分析

### 问题 1: AlertHistory ↔ AlertRule
- `AlertHistory` 实体通过 `@ManyToOne` 关联 `AlertRule`
- `AlertRule` 实体通过 `@OneToMany` 关联 `AlertHistory`
- 这是 TypeORM 实体间的双向关联导致的循环依赖

### 问题 2: ProjectConfig ↔ AlertHistory ↔ AlertRule
- `ProjectConfig` 实体通过 `@OneToMany` 关联 `AlertHistory`
- `AlertHistory` 实体通过 `@ManyToOne` 关联 `ProjectConfig`
- 同时 `AlertHistory` 和 `AlertRule` 也存在双向关联

### 问题 3: ProjectConfig ↔ AlertHistory
- `ProjectConfig` 和 `AlertHistory` 之间的双向关联

## 解决方案

### 1. 使用前向引用 (Forward Reference)

对于实体间的循环依赖，可以使用 NestJS 的 `forwardRef` 来解决：

```typescript
// 在 module 文件中使用 forwardRef
@Module({
  imports: [
    forwardRef(() => AlertModule),
    forwardRef(() => ProjectConfigModule),
  ],
  // ...
})
```

### 2. 使用接口分离

创建接口来打破实体间的直接依赖：

```typescript
// 创建接口文件
export interface IAlertRule {
  id: number;
  name: string;
  // ... 其他字段
}

// 在实体中使用接口而不是具体类
export class AlertHistory {
  @ManyToOne(() => AlertRule)
  alertRule: IAlertRule;
}
```

### 3. 重构实体关系

考虑是否真的需要双向关联，可以改为单向关联：

```typescript
// 移除不必要的反向关联
@Entity('alert_rules')
export class AlertRule {
  // 移除 @OneToMany 关联，如果不需要的话
  // @OneToMany(() => AlertHistory, alertHistory => alertHistory.alertRule)
  // alertHistories: AlertHistory[];
}
```

### 4. 使用延迟加载

使用提供的 `LazyLoader` 工具类：

```typescript
import { LazyLoader } from '../common/utils/dependency.utils';

class MyService {
  private readonly alertRuleLoader = new LazyLoader(() => this.getAlertRuleService());
  
  async someMethod() {
    const alertRuleService = this.alertRuleLoader.get();
    // 使用服务
  }
  
  private getAlertRuleService() {
    // 返回 AlertRuleService 实例
  }
}
```

## 具体实施步骤

### 步骤 1: 更新模块导入

在存在循环依赖的模块中使用 `forwardRef`：

```typescript
// alert.module.ts
@Module({
  imports: [
    forwardRef(() => ProjectConfigModule),
    TypeOrmModule.forFeature([AlertRule, AlertHistory]),
  ],
  // ...
})
export class AlertModule {}

// project-config.module.ts
@Module({
  imports: [
    forwardRef(() => AlertModule),
    TypeOrmModule.forFeature([ProjectConfig]),
  ],
  // ...
})
export class ProjectConfigModule {}
```

### 步骤 2: 使用提供的工具函数

项目现在提供了以下工具函数来帮助解决依赖问题：

1. **`/src/common/utils/dependency.utils.ts`** - 依赖管理工具
2. **`/src/common/utils/index.ts`** - 通用工具函数
3. **`/src/common/config/`** - 统一配置管理

### 步骤 3: 验证解决方案

运行以下命令验证循环依赖是否解决：

```bash
npx madge --circular /Users/lqt/Desktop/package/monitor/server/src --extensions ts
```

## 预防措施

### 1. 代码审查
- 在代码审查时特别注意实体间的关联关系
- 避免不必要的双向关联

### 2. 架构设计
- 使用依赖倒置原则，依赖接口而不是具体实现
- 考虑使用事件驱动架构来解耦模块

### 3. 工具集成
- 在 CI/CD 流程中加入循环依赖检查
- 使用 Madge 或其他依赖分析工具定期检查

### 4. 文档规范
- 在项目文档中明确模块间的依赖关系
- 记录允许的依赖方向和禁止的循环依赖

## 新工具函数使用示例

### 日期格式化
```typescript
import { formatDate } from '../common/utils';

const formatted = formatDate(new Date(), 'YYYY-MM-DD');
// 输出: "2024-01-01"
```

### 配置管理
```typescript
import { ConfigHelper, ConfigKey } from '../common/config';

@Injectable()
export class MyService {
  constructor(private readonly configHelper: ConfigHelper) {}
  
  getDatabaseConfig() {
    return this.configHelper.getDatabaseConfig();
  }
}
```

### 依赖管理
```typescript
import { LazyLoader } from '../common/utils/dependency.utils';

class MyService {
  private readonly dependentService = new LazyLoader(() => this.getDependentService());
  
  private getDependentService() {
    // 返回依赖服务的实例
  }
}
```

## 后续维护

1. **定期检查**: 每月运行一次循环依赖检查
2. **代码规范**: 在新代码中避免创建新的循环依赖
3. **文档更新**: 当模块关系发生变化时更新本文档
4. **工具更新**: 保持依赖分析工具的更新

通过以上措施，可以有效解决现有的循环依赖问题，并预防新的循环依赖产生。