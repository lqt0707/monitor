# Monitor SDK 源代码打包工具

简化的源代码打包API，让用户无需手动运行复杂的打包脚本。

## 快速开始

### 基础用法

```javascript
import { packSourceCode } from "@monitor/sdk";

// 最简单的用法
const result = await packSourceCode();

if (result.success) {
  console.log("打包成功！");
  console.log("文件数量:", result.stats.totalFiles);
  console.log("压缩包路径:", result.output.zipPath);
} else {
  console.error("打包失败:", result.error);
}
```

### 自定义配置

```javascript
import { packSourceCode, getRecommendedConfig } from "@monitor/sdk";

// 使用推荐配置
const config = getRecommendedConfig("taro");
const result = await packSourceCode({
  ...config,
  verbose: true,
  mode: "advanced",
});
```

### 完整配置示例

```javascript
const result = await packSourceCode({
  projectRoot: "./my-project",
  outputDir: "source-package",
  createZip: true,
  verbose: true,
  mode: "advanced",
  includePatterns: ["src/**/*", "config/**/*", "custom/**/*"],
  excludePatterns: ["node_modules/**/*", "*.log", "temp/**/*"],
});
```

## API 参考

### packSourceCode(options?)

主要的打包函数。

**参数:**

- `options` (PackOptions, 可选): 打包配置选项

**返回值:**

- `Promise<PackResult>`: 打包结果

### PackOptions

| 属性            | 类型                  | 默认值                | 描述               |
| --------------- | --------------------- | --------------------- | ------------------ |
| projectRoot     | string                | process.cwd()         | 项目根目录         |
| outputDir       | string                | 'source-code-package' | 输出目录           |
| createZip       | boolean               | true                  | 是否创建压缩包     |
| verbose         | boolean               | false                 | 是否启用详细日志   |
| mode            | 'basic' \| 'advanced' | 'basic'               | 打包模式           |
| includePatterns | string[]              | []                    | 额外包含的文件模式 |
| excludePatterns | string[]              | []                    | 额外排除的文件模式 |

### PackResult

```typescript
interface PackResult {
  success: boolean; // 是否成功
  error?: string; // 错误信息
  stats: {
    totalFiles: number; // 文件总数
    totalSize: number; // 总大小（字节）
    processedFiles: number; // 处理的文件数
    skippedFiles: number; // 跳过的文件数
  };
  output: {
    directory: string; // 输出目录路径
    zipPath?: string; // 压缩包路径
  };
  duration: number; // 打包耗时（毫秒）
}
```

### getRecommendedConfig(projectType?)

获取推荐的打包配置。

**参数:**

- `projectType` ('web' | 'taro', 可选): 项目类型

**返回值:**

- `PackOptions`: 推荐的配置选项

## 项目类型检测

工具会自动检测项目类型：

- **Taro项目**: 检测 `config/index.ts`、`project.config.json` 或 package.json 中的 Taro 依赖
- **Web项目**: 检测 package.json 中的 React、Vue 或 Angular 依赖
- **未知项目**: 使用通用配置

## 使用场景

### 1. 在监控SDK初始化时自动打包

```javascript
import Monitor, { packSourceCode } from "@monitor/sdk";

// 初始化监控
Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://your-api.com",
});

// 自动打包源代码
packSourceCode({ verbose: true }).then((result) => {
  if (result.success) {
    console.log("源代码包已准备就绪，可上传到监控平台");
  }
});
```

### 2. 在构建脚本中集成

```javascript
// build.js
import { packSourceCode } from "@monitor/sdk";

async function build() {
  // 执行项目构建
  await runBuild();

  // 打包源代码
  const result = await packSourceCode({
    mode: "advanced",
    createZip: true,
  });

  if (result.success) {
    console.log("构建完成，源代码包已生成");
  }
}
```

### 3. 在CI/CD中使用

```javascript
// ci-pack.js
import { packSourceCode } from "@monitor/sdk";

const result = await packSourceCode({
  verbose: process.env.CI_DEBUG === "true",
  zipName: `source-${process.env.BUILD_NUMBER}.zip`,
});

if (!result.success) {
  process.exit(1);
}
```

## 错误处理

```javascript
try {
  const result = await packSourceCode();

  if (!result.success) {
    console.error("打包失败:", result.error);
    // 处理失败情况
  }
} catch (error) {
  console.error("打包过程中发生异常:", error);
}
```

## 注意事项

1. **权限要求**: 需要读取项目文件和写入输出目录的权限
2. **依赖要求**: 需要 Node.js 环境和相关的打包脚本
3. **文件大小**: 大型项目可能需要较长的打包时间
4. **临时文件**: 工具会创建临时配置文件，使用后会自动清理

## 故障排除

### 常见问题

**Q: 打包脚本不存在错误**
A: 确保 SDK 完整安装，包含 examples 目录下的打包脚本

**Q: 权限错误**
A: 检查项目目录的读写权限

**Q: 文件过多导致打包缓慢**
A: 使用 `excludePatterns` 排除不必要的文件

**Q: 压缩包创建失败**
A: 检查系统是否安装了 zip 命令，或设置 `createZip: false`
