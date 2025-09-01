import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/**
 * 项目自动化配置工具
 * 用于快速为新项目配置源码管理和sourcemap生成
 */
class ProjectSetupTool {
  constructor() {
    this.templates = {
      webpack: this.getWebpackConfigTemplate(),
      vite: this.getViteConfigTemplate(),
      taro: this.getTaroConfigTemplate(),
      packageJson: this.getPackageJsonTemplate()
    };
  }

  /**
   * 获取Webpack配置模板
   */
  getWebpackConfigTemplate() {
    return `const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    sourceMapFilename: '[name].[contenthash].js.map'
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|jsx|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
              '@babel/preset-typescript',
              '@babel/preset-react'
            ],
            sourceMaps: true
          }
        }
      }
    ]
  }
};`;
  }

  /**
   * 获取Vite配置模板
   */
  getViteConfigTemplate() {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
});`;
  }

  /**
   * 获取Taro配置模板
   */
  getTaroConfigTemplate() {
    return `module.exports = {
  // Taro 项目配置
  mini: {
    webpackChain(chain) {
      chain.devtool('source-map');
      chain.output.sourceMapFilename('[name].js.map');
    }
  },
  h5: {
    webpackChain(chain) {
      chain.devtool('source-map');
      chain.output.sourceMapFilename('[name].js.map');
    }
  }
};`;
  }

  /**
   * 获取package.json脚本模板
   */
  getPackageJsonTemplate() {
    return {
      scripts: {
        "build:with-sourcemap": "npm run build && npm run pack:source && npm run pack:sourcemap",
        "pack:source": "./build-with-sourcemap.sh --projectId $npm_package_name --version $npm_package_version --pack-type source",
        "pack:sourcemap": "./build-with-sourcemap.sh --projectId $npm_package_name --version $npm_package_version --pack-type sourcemap",
        "upload:source": "npm run pack:source && echo '请将源代码包上传到监控平台源代码管理界面'",
        "upload:sourcemap": "npm run pack:sourcemap && echo '请将Sourcemap包上传到监控平台Sourcemap管理界面'"
      },
      config: {
        monitor: {
          sourceIncludePatterns: ["src/**/*", "config/**/*", "types/**/*", "*.json", "*.js", "*.ts", "*.md"],
          sourceExcludePatterns: ["node_modules/**", ".git/**", "dist/**", "build/**", "*.log", ".DS_Store"],
          sourcemapIncludePatterns: ["dist/**/*.map"],
          sourcemapExcludePatterns: ["dist/**/*.js", "dist/**/*.css", "dist/**/*.html"]
        }
      }
    };
  }

  /**
   * 检测项目类型
   */
  detectProjectType(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('未找到package.json文件');
    }

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // 检测Taro项目
    if (pkg.dependencies && pkg.dependencies['@tarojs/taro']) {
      return 'taro';
    }

    // 检测Vite项目
    if (pkg.devDependencies && pkg.devDependencies.vite) {
      return 'vite';
    }

    // 检测Webpack项目
    if (pkg.devDependencies && pkg.devDependencies.webpack) {
      return 'webpack';
    }

    // 检测React项目（通过react-scripts）
    if (pkg.dependencies && pkg.dependencies.react && pkg.dependencies['react-scripts']) {
      return 'react';
    }

    // 检测Vue项目
    if (pkg.dependencies && pkg.dependencies.vue) {
      return 'vue';
    }

    return 'unknown';
  }

  /**
   * 配置构建工具
   */
  setupBuildTool(projectPath, projectType) {
    const configFileName = this.getConfigFileName(projectType);

    // 对于未知项目类型，不创建配置文件
    if (!configFileName) {
      console.log('ℹ️  未知项目类型，跳过构建工具配置');
      return false;
    }

    const configPath = path.join(projectPath, configFileName);

    if (fs.existsSync(configPath)) {
      console.log(`📁 检测到现有配置文件: ${configPath}`);
      return this.updateExistingConfig(configPath, projectType);
    }

    console.log(`📝 创建新的配置文件: ${configPath}`);
    fs.writeFileSync(configPath, this.templates[projectType]);
    return true;
  }

  /**
   * 获取配置文件名称
   */
  getConfigFileName(projectType) {
    const configMap = {
      webpack: 'webpack.config.js',
      vite: 'vite.config.js',
      taro: 'config/index.js',
      react: null // React项目使用react-scripts，无需额外配置
    };
    return configMap[projectType] || null;
  }

  /**
   * 更新现有配置文件
   */
  updateExistingConfig(configPath, projectType) {
    const content = fs.readFileSync(configPath, 'utf8');

    if (projectType === 'webpack' && !content.includes('source-map')) {
      const updated = content.replace(
        /module\.exports\s*=\s*{/,
        "module.exports = {\n  devtool: 'source-map',"
      );
      fs.writeFileSync(configPath, updated);
      return true;
    }

    if (projectType === 'vite' && !content.includes('sourcemap:')) {
      const updated = content.replace(
        /build:\s*{/,
        "build: {\n    sourcemap: true,"
      );
      fs.writeFileSync(configPath, updated);
      return true;
    }

    console.log('✅ 配置文件已包含sourcemap设置');
    return false;
  }

  /**
   * 配置package.json
   */
  setupPackageJson(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const template = this.templates.packageJson;

    // 合并scripts
    pkg.scripts = { ...pkg.scripts, ...template.scripts };

    // 合并config
    pkg.config = { ...pkg.config, ...template.config };

    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    return true;
  }

  /**
   * 创建监控配置文件
   */
  createMonitorConfig(projectPath) {
    const config = {
      projectId: process.env.PROJECT_ID || 'default-project',
      version: process.env.VERSION || '1.0.0',
      includePatterns: [
        "src/**/*",
        "dist/**/*.map",
        "*.config.*",
        "package.json",
        "tsconfig.json",
        "babel.config.js"
      ],
      excludePatterns: [
        "node_modules/**",
        ".git/**",
        "dist/**/*.js",
        "dist/**/*.css",
        "*.log",
        ".DS_Store"
      ]
    };

    const configPath = path.join(projectPath, '.monitor-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  /**
   * 安装监控SDK
   */
  installMonitorSdk(projectPath, projectType) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // 对于未知项目类型，不安装SDK
    if (projectType === 'unknown') {
      console.log('ℹ️  未知项目类型，跳过SDK安装');
      return false;
    }

    const sdkPackage = projectType === 'taro' ? '@monitor/taro' : '@monitor/web';

    try {
      console.log(`📦 安装监控SDK: ${sdkPackage}`);
      // 跳过不存在的包安装
      if (!sdkPackage.startsWith('@monitor/')) {
        console.log(`ℹ️  跳过不存在的SDK包安装: ${sdkPackage}`);
        return false;
      }

      // 检查包是否存在，如果不存在则跳过
      try {
        execSync(`npm view ${sdkPackage} version`, { stdio: 'ignore' });
      } catch {
        console.log(`ℹ️  SDK包不存在，跳过安装: ${sdkPackage}`);
        return false;
      }

      execSync(`cd ${projectPath} && npm install ${sdkPackage}`, {
        stdio: 'inherit'
      });

      // 添加到package.json的dependencies
      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies[sdkPackage] = '^1.0.0';
      fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      return true;
    } catch (error) {
      console.warn('⚠️ SDK安装失败，请手动安装:', error.message);
      return false;
    }
  }

  /**
   * 主执行函数
   */
  async setupProject(projectPath = process.cwd()) {
    console.log('🚀 开始自动化项目配置...\n');

    try {
      // 1. 检测项目类型
      const projectType = this.detectProjectType(projectPath);
      console.log(`🔍 检测到项目类型: ${projectType}`);

      // 2. 配置构建工具
      console.log('\n🛠️  配置构建工具...');
      this.setupBuildTool(projectPath, projectType);

      // 3. 配置package.json
      console.log('\n📄 配置package.json脚本...');
      this.setupPackageJson(projectPath);

      // 4. 创建监控配置文件
      console.log('\n⚙️  创建监控配置文件...');
      const configPath = this.createMonitorConfig(projectPath);
      console.log(`✅ 监控配置文件已创建: ${configPath}`);

      // 5. 安装监控SDK
      console.log('\n📦 安装监控SDK...');
      this.installMonitorSdk(projectPath, projectType);

      console.log('\n🎉 项目配置完成！');
      console.log('\n📋 下一步操作:');
      console.log('1. 运行 npm run build:with-sourcemap 构建并打包源码');
      console.log('2. 配置环境变量 PROJECT_ID 和 VERSION');
      console.log('3. 运行 npm run upload:source 上传到监控平台');

      return true;

    } catch (error) {
      console.error('❌ 配置失败:', error.message);
      return false;
    }
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const projectPath = args[0] || process.cwd();

  const setupTool = new ProjectSetupTool();
  await setupTool.setupProject(projectPath);
}

// 导出为模块
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ProjectSetupTool;