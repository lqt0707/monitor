#!/usr/bin/env node

/**
 * 一键启动测试环境调试脚本
 * 包含服务端、管理后台启动和SDK测试功能
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// 配置信息
const config = {
    server: {
        port: 3001,
        dir: './server',
        startCommand: 'npm run start:dev',
        healthPath: '/api/health'
    },
    admin: {
        port: 5173,
        dir: './admin',
        startCommand: 'npm run dev',
        healthPath: '/'
    },
    sdk: {
        dir: './sdk/taroWechatMini',
        buildCommand: 'npm run build'
    }
};

// 颜色输出工具
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

/**
 * 带颜色的日志输出
 */
function log(message, color = 'white') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

/**
 * 检查端口是否被占用
 */
function checkPort(port) {
    return new Promise((resolve) => {
        const server = require('net').createServer();
        server.listen(port, (err) => {
            if (err) {
                resolve(false);
            } else {
                server.once('close', () => resolve(true));
                server.close();
            }
        });
        server.on('error', () => resolve(false));
    });
}

/**
 * 检查服务健康状态
 */
function checkHealth(url) {
    return new Promise((resolve) => {
        const request = http.get(url, (res) => {
            resolve(res.statusCode === 200);
        });

        request.on('error', () => resolve(false));
        request.setTimeout(3000, () => {
            request.destroy();
            resolve(false);
        });
    });
}

/**
 * 等待服务启动
 */
async function waitForService(name, url, maxRetries = 30) {
    log(`等待 ${name} 服务启动...`, 'yellow');

    for (let i = 0; i < maxRetries; i++) {
        try {
            const isHealthy = await checkHealth(url);
            if (isHealthy) {
                log(`✅ ${name} 服务已启动`, 'green');
                return true;
            }
        } catch (error) {
            // 忽略错误，继续重试
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        process.stdout.write('.');
    }

    log(`❌ ${name} 服务启动超时`, 'red');
    return false;
}

/**
 * 启动子进程
 */
function startProcess(name, command, cwd, color = 'white') {
    log(`启动 ${name}...`, 'blue');

    const child = spawn('sh', ['-c', command], {
        cwd: path.resolve(__dirname, cwd),
        stdio: ['pipe', 'pipe', 'pipe']
    });

    // 输出日志
    child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        lines.forEach(line => {
            log(`[${name}] ${line}`, color);
        });
    });

    child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        lines.forEach(line => {
            log(`[${name}] ${line}`, 'red');
        });
    });

    child.on('close', (code) => {
        if (code === 0) {
            log(`${name} 正常退出`, 'green');
        } else {
            log(`${name} 异常退出，代码: ${code}`, 'red');
        }
    });

    return child;
}

/**
 * 检查依赖是否已安装
 */
async function checkDependencies(dir, name) {
    const nodeModulesPath = path.resolve(__dirname, dir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        log(`${name} 依赖未安装，开始安装...`, 'yellow');

        return new Promise((resolve, reject) => {
            const installProcess = spawn('npm', ['install'], {
                cwd: path.resolve(__dirname, dir),
                stdio: 'inherit'
            });

            installProcess.on('close', (code) => {
                if (code === 0) {
                    log(`${name} 依赖安装完成`, 'green');
                    resolve();
                } else {
                    log(`${name} 依赖安装失败`, 'red');
                    reject(new Error(`${name} dependency installation failed`));
                }
            });
        });
    }
}

/**
 * 构建SDK
 */
async function buildSDK() {
    log('构建 Taro SDK...', 'blue');

    return new Promise((resolve, reject) => {
        const buildProcess = spawn('npm', ['run', 'build'], {
            cwd: path.resolve(__dirname, config.sdk.dir),
            stdio: 'inherit'
        });

        buildProcess.on('close', (code) => {
            if (code === 0) {
                log('✅ SDK 构建完成', 'green');
                resolve();
            } else {
                log('❌ SDK 构建失败', 'red');
                reject(new Error('SDK build failed'));
            }
        });
    });
}

/**
 * 运行数据格式测试
 */
async function runDataFormatTest() {
    log('运行数据格式测试...', 'blue');

    return new Promise((resolve) => {
        const testProcess = spawn('node', ['test-data-format.js'], {
            cwd: __dirname,
            stdio: 'inherit'
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                log('✅ 数据格式测试通过', 'green');
            } else {
                log('❌ 数据格式测试失败', 'red');
            }
            resolve();
        });
    });
}

/**
 * 显示服务状态
 */
async function showServiceStatus() {
    log('\n=== 服务状态检查 ===', 'cyan');

    const services = [
        { name: '服务端', url: `http://localhost:${config.server.port}${config.server.healthPath}` },
        { name: '管理后台', url: `http://localhost:${config.admin.port}${config.admin.healthPath}` }
    ];

    for (const service of services) {
        try {
            const isHealthy = await checkHealth(service.url);
            const status = isHealthy ? '✅ 运行中' : '❌ 未运行';
            log(`${service.name}: ${status} (${service.url})`, isHealthy ? 'green' : 'red');
        } catch (error) {
            log(`${service.name}: ❌ 检查失败`, 'red');
        }
    }
}

/**
 * 显示使用说明
 */
function showUsage() {
    log('\n=== 测试环境已启动 ===', 'cyan');
    log('📊 管理后台: http://localhost:5173', 'green');
    log('🔌 服务端API: http://localhost:3001', 'green');
    log('📚 API文档: http://localhost:3001/api-docs', 'green');
    log('🔍 健康检查: http://localhost:3001/api/health', 'green');
    log('\n=== 可用的测试命令 ===', 'cyan');
    log('• 运行数据格式测试: node test-data-format.js', 'yellow');
    log('• 运行集成测试: node test-integration.js', 'yellow');
    log('• 测试管理员功能: node test-admin-only.js', 'yellow');
    log('\n按 Ctrl+C 停止所有服务', 'magenta');
}

/**
 * 优雅退出处理
 */
function setupGracefulExit(processes) {
    process.on('SIGINT', () => {
        log('\n正在停止所有服务...', 'yellow');

        processes.forEach(proc => {
            if (proc && !proc.killed) {
                proc.kill('SIGTERM');
            }
        });

        setTimeout(() => {
            log('所有服务已停止', 'green');
            process.exit(0);
        }, 2000);
    });
}

/**
 * 主函数
 */
async function main() {
    const processes = [];

    try {
        log('🚀 启动测试环境...', 'cyan');

        // 检查端口占用
        const serverPortFree = await checkPort(config.server.port);
        const adminPortFree = await checkPort(config.admin.port);

        if (!serverPortFree) {
            log(`端口 ${config.server.port} 已被占用，请先关闭占用进程`, 'red');
            process.exit(1);
        }

        if (!adminPortFree) {
            log(`端口 ${config.admin.port} 已被占用，请先关闭占用进程`, 'red');
            process.exit(1);
        }

        // 检查和安装依赖
        await checkDependencies(config.server.dir, '服务端');
        await checkDependencies(config.admin.dir, '管理后台');
        await checkDependencies(config.sdk.dir, 'SDK');

        // 构建SDK
        await buildSDK();

        // 启动服务端
        const serverProcess = startProcess(
            '服务端',
            config.server.startCommand,
            config.server.dir,
            'blue'
        );
        processes.push(serverProcess);

        // 等待服务端启动
        const serverReady = await waitForService(
            '服务端',
            `http://localhost:${config.server.port}${config.server.healthPath}`
        );

        if (!serverReady) {
            log('服务端启动失败，退出程序', 'red');
            process.exit(1);
        }

        // 运行数据格式测试
        await runDataFormatTest();

        // 启动管理后台
        const adminProcess = startProcess(
            '管理后台',
            config.admin.startCommand,
            config.admin.dir,
            'green'
        );
        processes.push(adminProcess);

        // 等待管理后台启动
        const adminReady = await waitForService(
            '管理后台',
            `http://localhost:${config.admin.port}${config.admin.healthPath}`
        );

        if (!adminReady) {
            log('管理后台启动失败，但服务端仍在运行', 'yellow');
        }

        // 显示服务状态和使用说明
        await showServiceStatus();
        showUsage();

        // 设置优雅退出
        setupGracefulExit(processes);

        // 定期检查服务状态
        setInterval(async () => {
            await showServiceStatus();
        }, 30000); // 每30秒检查一次

    } catch (error) {
        log(`启动失败: ${error.message}`, 'red');

        // 清理进程
        processes.forEach(proc => {
            if (proc && !proc.killed) {
                proc.kill('SIGTERM');
            }
        });

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
    startProcess,
    checkHealth,
    waitForService,
    showServiceStatus
};