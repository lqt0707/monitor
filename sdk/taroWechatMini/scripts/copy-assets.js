#!/usr/bin/env node

/**
 * 复制资源文件到dist目录
 * 用于复制package.json和README.md等文件
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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
  
  // 确保dist目录存在
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }
  
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
 * 主函数
 */
function main() {
  console.log('📋 开始复制资源文件...');
  
  // 创建dist目录的package.json
  createDistPackageJson();
  
  // 复制README文件
  copyReadme();
  
  console.log('✅ 资源文件复制完成!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };