# 项目结构重构计划

## 当前项目结构分析

### 现状
项目已经部分按模块组织，但存在以下问题：
1. `services/` 目录独立存在，应该分散到各个模块中
2. `processors/` 目录独立存在，应该按功能模块组织
3. `templates/` 目录应该移到相应模块中
4. 一些模块结构不够完整，缺少DTOs、entities等

### 目标结构
```
src/
├── app.module.ts
├── main.ts
├── common/                    # 公共工具和装饰器
├── config/                    # 配置文件
├── database/                  # 数据库相关（迁移等）
│   └── migrations/
└── modules/                   # 按功能模块组织
    ├── monitor/               # 监控模块
    │   ├── controllers/
    │   ├── services/
    │   ├── processors/
    │   ├── entities/
    │   ├── dto/
    │   ├── enums/
    │   └── monitor.module.ts
    ├── project-config/        # 项目配置模块
    │   ├── controllers/
    │   ├── services/
    │   ├── entities/
    │   ├── dto/
    │   └── project-config.module.ts
    ├── email/                 # 邮件模块
    │   ├── controllers/
    │   ├── services/
    │   ├── processors/
    │   ├── templates/
    │   └── email.module.ts
    ├── ai-diagnosis/          # AI诊断模块
    │   ├── services/
    │   ├── processors/
    │   └── ai-diagnosis.module.ts
    ├── sourcemap/             # SourceMap模块
    │   ├── services/
    │   ├── processors/
    │   └── sourcemap.module.ts
    ├── clickhouse/            # ClickHouse模块
    │   ├── services/
    │   └── clickhouse.module.ts
    └── health/                # 健康检查模块
        ├── controllers/
        ├── services/
        └── health.module.ts
```

## 重构步骤

### 第一阶段：创建新的模块结构
1. 创建 AI诊断模块
2. 创建 SourceMap模块
3. 重构邮件模块，添加processors和templates
4. 重构监控模块，整合相关processors

### 第二阶段：迁移文件
1. 将 `services/` 下的文件移动到对应模块
2. 将 `processors/` 下的文件移动到对应模块
3. 将 `templates/` 下的文件移动到对应模块
4. 将 `database/entities/` 下的文件移动到对应模块

### 第三阶段：更新模块依赖
1. 更新各模块的imports和exports
2. 更新app.module.ts中的模块引用
3. 更新所有import路径

### 第四阶段：测试和验证
1. 确保所有功能正常工作
2. 运行测试用例
3. 验证API接口正常

## 注意事项

1. 保持向后兼容性
2. 确保模块间的依赖关系清晰
3. 每个模块应该有明确的职责边界
4. 共享的实体和服务需要合理组织
5. 保持代码的可测试性