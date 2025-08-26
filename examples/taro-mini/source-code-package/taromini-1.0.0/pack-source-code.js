#!/usr/bin/env node

/**
 * Taro 小程序源代码打包脚本
 * 用于收集所有源代码文件，便于上传到监控系统进行错误定位
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 支持的源代码文件扩展名
const SUPPORTED_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx', '.vue',
  '.css', '.scss', '.less', '.html',
  '.json', '.xml', '.yaml', '.yml', '.md'
];

// 需要排除的目录和文件
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.husky',
  'package-lock.json',
  '*.map',
  '*.log'
];

/**
 * 检查文件是否应该被包含在打包中
 */
function shouldIncludeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  
  // 检查文件扩展名
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
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
    } else if (filePath.includes(pattern)) {
      // 目录或文件匹配
      return false;
    }
  }
  
  return true;
}

/**
 * 递归收集所有源代码文件
 */
function collectSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      collectSourceFiles(filePath, fileList);
    } else if (shouldIncludeFile(filePath)) {
      fileList.push({
        path: filePath,
        size: stat.size,
        modified: stat.mtime
      });
    }
  }
  
  return fileList;
}

/**
 * 创建打包目录结构（符合后端解析格式）
 */
function createPackageStructure(sourceFiles, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 直接复制所有源代码文件到压缩包根目录
  // 后端期望压缩包内直接包含源代码文件，不需要manifest.json
  for (const file of sourceFiles) {
    const relativePath = path.relative(process.cwd(), file.path);
    const destPath = path.join(outputDir, relativePath);
    
    // 创建目标目录
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // 复制文件
    fs.copyFileSync(file.path, destPath);
  }
  
  // 返回简化的统计信息
  return {
    totalFiles: sourceFiles.length,
    totalSize: sourceFiles.reduce((sum, file) => sum + file.size, 0)
  };
}

/**
 * 获取项目版本号
 */
function getPackageVersion() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * 创建压缩包
 */
function createZipPackage(outputDir) {
  const zipFileName = `taro-mini-source-${new Date().toISOString().split('T')[0]}.zip`;
  const zipPath = path.join(process.cwd(), zipFileName);
  
  try {
    // 使用系统zip命令创建压缩包，从outputDir内部开始压缩
    // 这样压缩包内就不会包含完整的目录路径
    execSync(`cd "${outputDir}" && zip -r "${zipPath}" . -x "*.DS_Store"`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    return zipPath;
  } catch (error) {
    console.warn('创建压缩包失败，请手动压缩output目录');
    return null;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始打包 Taro 小程序源代码...\n');
  
  const projectRoot = process.cwd();
  const outputDir = path.join(projectRoot, 'source-code-package');
  
  try {
    // 收集所有源代码文件
    console.log('📁 扫描源代码文件...');
    const sourceFiles = collectSourceFiles(projectRoot);
    
    if (sourceFiles.length === 0) {
      console.log('❌ 未找到任何源代码文件');
      process.exit(1);
    }
    
    console.log(`✅ 找到 ${sourceFiles.length} 个源代码文件`);
    
    // 创建打包结构
    console.log('📦 创建打包结构...');
    const manifest = createPackageStructure(sourceFiles, outputDir);
    
    console.log('\n📊 打包统计:');
    console.log(`   文件数量: ${manifest.totalFiles}`);
    console.log(`   总大小: ${(manifest.totalSize / 1024).toFixed(2)} KB`);
    console.log(`   输出目录: ${outputDir}`);
    
    // 尝试创建压缩包
    console.log('\n🗜️  创建压缩包...');
    const zipPath = createZipPackage(outputDir);
    
    if (zipPath) {
      console.log(`✅ 压缩包创建成功: ${zipPath}`);
    }
    
    console.log('\n🎉 打包完成！');
    console.log('\n📋 下一步操作:');
    console.log('   1. 打开监控系统管理界面 (http://localhost:3000)');
    console.log('   2. 进入项目管理 -> 选择项目 -> 项目配置');
    console.log('   3. 在源代码分析区域使用上传组件');
    console.log('   4. 选择压缩包格式为ZIP并上传文件');
    console.log('   5. 系统将自动分析源代码');
    
  } catch (error) {
    console.error('❌ 打包过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  collectSourceFiles,
  createPackageStructure,
  shouldIncludeFile
};