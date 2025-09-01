#!/usr/bin/env node

/**
 * Taro小程序自动化配置工具
 * 自动检测Taro项目并配置监控SDK和构建脚本
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// 日志函数
function logInfo(message) {
  console.log(colors.blue('ℹ'), message);
}

function logSuccess(message) {
  console.log(colors.green('✓'), message);
}

function logWarning(message) {
  console.log(colors.yellow('⚠'), message);
}

function logError(message) {
  console.log(colors.red('✗'), message);
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 读取JSON文件
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// 写入JSON文件
function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

// 检测Taro项目
function detectTaroProject() {
  logInfo('正在检测Taro项目...');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fileExists(packageJsonPath)) {
    logError('未找到package.json文件');
    return false;
  }

  const packageJson = readJsonFile(packageJsonPath);
  if (!packageJson) {
    logError('无法读取package.json文件');
    return false;
  }

  const isTaroProject = packageJson.dependencies && (
    packageJson.dependencies['@tarojs/taro'] ||
    packageJson.dependencies['@tarojs/cli'] ||
    packageJson.dependencies['@tarojs/components']
  );

  if (!isTaroProject) {
    logError('当前目录不是Taro项目');
    return false;
  }

  logSuccess('检测到Taro项目');
  return true;
}

// 自动配置Taro构建
function configureTaroBuild() {
  logInfo('正在配置Taro构建...');

  const configDir = path.join(process.cwd(), 'config');
  if (!fileExists(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // 检查并配置index.ts
  const configIndexPath = path.join(configDir, 'index.ts');
  if (!fileExists(configIndexPath)) {
    const configContent = `import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import devConfig from './dev'
import prodConfig from './prod'

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<'webpack5'>(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'taroMini',
    date: '${new Date().toISOString().split('T')[0]}',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [
      "@tarojs/plugin-generator"
    ],
    defineConstants: {
    },
    copy: {
      patterns: [
      ],
      options: {
      }
    },
    framework: 'react',
    compiler: 'webpack5',
    cache: {
      enable: false // Webpack 持久化缓存配置，建议开启。默认配置请参考：https://docs.taro.zone/docs/config-detail#cache
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {

          }
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
      webpackChain(chain) {
        chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin)
        // 为监控平台生成sourcemap
        chain.devtool('source-map')
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: {
        filename: 'js/[name].[hash:8].js',
        chunkFilename: 'js/[name].[chunkhash:8].js'
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
      webpackChain(chain) {
        chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin)
      }
    },
    rn: {
      appName: 'taroDemo',
      postcss: {
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        }
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig)
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig)
})
`;
    fs.writeFileSync(configIndexPath, configContent);
    logSuccess('创建config/index.ts配置文件');
  } else {
    logWarning('config/index.ts已存在，跳过创建');
  }

  // 检查并配置dev.ts
  const devConfigPath = path.join(configDir, 'dev.ts');
  if (!fileExists(devConfigPath)) {
    const devContent = `import type { UserConfigExport } from "@tarojs/cli"

export default {
   logger: {
    quiet: false,
    stats: true
  },
  mini: {},
  h5: {}
} satisfies UserConfigExport<'webpack5'>
`;
    fs.writeFileSync(devConfigPath, devContent);
    logSuccess('创建config/dev.ts配置文件');
  }

  // 检查并配置prod.ts
  const prodConfigPath = path.join(configDir, 'prod.ts');
  if (!fileExists(prodConfigPath)) {
    const prodContent = `import type { UserConfigExport } from "@tarojs/cli"

export default {
  mini: {},
  h5: {
    /**
     * 启用sourcemap生成
     */
    webpackChain(chain) {
      chain.devtool('source-map')
    }
  }
} satisfies UserConfigExport<'webpack5'>
`;
    fs.writeFileSync(prodConfigPath, prodContent);
    logSuccess('创建config/prod.ts配置文件');
  }
}

// 检查并更新配置文件中的sourcemap配置
function updateConfigForSourcemap() {
  logInfo('正在检查配置文件中的sourcemap配置...');

  const configIndexPath = path.join(process.cwd(), 'config/index.ts');
  
  if (fileExists(configIndexPath)) {
    let content = fs.readFileSync(configIndexPath, 'utf8');
    
    // 检查是否已配置sourcemap
    if (!content.includes('chain.devtool') && !content.includes('source-map')) {
      // 在webpackChain函数中添加sourcemap配置
      if (content.includes('webpackChain(chain)')) {
        content = content.replace(
          'webpackChain(chain) {',
          'webpackChain(chain) {\n        // 为监控平台生成sourcemap\n        chain.devtool(\"source-map\")'
        );
        fs.writeFileSync(configIndexPath, content);
        logSuccess('在config/index.ts中添加sourcemap配置');
      }
    } else {
      logSuccess('config/index.ts中已配置sourcemap');
    }
  }
}

// 智能更新构建脚本配置
function updateBuildScriptConfiguration() {
  logInfo('正在智能更新构建脚本配置...');

  const buildScriptPath = path.join(process.cwd(), 'build-with-sourcemap.sh');
  
  if (fileExists(buildScriptPath)) {
    let content = fs.readFileSync(buildScriptPath, 'utf8');
    
    // 更新项目ID和版本配置
    if (content.includes('PROJECT_ID="taro-mini-app"')) {
      // 获取当前项目的package.json信息
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fileExists(packageJsonPath)) {
        const packageJson = readJsonFile(packageJsonPath);
        if (packageJson) {
          const projectName = packageJson.name || 'taro-mini-app';
          const version = packageJson.version || '1.0.0';
          
          content = content.replace(
            'PROJECT_ID="taro-mini-app"',
            `PROJECT_ID="${projectName}"`
          );
          content = content.replace(
            'VERSION="1.0.0"',
            `VERSION="${version}"`
          );
          
          fs.writeFileSync(buildScriptPath, content);
          logSuccess('更新构建脚本中的项目配置');
        }
      }
    }
  }
}

// 自动配置构建脚本
function configureBuildScript() {
  logInfo('正在配置构建脚本...');

  const buildScriptPath = path.join(process.cwd(), 'build-with-sourcemap.sh');

  if (!fileExists(buildScriptPath)) {
    // 从SDK脚本目录复制构建脚本
    const sdkScriptPath = path.join(__dirname, 'build-with-sourcemap.sh');

    if (fileExists(sdkScriptPath)) {
      const scriptContent = fs.readFileSync(sdkScriptPath, 'utf8');
      fs.writeFileSync(buildScriptPath, scriptContent);

      // 设置执行权限
      fs.chmodSync(buildScriptPath, '755');
      logSuccess('复制构建脚本并设置执行权限');
      
      // 更新构建脚本配置
      updateBuildScriptConfiguration();
    } else {
      logWarning('未找到SDK构建脚本，请手动配置');
    }
  } else {
    logWarning('构建脚本已存在，进行智能更新');
    updateBuildScriptConfiguration();
  }
}

// 配置package.json脚本
function configurePackageScripts() {
  logInfo('正在配置package.json脚本...');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = readJsonFile(packageJsonPath);

  if (!packageJson) {
    logError('无法读取package.json');
    return;
  }

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  // 添加监控构建脚本
  if (!packageJson.scripts['build:monitor']) {
    packageJson.scripts['build:monitor'] = './build-with-sourcemap.sh';
    logSuccess('添加build:monitor脚本');
  }

  // 添加sourcemap构建脚本
  if (!packageJson.scripts['build:sourcemap']) {
    packageJson.scripts['build:sourcemap'] = 'npm run build:weapp';
    logSuccess('添加build:sourcemap脚本');
  }

  writeJsonFile(packageJsonPath, packageJson);
}

// 安装监控SDK
function installMonitorSDK() {
  logInfo('正在检查监控SDK依赖...');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = readJsonFile(packageJsonPath);

  if (!packageJson) {
    logError('无法读取package.json');
    return;
  }

  const sdkDependency = '@monitor/sdk';
  const hasSDK = packageJson.dependencies && packageJson.dependencies[sdkDependency];

  if (!hasSDK) {
    logWarning('未找到监控SDK依赖，请手动安装: npm install @monitor/sdk');
    logWarning('如果包未发布，可以使用本地安装: npm install /path/to/monitor/sdk');
  } else {
    logSuccess('监控SDK依赖已配置');
  }
}

// 主函数
function main() {
  console.log(colors.cyan('🚀 Taro小程序自动化配置工具'));
  console.log(colors.cyan('============================'));
  console.log();

  // 检测当前目录是否为Taro项目
  if (!detectTaroProject()) {
    process.exit(1);
  }

  try {
    // 执行配置步骤
    configureTaroBuild();
    configureBuildScript();
    configurePackageScripts();
    installMonitorSDK();
    
    // 智能更新现有配置
    updateConfigForSourcemap();

    console.log();
    logSuccess('自动化配置完成！');
    console.log();

    console.log(colors.cyan('📋 下一步操作:'));
    console.log('1. 安装监控SDK: npm install @monitor/sdk');
    console.log('2. 在src/app.ts中引入监控SDK');
    console.log('3. 运行构建: npm run build:monitor');
    console.log('4. 上传生成的ZIP包到监控平台');
    console.log();
    console.log(colors.yellow('💡 本地开发提示:'));
    console.log('如果 @monitor/sdk 尚未发布，可以使用:');
    console.log('- 本地安装: npm install /path/to/monitor/sdk');
    console.log('- 或者直接使用相对路径运行脚本');
    console.log();

    console.log(colors.cyan('💡 提示:'));
    console.log('- 构建脚本: ./build-with-sourcemap.sh');
    console.log('- 配置文件: config/index.ts, config/dev.ts, config/prod.ts');
    console.log();

  } catch (error) {
    logError(`配置过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  detectTaroProject,
  configureTaroBuild,
  configureBuildScript,
  configurePackageScripts,
  installMonitorSDK
};