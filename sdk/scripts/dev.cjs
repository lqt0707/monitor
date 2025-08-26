#!/usr/bin/env node

const { spawn } = require('child_process');
const { watch } = require('chokidar');

// 简单的防抖函数实现
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

let buildProcess = null;

function killBuildProcess() {
    if (buildProcess) {
        buildProcess.kill('SIGTERM');
        buildProcess = null;
    }
}

const debouncedBuild = debounce((target) => {
    killBuildProcess();

    log(`\n🔄 检测到文件变化，重新构建 ${target || '所有模块'}...`, colors.cyan);

    // 使用一次性构建而不是watch模式，避免无限循环
    const command = target
        ? `rollup -c build.config.cjs --environment TARGET=${target}`
        : `rollup -c build.config.cjs`;

    buildProcess = spawn('npx', command.split(' '), {
        stdio: 'inherit',
        shell: true
    });

    buildProcess.on('error', (error) => {
        log(`❌ 构建进程错误: ${error.message}`, colors.red);
    });

    buildProcess.on('exit', (code) => {
        if (code === 0) {
            log(`✅ 构建完成`, colors.green);
        } else if (code !== null) {
            log(`❌ 构建失败，退出码: ${code}`, colors.red);
        }
        buildProcess = null;
    });
}, 500);

function startWatcher(target) {
    const watchPaths = target ? [`${target}-core/**/*.ts`, `core/**/*.ts`] : [
        'core/**/*.ts',
        'web-core/**/*.ts',
        'taro-core/**/*.ts',
        'index.ts'
    ];

    log(`\n👀 开始监听文件变化...`, colors.yellow);
    log(`📁 监听路径: ${watchPaths.join(', ')}`, colors.blue);

    const watcher = watch(watchPaths, {
        ignored: [
            '**/node_modules/**',
            '**/dist/**',
            '**/*.d.ts',
            '**/build/**',
            '**/*.map',
            '**/coverage/**',
            '**/.git/**',
            '**/logs/**'
        ],
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 50
        }
    });

    watcher.on('change', (path) => {
        log(`📝 文件变化: ${path}`, colors.magenta);
        debouncedBuild(target);
    });

    watcher.on('add', (path) => {
        log(`➕ 新增文件: ${path}`, colors.green);
        debouncedBuild(target);
    });

    watcher.on('unlink', (path) => {
        log(`🗑️  删除文件: ${path}`, colors.red);
        debouncedBuild(target);
    });

    watcher.on('error', (error) => {
        log(`❌ 监听器错误: ${error.message}`, colors.red);
    });

    // 初始构建
    debouncedBuild(target);

    // 优雅退出
    process.on('SIGINT', () => {
        log('\n🛑 停止开发服务器...', colors.yellow);
        killBuildProcess();
        watcher.close();
        process.exit(0);
    });
}

function main() {
    const args = process.argv.slice(2);
    const target = args[0];

    log(`\n🚀 Monitor SDK 开发模式`, colors.bright);

    if (target) {
        const validTargets = ['core', 'web', 'taro', 'main'];
        if (!validTargets.includes(target)) {
            log(`❌ 无效的目标: ${target}`, colors.red);
            log(`可用目标: ${validTargets.join(', ')}`, colors.yellow);
            process.exit(1);
        }
        log(`🎯 目标模块: ${target}`, colors.cyan);
    } else {
        log(`🎯 目标模块: 所有模块`, colors.cyan);
    }

    startWatcher(target);
}

main();