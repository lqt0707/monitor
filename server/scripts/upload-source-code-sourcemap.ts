#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SourceCodeSourcemapIntegrationService } from '../src/modules/monitor/services/source-code-sourcemap-integration.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 源代码和sourcemap压缩包上传CLI工具
 * 用于测试源代码和sourcemap压缩包的上传功能
 */
async function bootstrap() {
  console.log('🚀 开始上传源代码和sourcemap压缩包...\n');

  // 解析命令行参数
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('❌ 用法: upload-source-code-sourcemap <project-id> <version> <source-code-zip> <sourcemap-zip>');
    console.error('示例: upload-source-code-sourcemap test-project 1.0.0 ./source-code.zip ./sourcemap.zip');
    process.exit(1);
  }

  const [projectId, version, sourceCodeZipPath, sourcemapZipPath] = args;

  // 检查文件是否存在
  if (!fs.existsSync(sourceCodeZipPath)) {
    console.error(`❌ 源代码压缩包不存在: ${sourceCodeZipPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(sourcemapZipPath)) {
    console.error(`❌ Sourcemap压缩包不存在: ${sourcemapZipPath}`);
    process.exit(1);
  }

  try {
    // 创建NestJS应用
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // 获取集成服务
    const integrationService = app.get(SourceCodeSourcemapIntegrationService);

    // 读取压缩包文件
    const sourceCodeBuffer = fs.readFileSync(sourceCodeZipPath);
    const sourcemapBuffer = fs.readFileSync(sourcemapZipPath);

    console.log(`📦 项目ID: ${projectId}`);
    console.log(`🏷️  版本号: ${version}`);
    console.log(`📁 源代码压缩包: ${path.basename(sourceCodeZipPath)} (${formatFileSize(sourceCodeBuffer.length)})`);
    console.log(`🗺️  Sourcemap压缩包: ${path.basename(sourcemapZipPath)} (${formatFileSize(sourcemapBuffer.length)})\n`);

    // 上传源代码和sourcemap
    const result = await integrationService.uploadSourceCodeAndSourcemap(
      sourceCodeBuffer,
      sourcemapBuffer,
      projectId,
      version,
      {
        buildId: `build-${Date.now()}`,
        branchName: 'main',
        commitMessage: 'Auto upload from CLI',
        uploadedBy: 'cli-tool',
        description: 'Automatically uploaded source code and sourcemap archives',
        setAsActive: true
      }
    );

    console.log('✅ 上传结果:');
    console.log(`   - 状态: ${result.success ? '成功' : '失败'}`);
    console.log(`   - 消息: ${result.message}`);
    console.log(`   - 源代码版本ID: ${result.sourceCodeVersionId}`);
    console.log(`   - 源代码文件数: ${result.sourceCodeFileCount}`);
    console.log(`   - Sourcemap处理成功数: ${result.sourcemapProcessedCount}`);
    console.log(`   - Sourcemap处理失败数: ${result.sourcemapErrorCount}\n`);

    // 获取关联信息
    const association = await integrationService.getSourceCodeSourcemapAssociation(projectId, version);
    
    if (association.success) {
      console.log('🔗 关联信息:');
      console.log(`   - 源代码版本: ${association.sourceCodeVersion?.version}`);
      console.log(`   - 是否关联sourcemap: ${association.sourceCodeVersion?.hasSourcemap ? '是' : '否'}`);
      console.log(`   - Sourcemap文件数: ${association.sourcemapFiles?.length || 0}\n`);
    }

    console.log('🎉 上传完成！');
    
    await app.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ 上传失败:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 运行上传
bootstrap().catch(console.error);