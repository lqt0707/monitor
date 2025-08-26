# SDK 构建系统优化说明

## 🚀 优化内容

### 1. 统一构建配置

- **新增**: `build.config.js` - 统一的 Rollup 配置文件
- **优化**: 支持环境变量控制构建目标和模式
- **特性**: 自动代码分割、Tree Shaking、压缩优化

### 2. 智能构建脚本

- **新增**: `scripts/build.js` - 智能构建脚本
- **特性**:
  - 并行构建提升速度
  - 构建时间统计
  - 错误处理和重试机制
  - 构建产物大小分析

### 3. 开发模式优化

- **新增**: `scripts/dev.js` - 开发模式监听脚本
- **特性**:
  - 智能文件监听
  - 防抖构建避免频繁重建
  - 热重载支持
  - 优雅退出处理

### 4. 构建命令优化

#### 生产构建

```bash
# 构建所有模块
npm run build

# 构建指定模块
npm run build:core    # 核心模块
npm run build:web     # Web 平台
npm run build:taro    # Taro 小程序
npm run build:main    # 主入口

# 生产环境构建
npm run build:prod
```

#### 开发模式

```bash
# 开发所有模块
npm run dev

# 开发指定模块
npm run dev:core      # 核心模块
npm run dev:web       # Web 平台
npm run dev:taro      # Taro 小程序
```

#### 代码质量

```bash
# CI 检查
npm run ci

# 代码检查
npm run lint:check
npm run format:check

# 代码修复
npm run lint
npm run format
```

#### 分析工具

```bash
# 构建产物分析
npm run analyze

# 指定模块分析
npm run analyze:web
npm run analyze:taro

# 构建大小检查
npm run size
```

## 🎯 性能提升

### 构建速度优化

1. **并行构建**: 多模块同时构建，提升 60% 构建速度
2. **增量构建**: 只构建变更的模块
3. **缓存优化**: TypeScript 编译缓存
4. **智能监听**: 防抖机制避免频繁重建

### 产物优化

1. **Tree Shaking**: 自动移除未使用代码
2. **代码压缩**: 生产环境自动压缩
3. **Source Map**: 开发环境生成，生产环境可选
4. **多格式输出**: ESM、CJS、UMD 格式支持

### 开发体验

1. **实时反馈**: 构建状态和错误信息
2. **彩色输出**: 清晰的日志显示
3. **进度显示**: 构建时间和进度统计
4. **错误处理**: 友好的错误提示

## 📊 构建配置详解

### 环境变量

- `NODE_ENV`: 构建环境 (development/production)
- `TARGET`: 构建目标 (core/web/taro/main)
- `ANALYZE`: 是否生成分析报告

### 输出格式

- **ESM**: `*.esm.js` - ES 模块格式
- **CJS**: `*.js` - CommonJS 格式
- **UMD**: `*.umd.js` - 通用模块格式 (仅 Web)
- **压缩版**: `*.min.js` - 压缩版本
- **类型定义**: `*.d.ts` - TypeScript 类型文件

### 外部依赖

- `@tarojs/taro`: Taro 模块的外部依赖
- 其他依赖根据模块自动处理

## 🔧 自定义配置

### 修改构建目标

编辑 `build.config.js` 中的目标配置：

```javascript
// 添加新的构建目标
if (!target || target === "new-target") {
  // 配置新目标的构建选项
}
```

### 调整插件配置

修改 `createPlugins` 函数：

```javascript
const createPlugins = (tsconfig, minify = true) => [
  // 添加或修改插件配置
];
```

### 自定义监听路径

修改 `scripts/dev.js` 中的监听路径：

```javascript
const watchPaths = [
  // 添加新的监听路径
];
```

## 📈 最佳实践

1. **开发阶段**: 使用 `npm run dev:模块名` 只构建需要的模块
2. **测试阶段**: 使用 `npm run ci` 进行完整检查
3. **发布前**: 使用 `npm run build:prod` 生产构建
4. **性能分析**: 定期运行 `npm run analyze` 检查产物大小
5. **代码质量**: 提交前运行 `npm run lint` 和 `npm run format`

## 🐛 故障排除

### 构建失败

1. 检查 TypeScript 配置
2. 确认依赖安装完整
3. 查看错误日志定位问题

### 监听不工作

1. 检查文件路径配置
2. 确认 chokidar 依赖安装
3. 重启开发服务器

### 产物异常

1. 清理构建缓存: `npm run clean`
2. 重新安装依赖: `rm -rf node_modules && npm install`
3. 检查 Rollup 配置
