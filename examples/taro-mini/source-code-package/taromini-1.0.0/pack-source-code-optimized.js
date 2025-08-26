#!/usr/bin/env node

/**
 * Taro 小程序源代码打包脚本 - 优化版
 * 用于收集所有源代码文件，便于上传到监控系统进行错误定位
 * 
 * 主要优化：
 * 1. 生成标准 manifest.json 文件
 * 2. 更精确的文件类型识别
 * 3. 支持构建信息和版本控制
 * 4. 优化的压缩包结构
 * 5. 更好的错误定位支持
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// 支持的源代码文件扩展名和类型映射
const FILE_TYPE_MAP = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.vue': 'vue',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.html': 'html',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.txt': 'text',
    '.csv': 'text'
};

// 文本文件扩展名
const TEXT_EXTENSIONS = Object.keys(FILE_TYPE_MAP);

// 需要排除的目录和文件模式
const EXCLUDE_PATTERNS = [
    // 依赖目录
    'node_modules',
    '.git',
    '.husky',

    // 构建产物
    'dist',
    'build',
    'coverage',

    // 临时文件
    '*.log',
    '*.tmp',
    '.DS_Store',

    // 锁文件
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',

    // 环境文件
    '.env',
    '.env.*',

    // 源码映射文件（避免重复）
    '*.map',

    // 打包输出目录
    'source-code-package'
];

/**
 * 计算文件 MD5 哈希
 */
function calculateMD5(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * 获取文件类型
 */
function getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return FILE_TYPE_MAP[ext] || (TEXT_EXTENSIONS.includes(ext) ? 'text' : 'binary');
}

/**
 * 判断是否为文本文件
 */
function isTextFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return TEXT_EXTENSIONS.includes(ext);
}

/**
 * 检查文件是否应该被包含在打包中
 */
function shouldIncludeFile(filePath, projectRoot) {
    const relativePath = path.relative(projectRoot, filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // 检查文件扩展名
    if (!TEXT_EXTENSIONS.includes(ext)) {
        return false;
    }

    // 检查排除模式
    for (const pattern of EXCLUDE_PATTERNS) {
        if (pattern.startsWith('*.')) {
            // 通配符模式匹配
            const wildcardExt = pattern.substring(1);
            if (fileName.endsWith(wildcardExt)) {
                return false;
            }
        } else if (pattern.startsWith('.env')) {
            // 环境文件匹配
            if (fileName.startsWith('.env')) {
                return false;
            }
        } else if (relativePath.includes(pattern) || relativePath.startsWith(pattern)) {
            // 目录或文件匹配
            return false;
        }
    }

    return true;
}

/**
 * 递归收集所有源代码文件
 */
function collectSourceFiles(dir, projectRoot, fileList = []) {
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
                const relativePath = path.relative(projectRoot, filePath);
                const shouldExclude = EXCLUDE_PATTERNS.some(pattern =>
                    !pattern.includes('*') && (relativePath === pattern || relativePath.startsWith(pattern + '/'))
                );

                if (!shouldExclude) {
                    collectSourceFiles(filePath, projectRoot, fileList);
                }
            } else if (shouldIncludeFile(filePath, projectRoot)) {
                const buffer = fs.readFileSync(filePath);
                const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');

                fileList.push({
                    path: relativePath,
                    absolutePath: filePath,
                    size: stat.size,
                    modified: stat.mtime,
                    md5: calculateMD5(buffer),
                    type: getFileType(filePath),
                    text: isTextFile(filePath),
                    buffer: buffer
                });
            }
        } catch (error) {
            console.warn(`跳过文件 ${filePath}: ${error.message}`);
        }
    }

    return fileList;
}

/**
 * 获取项目信息
 */
function getProjectInfo() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    let packageInfo = {};

    try {
        packageInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error) {
        console.warn('无法读取 package.json，使用默认值');
    }

    // 获取原始项目名称
    let projectName = packageInfo.name || 'taro-mini-project';

    // 项目名称格式化选项 - 可以根据需要修改
    // 选项1: 保持原样 (默认)
    // projectName = projectName;

    // 选项2: 转换为小写
    // projectName = projectName.toLowerCase();

    // 选项3: 转换为短横线格式 (kebab-case)
    // projectName = projectName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');

    return {
        name: projectName,
        version: packageInfo.version || '1.0.0',
        description: packageInfo.description || ''
    };
}

/**
 * 获取构建信息
 */
function getBuildInfo() {
    const buildInfo = {
        buildId: process.env.BUILD_ID || `build-${Date.now()}`,
        branch: process.env.GIT_BRANCH || 'main',
        commit: process.env.GIT_COMMIT || '',
        buildTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
    };

    // 尝试获取 Git 信息
    try {
        if (!buildInfo.commit) {
            buildInfo.commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        }
        if (buildInfo.branch === 'main') {
            buildInfo.branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        }
    } catch (error) {
        console.warn('无法获取 Git 信息:', error.message);
    }

    return buildInfo;
}

/**
 * 创建 manifest.json 文件
 */
function createManifest(projectInfo, buildInfo, sourceFiles) {
    return {
        // 项目基本信息 - 保持原始格式，不进行大小写转换
        projectId: projectInfo.name,
        version: projectInfo.version,
        description: projectInfo.description,

        // 构建信息
        buildId: buildInfo.buildId,
        branch: buildInfo.branch,
        commit: buildInfo.commit,
        generatedAt: buildInfo.buildTime,

        // 环境信息
        nodeVersion: buildInfo.nodeVersion,
        platform: buildInfo.platform,
        arch: buildInfo.arch,

        // 文件统计
        totalFiles: sourceFiles.length,
        totalSize: sourceFiles.reduce((sum, file) => sum + file.size, 0),

        // 文件清单
        files: sourceFiles.map(file => ({
            path: file.path,
            size: file.size,
            md5: file.md5,
            type: file.type,
            text: file.text,
            modified: file.modified.toISOString()
        })),

        // 文件类型统计
        fileTypes: sourceFiles.reduce((types, file) => {
            types[file.type] = (types[file.type] || 0) + 1;
            return types;
        }, {}),

        // 打包工具信息
        packager: {
            name: 'taro-mini-source-packer',
            version: '2.0.0',
            optimized: true
        }
    };
}

/**
 * 创建打包目录结构
 */
function createPackageStructure(sourceFiles, manifest, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 创建项目根目录
    const projectRoot = path.join(outputDir, `${manifest.projectId}-${manifest.version}`);
    if (!fs.existsSync(projectRoot)) {
        fs.mkdirSync(projectRoot, { recursive: true });
    }

    // 复制所有源代码文件，保持目录结构
    for (const file of sourceFiles) {
        const destPath = path.join(projectRoot, file.path);
        const destDir = path.dirname(destPath);

        // 创建目标目录
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // 写入文件内容
        fs.writeFileSync(destPath, file.buffer);
    }

    // 写入 manifest.json
    const manifestPath = path.join(projectRoot, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return {
        projectRoot,
        manifestPath
    };
}

/**
 * 创建压缩包
 */
function createZipPackage(outputDir, manifest) {
    const zipFileName = `${manifest.projectId}-${manifest.version}-${manifest.buildId.slice(-8)}.zip`;
    const zipPath = path.join(process.cwd(), zipFileName);

    try {
        // 使用系统 zip 命令创建压缩包
        execSync(`cd "${outputDir}" && zip -r "${zipPath}" . -x "*.DS_Store"`, {
            cwd: process.cwd(),
            stdio: 'inherit'
        });
        return zipPath;
    } catch (error) {
        console.error('创建压缩包失败:', error.message);
        console.log('请手动压缩 output 目录');
        return null;
    }
}

/**
 * 验证打包结果
 */
function validatePackage(manifest, sourceFiles) {
    const issues = [];

    // 检查必要字段
    if (!manifest.projectId) issues.push('缺少 projectId');
    if (!manifest.version) issues.push('缺少 version');
    if (!manifest.buildId) issues.push('缺少 buildId');

    // 检查文件数量
    if (sourceFiles.length === 0) {
        issues.push('没有找到任何源代码文件');
    }

    // 检查文件大小
    const totalSize = sourceFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 50 * 1024 * 1024) { // 50MB
        issues.push(`源代码包过大: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    }

    return issues;
}

/**
 * 主函数
 */
function main() {
    console.log('🚀 开始打包 Taro 小程序源代码（优化版）...\n');

    const projectRoot = process.cwd();
    const outputDir = path.join(projectRoot, 'source-code-package');

    try {
        // 获取项目信息
        console.log('📋 获取项目信息...');
        const projectInfo = getProjectInfo();
        const buildInfo = getBuildInfo();

        console.log(`   项目名称: ${projectInfo.name}`);
        console.log(`   项目版本: ${projectInfo.version}`);
        console.log(`   构建ID: ${buildInfo.buildId}`);
        console.log(`   分支: ${buildInfo.branch}`);
        console.log(`   提交: ${buildInfo.commit.slice(0, 8)}`);

        // 收集所有源代码文件
        console.log('\n📁 扫描源代码文件...');
        const sourceFiles = collectSourceFiles(projectRoot, projectRoot);

        if (sourceFiles.length === 0) {
            console.log('❌ 未找到任何源代码文件');
            process.exit(1);
        }

        console.log(`✅ 找到 ${sourceFiles.length} 个源代码文件`);

        // 创建 manifest
        console.log('\n📄 生成 manifest.json...');
        const manifest = createManifest(projectInfo, buildInfo, sourceFiles);

        // 验证打包结果
        console.log('🔍 验证打包结果...');
        const issues = validatePackage(manifest, sourceFiles);
        if (issues.length > 0) {
            console.log('⚠️  发现问题:');
            issues.forEach(issue => console.log(`   - ${issue}`));

            if (issues.some(issue => issue.includes('没有找到') || issue.includes('缺少'))) {
                process.exit(1);
            }
        }

        // 创建打包结构
        console.log('\n📦 创建打包结构...');
        const { projectRoot: packageRoot } = createPackageStructure(sourceFiles, manifest, outputDir);

        // 显示统计信息
        console.log('\n📊 打包统计:');
        console.log(`   文件数量: ${manifest.totalFiles}`);
        console.log(`   总大小: ${(manifest.totalSize / 1024).toFixed(2)} KB`);
        console.log(`   文件类型: ${Object.keys(manifest.fileTypes).join(', ')}`);
        console.log(`   输出目录: ${packageRoot}`);

        // 显示文件类型分布
        console.log('\n📈 文件类型分布:');
        Object.entries(manifest.fileTypes).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} 个文件`);
        });

        // 创建压缩包
        console.log('\n🗜️  创建压缩包...');
        const zipPath = createZipPackage(outputDir, manifest);

        if (zipPath) {
            console.log(`✅ 压缩包创建成功: ${path.basename(zipPath)}`);

            // 显示压缩包信息
            const zipStats = fs.statSync(zipPath);
            console.log(`   压缩包大小: ${(zipStats.size / 1024).toFixed(2)} KB`);
            console.log(`   压缩率: ${((1 - zipStats.size / manifest.totalSize) * 100).toFixed(1)}%`);
        }

        console.log('\n🎉 打包完成！');
        console.log('\n📋 上传指南:');
        console.log('   1. 打开监控系统管理界面');
        console.log('   2. 进入项目管理 -> 选择项目 -> 项目配置');
        console.log('   3. 在源代码分析区域上传压缩包');
        console.log('   4. 系统将自动解析 manifest.json 并建立文件索引');
        console.log('   5. 错误发生时可精确定位到源代码位置');

        console.log('\n🔧 优化特性:');
        console.log('   ✓ 标准 manifest.json 格式');
        console.log('   ✓ 完整的文件类型识别');
        console.log('   ✓ MD5 文件完整性校验');
        console.log('   ✓ 构建信息和版本控制');
        console.log('   ✓ 优化的压缩包结构');
        console.log('   ✓ 精确的错误定位支持');

    } catch (error) {
        console.error('❌ 打包过程中出现错误:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = {
    collectSourceFiles,
    createManifest,
    createPackageStructure,
    shouldIncludeFile,
    getFileType,
    isTextFile
};