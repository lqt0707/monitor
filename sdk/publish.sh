#!/bin/bash

# Monitor SDK 发布脚本
# 支持发布所有包或单个包

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查Git状态
check_git_status() {
    log_info "检查Git状态..."
    
    if [[ -n $(git status --porcelain) ]]; then
        log_error "存在未提交的更改，请先提交或暂存"
        exit 1
    fi
    
    if [[ $(git rev-parse --abbrev-ref HEAD) != "main" ]]; then
        log_warning "当前不在main分支，继续发布吗？(y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Git状态检查通过"
}

# 检查版本一致性
check_version_consistency() {
    log_info "检查版本一致性..."
    
    main_version=$(node -p "require('./package.json').version")
    core_version=$(node -p "require('./core/package.json').version")
    web_version=$(node -p "require('./web-core/package.json').version")
    taro_version=$(node -p "require('./taro-core/package.json').version")
    
    if [[ "$main_version" != "$core_version" ]] || [[ "$main_version" != "$web_version" ]] || [[ "$main_version" != "$taro_version" ]]; then
        log_error "版本不一致！请确保所有包的版本相同"
        echo "主包: $main_version"
        echo "Core: $core_version" 
        echo "Web: $web_version"
        echo "Taro: $taro_version"
        exit 1
    fi
    
    log_success "版本一致性检查通过 (v$main_version)"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    if ! npm run test; then
        log_error "测试失败，取消发布"
        exit 1
    fi
    
    log_success "测试通过"
}

# 构建所有包
build_all() {
    log_info "构建所有包..."
    
    if ! npm run build; then
        log_error "构建失败，取消发布"
        exit 1
    fi
    
    log_success "构建完成"
}

# 发布单个包
publish_package() {
    local package_name=$1
    local package_dir=$2
    local npm_name=$3
    
    log_info "发布 $package_name..."
    
    if [[ -n "$package_dir" ]]; then
        cd "$package_dir"
    fi
    
    # 检查是否已发布相同版本
    local current_version=$(node -p "require('./package.json').version")
    if npm view "$npm_name@$current_version" version >/dev/null 2>&1; then
        log_warning "$npm_name@$current_version 已存在，跳过发布"
        if [[ -n "$package_dir" ]]; then
            cd ..
        fi
        return
    fi
    
    # 发布
    if npm publish; then
        log_success "$package_name 发布成功"
    else
        log_error "$package_name 发布失败"
        exit 1
    fi
    
    if [[ -n "$package_dir" ]]; then
        cd ..
    fi
}

# 主函数
main() {
    log_info "🚀 开始发布 Monitor SDK..."
    
    # 检查参数
    local target=${1:-"all"}
    
    case $target in
        "all")
            log_info "发布所有包"
            check_git_status
            check_version_consistency
            run_tests
            build_all
            
            publish_package "Core模块" "core" "@monitor/core"
            publish_package "Web SDK" "web-core" "@monitor/web-sdk"
            publish_package "Taro SDK" "taro-core" "@monitor/taro-sdk"
            publish_package "主包" "" "@monitor/sdk"
            ;;
        "main")
            log_info "发布主包"
            check_git_status
            run_tests
            build_all
            publish_package "主包" "" "@monitor/sdk"
            ;;
        "core")
            log_info "发布Core模块"
            run_tests
            npm run build:core
            publish_package "Core模块" "core" "@monitor/core"
            ;;
        "web")
            log_info "发布Web SDK"
            run_tests
            npm run build:web
            publish_package "Web SDK" "web-core" "@monitor/web-sdk"
            ;;
        "taro")
            log_info "发布Taro SDK"
            run_tests
            npm run build:taro
            publish_package "Taro SDK" "taro-core" "@monitor/taro-sdk"
            ;;
        *)
            log_error "未知的发布目标: $target"
            echo "用法: $0 [all|main|core|web|taro]"
            exit 1
            ;;
    esac
    
    log_success "🎉 发布完成！"
    
    # 显示安装命令
    echo ""
    log_info "📦 用户可以通过以下方式安装："
    echo ""
    echo "  # 完整功能包（推荐新手）"
    echo "  npm install @monitor/sdk"
    echo ""
    echo "  # Web专用包（生产环境推荐）"
    echo "  npm install @monitor/web-sdk"
    echo ""
    echo "  # Taro专用包（小程序开发）"
    echo "  npm install @monitor/taro-sdk"
    echo ""
    echo "  # 核心包（自定义开发）"
    echo "  npm install @monitor/core"
    echo ""
}

# 运行主函数
main "$@"