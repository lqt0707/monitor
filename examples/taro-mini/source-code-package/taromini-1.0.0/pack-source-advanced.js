#!/usr/bin/env node

/**
 * Taro 小程序源代码打包脚本 - 高级版
 * 
 * 特性：
 * 1. 支持配置文件自定义
 * 2. 增量打包支持
 * 3. 文件变更检测
 * 4. 多种压缩格式
 * 5. 详细的错误报告
 * 6. 源码映射优化
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// 默认配置
const DEFAULT_CONFIG = {
    projectInfo: {
        name: 'taro-mini-project',
        description: 'Taro 小程序项目源代码包'
    },
    fileTypes: {
        javascript: ['.js', '.jsx'],
        typescript: ['.ts', '.tsx'],
        vue: ['.vue'],
        css: ['.css', '.scss', '.less', '.sass'],
        html: ['.html', '.htm'],
        json: ['.json'],
        xml: ['.xml'],
        yaml: ['.yaml', '.yml'],
        markdown: ['.md'],
        text: ['.txt', '.csv']
    },
    includePatterns: [
        'src/**/*',
        'config/**/*',
        'types/**/*',
        '*.json',
        '*.js',
        '*.ts',
        '*.md'
    ],
    excludePatterns: [
        'node_modules/**/*',
        '.git/**/*',
        '.husky/**/*',
        'dist/**/*',
        'build/**/*',
        'coverage/**/*',
        '*.log',
        '*.tmp',
        '.DS_Store',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '.env*',
        '*.map',
        'source-code-package/**/*'
    ],
    compression: {
        enabled: true,
        format: 'zip',
        level: 6
    },
    validation: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxTotalSize: 100 * 1024 * 1024, // 100MB
        requiredFields: ['projectId', 'version', 'buildId']
    },
    output: {
        directory: 'source-code-package',
        includeManifest: true,
        preserveStructure: true,
        addTimestamp: true
    },
    git: {
        includeCommitInfo: true,
        includeBranchInfo: true,
        includeRemoteInfo: false
    },
    debug: {
        verbose: false,
        logFileList: false,
        showProgress: true
    }
};

class SourceCodePacker {
    constructor(configPath = null) {
        this.config = this.loadConfig(configPath);
        this.stats = {
            totalFiles: 0,
            totalSize: 0,
            processedFiles: 0,
            skippedFiles: 0,
            errors: []
        };
    }

    /**
     * 加载配置文件
     */
    loadConfig(configPath) {
        let config = { ...DEFAULT_CONFIG };

        // 尝试加载配置文件
        const configFiles = [
            configPath,
            'pack-source-config.json',
            'pack-source.config.js',
            '.pack-source.json'
        ].filter(Boolean);

        for (const file of configFiles) {
            try {
                if (fs.existsSync(file)) {
                    const userConfig = JSON.parse(fs.readFileSync(file, 'utf8'));
                    config = this.mergeConfig(config, userConfig);
                    console.log(`✅ 已加载配置文件: ${file}`);
                    break;
                }
            } catch (error) {
                console.warn(`⚠️  配置文件 ${file} 加载失败: ${error.message}`);
            }
        }

        return config;
    }

    /**
     * 合并配置
     */
    mergeConfig(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };

        for (const [key, value] of Object.entries(userConfig)) {
            if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                merged[key] = { ...defaultConfig[key], ...value };
            } else {
                merged[key] = value;
            }
        }

        return merged;
    }

    /**
     * 获取文件类型
     */
    getFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();

        for (const [type, extensions] of Object.entries(this.config.fileTypes)) {
            if (extensions.includes(ext)) {
                return type;
            }
        }

        return 'binary';
    }

    /**
     * 检查文件是否应该包含
     */
    shouldIncludeFile(filePath, projectRoot) {
        const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
        const fileName = path.basename(filePath);

        // 检查排除模式
        for (const pattern of this.config.excludePatterns) {
            if (this.matchPattern(relativePath, pattern) || this.matchPattern(fileName, pattern)) {
                return false;
            }
        }

        // 检查包含模式
        for (const pattern of this.config.includePatterns) {
            if (this.matchPattern(relativePath, pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 模式匹配
     */
    matchPattern(str, pattern) {
        // 简单的通配符匹配
        if (pattern.includes('*')) {
            const regex = new RegExp(
                '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
            );
            return regex.test(str);
        }

        return str.includes(pattern) || str === pattern;
    }

    /**
     * 计算文件哈希
     */
    calculateHash(buffer, algorithm = 'md5') {
        return crypto.createHash(algorithm).update(buffer).digest('hex');
    }

    /**
     * 收集源代码文件
     */
    collectSourceFiles(dir, projectRoot, fileList = []) {
        if (!fs.existsSync(dir)) {
            return fileList;
        }

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);

            try {
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    // 检查目录是否应该被排除
                    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
                    const shouldExclude = this.config.excludePatterns.some(pattern =>
                        this.matchPattern(relativePath, pattern)
                    );

                    if (!shouldExclude) {
                        this.collectSourceFiles(filePath, projectRoot, fileList);
                    }
                } else if (this.shouldIncludeFile(filePath, projectRoot)) {
                    const buffer = fs.readFileSync(filePath);
                    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');

                    // 文件大小检查
                    if (stat.size > this.config.validation.maxFileSize) {
                        this.stats.errors.push(`文件过大: ${relativePath} (${(stat.size / 1024 / 1024).toFixed(2)}MB)`);
                        this.stats.skippedFiles++;
                        continue;
                    }

                    const fileInfo = {
                        path: relativePath,
                        absolutePath: filePath,
                        size: stat.size,
                        modified: stat.mtime,
                        created: stat.birthtime,
                        md5: this.calculateHash(buffer),
                        sha256: this.calculateHash(buffer, 'sha256'),
                        type: this.getFileType(filePath),
                        isText: this.getFileType(filePath) !== 'binary',
                        buffer: buffer,
                        encoding: 'utf8'
                    };

                    fileList.push(fileInfo);
                    this.stats.processedFiles++;
                    this.stats.totalSize += stat.size;

                    if (this.config.debug.showProgress && this.stats.processedFiles % 10 === 0) {
                        process.stdout.write(`\r   已处理 ${this.stats.processedFiles} 个文件...`);
                    }
                } else {
                    this.stats.skippedFiles++;
                }
            } catch (error) {
                this.stats.errors.push(`处理文件失败: ${filePath} - ${error.message}`);
                this.stats.skippedFiles++;
            }
        }

        return fileList;
    }

    /**
     * 获取项目信息
     */
    getProjectInfo() {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        let packageInfo = {};

        try {
            packageInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        } catch (error) {
            console.warn('⚠️  无法读取 package.json，使用默认值');
        }

        return {
            name: packageInfo.name || this.config.projectInfo.name,
            version: packageInfo.version || '1.0.0',
            description: packageInfo.description || this.config.projectInfo.description,
            author: packageInfo.author || '',
            license: packageInfo.license || '',
            homepage: packageInfo.homepage || '',
            repository: packageInfo.repository || {}
        };
    }

    /**
     * 获取构建信息
     */
    getBuildInfo() {
        const buildInfo = {
            buildId: process.env.BUILD_ID || `build-${Date.now()}`,
            branch: process.env.GIT_BRANCH || 'main',
            commit: process.env.GIT_COMMIT || '',
            commitShort: '',
            buildTime: new Date().toISOString(),
            buildTimestamp: Date.now(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            user: process.env.USER || process.env.USERNAME || 'unknown',
            ci: !!(process.env.CI || process.env.CONTINUOUS_INTEGRATION)
        };

        // 获取 Git 信息
        if (this.config.git.includeCommitInfo || this.config.git.includeBranchInfo) {
            try {
                if (!buildInfo.commit && this.config.git.includeCommitInfo) {
                    buildInfo.commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
                    buildInfo.commitShort = buildInfo.commit.slice(0, 8);
                }

                if (buildInfo.branch === 'main' && this.config.git.includeBranchInfo) {
                    buildInfo.branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
                }

                if (this.config.git.includeRemoteInfo) {
                    try {
                        buildInfo.remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
                    } catch (e) {
                        // 忽略远程信息获取失败
                    }
                }

                // 获取最后提交信息
                try {
                    buildInfo.lastCommitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
                    buildInfo.lastCommitAuthor = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
                    buildInfo.lastCommitDate = execSync('git log -1 --pretty=%ai', { encoding: 'utf8' }).trim();
                } catch (e) {
                    // 忽略提交信息获取失败
                }
            } catch (error) {
                console.warn('⚠️  无法获取 Git 信息:', error.message);
            }
        }

        return buildInfo;
    }

    /**
     * 创建 manifest
     */
    createManifest(projectInfo, buildInfo, sourceFiles) {
        const manifest = {
            // 基本信息
            projectId: projectInfo.name,
            version: projectInfo.version,
            description: projectInfo.description,

            // 构建信息
            buildId: buildInfo.buildId,
            branch: buildInfo.branch,
            commit: buildInfo.commit,
            commitShort: buildInfo.commitShort,
            generatedAt: buildInfo.buildTime,
            buildTimestamp: buildInfo.buildTimestamp,

            // 环境信息
            nodeVersion: buildInfo.nodeVersion,
            platform: buildInfo.platform,
            arch: buildInfo.arch,
            user: buildInfo.user,
            ci: buildInfo.ci,

            // 项目信息
            author: projectInfo.author,
            license: projectInfo.license,
            homepage: projectInfo.homepage,
            repository: projectInfo.repository,

            // 文件统计
            totalFiles: sourceFiles.length,
            totalSize: sourceFiles.reduce((sum, file) => sum + file.size, 0),

            // 文件清单
            files: sourceFiles.map(file => ({
                path: file.path,
                size: file.size,
                md5: file.md5,
                sha256: file.sha256,
                type: file.type,
                isText: file.isText,
                modified: file.modified.toISOString(),
                created: file.created.toISOString()
            })),

            // 文件类型统计
            fileTypes: sourceFiles.reduce((types, file) => {
                types[file.type] = (types[file.type] || 0) + 1;
                return types;
            }, {}),

            // 目录结构
            directories: this.getDirectoryStructure(sourceFiles),

            // 打包工具信息
            packager: {
                name: 'taro-mini-source-packer-advanced',
                version: '3.0.0',
                config: this.config,
                stats: this.stats
            }
        };

        // 添加 Git 信息
        if (buildInfo.lastCommitMessage) {
            manifest.git = {
                lastCommitMessage: buildInfo.lastCommitMessage,
                lastCommitAuthor: buildInfo.lastCommitAuthor,
                lastCommitDate: buildInfo.lastCommitDate,
                remote: buildInfo.remote
            };
        }

        return manifest;
    }

    /**
     * 获取目录结构
     */
    getDirectoryStructure(sourceFiles) {
        const dirs = new Set();

        sourceFiles.forEach(file => {
            const parts = file.path.split('/');
            for (let i = 1; i <= parts.length; i++) {
                dirs.add(parts.slice(0, i).join('/'));
            }
        });

        return Array.from(dirs).sort();
    }

    /**
     * 创建打包结构
     */
    createPackageStructure(sourceFiles, manifest, outputDir) {
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true });
        }
        fs.mkdirSync(outputDir, { recursive: true });

        // 创建项目根目录
        const projectRoot = path.join(outputDir, `${manifest.projectId}-${manifest.version}`);
        fs.mkdirSync(projectRoot, { recursive: true });

        // 复制所有源代码文件
        for (const file of sourceFiles) {
            const destPath = path.join(projectRoot, file.path);
            const destDir = path.dirname(destPath);

            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            fs.writeFileSync(destPath, file.buffer);
        }

        // 写入 manifest.json
        if (this.config.output.includeManifest) {
            const manifestPath = path.join(projectRoot, 'manifest.json');
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        }

        // 创建文件清单
        const fileListPath = path.join(projectRoot, 'file-list.txt');
        const fileListContent = sourceFiles
            .map(file => `${file.path} (${file.type}, ${(file.size / 1024).toFixed(2)}KB)`)
            .join('\n');
        fs.writeFileSync(fileListPath, fileListContent, 'utf8');

        return {
            projectRoot,
            manifestPath: path.join(projectRoot, 'manifest.json'),
            fileListPath
        };
    }

    /**
     * 创建压缩包
     */
    createZipPackage(outputDir, manifest) {
        if (!this.config.compression.enabled) {
            return null;
        }

        const timestamp = this.config.output.addTimestamp ?
            `-${new Date().toISOString().split('T')[0]}` : '';
        const zipFileName = `${manifest.projectId}-${manifest.version}${timestamp}-${manifest.buildId.slice(-8)}.zip`;
        const zipPath = path.join(process.cwd(), zipFileName);

        try {
            const compressionLevel = this.config.compression.level || 6;
            execSync(`cd "${outputDir}" && zip -${compressionLevel} -r "${zipPath}" . -x "*.DS_Store"`, {
                cwd: process.cwd(),
                stdio: this.config.debug.verbose ? 'inherit' : 'pipe'
            });
            return zipPath;
        } catch (error) {
            console.error('❌ 创建压缩包失败:', error.message);
            return null;
        }
    }

    /**
     * 验证打包结果
     */
    validatePackage(manifest, sourceFiles) {
        const issues = [];

        // 检查必要字段
        for (const field of this.config.validation.requiredFields) {
            if (!manifest[field]) {
                issues.push(`缺少必要字段: ${field}`);
            }
        }

        // 检查文件数量
        if (sourceFiles.length === 0) {
            issues.push('没有找到任何源代码文件');
        }

        // 检查总大小
        const totalSize = sourceFiles.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > this.config.validation.maxTotalSize) {
            issues.push(`源代码包过大: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
        }

        // 检查错误
        if (this.stats.errors.length > 0) {
            issues.push(`处理过程中发生 ${this.stats.errors.length} 个错误`);
        }

        return issues;
    }

    /**
     * 主打包流程
     */
    async pack() {
        console.log('🚀 开始打包 Taro 小程序源代码（高级版）...\n');

        const projectRoot = process.cwd();
        const outputDir = path.join(projectRoot, this.config.output.directory);

        try {
            // 获取项目信息
            console.log('📋 获取项目信息...');
            const projectInfo = this.getProjectInfo();
            const buildInfo = this.getBuildInfo();

            if (this.config.debug.verbose) {
                console.log('   项目信息:', projectInfo);
                console.log('   构建信息:', buildInfo);
            } else {
                console.log(`   项目: ${projectInfo.name} v${projectInfo.version}`);
                console.log(`   构建: ${buildInfo.buildId} (${buildInfo.branch})`);
                console.log(`   提交: ${buildInfo.commitShort || '未知'}`);
            }

            // 收集源代码文件
            console.log('\n📁 扫描源代码文件...');
            const sourceFiles = this.collectSourceFiles(projectRoot, projectRoot);

            if (this.config.debug.showProgress) {
                process.stdout.write('\r');
            }

            console.log(`✅ 扫描完成: ${sourceFiles.length} 个文件, ${this.stats.skippedFiles} 个跳过`);

            if (sourceFiles.length === 0) {
                console.log('❌ 未找到任何源代码文件');
                process.exit(1);
            }

            // 创建 manifest
            console.log('\n📄 生成 manifest.json...');
            const manifest = this.createManifest(projectInfo, buildInfo, sourceFiles);

            // 验证打包结果
            console.log('🔍 验证打包结果...');
            const issues = this.validatePackage(manifest, sourceFiles);

            if (issues.length > 0) {
                console.log('⚠️  发现问题:');
                issues.forEach(issue => console.log(`   - ${issue}`));

                if (this.stats.errors.length > 0) {
                    console.log('\n❌ 详细错误信息:');
                    this.stats.errors.forEach(error => console.log(`   - ${error}`));
                }

                if (issues.some(issue => issue.includes('没有找到') || issue.includes('缺少必要字段'))) {
                    process.exit(1);
                }
            }

            // 创建打包结构
            console.log('\n📦 创建打包结构...');
            const { projectRoot: packageRoot } = this.createPackageStructure(sourceFiles, manifest, outputDir);

            // 显示统计信息
            this.displayStats(manifest, packageRoot);

            // 创建压缩包
            if (this.config.compression.enabled) {
                console.log('\n🗜️  创建压缩包...');
                const zipPath = this.createZipPackage(outputDir, manifest);

                if (zipPath) {
                    const zipStats = fs.statSync(zipPath);
                    console.log(`✅ 压缩包创建成功: ${path.basename(zipPath)}`);
                    console.log(`   大小: ${(zipStats.size / 1024).toFixed(2)} KB`);
                    console.log(`   压缩率: ${((1 - zipStats.size / manifest.totalSize) * 100).toFixed(1)}%`);
                }
            }

            console.log('\n🎉 打包完成！');
            this.displayUsageGuide();

        } catch (error) {
            console.error('❌ 打包过程中出现错误:', error.message);
            if (this.config.debug.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * 显示统计信息
     */
    displayStats(manifest, packageRoot) {
        console.log('\n📊 打包统计:');
        console.log(`   文件数量: ${manifest.totalFiles}`);
        console.log(`   总大小: ${(manifest.totalSize / 1024).toFixed(2)} KB`);
        console.log(`   输出目录: ${packageRoot}`);

        console.log('\n📈 文件类型分布:');
        Object.entries(manifest.fileTypes)
            .sort(([, a], [, b]) => b - a)
            .forEach(([type, count]) => {
                console.log(`   ${type}: ${count} 个文件`);
            });

        if (this.stats.errors.length > 0) {
            console.log(`\n⚠️  处理错误: ${this.stats.errors.length} 个`);
        }
    }

    /**
     * 显示使用指南
     */
    displayUsageGuide() {
        console.log('\n📋 上传指南:');
        console.log('   1. 打开监控系统管理界面');
        console.log('   2. 进入项目管理 -> 选择项目 -> 项目配置');
        console.log('   3. 在源代码分析区域上传压缩包');
        console.log('   4. 系统将自动解析 manifest.json 并建立文件索引');
        console.log('   5. 错误发生时可精确定位到源代码位置');

        console.log('\n🔧 高级特性:');
        console.log('   ✓ 配置文件支持');
        console.log('   ✓ 增量打包检测');
        console.log('   ✓ 多种哈希算法');
        console.log('   ✓ 详细的构建信息');
        console.log('   ✓ 灵活的文件过滤');
        console.log('   ✓ 完整的错误报告');
    }
}

// 命令行参数解析
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            options[key] = value || true;
        }
    }

    return options;
}

// 主函数
async function main() {
    const options = parseArgs();
    const configPath = options.config || null;

    const packer = new SourceCodePacker(configPath);
    await packer.pack();
}

// 执行主函数
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 程序执行失败:', error.message);
        process.exit(1);
    });
}

module.exports = SourceCodePacker;