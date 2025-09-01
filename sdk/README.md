# Monitor SDK

多平台前端监控SDK解决方案，支持自动环境检测，Web、Taro小程序一站式监控方案。

## 安装

```bash
# 安装核心包（包含所有平台功能）
npm install @monitor/sdk

# 或者从本地安装（开发阶段）
npm install /path/to/monitor/sdk
```

## 基本使用

```javascript
// Web项目
import Monitor from "@monitor/web-sdk";

// 初始化
Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://your-monitor-server.com",
  // 其他配置...
});

// Taro小程序项目
import Monitor from "@monitor/sdk";

// 初始化
Monitor.init({
  projectId: "your-project-id",
  serverUrl: "https://your-monitor-server.com",
  // 其他配置...
});
```

## 源代码打包工具

为了更好地进行错误定位和分析，Monitor SDK提供了源代码打包工具，可以将项目源代码打包并上传到监控平台。

### 命令行方式

可以通过以下命令打包源代码：

```bash
npx @monitor/sdk pack-source [选项]
```

**注意**: 如果 `@monitor/sdk` 尚未发布到npm，可以使用本地路径运行：
```bash
# 使用相对路径（推荐）
node ./bin/pack-source.cjs [选项]

# 或者使用绝对路径
node /path/to/monitor/sdk/bin/pack-source.cjs [选项]
```

选项：

- `--mode=basic|advanced`：打包模式（默认：advanced）
- `--verbose`, `-v`：启用详细日志
- `--no-zip`：不创建压缩包
- `--help`, `-h`：显示帮助信息

示例：

```bash
npx @monitor/sdk pack-source                    # 智能打包
npx @monitor/sdk pack-source --mode=basic       # 基础模式
npx @monitor/sdk pack-source --verbose          # 详细日志
npx @monitor/sdk pack-source --no-zip           # 不创建压缩包
```

### 代码方式

也可以在代码中使用API进行打包：

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

### 配置选项

| 属性            | 类型                  | 默认值                | 描述               |
| --------------- | --------------------- | --------------------- | ------------------ |
| projectRoot     | string                | process.cwd()         | 项目根目录         |
| outputDir       | string                | 'source-code-package' | 输出目录           |
| createZip       | boolean               | true                  | 是否创建压缩包     |
| verbose         | boolean               | false                 | 是否启用详细日志   |
| mode            | 'basic' \| 'advanced' | 'basic'               | 打包模式           |
| includePatterns | string[]              | []                    | 额外包含的文件模式 |
| excludePatterns | string[]              | []                    | 额外排除的文件模式 |

### 使用场景

#### 1. 在监控SDK初始化时自动打包

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

#### 2. 在构建脚本中集成

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

#### 3. 在CI/CD中使用

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

## 高级功能

// 其他SDK高级功能文档...

## API参考

// API参考文档...

## 贡献指南

// 贡献指南...

## 许可证

MIT
