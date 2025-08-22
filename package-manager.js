#!/usr/bin/env node

/**
 * 项目依赖管理脚本
 * 用于批量安装、更新和检查项目各模块的依赖
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 项目模块配置
const modules = [
    { name: '服务端', dir: './server' },
    { name: '管理后台', dir: './admin' },
    { name: 'Taro SDK', dir: './sdk/taroWechatMini' },
    { name: 'Web SDK', dir: './sdk/web' },
    { name: '示例项目', dir: './example' }
];

// 颜色输出
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 执行npm命令
 */
function runNpmCommand(command, cwd, moduleName) {
    return new Promise((resolve, reject) => {
        log(`[${moduleName}] 执行: ${command}`, 'blue');

        const child = spawn('npm', command.split(' ').slice(1), {
            cwd: path.resolve(__dirname, cwd),
            stdio: 'inherit'
        });

        child.on('close', (code) => {
            if (code === 0) {
                log(`[${moduleName}] ✅ ${command} 完成`, 'green');
                resolve();
            } else {
                log(`[${moduleName}] ❌ ${command} 失败`, 'red');
                reject(new Error(`${command} failed for ${moduleName}`));
            }
        });
    });
}

/**
 * 检查模块是否存在
 */
function checkModuleExists(dir) {
    const packageJsonPath = path.resolve(__dirname, dir, 'package.json');
    return fs.existsSync(packageJsonPath);
}

/**
 * 安装所有模块的依赖
 */
async function installAll() {
    log('开始安装所有模块的依赖...', 'cyan');

    for (const module of modules) {
        if (!checkModuleExists(module.dir)) {
            log(`[${module.name}] 跳过: package.json 不存在`, 'yellow');
            continue;
        }

        try {
            await runNpmCommand('npm install', module.dir, module.name);
        } catch (error) {
            log(`[${module.name}] 安装失败: ${error.message}`, 'red');
        }
    }

    log('所有模块依赖安装完成', 'green');
}

/**
 * 更新所有模块的依赖
 */
async function updateAll() {
    log('开始更新所有模块的依赖...', 'cyan');

    for (const module of modules) {
        if (!checkModuleExists(module.dir)) {
            log(`[${module.name}] 跳过: package.json 不存在`, 'yellow');
            continue;
        }

        try {
            await runNpmCommand('npm update', module.dir, module.name);
        } catch (error) {
            log(`[${module.name}] 更新失败: ${error.message}`, 'red');
        }
    }

    log('所有模块依赖更新完成', 'green');
}

/**
 * 清理所有模块的node_modules
 */
async function cleanAll() {
    log('开始清理所有模块的 node_modules...', 'cyan');

    for (const module of modules) {
        const nodeModulesPath = path.resolve(__dirname, module.dir, 'node_modules');

        if (fs.existsSync(nodeModulesPath)) {
            try {
                await runNpmCommand('rm -rf node_modules', module.dir, module.name);
                log(`[${module.name}] ✅ node_modules 已清理`, 'green');
            } catch (error) {
                log(`[${module.name}] ❌ 清理失败: ${error.message}`, 'red');
            }
        } else {
            log(`[${module.name}] node_modules 不存在，跳过`, 'yellow');
        }
    }

    log('所有模块 node_modules 清理完成', 'green');
}

/**
 * 构建所有可构建的模块
 */
async function buildAll() {
    log('开始构建所有模块...', 'cyan');

    const buildableModules = [
        { name: 'Taro SDK', dir: './sdk/taroWechatMini', command: 'npm run build' },
        { name: 'Web SDK', dir: './sdk/web', command: 'npm run build' },
        { name: '管理后台', dir: './admin', command: 'npm run build' }
    ];

    for (const module of buildableModules) {
        if (!checkModuleExists(module.dir)) {
            log(`[${module.name}] 跳过: package.json 不存在`, 'yellow');
            continue;
        }

        try {
            await runNpmCommand(module.command, module.dir, module.name);
        } catch (error) {
            log(`[${module.name}] 构建失败: ${error.message}`, 'red');
        }
    }

    log('所有模块构建完成', 'green');
}

/**
 * 检查所有模块的依赖状态
 */
function checkStatus() {
    log('检查所有模块状态...', 'cyan');

    for (const module of modules) {
        const packageJsonPath = path.resolve(__dirname, module.dir, 'package.json');
        const nodeModulesPath = path.resolve(__dirname, module.dir, 'node_modules');

        if (!fs.existsSync(packageJsonPath)) {
            log(`[${module.name}] ❌ package.json 不存在`, 'red');
            continue;
        }

        const hasNodeModules = fs.existsSync(nodeModulesPath);
        const status = hasNodeModules ? '✅ 已安装' : '❌ 未安装';
        const color = hasNodeModules ? 'green' : 'red';

        log(`[${module.name}] ${status}`, color);
    }
}

/**
 * 显示帮助信息
 */
function showHelp() {
    log('项目依赖管理脚本', 'cyan');
    log('');
    log('使用方法:', 'yellow');
    log('  node package-manager.js [命令]', 'white');
    log('');
    log('可用命令:', 'yellow');
    log('  install    安装所有模块的依赖', 'white');
    log('  update     更新所有模块的依赖', 'white');
    log('  clean      清理所有模块的 node_modules', 'white');
    log('  build      构建所有可构建的模块', 'white');
    log('  status     检查所有模块的依赖状态', 'white');
    log('  help       显示此帮助信息', 'white');
    log('');
    log('示例:', 'yellow');
    log('  node package-manager.js install', 'white');
    log('  node package-manager.js clean && node package-manager.js install', 'white');
}

/**
 * 主函数
 */
async function main() {
    const command = process.argv[2];

    switch (command) {
        case 'install':
            await installAll();
            break;
        case 'update':
            await updateAll();
            break;
        case 'clean':
            await cleanAll();
            break;
        case 'build':
            await buildAll();
            break;
        case 'status':
            checkStatus();
            break;
        case 'help':
        case undefined:
            showHelp();
            break;
        default:
            log(`未知命令: ${command}`, 'red');
            log('使用 "node package-manager.js help" 查看帮助', 'yellow');
            process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        log(`程序异常: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = {
    installAll,
    updateAll,
    cleanAll,
    buildAll,
    checkStatus
};