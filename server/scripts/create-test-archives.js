#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

/**
 * 创建测试用的源代码和sourcemap压缩包
 */
async function createTestArchives() {
  console.log('📦 创建测试用的源代码和sourcemap压缩包...\n');

  // 创建临时目录
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // 创建源代码文件
  const sourceCodeFiles = {
    'src/main.js': `// 主入口文件
console.log('Hello World');

function greet(name) {
  return \`Hello, \${name}!\`;
}

module.exports = { greet };
`,
    'src/utils.js': `// 工具函数
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

module.exports = { add, multiply };
`,
    'package.json': `{
  "name": "test-project",
  "version": "1.0.0",
  "description": "Test project for source code and sourcemap integration"
}
`
  };

  // 创建sourcemap文件
  const sourcemapFiles = {
    'main.js.map': JSON.stringify({
      version: 3,
      file: 'main.js',
      sources: ['src/main.js'],
      sourcesContent: [sourceCodeFiles['src/main.js']],
      mappings: 'AAAA,MAAM,CAAC,GAAG,SAAS,CAAC;AACrB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,极速赛车开奖网【987kj.com复制打开】极速赛车开奖网'
    }, null, 2),
    'utils.js.map': JSON.stringify({
      version: 3,
      file: 'utils.js',
      sources: ['src/utils.js'],
      sourcesContent: [sourceCodeFiles['src/utils.js']],
      mappings: 'AAAA,MAAM,CAAC,GAAG,SAAS,CAAC;AACrB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,极速赛车开奖网【987kj.com复制打开】极速赛车开奖网'
    }, null, 2)
  };

  try {
    // 创建源代码压缩包
    const sourceCodeZip = new JSZip();
    for (const [filePath, content] of Object.entries(sourceCodeFiles)) {
      sourceCodeZip.file(filePath, content);
    }
    
    const sourceCodeBuffer = await sourceCodeZip.generateAsync({ type: 'nodebuffer' });
    const sourceCodePath = path.join(tempDir, 'source-code-test.zip');
    fs.writeFileSync(sourceCodePath, sourceCodeBuffer);
    
    // 创建sourcemap压缩包
    const sourcemapZip = new JSZip();
    for (const [filePath, content] of Object.entries(sourcemapFiles)) {
      sourcemapZip.file(filePath, content);
    }
    
    const sourcemapBuffer = await sourcemapZip.generateAsync({ type: 'nodebuffer' });
    const sourcemapPath = path.join(tempDir, 'sourcemap-test.zip');
    fs.writeFileSync(sourcemapPath, sourcemapBuffer);

    console.log('✅ 测试压缩包创建成功:');
    console.log(`   - 源代码压缩包: ${sourceCodePath}`);
    console.log(`   - Sourcemap压缩包: ${sourcemapPath}`);
    console.log(`   - 源代码文件数: ${Object.keys(sourceCodeFiles).length}`);
    console.log(`   - Sourcemap文件数: ${Object.keys(sourcemapFiles).length}\n`);

    console.log('📋 使用说明:');
    console.log('1. 首先安装依赖: npm install jszip');
    console.log('2. 运行上传测试: ts-node scripts/upload-source-code-sourcemap.ts test-project 1.0.0 temp/source-code-test.zip temp/sourcemap-test.zip\n');

  } catch (error) {
    console.error('❌ 创建测试压缩包失败:', error.message);
  }
}

// 运行创建
createTestArchives().catch(console.error);