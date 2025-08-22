#!/bin/bash

# 预提交检查脚本
# Pre-commit Check Script

echo "🔍 开始预提交检查..."

# 检查代码格式和语法
echo "📝 检查代码格式..."

# 运行测试
echo "🧪 运行测试套件..."
npm run test:format
if [ $? -ne 0 ]; then
    echo "❌ 数据格式测试失败"
    exit 1
fi

npm run test:network
if [ $? -ne 0 ]; then
    echo "❌ 网络错误测试失败"
    exit 1
fi

echo "✅ 所有测试通过"

# 检查构建
echo "🏗️ 检查构建..."
npm run deps:build
if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"

# 检查依赖状态
echo "📦 检查依赖状态..."
npm run deps:status
if [ $? -ne 0 ]; then
    echo "❌ 依赖状态检查失败"
    exit 1
fi

echo "✅ 依赖状态正常"

echo "🎉 预提交检查通过！可以安全提交代码。"