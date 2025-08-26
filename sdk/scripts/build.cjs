#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { performance } = require('perf_hooks');
const crypto = require('crypto');

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

function execCommand(command, options = {}) {
    try {
        const result = execSync(command, {
            stdio: 'inherit',
            encoding: 'utf8',
            ...options
        });
        return result;
    } catch (error) {
        log(`❌ 命令执行失败: ${command}`, colors.red);
        throw error;
    }
}

function ensureDir(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

async function buildTarget(target, description) {
    const startTime = performance.now();

    // 检查入口文件
    const entryMap = {
        'core': 'core/index.ts',
        'web': 'web-core/index.ts',
        'taro': 'taro-core/index.ts',
        'main': 'src/index.ts'
    };

    const entryFile = entryMap[target];
    if (!entryFile || !existsSync(entryFile)) {
        // 创建空的入口文件以避免构建错误
        const entryDir = entryFile.substring(0, entryFile.lastIndexOf('/'));
        if (!existsSync(entryDir)) {
            mkdirSync(entryDir, { recursive: true });
            log(`📁 创建目录: ${entryDir}`, colors.yellow);
        }

        if (!existsSync(entryFile)) {
            writeFileSync(entryFile, '// 自动生成的入口文件\nexport default {};\n', 'utf8');
            log(`📄 创建入口文件: ${entryFile}`, colors.yellow);
        }
    }

    // 检查缓存
    if (process.env.USE_CACHE && checkCache(target)) {
        log(`\n📦 使用缓存 ${description}...`, colors.cyan);
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        log(`✅ ${description} 缓存命中 (${duration}s)`, colors.green);
        return true;
    }

    log(`\n🔨 开始构建 ${description}...`, colors.cyan);

    try {
        const env = [];
        if (process.env.NODE_ENV) env.push(`NODE_ENV=${process.env.NODE_ENV}`);
        if (process.env.MINIFY) env.push(`MINIFY=${process.env.MINIFY}`);
        if (process.env.ANALYZE) env.push(`ANALYZE=${process.env.ANALYZE}`);

        const envString = env.length > 0 ? `${env.join(' ')} ` : '';
        execCommand(`${envString}rollup -c build.config.cjs --environment TARGET=${target}`);

        // 更新缓存
        if (process.env.USE_CACHE) {
            updateCache(target);
        }

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        log(`✅ ${description} 构建完成 (${duration}s)`, colors.green);
        return true;
    } catch (error) {
        log(`❌ ${description} 构建失败`, colors.red);
        return false;
    }
}

// 缓存相关函数
function calculateHash(filePath) {
    try {
        const content = readFileSync(filePath, 'utf8');
        return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
        return '';
    }
}

function getSourceFileHashes(target) {
    const sourceMap = {
        'core': ['core/src'],
        'web': ['web-core/src', 'core/src'],
        'taro': ['taro-core/src', 'core/src'],
        'main': ['src']
    };

    const dirs = sourceMap[target] || [];
    const result = {};

    // 更安全的文件查找方式
    for (const dir of dirs) {
        if (!existsSync(dir)) {
            continue;
        }

        try {
            // 使用 Node.js 的 fs 模块递归遍历目录
            const { readdirSync, statSync } = require('fs');
            const { join } = require('path');

            function scanDir(directory) {
                const entries = readdirSync(directory, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = join(directory, entry.name);

                    if (entry.isDirectory()) {
                        scanDir(fullPath);
                    } else if (entry.isFile() &&
                        (fullPath.endsWith('.ts') || fullPath.endsWith('.js'))) {
                        result[fullPath] = calculateHash(fullPath);
                    }
                }
            }

            scanDir(dir);
        } catch (error) {
            // 忽略错误
            log(`⚠️  无法扫描目录: ${dir}`, colors.yellow);
        }
    }

    return result;
}

function checkCache(target) {
    if (!process.env.USE_CACHE) return false;

    const cacheDir = join(__dirname, '../.build-cache');
    ensureDir(cacheDir);

    const cacheFile = join(cacheDir, `${target}.json`);
    if (!existsSync(cacheFile)) return false;

    try {
        const cache = JSON.parse(readFileSync(cacheFile, 'utf8'));
        const currentHashes = getSourceFileHashes(target);

        // 检查配置文件是否变化
        const configHash = calculateHash(join(__dirname, '../build.config.cjs'));
        if (configHash !== cache.configHash) return false;

        // 检查源文件是否变化
        for (const [file, hash] of Object.entries(currentHashes)) {
            if (cache.files[file] !== hash) return false;
        }

        // 检查是否有新增文件
        if (Object.keys(currentHashes).length !== Object.keys(cache.files).length) return false;

        return true;
    } catch (error) {
        return false;
    }
}

function updateCache(target) {
    if (!process.env.USE_CACHE) return;

    const cacheDir = join(__dirname, '../.build-cache');
    ensureDir(cacheDir);

    const cacheFile = join(cacheDir, `${target}.json`);
    const currentHashes = getSourceFileHashes(target);
    const configHash = calculateHash(join(__dirname, '../build.config.cjs'));

    const cache = {
        timestamp: Date.now(),
        configHash,
        files: currentHashes
    };

    writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
}

async function main() {
    const args = process.argv.slice(2);
    // 过滤出选项参数和目标参数
    const options = args.filter(arg => arg.startsWith('--'));
    const targets = args.filter(arg => !arg.startsWith('--'));

    const target = targets[0]; // 第一个非选项参数作为构建目标
    const useCache = options.includes('--cache');
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldMinify = process.env.MINIFY === 'true' || isProduction;

    if (useCache) {
        process.env.USE_CACHE = 'true';
    }

    log(`\n🚀 Monitor SDK 构建工具`, colors.bright);
    log(`📦 环境: ${isProduction ? '生产' : '开发'}${shouldMinify ? ' (压缩)' : ''}${useCache ? ' (启用缓存)' : ''}`, colors.yellow);

    const totalStartTime = performance.now();

    // 确保输出目录存在
    ['dist', 'core/dist', 'web-core/dist', 'taro-core/dist', '.build-cache'].forEach(ensureDir);

    // 清理旧文件（如果不使用缓存）
    if (!useCache) {
        log('\n🧹 清理旧文件...', colors.yellow);
        execCommand('npm run clean');
    }

    // 构建 source-packer
    log('\n📦 构建 source-packer...', colors.yellow);
    execCommand('npm run build:source-packer');

    let success = true;

    if (target) {
        // 构建指定目标
        const targetMap = {
            'core': 'Core 核心模块',
            'web': 'Web 平台模块',
            'taro': 'Taro 小程序模块',
            'main': '主入口模块'
        };

        if (targetMap[target]) {
            success = await buildTarget(target, targetMap[target]);
        } else {
            log(`❌ 未知的构建目标: ${target}`, colors.red);
            log(`可用目标: ${Object.keys(targetMap).join(', ')}`, colors.yellow);
            process.exit(1);
        }
    } else {
        // 构建所有目标
        log('\n🔄 开始并行构建所有模块...', colors.magenta);

        const targets = [
            ['core', 'Core 核心模块'],
            ['web', 'Web 平台模块'],
            ['taro', 'Taro 小程序模块'],
            ['main', '主入口模块']
        ];

        // 并行构建以提升速度
        const buildPromises = targets.map(([target, description]) =>
            buildTarget(target, description)
        );

        const results = await Promise.all(buildPromises);
        success = results.every(result => result);
    }

    const totalEndTime = performance.now();
    const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2);

    if (success) {
        log(`\n🎉 构建完成! 总耗时: ${totalDuration}s`, colors.green);

        // 显示构建产物大小
        if (isProduction) {
            log('\n📊 构建产物大小:', colors.cyan);
            try {
                execCommand('npm run size');
            } catch (error) {
                log('⚠️  无法获取构建产物大小', colors.yellow);
            }
        }
    } else {
        log(`\n💥 构建失败! 总耗时: ${totalDuration}s`, colors.red);
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n💥 构建过程中发生错误:`, colors.red);
    console.error(error);
    process.exit(1);
});