.PHONY: help install clean build dev test lint format analyze

# 默认目标
help:
	@echo "📦 Monitor SDK 构建工具"
	@echo ""
	@echo "可用命令:"
	@echo "  make install    - 安装依赖"
	@echo "  make clean      - 清理构建产物"
	@echo "  make build      - 构建所有模块"
	@echo "  make build-prod - 生产环境构建"
	@echo "  make dev        - 开发模式"
	@echo "  make test       - 运行测试"
	@echo "  make lint       - 代码检查"
	@echo "  make format     - 代码格式化"
	@echo "  make analyze    - 构建分析"
	@echo "  make ci         - CI 检查"
	@echo ""
	@echo "模块构建:"
	@echo "  make build-core - 构建核心模块"
	@echo "  make build-web  - 构建 Web 模块"
	@echo "  make build-taro - 构建 Taro 模块"
	@echo "  make dev-web    - Web 开发模式"
	@echo "  make dev-taro   - Taro 开发模式"

# 安装依赖
install:
	@echo "📦 安装依赖..."
	npm install

# 清理构建产物
clean:
	@echo "🧹 清理构建产物..."
	npm run clean

# 构建所有模块
build:
	@echo "🔨 构建所有模块..."
	npm run build

# 生产环境构建
build-prod:
	@echo "🚀 生产环境构建..."
	npm run build:prod

# 构建指定模块
build-core:
	@echo "🔨 构建核心模块..."
	npm run build:core

build-web:
	@echo "🔨 构建 Web 模块..."
	npm run build:web

build-taro:
	@echo "🔨 构建 Taro 模块..."
	npm run build:taro

# 开发模式
dev:
	@echo "🚀 启动开发模式..."
	npm run dev

dev-web:
	@echo "🚀 启动 Web 开发模式..."
	npm run dev:web

dev-taro:
	@echo "🚀 启动 Taro 开发模式..."
	npm run dev:taro

dev-core:
	@echo "🚀 启动核心模块开发模式..."
	npm run dev:core

# 测试
test:
	@echo "🧪 运行测试..."
	npm run test

# 代码检查
lint:
	@echo "🔍 代码检查..."
	npm run lint

lint-check:
	@echo "🔍 代码检查 (只检查)..."
	npm run lint:check

# 代码格式化
format:
	@echo "✨ 代码格式化..."
	npm run format

format-check:
	@echo "✨ 代码格式检查..."
	npm run format:check

# 构建分析
analyze:
	@echo "📊 构建分析..."
	npm run analyze

analyze-web:
	@echo "📊 Web 模块分析..."
	npm run analyze:web

analyze-taro:
	@echo "📊 Taro 模块分析..."
	npm run analyze:taro

# 构建大小检查
size:
	@echo "📏 检查构建大小..."
	npm run size

# CI 检查
ci:
	@echo "🔄 CI 检查..."
	npm run ci

# 发布准备
prepare-release: clean build-prod test
	@echo "🎉 发布准备完成!"

# 快速开始
quick-start: install build
	@echo "🚀 快速开始完成!"
	@echo "💡 运行 'make dev' 开始开发"