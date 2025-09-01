# SDK 构建+手动上传方案设计

## 方案概述

本方案将源代码构建过程与 sourcemap 上传过程完全分离：

- **构建阶段**: 在本地通过 SDK 执行构建，自动生成 sourcemap 文件
- **上传阶段**: 用户通过管理后台手动上传已生成的 sourcemap 文件
- **关联机制**: 通过版本号、构建 ID 等标识符关联源代码和 sourcemap

## 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   本地开发环境    │    │   SDK构建工具    │    │   管理后台      │
│                 │    │                 │    │                 │
│ 源代码项目       │───▶│ 执行构建命令     │───▶│ 手动上传        │
│ package.json    │    │ 生成sourcemap   │    │ sourcemap文件   │
│ 构建配置        │    │ 打包构建产物     │    │ 版本关联        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 详细实现方案

### 1. SDK 构建工具增强

#### 1.1 构建配置模板

```typescript
// sdk/build-templates/webpack.config.js
module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    clean: true,
  },
  devtool: "source-map", // 自动生成sourcemap
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        sourceMap: true, // 确保压缩时保留sourcemap
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            sourceMaps: true, // Babel也生成sourcemap
          },
        },
      },
    ],
  },
};

// sdk/build-templates/rollup.config.js
export default {
  input: "src/index.js",
  output: {
    file: "dist/bundle.js",
    format: "iife",
    sourcemap: true, // 生成sourcemap
    sourcemapExcludeSources: false, // 包含源代码内容
  },
  plugins: [
    typescript(),
    terser({
      sourcemap: true,
    }),
  ],
};

// sdk/build-templates/vite.config.js
export default {
  build: {
    sourcemap: true, // 生成sourcemap
    minify: "terser",
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false,
      },
    },
  },
};
```

#### 1.2 构建脚本生成器

```typescript
// sdk/src/build-script-generator.ts
export class BuildScriptGenerator {
  /**
   * 生成构建脚本
   */
  generateBuildScript(options: BuildScriptOptions): string {
    const { projectType, projectId, version, buildId } = options;

    return `#!/bin/bash
# 自动构建脚本 - ${projectType}项目
# 项目ID: ${projectId}
# 版本: ${version}
# 构建ID: ${buildId}

set -e

echo "🚀 开始构建项目: ${projectId}"
echo "📦 版本: ${version}"
echo "🔨 构建ID: ${buildId}"
echo "⏰ 开始时间: $(date)"

# 1. 安装依赖
echo "📥 安装依赖..."
if [ -f "package-lock.json" ]; then
  npm ci
elif [ -f "yarn.lock" ]; then
  yarn install --frozen-lockfile
else
  npm install
fi

# 2. 执行构建
echo "🔨 执行构建..."
case "${projectType}" in
  "webpack")
    npm run build:prod || npm run build
    ;;
  "rollup")
    npm run build:rollup || npm run build
    ;;
  "vite")
    npm run build:vite || npm run build
    ;;
  *)
    echo "❌ 不支持的构建类型: ${projectType}"
    exit 1
    ;;
esac

# 3. 验证构建产物
echo "✅ 验证构建产物..."
if [ ! -d "dist" ] && [ ! -d "build" ]; then
  echo "❌ 构建失败：未找到输出目录"
  exit 1
fi

# 4. 收集构建产物
echo "📁 收集构建产物..."
BUILD_DIR="dist"
if [ ! -d "dist" ]; then
  BUILD_DIR="build"
fi

mkdir -p upload
cp -r ${BUILD_DIR}/* upload/

# 5. 检查sourcemap文件
echo "🗺️ 检查sourcemap文件..."
sourcemap_count=$(find upload -name "*.map" | wc -l)
echo "📊 找到 ${sourcemap_count} 个sourcemap文件"

if [ $sourcemap_count -eq 0 ]; then
  echo "⚠️  警告: 未找到sourcemap文件"
  echo "💡 请检查构建配置是否启用了sourcemap生成"
  echo "🔧 建议配置: devtool: 'source-map' (webpack) 或 sourcemap: true (rollup/vite)"
fi

# 6. 生成构建报告
echo "📋 生成构建报告..."
cat > upload/build-report.json << EOF
{
  "projectId": "${projectId}",
  "version": "${version}",
  "buildId": "${buildId}",
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildType": "${projectType}",
  "sourcemapCount": ${sourcemap_count},
  "files": [
    $(find upload -type f -exec echo '    {"path": "{}", "size": '$(stat -f%z "{}" 2>/dev/null || stat -c%s "{}" 2>/dev/null || echo 0)', "type": "{}"}' \; | sed 's/upload\///g' | paste -sd ',' -)
  ]
}
EOF

# 7. 创建上传包
echo "📦 创建上传包..."
cd upload
zip -r "../${projectId}-${version}-${buildId}.zip" .

echo ""
echo "🎉 构建完成！"
echo "📁 上传文件: ${projectId}-${version}-${buildId}.zip"
echo "📊 包含 ${sourcemap_count} 个sourcemap文件"
echo "📋 构建报告: build-report.json"
echo ""
echo "📤 下一步：将此文件上传到源代码管理系统"
echo "🔗 上传地址：管理后台 → 源代码管理 → 上传源代码版本"
`;
  }

  /**
   * 生成package.json脚本
   */
  generatePackageScripts(options: BuildScriptOptions): Record<string, string> {
    const { projectType } = options;

    const scripts = {
      build: "webpack --mode production",
      "build:dev": "webpack --mode development",
      "build:prod": "webpack --mode production --env production",
      "build:analyze": "webpack --mode production --analyze",
    };

    switch (projectType) {
      case "rollup":
        scripts.build = "rollup -c";
        scripts["build:dev"] = "rollup -c --watch";
        scripts["build:prod"] = "rollup -c --environment NODE_ENV:production";
        break;

      case "vite":
        scripts.build = "vite build";
        scripts["build:dev"] = "vite build --mode development";
        scripts["build:prod"] = "vite build --mode production";
        scripts["preview"] = "vite preview";
        break;
    }

    return scripts;
  }

  /**
   * 生成CI/CD配置
   */
  generateCIConfig(options: BuildScriptOptions): string {
    const { projectType, projectId } = options;

    return `name: Build and Package

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      version:
        description: '版本号'
        required: true
        default: '1.0.0'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build project
      run: npm run build:prod
    
    - name: Generate build ID
      id: build_id
      run: echo "id=\${{ github.sha }}" >> \$GITHUB_OUTPUT
    
    - name: Package build artifacts
      run: |
        mkdir -p upload
        cp -r dist/* upload/ 2>/dev/null || cp -r build/* upload/ 2>/dev/null || true
        
        # 生成构建报告
        cat > upload/build-report.json << EOF
        {
          "projectId": "${projectId}",
          "version": "\${{ github.event.inputs.version || '1.0.0' }}",
          "buildId": "\${{ steps.build_id.outputs.id }}",
          "buildTime": "\$(date -u +%Y-%m-%dT%H:%M:%SZ)",
          "buildType": "${projectType}",
          "sourcemapCount": \$(find upload -name "*.map" | wc -l),
          "commit": "\${{ github.sha }}",
          "branch": "\${{ github.ref_name }}"
        }
        EOF
        
        # 创建上传包
        cd upload
        zip -r "../${projectId}-\${{ github.event.inputs.version || '1.0.0' }}-build-\${{ github.sha }}.zip" .
    
    - name: Upload build package
      uses: actions/upload-artifact@v3
      with:
        name: build-package
        path: ${projectId}-*.zip
    
    - name: Create Release
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: v\${{ github.event.inputs.version || '1.0.0' }}
        release_name: Release v\${{ github.event.inputs.version || '1.0.0' }}
        body: |
          ## 构建完成
          
          - 项目: ${projectId}
          - 版本: \${{ github.event.inputs.version || '1.0.0' }}
          - 构建ID: \${{ github.sha }}
          - 构建时间: \$(date -u +%Y-%m-%dT%H:%M:%SZ)
          
          ## 下载
          
          请下载构建包并上传到源代码管理系统：
          \${projectId}-\${{ github.event.inputs.version || '1.0.0' }}-build-\${{ github.sha }}.zip
        draft: false
        prerelease: false`;
  }
}

interface BuildScriptOptions {
  projectType: "webpack" | "rollup" | "vite";
  projectId: string;
  version: string;
  buildId: string;
}
```

#### 1.3 SDK 命令行工具

```typescript
// sdk/src/cli/build-command.ts
import { Command } from "commander";
import { BuildScriptGenerator } from "../build-script-generator";
import { ProjectAnalyzer } from "../project-analyzer";
import { BuildExecutor } from "../build-executor";

export class BuildCommand {
  private program: Command;
  private buildScriptGenerator: BuildScriptGenerator;
  private projectAnalyzer: ProjectAnalyzer;
  private buildExecutor: BuildExecutor;

  constructor() {
    this.program = new Command();
    this.buildScriptGenerator = new BuildScriptGenerator();
    this.projectAnalyzer = new ProjectAnalyzer();
    this.buildExecutor = new BuildExecutor();

    this.setupCommands();
  }

  private setupCommands() {
    this.program
      .name("monitor-sdk")
      .description("Monitor SDK 构建工具")
      .version("1.0.0");

    this.program
      .command("build")
      .description("构建项目并生成sourcemap")
      .option("-p, --project-id <id>", "项目ID")
      .option("-v, --version <version>", "版本号")
      .option("-t, --type <type>", "构建类型 (webpack|rollup|vite)")
      .option("--auto-detect", "自动检测项目类型")
      .option("--generate-script", "生成构建脚本")
      .option("--execute", "执行构建")
      .action(this.handleBuild.bind(this));

    this.program
      .command("init")
      .description("初始化项目构建配置")
      .option("-p, --project-id <id>", "项目ID")
      .option("-t, --type <type>", "构建类型")
      .action(this.handleInit.bind(this));

    this.program
      .command("package")
      .description("打包构建产物")
      .option("-p, --project-id <id>", "项目ID")
      .option("-v, --version <version>", "版本号")
      .option("-b, --build-id <id>", "构建ID")
      .action(this.handlePackage.bind(this));
  }

  private async handleBuild(options: any) {
    try {
      const projectId = options.projectId || (await this.promptProjectId());
      const version = options.version || (await this.promptVersion());
      const buildId = this.generateBuildId();

      // 自动检测项目类型
      let projectType = options.type;
      if (options.autoDetect || !projectType) {
        projectType = await this.projectAnalyzer.detectProjectType();
        console.log(`🔍 检测到项目类型: ${projectType}`);
      }

      // 生成构建脚本
      if (options.generateScript) {
        const script = this.buildScriptGenerator.generateBuildScript({
          projectType,
          projectId,
          version,
          buildId,
        });

        const scriptPath = `build-${projectId}.sh`;
        require("fs").writeFileSync(scriptPath, script);
        require("fs").chmodSync(scriptPath, "755");

        console.log(`📝 构建脚本已生成: ${scriptPath}`);
        console.log(`🚀 执行命令: ./${scriptPath}`);
      }

      // 执行构建
      if (options.execute) {
        console.log("🔨 开始执行构建...");
        await this.buildExecutor.execute({
          projectType,
          projectId,
          version,
          buildId,
        });
      }

      // 生成package.json脚本
      const packageScripts = this.buildScriptGenerator.generatePackageScripts({
        projectType,
        projectId,
        version,
        buildId,
      });

      console.log("\n📋 建议的package.json脚本:");
      Object.entries(packageScripts).forEach(([name, script]) => {
        console.log(`  "${name}": "${script}"`);
      });

      console.log(`\n🎯 下一步：`);
      console.log(`1. 执行构建: npm run build:prod`);
      console.log(`2. 检查dist目录中的sourcemap文件`);
      console.log(`3. 将构建产物上传到源代码管理系统`);
    } catch (error) {
      console.error("❌ 构建失败:", error.message);
      process.exit(1);
    }
  }

  private async handleInit(options: any) {
    try {
      const projectId = options.projectId || (await this.promptProjectId());
      const projectType = options.type || (await this.promptProjectType());

      console.log(`🚀 初始化项目: ${projectId}`);
      console.log(`🔧 构建类型: ${projectType}`);

      // 生成配置文件
      await this.generateConfigFiles(projectId, projectType);

      console.log("✅ 项目初始化完成！");
      console.log("📝 请检查生成的配置文件并根据需要调整");
    } catch (error) {
      console.error("❌ 初始化失败:", error.message);
      process.exit(1);
    }
  }

  private async handlePackage(options: any) {
    try {
      const projectId = options.projectId || (await this.promptProjectId());
      const version = options.version || (await this.promptVersion());
      const buildId = options.buildId || this.generateBuildId();

      console.log(`📦 打包项目: ${projectId} v${version}`);

      // 检查构建产物
      const buildDir = await this.findBuildDirectory();
      if (!buildDir) {
        throw new Error("未找到构建产物目录 (dist 或 build)");
      }

      // 创建上传包
      const packagePath = await this.createUploadPackage(
        projectId,
        version,
        buildId,
        buildDir
      );

      console.log(`✅ 打包完成: ${packagePath}`);
      console.log(`📤 请将此文件上传到源代码管理系统`);
    } catch (error) {
      console.error("❌ 打包失败:", error.message);
      process.exit(1);
    }
  }

  private generateBuildId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async promptProjectId(): Promise<string> {
    // 实现交互式提示
    return "my-project";
  }

  private async promptVersion(): Promise<string> {
    return "1.0.0";
  }

  private async promptProjectType(): Promise<string> {
    return "webpack";
  }

  run() {
    this.program.parse();
  }
}
```

### 2. 管理后台手动上传功能

#### 2.1 增强的源代码上传组件

```typescript
// admin/src/components/EnhancedSourceCodeUpload/EnhancedSourceCodeUpload.tsx
import React, { useState } from "react";
import {
  Card,
  Upload,
  Button,
  Space,
  Alert,
  Typography,
  Tag,
  Divider,
  message,
} from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  CodeOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { SourcemapValidator } from "../../utils/sourcemapValidator";
import "./EnhancedSourceCodeUpload.css";

const { Title, Text, Paragraph } = Typography;

interface EnhancedSourceCodeUploadProps {
  projectId: string;
  onUploadComplete?: (result: any) => void;
  showSourcemapValidation?: boolean;
}

export const EnhancedSourceCodeUpload: React.FC<
  EnhancedSourceCodeUploadProps
> = ({ projectId, onUploadComplete, showSourcemapValidation = true }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<
    "source" | "sourcemap" | "combined"
  >("combined");
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleUpload = async (file: File) => {
    if (!projectId) {
      message.error("请先选择项目");
      return false;
    }

    setUploading(true);

    try {
      if (uploadType === "combined") {
        // 处理包含源代码和sourcemap的压缩包
        const result = await this.uploadCombinedPackage(file);

        if (showSourcemapValidation) {
          // 验证sourcemap文件
          const validation = await this.validateSourcemapFiles(result);
          setValidationResult(validation);
        }

        onUploadComplete?.(result);
        message.success("源代码和sourcemap上传成功");
      } else if (uploadType === "sourcemap") {
        // 仅上传sourcemap文件
        const result = await this.uploadSourcemapOnly(file);
        onUploadComplete?.(result);
        message.success("Sourcemap文件上传成功");
      } else {
        // 仅上传源代码
        const result = await this.uploadSourceCodeOnly(file);
        onUploadComplete?.(result);
        message.success("源代码上传成功");
      }
    } catch (error: any) {
      console.error("上传失败:", error);
      message.error(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }

    return false;
  };

  const renderUploadGuide = () => (
    <div className="upload-guide">
      <Title level={4}>📋 上传指南</Title>

      <div className="guide-section">
        <Text strong>🎯 推荐方式：SDK本地构建 + 手动上传</Text>
        <Paragraph>
          1. 使用SDK构建工具在本地生成sourcemap文件 2. 将构建产物（JS +
          sourcemap）打包成zip文件 3. 通过此界面上传压缩包
        </Paragraph>
      </div>

      <div className="guide-section">
        <Text strong>🔧 SDK构建命令</Text>
        <Paragraph>
          <Text code>
            npx monitor-sdk build --project-id {projectId} --execute
          </Text>
          <br />
          <Text type="secondary">此命令将自动检测项目类型并执行构建</Text>
        </Paragraph>
      </div>

      <div className="guide-section">
        <Text strong>📦 构建产物结构</Text>
        <Paragraph>
          <Text code>dist/</Text> 或 <Text code>build/</Text> 目录应包含：
          <ul>
            <li>JavaScript文件 (.js)</li>
            <li>Sourcemap文件 (.map)</li>
            <li>其他资源文件</li>
          </ul>
        </Paragraph>
      </div>

      <div className="guide-section">
        <Text strong>⚠️ 注意事项</Text>
        <Paragraph>
          <ul>
            <li>确保构建配置启用了sourcemap生成</li>
            <li>JS文件和sourcemap文件版本必须一致</li>
            <li>保持文件路径结构不变</li>
            <li>建议使用压缩包格式上传</li>
          </ul>
        </Paragraph>
      </div>
    </div>
  );

  const renderValidationResult = () => {
    if (!validationResult) return null;

    const { isValid, summary, issues } = validationResult;

    return (
      <div className="validation-result">
        <Title level={4}>🔍 Sourcemap验证结果</Title>

        <div className="validation-summary">
          <Space>
            <Tag color={isValid ? "green" : "red"}>
              {isValid ? "✅ 验证通过" : "❌ 验证失败"}
            </Tag>
            <Text>覆盖率: {summary.coverage}%</Text>
            <Text>Sourcemap文件: {summary.sourcemapFiles}</Text>
            <Text>问题数量: {issues.length}</Text>
          </Space>
        </div>

        {issues.length > 0 && (
          <div className="validation-issues">
            <Title level={5}>⚠️ 发现的问题</Title>
            {issues.map((issue: any, index: number) => (
              <Alert
                key={index}
                message={issue.file}
                description={issue.message}
                type={issue.severity === "error" ? "error" : "warning"}
                showIcon
                style={{ marginBottom: 8 }}
              />
            ))}
          </div>
        )}

        {!isValid && (
          <Alert
            message="验证失败"
            description="请检查构建配置和sourcemap文件，修复问题后重新上传"
            type="error"
            showIcon
          />
        )}
      </div>
    );
  };

  return (
    <Card
      title={
        <Space>
          <CodeOutlined />
          <span>增强源代码上传</span>
          <Tag color="blue">SDK构建 + 手动上传</Tag>
        </Space>
      }
      className="enhanced-source-code-upload"
    >
      <div className="upload-content">
        {/* 上传指南 */}
        {renderUploadGuide()}

        <Divider />

        {/* 上传类型选择 */}
        <div className="upload-type-selector">
          <Text strong>选择上传类型：</Text>
          <Space>
            <Button
              type={uploadType === "combined" ? "primary" : "default"}
              onClick={() => setUploadType("combined")}
            >
              📦 源代码 + Sourcemap (推荐)
            </Button>
            <Button
              type={uploadType === "source" ? "primary" : "default"}
              onClick={() => setUploadType("source")}
            >
              📄 仅源代码
            </Button>
            <Button
              type={uploadType === "sourcemap" ? "primary" : "default"}
              onClick={() => setUploadType("sourcemap")}
            >
              🗺️ 仅Sourcemap
            </Button>
          </Space>
        </div>

        {/* 上传区域 */}
        <div className="upload-area">
          <Upload.Dragger
            accept={
              uploadType === "sourcemap"
                ? ".map,.zip,.tar,.gz"
                : ".zip,.tar,.gz"
            }
            beforeUpload={handleUpload}
            disabled={uploading}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              {uploadType === "combined" && "点击或拖拽压缩包到此区域上传"}
              {uploadType === "source" && "点击或拖拽源代码压缩包到此区域上传"}
              {uploadType === "sourcemap" &&
                "点击或拖拽sourcemap文件到此区域上传"}
            </p>
            <p className="ant-upload-hint">
              {uploadType === "combined" &&
                "支持包含JS文件和sourcemap文件的压缩包"}
              {uploadType === "source" && "支持ZIP、TAR、GZ等格式"}
              {uploadType === "sourcemap" && "支持.map文件或压缩包"}
            </p>
          </Upload.Dragger>
        </div>

        {/* 验证结果 */}
        {showSourcemapValidation && renderValidationResult()}

        {/* 快速操作 */}
        <Divider />
        <div className="quick-actions">
          <Text strong>🚀 快速操作：</Text>
          <Space>
            <Button
              icon={<CodeOutlined />}
              onClick={() => window.open("/sdk-guide", "_blank")}
            >
              查看SDK使用指南
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => window.open("/build-templates", "_blank")}
            >
              下载构建配置模板
            </Button>
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => window.open("/sourcemap-guide", "_blank")}
            >
              查看Sourcemap生成指南
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedSourceCodeUpload;
```

#### 2.2 上传验证服务

```typescript
// admin/src/services/enhancedUploadService.ts
import { apiClient } from "./api";
import { SourcemapValidator } from "../utils/sourcemapValidator";

export class EnhancedUploadService {
  private sourcemapValidator: SourcemapValidator;

  constructor() {
    this.sourcemapValidator = new SourcemapValidator();
  }

  /**
   * 上传包含源代码和sourcemap的压缩包
   */
  async uploadCombinedPackage(file: File, projectId: string): Promise<any> {
    try {
      // 1. 解压并分析文件
      const extractedFiles = await this.extractAndAnalyze(file);

      // 2. 分离源代码和sourcemap文件
      const { sourceFiles, sourcemapFiles } =
        this.separateFiles(extractedFiles);

      // 3. 验证sourcemap文件
      const validationResult =
        await this.sourcemapValidator.validateSourcemapConsistency(
          sourceFiles,
          sourcemapFiles
        );

      // 4. 上传源代码
      const sourceCodeResult = await this.uploadSourceCode(
        sourceFiles,
        projectId
      );

      // 5. 上传sourcemap文件
      const sourcemapResult = await this.uploadSourcemaps(
        sourcemapFiles,
        projectId
      );

      // 6. 关联版本信息
      await this.associateVersions(
        sourceCodeResult.versionId,
        sourcemapResult.sourcemapIds
      );

      return {
        success: true,
        sourceCode: sourceCodeResult,
        sourcemaps: sourcemapResult,
        validation: validationResult,
        message: "源代码和sourcemap上传成功",
      };
    } catch (error) {
      throw new Error(`上传失败: ${error.message}`);
    }
  }

  /**
   * 仅上传sourcemap文件
   */
  async uploadSourcemapOnly(file: File, projectId: string): Promise<any> {
    try {
      const extractedFiles = await this.extractAndAnalyze(file);
      const sourcemapFiles = extractedFiles.filter((f) =>
        f.name.endsWith(".map")
      );

      if (sourcemapFiles.length === 0) {
        throw new Error("未找到sourcemap文件");
      }

      const result = await this.uploadSourcemaps(sourcemapFiles, projectId);

      return {
        success: true,
        sourcemaps: result,
        message: `成功上传 ${sourcemapFiles.length} 个sourcemap文件`,
      };
    } catch (error) {
      throw new Error(`Sourcemap上传失败: ${error.message}`);
    }
  }

  /**
   * 仅上传源代码
   */
  async uploadSourceCodeOnly(file: File, projectId: string): Promise<any> {
    try {
      const extractedFiles = await this.extractAndAnalyze(file);
      const sourceFiles = extractedFiles.filter(
        (f) => !f.name.endsWith(".map")
      );

      const result = await this.uploadSourceCode(sourceFiles, projectId);

      return {
        success: true,
        sourceCode: result,
        message: "源代码上传成功",
      };
    } catch (error) {
      throw new Error(`源代码上传失败: ${error.message}`);
    }
  }

  /**
   * 解压并分析文件
   */
  private async extractAndAnalyze(file: File): Promise<any[]> {
    // 实现文件解压和分析逻辑
    return [];
  }

  /**
   * 分离源代码和sourcemap文件
   */
  private separateFiles(files: any[]): {
    sourceFiles: any[];
    sourcemapFiles: any[];
  } {
    const sourceFiles = files.filter((f) => !f.name.endsWith(".map"));
    const sourcemapFiles = files.filter((f) => f.name.endsWith(".map"));

    return { sourceFiles, sourcemapFiles };
  }

  /**
   * 上传源代码
   */
  private async uploadSourceCode(
    files: any[],
    projectId: string
  ): Promise<any> {
    // 调用现有的源代码上传API
    return await apiClient.sourceCode.uploadArchive({
      projectId,
      archive: "base64_content",
      fileName: "source-code.zip",
      archiveType: "zip",
    });
  }

  /**
   * 上传sourcemap文件
   */
  private async uploadSourcemaps(
    files: any[],
    projectId: string
  ): Promise<any> {
    // 调用现有的sourcemap上传API
    const uploadData = files.map((file) => ({
      projectId,
      sourcemap: file.content,
      fileName: file.name,
      filePath: file.path,
    }));

    return await apiClient.sourcemapUpload.batchUpload({
      projectId,
      files: uploadData,
    });
  }

  /**
   * 关联版本信息
   */
  private async associateVersions(
    sourceCodeVersionId: string,
    sourcemapIds: string[]
  ): Promise<void> {
    // 实现版本关联逻辑
  }
}

export default EnhancedUploadService;
```

### 3. 使用流程

#### 3.1 本地构建流程

```bash
# 1. 安装SDK
npm install @monitor/sdk

# 2. 初始化项目
npx monitor-sdk init --project-id my-project --type webpack

# 3. 执行构建
npx monitor-sdk build --project-id my-project --execute

# 4. 检查构建产物
ls -la dist/
# 应该看到 .js 和 .map 文件

# 5. 打包上传
npx monitor-sdk package --project-id my-project --version 1.0.0
```

#### 3.2 管理后台上传流程

1. 用户登录管理后台
2. 进入源代码管理页面
3. 选择"增强源代码上传"组件
4. 选择上传类型（推荐：源代码+Sourcemap）
5. 拖拽或选择本地构建的压缩包
6. 系统自动验证和关联文件
7. 上传完成，显示验证结果

### 4. 优势特点

#### 4.1 构建过程优势

- **本地执行**: 构建在用户本地环境执行，性能更好
- **环境一致**: 使用项目原有的依赖和配置
- **调试友好**: 支持本地调试和热重载
- **版本控制**: 构建产物与源代码版本完全一致

#### 4.2 上传过程优势

- **灵活选择**: 支持多种上传方式组合
- **自动验证**: 系统自动验证文件一致性
- **版本关联**: 自动关联源代码和 sourcemap 版本
- **用户友好**: 提供详细的上传指南和验证反馈

#### 4.3 整体架构优势

- **职责分离**: 构建和上传完全分离，职责清晰
- **可扩展性**: 支持多种构建工具和项目类型
- **标准化**: 统一的构建流程和上传接口
- **维护性**: 减少系统复杂度，降低维护成本

## 总结

这个方案通过 SDK 本地构建 + 管理后台手动上传的方式，实现了构建和上传过程的完全分离。用户可以在本地使用熟悉的构建工具生成高质量的 sourcemap 文件，然后通过管理后台的友好界面上传和验证。这种方式既保证了构建过程的灵活性和性能，又提供了良好的用户体验和系统可靠性。
