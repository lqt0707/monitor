#!/usr/bin/env node

/**
 * Monitor SDK 增强构建工具
 * 支持多种项目类型的构建和sourcemap生成
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const program = new Command();

/**
 * 生成唯一的构建ID
 * @returns {string} 构建ID
 */
function generateBuildId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * 检测项目名称
 * @returns {Promise<string>} 项目名称
 */
async function detectProjectName() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    return packageJson.name || 'unknown-project';
  } catch (error) {
    return 'unknown-project';
  }
}

/**
 * 检测项目类型
 * @returns {Promise<string>} 项目类型
 */
async function detectProjectType() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    
    if (packageJson.dependencies?.['@tarojs/cli'] || packageJson.devDependencies?.['@tarojs/cli']) {
      return 'taro';
    }
    
    if (packageJson.dependencies?.webpack || packageJson.devDependencies?.webpack) {
      return 'webpack';
    }
    
    if (packageJson.dependencies?.rollup || packageJson.devDependencies?.rollup) {
      return 'rollup';
    }
    
    if (packageJson.dependencies?.vite || packageJson.devDependencies?.vite) {
      return 'vite';
    }
    
    // 检查构建脚本
    const scripts = packageJson.scripts || {};
    if (scripts.build?.includes('webpack') || scripts['build:prod']?.includes('webpack')) {
      return 'webpack';
    }
    
    if (scripts.build?.includes('rollup') || scripts['build:prod']?.includes('rollup')) {
      return 'rollup';
    }
    
    if (scripts.build?.includes('vite') || scripts['build:prod']?.includes('vite')) {
      return 'vite';
    }
    
    return 'generic';
  } catch (error) {
    return 'generic';
  }
}

/**
 * 执行构建命令
 * @param {string} projectType 项目类型
 */
async function executeBuild(projectType) {
  console.log('🔨 执行构建命令...');
  
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    let buildCommand = '';
    
    switch (projectType) {
      case 'taro':
        buildCommand = scripts['build:weapp'] || scripts.build || 'taro build --type weapp';
        break;
      case 'webpack':
        buildCommand = scripts['build:prod'] || scripts.build || 'webpack --mode production';
        break;
      case 'rollup':
        buildCommand = scripts['build:prod'] || scripts.build || 'rollup -c';
        break;
      case 'vite':
        buildCommand = scripts['build:prod'] || scripts.build || 'vite build';
        break;
      default:
        buildCommand = scripts.build || 'npm run build';
    }
    
    console.log(`📝 执行命令: ${buildCommand}`);
    execSync(buildCommand, { stdio: 'inherit' });
    
  } catch (error) {
    throw new Error(`构建执行失败: ${error.message}`);
  }
}

/**
 * 查找构建输出目录
 * @returns {string} 构建目录路径
 */
function findBuildDirectory() {
  const possibleDirs = ['dist', 'build', 'output', 'lib'];
  
  for (const dir of possibleDirs) {
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      return dir;
    }
  }
  
  throw new Error('未找到构建输出目录，请检查构建是否成功');
}

/**
 * 打包构建产物
 * @param {string} projectId 项目ID
 * @param {string} version 版本号
 * @param {string} buildId 构建ID
 * @returns {string} 打包文件路径
 */
async function packageBuildArtifacts(projectId, version, buildId) {
  console.log('📦 打包构建产物...');
  
  const buildDir = findBuildDirectory();
  console.log(`📁 构建目录: ${buildDir}`);
  
  // 创建上传目录
  const uploadDir = 'upload';
  if (!existsSync(uploadDir)) {
    execSync(`mkdir -p ${uploadDir}`);
  }
  
  // 复制构建产物
  execSync(`cp -r ${buildDir}/* ${uploadDir}/`);
  
  // 统计sourcemap文件
  const sourcemapCount = execSync(`find ${uploadDir} -name "*.map" | wc -l`).toString().trim();
  console.log(`🗺️  找到 ${sourcemapCount} 个sourcemap文件`);
  
  if (parseInt(sourcemapCount) === 0) {
    console.log('⚠️  警告: 未找到sourcemap文件');
    console.log('💡 请检查构建配置是否启用了sourcemap生成');
  }
  
  // 生成构建信息文件
  const buildInfo = {
    projectId,
    version,
    buildId,
    buildTime: new Date().toISOString(),
    buildType: 'sdk-enhanced',
    sourcemapCount: parseInt(sourcemapCount),
    files: []
  };
  
  writeFileSync(
    join(uploadDir, 'build-info.json'), 
    JSON.stringify(buildInfo, null, 2)
  );
  
  // 创建ZIP包
  const zipFileName = `${projectId}-${version}-${buildId}.zip`;
  execSync(`cd ${uploadDir} && zip -r ../${zipFileName} .`, { stdio: 'inherit' });
  
  // 清理上传目录
  execSync(`rm -rf ${uploadDir}`);
  
  return zipFileName;
}

// 配置命令行工具
program
  .name('monitor-build')
  .description('Monitor SDK 增强构建工具 - 支持源代码和sourcemap打包')
  .version('1.0.0');

program
  .command('build')
  .description('构建项目并生成sourcemap')
  .option('-p, --project-id <id>', '项目ID')
  .option('-v, --version <version>', '版本号', '1.0.0')
  .option('-t, --type <type>', '构建类型 (webpack|rollup|vite|taro)')
  .option('--auto-detect', '自动检测项目类型')
  .action(async (options) => {
    try {
      const projectId = options.projectId || await detectProjectName();
      const version = options.version;
      const buildId = generateBuildId();
      
      let projectType = options.type;
      if (options.autoDetect || !projectType) {
        projectType = await detectProjectType();
        console.log(`🔍 检测到项目类型: ${projectType}`);
      }

      console.log(`🚀 开始构建项目: ${projectId}`);
      console.log(`📦 版本: ${version}`);
      console.log(`🆔 构建ID: ${buildId}`);
      console.log(`🔧 构建类型: ${projectType}`);

      // 执行构建
      await executeBuild(projectType);
      
      // 打包构建产物
      const packagePath = await packageBuildArtifacts(projectId, version, buildId);
      
      console.log('✅ 构建完成！');
      console.log(`📦 上传文件: ${packagePath}`);
      console.log('📤 请将此文件上传到管理后台');
      console.log('🔗 上传地址：管理后台 → 源代码管理 → 增强上传');
      
    } catch (error) {
      console.error('❌ 构建失败:', error.message);
      process.exit(1);
    }
  });

program
  .command('info')
  .description('显示项目构建信息')
  .action(async () => {
    try {
      const projectName = await detectProjectName();
      const projectType = await detectProjectType();
      
      console.log('📋 项目信息:');
      console.log(`  名称: ${projectName}`);
      console.log(`  类型: ${projectType}`);
      
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      console.log(`  版本: ${packageJson.version || '未设置'}`);
      
      // 检查构建配置
      const scripts = packageJson.scripts || {};
      console.log('🔧 构建脚本:');
      Object.entries(scripts).forEach(([name, script]) => {
        if (name.includes('build')) {
          console.log(`  ${name}: ${script}`);
        }
      });
      
    } catch (error) {
      console.error('❌ 获取项目信息失败:', error.message);
    }
  });

// 解析命令行参数
program.parse();