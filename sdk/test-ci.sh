#!/bin/bash

# CI环境测试脚本
echo "🧪 模拟CI环境测试..."

# 清理环境
echo "🧹 清理构建产物..."
npm run clean

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 构建
echo "🔨 执行构建..."
npm run build

# 检查构建产物
echo "🔍 检查构建产物..."

# 检查core模块
if [ -f "core/dist/index.js" ]; then
    echo "✅ core模块构建产物存在"
else
    echo "❌ core模块构建产物缺失"
    echo "📁 core目录内容:"
    ls -la core/ || echo "core目录不存在"
    echo "📁 core/dist目录内容:"
    ls -la core/dist/ || echo "core/dist目录不存在"
    exit 1
fi

# 检查web模块
if [ -f "web-core/dist/index.js" ]; then
    echo "✅ web模块构建产物存在"
else
    echo "❌ web模块构建产物缺失"
    echo "📁 web-core目录内容:"
    ls -la web-core/ || echo "web-core目录不存在"
    echo "📁 web-core/dist目录内容:"
    ls -la web-core/dist/ || echo "web-core/dist目录不存在"
    exit 1
fi

# 检查taro模块
if [ -f "taro-core/dist/index.js" ]; then
    echo "✅ taro模块构建产物存在"
else
    echo "❌ taro模块构建产物缺失"
    echo "📁 taro-core目录内容:"
    ls -la taro-core/ || echo "taro-core目录不存在"
    echo "📁 taro-core/dist目录内容:"
    ls -la taro-core/dist/ || echo "taro-core/dist目录不存在"
    exit 1
fi

# 检查main模块
if [ -f "dist/index.js" ]; then
    echo "✅ main模块构建产物存在"
else
    echo "❌ main模块构建产物缺失"
    echo "📁 dist目录内容:"
    ls -la dist/ || echo "dist目录不存在"
    exit 1
fi

echo "🎉 所有模块构建成功！"
echo "📊 构建产物统计:"
echo "core模块: $(find core/dist -name '*.js' | wc -l) 个JS文件"
echo "web模块: $(find web-core/dist -name '*.js' | wc -l) 个JS文件"
echo "taro模块: $(find taro-core/dist -name '*.js' | wc -l) 个JS文件"
echo "main模块: $(find dist -name '*.js' | wc -l) 个JS文件"
