# Sourcemap 生成方案设计

## 系统现状分析

### 当前架构

- **源代码上传系统**: 支持 ZIP/TAR 压缩包上传，自动解压和文件分析
- **Sourcemap 上传系统**: 支持单个文件、批量文件和压缩包上传
- **错误定位系统**: 基于 sourcemap 进行错误堆栈到源代码的映射
- **版本管理**: 支持多版本源代码和 sourcemap 的存储管理

### 现有功能

- ✅ 源代码压缩包上传和解压
- ✅ Sourcemap 文件上传和验证
- ✅ 错误位置解析和源代码关联
- ✅ 版本化存储管理

## 方案设计

### 方案一：用户手动生成上传（推荐）

#### 实现方式

用户使用构建工具（webpack、rollup、vite 等）生成 sourcemap 文件，然后上传到系统。

#### 技术实现

```typescript
// 1. 构建配置示例
// webpack.config.js
module.exports = {
  mode: "production",
  devtool: "source-map", // 生成完整sourcemap
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "dist"),
  },
};

// rollup.config.js
export default {
  input: "src/main.js",
  output: {
    file: "dist/bundle.js",
    format: "iife",
    sourcemap: true, // 生成sourcemap
  },
};

// vite.config.js
export default {
  build: {
    sourcemap: true, // 生成sourcemap
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false,
      },
    },
  },
};
```

#### 操作指引

1. **构建配置**: 在构建工具中启用 sourcemap 生成
2. **文件收集**: 收集构建产物（JS 文件）和对应的 sourcemap 文件
3. **打包上传**: 将 JS 文件和 sourcemap 文件打包上传
4. **版本关联**: 确保 JS 文件和 sourcemap 文件版本一致

#### 优点

- **可靠性高**: 使用成熟的构建工具，生成质量有保障
- **灵活性好**: 支持各种构建配置和优化选项
- **性能影响小**: 不影响系统构建性能
- **调试友好**: 支持开发环境的热重载和调试
- **标准化**: 符合前端工程化最佳实践

#### 缺点

- **用户操作复杂**: 需要配置构建工具和手动上传
- **版本同步**: 需要确保 JS 文件和 sourcemap 文件版本一致
- **存储空间**: 需要存储额外的 sourcemap 文件

### 方案二：系统自动生成

#### 实现方式

系统接收源代码后，自动调用构建工具生成 sourcemap 文件。

#### 技术实现

```typescript
// 1. 构建工具集成
import { exec } from "child_process";
import { promisify } from "util";
import * as webpack from "webpack";
import { rollup } from "rollup";

export class AutoSourcemapGenerator {
  private readonly tempDir: string;
  private readonly buildConfig: BuildConfig;

  constructor(config: BuildConfig) {
    this.tempDir = path.join(os.tmpdir(), "auto-build-");
    this.buildConfig = config;
  }

  // Webpack构建
  async generateWithWebpack(sourceCode: string): Promise<SourcemapResult> {
    const tempDir = await this.createTempDir();
    const webpackConfig = this.createWebpackConfig(tempDir);

    try {
      // 写入源代码文件
      await this.writeSourceFiles(sourceCode, tempDir);

      // 执行webpack构建
      const compiler = webpack(webpackConfig);
      const stats = await this.runWebpack(compiler);

      // 收集构建产物和sourcemap
      const result = await this.collectBuildOutput(tempDir, stats);

      return result;
    } finally {
      await this.cleanupTempDir(tempDir);
    }
  }

  // Rollup构建
  async generateWithRollup(sourceCode: string): Promise<SourcemapResult> {
    const tempDir = await this.createTempDir();
    const rollupConfig = this.createRollupConfig(tempDir);

    try {
      await this.writeSourceFiles(sourceCode, tempDir);

      const bundle = await rollup(rollupConfig);
      const { output } = await bundle.generate({
        format: "iife",
        sourcemap: true,
      });

      const result = await this.processRollupOutput(output, tempDir);
      return result;
    } finally {
      await this.cleanupTempDir(tempDir);
    }
  }

  // 检测项目类型并选择合适的构建工具
  async detectProjectType(sourceCode: string): Promise<ProjectType> {
    const packageJson = await this.findPackageJson(sourceCode);

    if (
      packageJson.dependencies?.webpack ||
      packageJson.devDependencies?.webpack
    ) {
      return "webpack";
    } else if (
      packageJson.dependencies?.rollup ||
      packageJson.devDependencies?.rollup
    ) {
      return "rollup";
    } else if (
      packageJson.dependencies?.vite ||
      packageJson.devDependencies?.vite
    ) {
      return "vite";
    } else {
      return "generic";
    }
  }
}

// 2. 构建配置生成
interface BuildConfig {
  projectType: "webpack" | "rollup" | "vite" | "generic";
  entryPoint: string;
  outputDir: string;
  sourcemapType: "source-map" | "hidden-source-map" | "nosources-source-map";
  minify: boolean;
  target: string[];
}

// 3. 集成到源代码上传流程
export class SourceCodeVersionService {
  private autoSourcemapGenerator: AutoSourcemapGenerator;

  async uploadSourceCodeVersion(
    dto: UploadSourceCodeVersionDto
  ): Promise<UploadResult> {
    // 1. 解压源代码
    const sourceFiles = await this.extractSourceCode(dto);

    // 2. 检测项目类型
    const projectType = await this.autoSourcemapGenerator.detectProjectType(
      sourceFiles
    );

    // 3. 自动生成sourcemap
    if (this.shouldAutoGenerateSourcemap(projectType, dto)) {
      const sourcemapResult = await this.autoSourcemapGenerator.generate(
        projectType,
        sourceFiles
      );

      // 4. 存储sourcemap文件
      await this.storeSourcemapFiles(sourcemapResult);
    }

    // 5. 继续原有的源代码处理流程
    return await this.processSourceCode(sourceFiles);
  }
}
```

#### 优点

- **自动化程度高**: 用户无需手动配置构建工具
- **版本一致性**: 自动确保源代码和 sourcemap 版本匹配
- **用户体验好**: 一键上传，自动处理
- **标准化**: 统一的构建配置和输出格式

#### 缺点

- **技术复杂度高**: 需要集成多种构建工具
- **构建性能影响**: 增加源代码上传时间
- **资源消耗大**: 需要临时构建环境和计算资源
- **兼容性问题**: 不同项目构建配置差异大
- **维护成本高**: 需要持续跟进构建工具版本更新

## 推荐方案对比

| 特性           | 方案一：手动生成 | 方案二：自动生成 |
| -------------- | ---------------- | ---------------- |
| **实现复杂度** | 低               | 高               |
| **可靠性**     | 高               | 中               |
| **性能影响**   | 无               | 大               |
| **用户体验**   | 中               | 高               |
| **维护成本**   | 低               | 高               |
| **灵活性**     | 高               | 中               |
| **标准化程度** | 高               | 中               |

## 最终推荐

### 推荐方案一：用户手动生成上传

#### 理由

1. **技术成熟**: 基于现有成熟的构建工具生态
2. **性能友好**: 不影响系统性能，不增加上传时间
3. **维护简单**: 无需维护复杂的构建工具集成
4. **用户可控**: 用户可以根据项目需求定制构建配置
5. **标准化**: 符合前端工程化最佳实践

### 实施方案

#### 1. 完善用户指引

```typescript
// 创建构建配置生成器
export class BuildConfigGenerator {
  generateWebpackConfig(projectType: string): string {
    const templates = {
      react: this.getReactWebpackConfig(),
      vue: this.getVueWebpackConfig(),
      angular: this.getAngularWebpackConfig(),
      generic: this.getGenericWebpackConfig(),
    };

    return templates[projectType] || templates.generic;
  }

  generateRollupConfig(projectType: string): string {
    // 类似webpack配置生成
  }

  generateViteConfig(projectType: string): string {
    // Vite配置生成
  }
}
```

#### 2. 提供构建脚本

```bash
#!/bin/bash
# build-and-upload.sh

PROJECT_ID=$1
VERSION=$2
BUILD_TYPE=${3:-webpack}

echo "开始构建项目: $PROJECT_ID, 版本: $VERSION"

# 安装依赖
npm install

# 根据类型构建
case $BUILD_TYPE in
  "webpack")
    npm run build:prod
    ;;
  "rollup")
    npm run build:rollup
    ;;
  "vite")
    npm run build:vite
    ;;
  *)
    echo "不支持的构建类型: $BUILD_TYPE"
    exit 1
    ;;
esac

# 收集构建产物
echo "收集构建产物..."
mkdir -p upload
cp -r dist/* upload/
cp -r dist/*.map upload/ 2>/dev/null || true

# 创建上传包
cd upload
zip -r "../${PROJECT_ID}-${VERSION}.zip" .

echo "构建完成，文件: ${PROJECT_ID}-${VERSION}.zip"
echo "请将此文件上传到源代码管理系统"
```

#### 3. 增强上传验证

```typescript
export class SourcemapValidator {
  async validateSourcemapConsistency(
    sourceFiles: SourceFile[],
    sourcemapFiles: SourcemapFile[]
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // 检查JS文件和sourcemap文件是否匹配
    for (const sourceFile of sourceFiles) {
      if (sourceFile.type === "javascript") {
        const sourcemapFile = sourcemapFiles.find(
          (sm) => sm.sourceFile === sourceFile.name
        );

        if (!sourcemapFile) {
          issues.push({
            type: "missing_sourcemap",
            file: sourceFile.name,
            severity: "warning",
            message: "JavaScript文件缺少对应的sourcemap文件",
          });
        } else {
          // 验证sourcemap文件的有效性
          const isValid = await this.validateSourcemapFile(sourcemapFile);
          if (!isValid) {
            issues.push({
              type: "invalid_sourcemap",
              file: sourcemapFile.name,
              severity: "error",
              message: "Sourcemap文件格式无效",
            });
          }
        }
      }
    }

    return {
      isValid: issues.filter((i) => i.severity === "error").length === 0,
      issues,
      warnings: issues.filter((i) => i.severity === "warning"),
      errors: issues.filter((i) => i.severity === "error"),
    };
  }
}
```

#### 4. 提供最佳实践文档

````markdown
# Sourcemap 生成最佳实践

## 构建工具配置

### Webpack

```javascript
module.exports = {
  mode: "production",
  devtool: "source-map",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
      }),
    ],
  },
};
```
````

### Rollup

```javascript
export default {
  input: "src/main.js",
  output: {
    file: "dist/bundle.js",
    format: "iife",
    sourcemap: true,
  },
  plugins: [
    terser({
      sourcemap: true,
    }),
  ],
};
```

### Vite

```javascript
export default {
  build: {
    sourcemap: true,
    minify: "terser",
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false,
      },
    },
  },
};
```

## 上传流程

1. 配置构建工具生成 sourcemap
2. 执行构建命令
3. 收集构建产物（JS 文件 + sourcemap 文件）
4. 打包上传到系统
5. 系统自动验证文件一致性

```

## 总结

基于当前系统的架构和需求，推荐采用**方案一：用户手动生成上传**。该方案具有技术成熟、性能友好、维护简单等优势，能够满足大多数用户的需求。

同时，系统可以提供完善的用户指引、构建脚本和验证机制，降低用户的使用门槛，确保sourcemap文件的质量和一致性。
```
