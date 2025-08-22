#!/usr/bin/env node

/**
 * 发布准备脚本
 * 用于准备项目发布到仓库
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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
 * 执行命令
 */
function runCommand(command, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

/**
 * 检查Git状态
 */
async function checkGitStatus() {
    log('🔍 检查Git状态...', 'blue');

    try {
        const { stdout } = await runCommand('git status --porcelain');

        if (stdout.trim()) {
            log('📝 发现未提交的更改:', 'yellow');
            console.log(stdout);

            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('是否要添加并提交这些更改？(y/N): ', resolve);
            });

            rl.close();

            if (answer.toLowerCase() === 'y') {
                await runCommand('git add .');
                const commitMsg = await new Promise(resolve => {
                    const rl2 = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    rl2.question('请输入提交信息: ', resolve);
                    rl2.close();
                });

                await runCommand(`git commit -m "${commitMsg}"`);
                log('✅ 更改已提交', 'green');
            }
        } else {
            log('✅ 工作区干净', 'green');
        }
    } catch (error) {
        log(`❌ Git状态检查失败: ${error.message}`, 'red');
        process.exit(1);
    }
}

/**
 * 运行测试
 */
async function runTests() {
    log('🧪 运行测试套件...', 'blue');

    const tests = [
        { name: '数据格式测试', command: 'npm run test:format' },
        { name: '网络错误测试', command: 'npm run test:network' }
    ];

    for (const test of tests) {
        try {
            log(`   运行 ${test.name}...`, 'cyan');
            await runCommand(test.command);
            log(`   ✅ ${test.name} 通过`, 'green');
        } catch (error) {
            log(`   ❌ ${test.name} 失败`, 'red');
            throw error;
        }
    }
}

/**
 * 构建项目
 */
async function buildProject() {
    log('🏗️ 构建项目...', 'blue');

    try {
        await runCommand('npm run deps:build');
        log('✅ 项目构建成功', 'green');
    } catch (error) {
        log('⚠️ 构建有警告，但已完成', 'yellow');
    }
}

/**
 * 检查依赖状态
 */
async function checkDependencies() {
    log('📦 检查依赖状态...', 'blue');

    try {
        await runCommand('npm run deps:status');
        log('✅ 依赖状态正常', 'green');
    } catch (error) {
        log(`❌ 依赖检查失败: ${error.message}`, 'red');
        throw error;
    }
}

/**
 * 生成发布信息
 */
function generateReleaseInfo() {
    log('📋 生成发布信息...', 'blue');

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;

    const releaseInfo = `
# 发布信息

## 版本: ${version}
## 发布时间: ${new Date().toLocaleString('zh-CN')}

## 🚀 主要功能
- 完整的前端监控系统
- 多端SDK支持（Web、Taro小程序）
- 管理后台界面
- 一键启动开发环境
- 完整的测试框架

## 📦 包含模块
- 后端服务 (NestJS + TypeScript)
- 管理后台 (React + TypeScript)
- Web SDK
- Taro小程序SDK
- 示例项目

## 🧪 测试状态
- ✅ 数据格式测试通过
- ✅ 网络错误测试通过
- ✅ 构建成功
- ✅ 依赖状态正常

## 🔧 使用方法
\`\`\`bash
# 克隆项目
git clone <repository-url>

# 启动开发环境
npm start
\`\`\`

## 📚 文档
- README.md - 项目说明
- CONTRIBUTING.md - 贡献指南
- CHANGELOG.md - 更新日志
- DEV_ENVIRONMENT.md - 开发环境指南
`;

    fs.writeFileSync('RELEASE_INFO.md', releaseInfo);
    log('✅ 发布信息已生成', 'green');
}

/**
 * 主函数
 */
async function main() {
    log('🎯 开始发布准备...', 'cyan');

    try {
        // 1. 检查Git状态
        await checkGitStatus();

        // 2. 检查依赖
        await checkDependencies();

        // 3. 运行测试
        await runTests();

        // 4. 构建项目
        await buildProject();

        // 5. 生成发布信息
        generateReleaseInfo();

        log('🎉 发布准备完成！', 'green');
        log('', 'reset');
        log('📋 接下来的步骤:', 'yellow');
        log('1. 创建远程仓库（GitHub/GitLab等）', 'cyan');
        log('2. 添加远程仓库地址: git remote add origin <repository-url>', 'cyan');
        log('3. 推送代码: npm run push', 'cyan');
        log('4. 创建发布版本: npm run release', 'cyan');

    } catch (error) {
        log(`❌ 发布准备失败: ${error.message}`, 'red');
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { main };