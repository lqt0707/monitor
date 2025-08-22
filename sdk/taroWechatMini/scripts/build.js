#!/usr/bin/env node

/**
 * SDK构建脚本
 * 用于生成CommonJS、ES Module和TypeScript声明文件
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 执行命令并输出结果
 * @param {string} command - 要执行的命令
 * @param {string} description - 命令描述
 */
function runCommand(command, description) {
  console.log(`\n🔨 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} 完成`);
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    process.exit(1);
  }
}

/**
 * 清理dist目录
 */
function cleanDist() {
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('🧹 清理dist目录完成');
  }
}

/**
 * 创建package.json文件到dist目录
 */
function createDistPackageJson() {
  const packageJson = require('../package.json');
  const distPackageJson = {
    ...packageJson,
    main: 'index.js',
    module: 'index.esm.js',
    types: 'index.d.ts',
    scripts: undefined,
    devDependencies: undefined
  };
  
  const distPath = path.join(process.cwd(), 'dist');
  fs.writeFileSync(
    path.join(distPath, 'package.json'),
    JSON.stringify(distPackageJson, null, 2)
  );
  console.log('📦 创建dist/package.json完成');
}

/**
 * 复制README文件到dist目录
 */
function copyReadme() {
  const readmePath = path.join(process.cwd(), 'README.md');
  const distReadmePath = path.join(process.cwd(), 'dist', 'README.md');
  
  if (fs.existsSync(readmePath)) {
    fs.copyFileSync(readmePath, distReadmePath);
    console.log('📄 复制README.md到dist目录完成');
  }
}

/**
 * 主构建流程
 */
function main() {
  console.log('🚀 开始构建SDK...');
  
  // 1. 清理dist目录
  cleanDist();
  
  // 2. 构建CommonJS版本
  runCommand(
    'tsc --module commonjs --outDir dist --declaration --declarationMap --sourceMap',
    '构建CommonJS版本'
  );
  
  // 3. 构建ES Module版本
  runCommand(
    'tsc --module es2015 --outDir dist/esm --declaration false --declarationMap false --sourceMap',
    '构建ES Module版本'
  );
  
  // 4. 重命名ES Module文件
  const esmIndexPath = path.join(process.cwd(), 'dist', 'esm', 'index.js');
  const esmTargetPath = path.join(process.cwd(), 'dist', 'index.esm.js');
  if (fs.existsSync(esmIndexPath)) {
    fs.renameSync(esmIndexPath, esmTargetPath);
    // 清理esm目录
    fs.rmSync(path.join(process.cwd(), 'dist', 'esm'), { recursive: true, force: true });
    console.log('📝 重命名ES Module文件完成');
  }
  
  // 5. 创建dist目录的package.json
  createDistPackageJson();
  
  // 6. 复制README文件
  copyReadme();
  
  console.log('\n🎉 SDK构建完成!');
  console.log('📁 构建产物位于 dist/ 目录');
}

if (require.main === module) {
  main();
}

module.exports = { main };