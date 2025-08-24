#!/usr/bin/env node

/**
 * SDK统一管理脚本
 * 在项目根目录提供SDK相关的管理命令
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SDK_DIR = path.join(__dirname, 'sdk');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`执行命令: ${command}`, 'cyan');
    const result = execSync(command, {
      cwd: SDK_DIR,
      stdio: 'inherit',
      ...options
    });
    return result;
  } catch (error) {
    log(`命令执行失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

function checkSDKDirectory() {
  if (!fs.existsSync(SDK_DIR)) {
    log('❌ SDK目录不存在', 'red');
    process.exit(1);
  }
  
  const packageJsonPath = path.join(SDK_DIR, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ SDK package.json不存在', 'red');
    process.exit(1);
  }
  
  log('✅ SDK目录检查通过', 'green');
}

function showHelp() {
  log('\n🔧 SDK统一管理工具', 'bright');
  log('════════════════════════════════════', 'cyan');
  
  log('\n📦 构建命令:', 'yellow');
  log('  npm run sdk:build         # 构建所有平台SDK');
  log('  npm run sdk:build:web     # 构建Web SDK');
  log('  npm run sdk:build:taro    # 构建Taro SDK');
  log('  npm run sdk:build:core    # 构建Core模块');
  
  log('\n🚀 开发命令:', 'yellow');
  log('  npm run sdk:dev           # 开发模式（监听所有变化）');
  log('  npm run sdk:dev:web       # 开发模式（仅Web SDK）');
  log('  npm run sdk:dev:taro      # 开发模式（仅Taro SDK）');
  log('  npm run sdk:dev:core      # 开发模式（仅Core模块）');
  
  log('\n🧪 测试命令:', 'yellow');
  log('  npm run sdk:test          # 运行所有测试');
  log('  npm run sdk:clean         # 清理构建文件');
  
  log('\n📊 分析命令:', 'yellow');
  log('  npm run sdk:size          # 检查包大小');
  log('  npm run sdk:analyze       # 分析包结构');
  
  log('\n💡 提示:', 'magenta');
  log('  - 所有SDK相关的构建都在 sdk/ 目录统一管理');
  log('  - 使用Core架构，减少80%重复代码');
  log('  - 支持Web、Taro小程序等多平台');
  
  log('\n────────────────────────────────────', 'cyan');
}

function getSDKStatus() {
  log('\n📊 SDK状态检查', 'bright');
  log('════════════════════════════════════', 'cyan');
  
  // 检查构建输出
  const distDirs = [
    'dist',
    'core/dist', 
    'web-core/dist',
    'taro-core/dist'
  ];
  
  log('\n📁 构建输出目录:', 'yellow');
  distDirs.forEach(dir => {
    const fullPath = path.join(SDK_DIR, dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      log(`  ✅ ${dir} (${files.length} 文件)`, 'green');
    } else {
      log(`  ❌ ${dir} (不存在)`, 'red');
    }
  });
  
  // 检查package.json脚本
  log('\n📝 可用脚本:', 'yellow');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(SDK_DIR, 'package.json'), 'utf8'));
    const scripts = Object.keys(packageJson.scripts || {});
    scripts.forEach(script => {
      log(`  📜 ${script}`, 'cyan');
    });
  } catch (error) {
    log('  ❌ 无法读取package.json', 'red');
  }
  
  log('\n────────────────────────────────────', 'cyan');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // 显示帮助
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  // 显示状态
  if (command === 'status') {
    checkSDKDirectory();
    getSDKStatus();
    return;
  }
  
  // 检查SDK目录
  checkSDKDirectory();
  
  // 执行对应命令
  switch (command) {
    case 'build':
      log('🏗️  构建所有平台SDK...', 'bright');
      execCommand('npm run build');
      log('✅ 构建完成', 'green');
      break;
      
    case 'build:web':
      log('🌐 构建Web SDK...', 'bright');
      execCommand('npm run build:web');
      log('✅ Web SDK构建完成', 'green');
      break;
      
    case 'build:taro':
      log('📱 构建Taro SDK...', 'bright');
      execCommand('npm run build:taro');
      log('✅ Taro SDK构建完成', 'green');
      break;
      
    case 'build:core':
      log('🏗️  构建Core模块...', 'bright');
      execCommand('npm run build:core');
      log('✅ Core模块构建完成', 'green');
      break;
      
    case 'dev':
      log('🚀 启动开发模式（所有平台）...', 'bright');
      execCommand('npm run dev');
      break;
      
    case 'dev:web':
      log('🌐 启动Web SDK开发模式...', 'bright');
      execCommand('npm run dev:web');
      break;
      
    case 'dev:taro':
      log('📱 启动Taro SDK开发模式...', 'bright');
      execCommand('npm run dev:taro');
      break;
      
    case 'dev:core':
      log('🏗️  启动Core模块开发模式...', 'bright');
      execCommand('npm run dev:core');
      break;
      
    case 'test':
      log('🧪 运行SDK测试...', 'bright');
      execCommand('npm run test');
      log('✅ 测试完成', 'green');
      break;
      
    case 'clean':
      log('🧹 清理构建文件...', 'bright');
      execCommand('npm run clean');
      log('✅ 清理完成', 'green');
      break;
      
    case 'size':
      log('📊 检查包大小...', 'bright');
      execCommand('npm run size');
      break;
      
    case 'analyze':
      log('🔍 分析包结构...', 'bright');
      execCommand('npm run analyze');
      break;
      
    default:
      log(`❌ 未知命令: ${command}`, 'red');
      log('使用 "node sdk-manager.js help" 查看帮助', 'yellow');
      process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkSDKDirectory,
  getSDKStatus,
  showHelp
};