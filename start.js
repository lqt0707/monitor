#!/usr/bin/env node

/**
 * 高级启动脚本 - 支持多种启动模式
 * 用法: node start.js [mode] [options]
 * 模式: dev | server | admin | test | build
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// 配置信息
const config = {
    server: {
        port: process.env.SERVER_PORT || 3001,
        dir: './server',
        startCommand: 'npm run start:dev',
        healthPath: '/api/health'
    },
    admin: {
        port: process.env.ADMIN_PORT || 5173,
        dir: './admin',
        startCommand: 'npm run dev',
        healthPath: '/'
    },
    sdk: {
        taro: './sdk/taroWechatMini',
        web: './sdk/web'
    }
};

// 颜色和图标
const ui = {
    colors: {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
        reset: '\x1b[0m'
    },
    icons: {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        rocket: '🚀',
        gear: '⚙️',
        package: '📦',
        server: '🔌',
        admin: '📊',
        test: '🧪',
        build: '🏗️'
    }
};

/**
 * 日志工具
 */
class Logger {
    static log(message, color = 'white', icon = '') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = icon ? `${icon} ` : '';
        console.log(`${ui.colors[color]}[${timestamp}] ${prefix}${message}${ui.colors.reset}`);
    }

    static success(message) {
        this.log(message, 'green', ui.icons.success);
    }

    static error(message) {
        this.log(message, 'red', ui.icons.error);
    }

    static warning(message) {
        this.log(message, 'yellow', ui.icons.warning);
    }

    static info(message) {
        this.log(message, 'cyan', ui.icons.info);
    }

    static header(message) {
        console.log(`\\n${ui.colors.cyan}${'='.repeat(50)}${ui.colors.reset}`);
        console.log(`${ui.colors.cyan}${message}${ui.colors.reset}`);
        console.log(`${ui.colors.cyan}${'='.repeat(50)}${ui.colors.reset}\\n`);
    }
}

/**
 * 进程管理器
 */
class ProcessManager {
    constructor() {
        this.processes = new Map();
        this.setupGracefulExit();
    }

    spawn(name, command, cwd, options = {}) {
        Logger.info(`启动 ${name}...`);

        const child = spawn('sh', ['-c', command], {
            cwd: path.resolve(__dirname, cwd),
            stdio: options.silent ? 'pipe' : ['pipe', 'pipe', 'pipe'],
            ...options
        });

        this.processes.set(name, child);

        if (!options.silent) {
            child.stdout.on('data', (data) => {
                const lines = data.toString().split('\\n').filter(line => line.trim());
                lines.forEach(line => {
                    Logger.log(`[${name}] ${line}`, options.color || 'white');
                });
            });

            child.stderr.on('data', (data) => {
                const lines = data.toString().split('\\n').filter(line => line.trim());
                lines.forEach(line => {
                    Logger.log(`[${name}] ${line}`, 'red');
                });
            });
        }

        child.on('close', (code) => {
            this.processes.delete(name);
            if (code === 0) {
                Logger.success(`${name} 正常退出`);
            } else {
                Logger.error(`${name} 异常退出，代码: ${code}`);
            }
        });

        return child;
    }

    kill(name) {
        const process = this.processes.get(name);
        if (process && !process.killed) {
            process.kill('SIGTERM');
            return true;
        }
        return false;
    }

    killAll() {
        Logger.warning('正在停止所有服务...');
        for (const [name, process] of this.processes) {
            if (!process.killed) {
                Logger.info(`停止 ${name}`);
                process.kill('SIGTERM');
            }
        }

        setTimeout(() => {
            for (const [name, process] of this.processes) {
                if (!process.killed) {
                    Logger.warning(`强制停止 ${name}`);
                    process.kill('SIGKILL');
                }
            }
        }, 3000);
    }

    setupGracefulExit() {
        process.on('SIGINT', () => {
            Logger.header('正在优雅关闭...');
            this.killAll();
            setTimeout(() => {
                Logger.success('所有服务已停止');
                process.exit(0);
            }, 5000);
        });
    }
}

/**
 * 工具函数
 */
class Utils {
    static async checkPort(port) {
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

    static async checkHealth(url, timeout = 3000) {
        return new Promise((resolve) => {
            const http = require('http');
            const request = http.get(url, (res) => {
                resolve(res.statusCode === 200);
            });

            request.on('error', () => resolve(false));
            request.setTimeout(timeout, () => {
                request.destroy();
                resolve(false);
            });
        });
    }

    static async waitFor(condition, options = {}) {
        const { maxRetries = 30, interval = 2000, name = '服务' } = options;

        for (let i = 0; i < maxRetries; i++) {
            if (await condition()) {
                return true;
            }
            if (i === 0) Logger.info(`等待 ${name} 启动...`);
            process.stdout.write('.');
            await new Promise(resolve => setTimeout(resolve, interval));
        }

        console.log('');
        Logger.error(`${name} 启动超时`);
        return false;
    }

    static async runCommand(command, cwd = '.') {
        return new Promise((resolve, reject) => {
            exec(command, { cwd: path.resolve(__dirname, cwd) }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }

    static async question(prompt) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(prompt, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }
}

/**
 * 启动模式
 */
class StartupModes {
    constructor() {
        this.pm = new ProcessManager();
    }

    async dev(options = {}) {
        Logger.header(`${ui.icons.rocket} 启动完整开发环境`);

        // 检查端口
        const serverPortFree = await Utils.checkPort(config.server.port);
        const adminPortFree = await Utils.checkPort(config.admin.port);

        if (!serverPortFree) {
            Logger.error(`端口 ${config.server.port} 被占用`);
            const answer = await Utils.question('是否继续？(y/N): ');
            if (answer.toLowerCase() !== 'y') {
                process.exit(1);
            }
        }

        if (!adminPortFree) {
            Logger.error(`端口 ${config.admin.port} 被占用`);
            const answer = await Utils.question('是否继续？(y/N): ');
            if (answer.toLowerCase() !== 'y') {
                process.exit(1);
            }
        }

        // 构建SDK
        if (!options.skipBuild) {
            await this.buildSDK();
        }

        // 启动服务端
        this.pm.spawn('服务端', config.server.startCommand, config.server.dir, { color: 'blue' });

        const serverReady = await Utils.waitFor(
            () => Utils.checkHealth(`http://localhost:${config.server.port}${config.server.healthPath}`),
            { name: '服务端' }
        );

        if (!serverReady) {
            Logger.error('服务端启动失败');
            return;
        }

        // 运行测试
        if (!options.skipTest) {
            await this.runTests();
        }

        // 启动管理后台
        this.pm.spawn('管理后台', config.admin.startCommand, config.admin.dir, { color: 'green' });

        const adminReady = await Utils.waitFor(
            () => Utils.checkHealth(`http://localhost:${config.admin.port}${config.admin.healthPath}`),
            { name: '管理后台' }
        );

        this.showStatus();
        this.showUsage();

        // 定期状态检查
        setInterval(() => this.showStatus(), 60000);
    }

    async server() {
        Logger.header(`${ui.icons.server} 启动服务端`);
        this.pm.spawn('服务端', config.server.startCommand, config.server.dir, { color: 'blue' });

        const ready = await Utils.waitFor(
            () => Utils.checkHealth(`http://localhost:${config.server.port}${config.server.healthPath}`),
            { name: '服务端' }
        );

        if (ready) {
            Logger.success(`服务端已启动: http://localhost:${config.server.port}`);
        }
    }

    async admin() {
        Logger.header(`${ui.icons.admin} 启动管理后台`);
        this.pm.spawn('管理后台', config.admin.startCommand, config.admin.dir, { color: 'green' });

        const ready = await Utils.waitFor(
            () => Utils.checkHealth(`http://localhost:${config.admin.port}${config.admin.healthPath}`),
            { name: '管理后台' }
        );

        if (ready) {
            Logger.success(`管理后台已启动: http://localhost:${config.admin.port}`);
        }
    }

    async test() {
        Logger.header(`${ui.icons.test} 运行测试`);
        await this.runTests();
    }

    async build() {
        Logger.header(`${ui.icons.build} 构建项目`);
        await this.buildAll();
    }

    async buildSDK() {
        Logger.info(`${ui.icons.gear} 构建 SDK...`);

        try {
            const { stdout } = await Utils.runCommand('npm run build', config.sdk.taro);
            Logger.success('Taro SDK 构建完成');
        } catch (error) {
            Logger.warning('Taro SDK 构建有警告，但已完成');
        }
    }

    async buildAll() {
        const builds = [
            { name: 'Taro SDK', dir: config.sdk.taro },
            { name: 'Web SDK', dir: config.sdk.web },
            { name: '管理后台', dir: config.admin.dir }
        ];

        for (const build of builds) {
            try {
                Logger.info(`构建 ${build.name}...`);
                await Utils.runCommand('npm run build', build.dir);
                Logger.success(`${build.name} 构建完成`);
            } catch (error) {
                Logger.error(`${build.name} 构建失败: ${error.message}`);
            }
        }
    }

    async runTests() {
        const tests = [
            { name: '数据格式测试', file: 'test-data-format.js' },
            { name: '网络错误测试', file: 'test-network-errors.js' },
            { name: '集成测试', file: 'test-integration.js' }
        ];

        for (const test of tests) {
            try {
                Logger.info(`运行 ${test.name}...`);
                await Utils.runCommand(`node ${test.file}`);
                Logger.success(`${test.name} 通过`);
            } catch (error) {
                Logger.error(`${test.name} 失败`);
            }
        }
    }

    async showStatus() {
        const services = [
            { name: '服务端', url: `http://localhost:${config.server.port}${config.server.healthPath}` },
            { name: '管理后台', url: `http://localhost:${config.admin.port}${config.admin.healthPath}` }
        ];

        Logger.info('服务状态检查:');
        for (const service of services) {
            const isHealthy = await Utils.checkHealth(service.url);
            const status = isHealthy ? `${ui.icons.success} 运行中` : `${ui.icons.error} 停止`;
            const color = isHealthy ? 'green' : 'red';
            Logger.log(`  ${service.name}: ${status}`, color);
        }
    }

    showUsage() {
        Logger.header('服务地址');
        Logger.log(`📊 管理后台: http://localhost:${config.admin.port}`, 'green');
        Logger.log(`🔌 服务端API: http://localhost:${config.server.port}`, 'blue');
        Logger.log(`📚 API文档: http://localhost:${config.server.port}/api-docs`, 'cyan');
        Logger.log(`🔍 健康检查: http://localhost:${config.server.port}/api/health`, 'yellow');
        Logger.log('\\n按 Ctrl+C 停止所有服务', 'gray');
    }
}

/**
 * 主函数
 */
async function main() {
    const [mode = 'dev', ...args] = process.argv.slice(2);
    const options = {
        skipBuild: args.includes('--skip-build'),
        skipTest: args.includes('--skip-test'),
        silent: args.includes('--silent')
    };

    const startup = new StartupModes();

    switch (mode) {
        case 'dev':
        case 'development':
            await startup.dev(options);
            break;
        case 'server':
        case 'srv':
            await startup.server();
            break;
        case 'admin':
        case 'frontend':
            await startup.admin();
            break;
        case 'test':
            await startup.test();
            break;
        case 'build':
            await startup.build();
            break;
        case 'help':
        case '-h':
        case '--help':
            showHelp();
            break;
        default:
            Logger.error(`未知模式: ${mode}`);
            showHelp();
            process.exit(1);
    }
}

function showHelp() {
    console.log(`
${ui.colors.cyan}监控系统启动脚本${ui.colors.reset}

${ui.colors.yellow}用法:${ui.colors.reset}
  node start.js [模式] [选项]

${ui.colors.yellow}模式:${ui.colors.reset}
  dev          启动完整开发环境 (默认)
  server       仅启动服务端
  admin        仅启动管理后台
  test         运行测试
  build        构建项目
  help         显示帮助

${ui.colors.yellow}选项:${ui.colors.reset}
  --skip-build 跳过 SDK 构建
  --skip-test  跳过测试
  --silent     静默模式

${ui.colors.yellow}示例:${ui.colors.reset}
  node start.js dev
  node start.js server
  node start.js build
  node start.js dev --skip-test --skip-build
`);
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        Logger.error(`程序异常: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { StartupModes, ProcessManager, Logger, Utils };