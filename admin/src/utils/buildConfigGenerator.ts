/**
 * 构建配置生成器
 * 帮助用户生成各种构建工具的配置，用于生成sourcemap文件
 */

export interface BuildConfigOptions {
  projectType: 'react' | 'vue' | 'angular' | 'generic' | 'webpack' | 'rollup' | 'vite';
  entryPoint: string;
  outputDir: string;
  sourcemapType: 'source-map' | 'hidden-source-map' | 'nosources-source-map';
  minify: boolean;
  target: string[];
  framework?: string;
  useTypeScript?: boolean;
  useCSS?: boolean;
  useAssets?: boolean;
  projectId?: string;
  version?: string;
}

export class BuildConfigGenerator {
  /**
   * 生成Webpack配置
   */
  generateWebpackConfig(options: BuildConfigOptions): string {
    const { projectType, entryPoint, outputDir, sourcemapType, minify, target, useTypeScript, useCSS, useAssets } = options;
    
    const config = {
      mode: 'production',
      entry: entryPoint,
      output: {
        path: outputDir,
        filename: '[name].[contenthash].js',
        clean: true
      },
      devtool: sourcemapType,
      target: target,
      module: {
        rules: []
      },
      plugins: [],
      optimization: {
        minimize: minify,
        minimizer: []
      },
      resolve: {
        extensions: []
      }
    };

    // 添加TypeScript支持
    if (useTypeScript) {
      config.module.rules.push({
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      });
      config.resolve.extensions.push('.ts', '.tsx');
    }

    // 添加CSS支持
    if (useCSS) {
      config.module.rules.push(
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader']
        }
      );
    }

    // 添加资源文件支持
    if (useAssets) {
      config.module.rules.push({
        test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource'
      });
    }

    // 根据项目类型添加特定配置
    switch (projectType) {
      case 'react':
        config.resolve.extensions.push('.jsx');
        config.module.rules.push({
          test: /\.jsx$/,
          use: 'babel-loader',
          exclude: /node_modules/
        });
        break;
      
      case 'vue':
        config.module.rules.push({
          test: /\.vue$/,
          use: 'vue-loader'
        });
        break;
      
      case 'angular':
        // Angular项目通常使用Angular CLI，这里提供基础配置
        config.resolve.extensions.push('.ts');
        break;
    }

    // 添加压缩配置
    if (minify) {
      config.optimization.minimizer.push("new TerserPlugin({ sourceMap: true })");
    }

    return this.formatConfig(config);
  }

  /**
   * 生成Rollup配置
   */
  generateRollupConfig(options: BuildConfigOptions): string {
    const { entryPoint, outputDir, sourcemapType, minify, useTypeScript, useCSS, useAssets } = options;
    
    const plugins = [];
    
    // 添加TypeScript支持
    if (useTypeScript) {
      plugins.push('typescript()');
    }

    // 添加CSS支持
    if (useCSS) {
      plugins.push('postcss()');
    }

    // 添加资源支持
    if (useAssets) {
      plugins.push('url()');
    }

    // 添加压缩支持
    if (minify) {
      plugins.push('terser({ sourcemap: true })');
    }

    const config = {
      input: entryPoint,
      output: {
        file: `${outputDir}/bundle.js`,
        format: 'iife',
        sourcemap: sourcemapType !== 'nosources-source-map'
      },
      plugins
    };

    return this.formatConfig(config);
  }

  /**
   * 生成Vite配置
   */
  generateViteConfig(options: BuildConfigOptions): string {
    const { projectType, entryPoint, outputDir, sourcemapType, minify } = options;
    
    const config: any = {
      build: {
        outDir: outputDir,
        sourcemap: sourcemapType !== 'nosources-source-map',
        minify: minify ? 'terser' : false,
        rollupOptions: {
          input: entryPoint,
          output: {
            sourcemapExcludeSources: sourcemapType === 'nosources-source-map'
          }
        }
      },
      plugins: []
    };

    // 根据项目类型添加插件
    switch (projectType) {
      case 'react':
        config.plugins.push('react()');
        break;
      
      case 'vue':
        config.plugins.push('vue()');
        break;
      
      case 'angular':
        // Angular项目通常使用Angular CLI
        break;
    }

    return this.formatConfig(config);
  }

  /**
   * 生成package.json脚本
   */
  generatePackageScripts(options: BuildConfigOptions): Record<string, string> {
    const { projectType } = options;
    
    const scripts = {
      'build': 'webpack --mode production',
      'build:dev': 'webpack --mode development',
      'start': 'webpack serve --mode development'
    };

    switch (projectType) {
      case 'webpack':
        scripts.build = 'webpack --mode production';
        scripts['build:dev'] = 'webpack --mode development';
        break;
      
      case 'rollup':
        scripts.build = 'rollup -c';
        scripts['build:dev'] = 'rollup -c --watch';
        break;
      
      case 'vite':
        scripts.build = 'vite build';
        scripts['build:dev'] = 'vite build --mode development';
        (scripts as any).preview = 'vite preview';
        break;
    }

    return scripts;
  }

  /**
   * 生成构建脚本
   */
  generateBuildScript(options: BuildConfigOptions): string {
    const { projectType, projectId, version } = options;
    
    return `#!/bin/bash
# 自动构建脚本 - ${projectType}项目
# 项目ID: ${projectId}
# 版本: ${version}

set -e

echo "开始构建项目: ${projectId}, 版本: ${version}"

# 安装依赖
if [ -f "package-lock.json" ]; then
  npm ci
else
  npm install
fi

# 执行构建
case "${projectType}" in
  "webpack")
    npm run build
    ;;
  "rollup")
    npm run build
    ;;
  "vite")
    npm run build
    ;;
  *)
    echo "不支持的构建类型: ${projectType}"
    exit 1
    ;;
esac

# 收集构建产物
echo "收集构建产物..."
mkdir -p upload
cp -r dist/* upload/ 2>/dev/null || cp -r build/* upload/ 2>/dev/null || true

# 检查sourcemap文件
    sourcemap_count=$(find upload -name "*.map" | wc -l)
    echo "找到 ${sourcemap_count} 个sourcemap文件"

    if [ $sourcemap_count -eq 0 ]; then
      echo "警告: 未找到sourcemap文件，请检查构建配置"
    fi

# 创建上传包
cd upload
zip -r "../${projectId}-${version}.zip" .

echo "构建完成！"
echo "上传文件: ${projectId}-${version}.zip"
echo "请将此文件上传到源代码管理系统"
echo ""
echo "提示: 确保构建配置中启用了sourcemap生成"`;
  }

  /**
   * 生成Dockerfile（用于CI/CD环境）
   */
  generateDockerfile(options: BuildConfigOptions): string {
    const { projectType } = options;
    
    return `# 多阶段构建Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 生产环境镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`;
  }

  /**
   * 生成GitHub Actions工作流
   */
  generateGitHubActions(options: BuildConfigOptions): string {
    const { projectType, projectId } = options;
    
    return `name: Build and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

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
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-${projectType}
        path: dist/
    
    - name: Create sourcemap package
      run: |
        mkdir -p upload
        cp -r dist/* upload/
        cd upload
        zip -r "../${projectId}-\${{ github.sha }}.zip" .
    
    - name: Upload sourcemap package
      uses: actions/upload-artifact@v3
      with:
        name: sourcemap-package
        path: ${projectId}-*.zip`;
  }

  /**
   * 格式化配置对象为字符串
   */
  private formatConfig(config: any): string {
    return `module.exports = ${JSON.stringify(config, null, 2)};`;
  }

  /**
   * 验证构建配置
   */
  validateBuildConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.entry) {
      errors.push('缺少入口文件配置');
    }
    
    if (!config.output) {
      errors.push('缺少输出配置');
    }
    
    if (!config.devtool && !config.output?.sourcemap) {
      errors.push('缺少sourcemap配置');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default BuildConfigGenerator;
