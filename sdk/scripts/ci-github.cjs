#!/usr/bin/env node

/**
 * GitHub Actions CI脚本 - 简化版
 * 只做必要的构建验证，确保能成功发布
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 开始GitHub Actions CI流程...');

// 检查必要文件
const requiredFiles = [
  'core/dist/index.js',
  'web-core/dist/index.js',
  'taro-core/dist/index.js',
  'dist/index.js'
];

function checkRequiredFiles() {
  console.log('🔍 检查必要文件...');
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ 缺少必要文件: ${file}`);
      process.exit(1);
    }
  }
  
  console.log('✅ 所有必要文件检查通过');
}

function runBuildTest() {
  console.log('🔨 运行构建测试...');
  
  try {
    // 直接运行生产构建，确保有构建产物
    execSync('npm run build:prod', { stdio: 'inherit' });
    console.log('✅ 构建测试通过');
  } catch (error) {
    console.error('❌ 构建测试失败');
    process.exit(1);
  }
}

function main() {
  try {
    // 1. 构建测试
    runBuildTest();
    
    // 2. 检查必要文件
    checkRequiredFiles();
    
    console.log('🎉 GitHub Actions CI流程完成！');
  } catch (error) {
    console.error('❌ CI流程失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkRequiredFiles, runBuildTest };
