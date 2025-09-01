#!/usr/bin/env node

/**
 * 版本管理脚本
 * 用于自动更新所有包的版本号
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 包目录列表
const PACKAGES = [
    'core',
    'web-core',
    'taro-core'
];

/**
 * 读取package.json文件
 * @param {string} packagePath - 包路径
 * @returns {Object} package.json内容
 */
function readPackageJson(packagePath) {
    try {
        const content = fs.readFileSync(packagePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`❌ 读取 ${packagePath} 失败:`, error.message);
        return null;
    }
}

/**
 * 写入package.json文件
 * @param {string} packagePath - 包路径
 * @param {Object} data - 要写入的数据
 */
function writePackageJson(packagePath, data) {
    try {
        const content = JSON.stringify(data, null, 2) + '\n';
        fs.writeFileSync(packagePath, content, 'utf8');
        console.log(`✅ 更新 ${packagePath} 成功`);
    } catch (error) {
        console.error(`❌ 写入 ${packagePath} 失败:`, error.message);
    }
}

/**
 * 更新版本号
 * @param {string} newVersion - 新版本号
 * @param {string} type - 版本类型 (patch, minor, major)
 */
function updateVersion(newVersion, type = 'patch') {
    console.log(`🚀 开始更新版本到 ${newVersion} (${type})`);

    // 更新主包版本
    const mainPackagePath = path.join(__dirname, '..', 'package.json');
    const mainPackage = readPackageJson(mainPackagePath);

    if (mainPackage) {
        mainPackage.version = newVersion;
        writePackageJson(mainPackagePath, mainPackage);
    }

    // 更新子包版本
    PACKAGES.forEach(pkgName => {
        const packagePath = path.join(__dirname, '..', pkgName, 'package.json');
        const pkg = readPackageJson(packagePath);

        if (pkg) {
            pkg.version = newVersion;
            writePackageJson(packagePath, pkg);
        }
    });

    console.log(`🎉 所有包版本已更新到 ${newVersion}`);
}

/**
 * 显示当前版本信息
 */
function showVersions() {
    console.log('📦 当前版本信息:');

    // 主包版本
    const mainPackagePath = path.join(__dirname, '..', 'package.json');
    const mainPackage = readPackageJson(mainPackagePath);

    if (mainPackage) {
        console.log(`主包 (@${mainPackage.name}): ${mainPackage.version}`);
    }

    // 子包版本
    PACKAGES.forEach(pkgName => {
        const packagePath = path.join(__dirname, '..', pkgName, 'package.json');
        const pkg = readPackageJson(packagePath);

        if (pkg) {
            console.log(`${pkgName} (@${pkg.name}): ${pkg.version}`);
        }
    });
}

/**
 * 生成下一个版本号
 * @param {string} currentVersion - 当前版本号
 * @param {string} type - 版本类型
 * @returns {string} 下一个版本号
 */
function getNextVersion(currentVersion, type = 'patch') {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (type) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
        default:
            return `${major}.${minor}.${patch + 1}`;
    }
}

/**
 * 主函数
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'show':
            showVersions();
            break;

        case 'update':
            const newVersion = args[1];
            const type = args[2] || 'patch';

            if (!newVersion) {
                console.error('❌ 请提供新版本号');
                console.log('用法: node version-manager.js update <version> [type]');
                process.exit(1);
            }

            updateVersion(newVersion, type);
            break;

        case 'bump':
            const bumpType = args[1] || 'patch';
            const mainPackagePath = path.join(__dirname, '..', 'package.json');
            const mainPackage = readPackageJson(mainPackagePath);

            if (mainPackage) {
                const nextVersion = getNextVersion(mainPackage.version, bumpType);
                updateVersion(nextVersion, bumpType);
            }
            break;

        default:
            console.log('📖 版本管理脚本使用说明:');
            console.log('');
            console.log('命令:');
            console.log('  show                   显示所有包的当前版本');
            console.log('  update <version> [type] 更新到指定版本');
            console.log('  bump [type]            自动递增版本号');
            console.log('');
            console.log('版本类型:');
            console.log('  patch (默认)           补丁版本 1.0.0 -> 1.0.1');
            console.log('  minor                  次要版本 1.0.0 -> 1.1.0');
            console.log('  major                  主要版本 1.0.0 -> 2.0.0');
            console.log('');
            console.log('示例:');
            console.log('  node version-manager.js show');
            console.log('  node version-manager.js update 1.1.0');
            console.log('  node version-manager.js bump minor');
            break;
    }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { updateVersion, showVersions, getNextVersion };
