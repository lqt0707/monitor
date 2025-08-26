#!/usr/bin/env node

/**
 * Monitor SDK 源代码打包命令行工具
 * 用户只需要运行: npx @monitor/sdk pack-source
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// 确保source-packer已构建
function ensureSourcePackerBuilt() {
    const sourcePackerDir = path.join(__dirname, '../source-packer');
    const distDir = path.join(sourcePackerDir, 'dist');
    const indexFile = path.join(distDir, 'index.js');

    // 检查是否需要构建
    if (!fs.existsSync(indexFile)) {
        console.log('🔨 首次使用，正在构建源代码打包工具...');
        try {
            // 构建source-packer
            execSync('npx tsc', {
                cwd: sourcePackerDir,
                stdio: 'inherit'
            });
            console.log('✅ 构建完成！\n');
        } catch (error) {
            console.error('❌ 构建失败:', error.message);
            process.exit(1);
        }
    }
}

// 确保构建完成后再导入
ensureSourcePackerBuilt();
const { packSourceCode, getRecommendedConfig } = require('../source-packer/dist/index.js');

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        mode: 'advanced',
        verbose: false,
        createZip: true,
        help: false
    };

    args.forEach(arg => {
        if (arg.startsWith('--mode=')) {
            options.mode = arg.split('=')[1];
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--no-zip') {
            options.createZip = false;
        } else if (arg === '--help' || arg === '-h') {
            options.help = true;
        }
    });

    return options;
}

// 显示帮助信息
function showHelp() {
    console.log(`
📦 Monitor SDK 源代码打包工具

用法:
  npx @monitor/sdk pack-source [选项]

选项:
  --mode=basic|advanced    打包模式 (默认: advanced)
  --verbose, -v           启用详细日志
  --no-zip               不创建压缩包
  --help, -h             显示帮助信息

示例:
  npx @monitor/sdk pack-source                    # 智能打包
  npx @monitor/sdk pack-source --mode=basic       # 基础模式
  npx @monitor/sdk pack-source --verbose          # 详细日志
  npx @monitor/sdk pack-source --no-zip           # 不创建压缩包

🚀 特性:
  - 自动检测项目类型 (Taro/Web/React/Vue等)
  - 智能应用最佳配置
  - 一键生成监控平台所需的源代码包
  - 完善的错误处理和友好提示

📚 更多信息: https://github.com/your-org/monitor-sdk
`);
}

// 检测项目类型
function detectProjectInfo() {
    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, 'package.json');

    let projectInfo = {
        name: path.basename(cwd),
        type: 'unknown',
        framework: 'unknown'
    };

    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            projectInfo.name = packageJson.name || projectInfo.name;

            // 检测项目类型
            if (fs.existsSync(path.join(cwd, 'project.config.json')) ||
                fs.existsSync(path.join(cwd, 'config/index.ts'))) {
                projectInfo.type = 'taro';
                projectInfo.framework = 'Taro小程序';
            } else if (packageJson.dependencies) {
                if (packageJson.dependencies['react'] || packageJson.dependencies['@types/react']) {
                    projectInfo.type = 'web';
                    projectInfo.framework = 'React';
                } else if (packageJson.dependencies['vue']) {
                    projectInfo.type = 'web';
                    projectInfo.framework = 'Vue';
                } else if (packageJson.dependencies['@angular/core']) {
                    projectInfo.type = 'web';
                    projectInfo.framework = 'Angular';
                } else {
                    projectInfo.type = 'web';
                    projectInfo.framework = 'Web';
                }
            }
        } catch (error) {
            console.warn('⚠️ 无法读取package.json，使用默认配置');
        }
    }

    return projectInfo;
}

async function main() {
    const args = parseArgs();

    if (args.help) {
        showHelp();
        return;
    }

    console.log('🚀 Monitor SDK 源代码打包工具\n');

    try {
        // 检测项目信息
        const projectInfo = detectProjectInfo();
        console.log('🔍 项目信息:');
        console.log(`- 项目名称: ${projectInfo.name}`);
        console.log(`- 项目类型: ${projectInfo.framework}`);
        console.log('');

        // 获取推荐配置
        const recommendedConfig = getRecommendedConfig(projectInfo.type);

        // 合并配置
        const packOptions = {
            ...recommendedConfig,
            ...args,
            projectRoot: process.cwd(),
            outputDir: 'monitor-source-package'
        };

        console.log('⚙️ 打包配置:');
        console.log(`- 模式: ${packOptions.mode}`);
        console.log(`- 详细日志: ${packOptions.verbose ? '是' : '否'}`);
        console.log(`- 创建压缩包: ${packOptions.createZip ? '是' : '否'}`);
        console.log('');

        console.log('🔄 开始打包...');
        const startTime = Date.now();

        // 执行打包
        const result = await packSourceCode(packOptions);

        const duration = Date.now() - startTime;

        if (result.success) {
            console.log('\n✅ 打包成功！');
            console.log('\n📊 统计信息:');
            console.log(`- 处理文件数: ${result.stats.totalFiles}`);
            console.log(`- 总大小: ${(result.stats.totalSize / 1024).toFixed(2)} KB`);
            console.log(`- 耗时: ${duration} ms`);
            console.log(`- 输出目录: ${result.output.directory}`);

            if (result.output.zipPath) {
                console.log(`- 压缩包: ${result.output.zipPath}`);
            }

            console.log('\n🎯 下一步操作:');
            console.log('1. 打开监控系统管理界面');
            console.log('2. 进入项目配置页面');
            console.log('3. 上传生成的源代码包');
            console.log('4. 开始享受完整的错误监控功能');

            console.log('\n💡 提示:');
            console.log('- 可以将此命令添加到package.json的scripts中');
            console.log('- 建议在CI/CD流程中自动执行此命令');

        } else {
            console.error('\n❌ 打包失败:', result.error);
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ 执行异常:', error.message);
        if (args.verbose) {
            console.error('详细错误信息:', error.stack);
        }
        console.error('\n💡 解决建议:');
        console.error('1. 确保在项目根目录执行命令');
        console.error('2. 检查项目是否包含源代码文件');
        console.error('3. 使用 --verbose 参数查看详细错误信息');
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}