#!/bin/bash

# ============================================
# Monitor SDK - Taro小程序构建脚本
# 自动构建项目并生成sourcemap，用于错误监控
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓ ${NC}$1"
}

log_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

log_error() {
    echo -e "${RED}✗ ${NC}$1"
}

# 显示帮助信息
show_help() {
    echo -e "${CYAN}🚀 Monitor SDK Taro构建脚本${NC}"
    echo -e "${CYAN}============================${NC}"
    echo ""
    echo "用法: ./build-with-sourcemap.sh [选项]"
    echo ""
    echo "选项:"
    echo "  --help, -h        显示帮助信息"
    echo "  --project-id ID   指定项目ID（默认: 从package.json读取）"
    echo "  --version VER     指定版本号（默认: 从package.json读取）"
    echo "  --env ENV         构建环境: development|production（默认: production）"
    echo "  --platform PLAT   构建平台: weapp|h5|alipay...（默认: weapp）"
    echo "  --pack-type TYPE  打包类型: both|source|sourcemap（默认: both）"
    echo ""
    echo "示例:"
    echo "  ./build-with-sourcemap.sh"
    echo "  ./build-with-sourcemap.sh --env development --platform h5"
    echo "  ./build-with-sourcemap.sh --project-id my-app --version 2.0.0"
    echo "  ./build-with-sourcemap.sh --pack-type source      # 仅打包源代码"
    echo "  ./build-with-sourcemap.sh --pack-type sourcemap  # 仅打包Sourcemap"
    echo ""
}

# 解析命令行参数
parse_args() {
    PROJECT_ID=""
    VERSION=""
    BUILD_ENV="production"
    BUILD_PLATFORM="weapp"
    PACK_TYPE="both"  # both, source, sourcemap
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --project-id)
                PROJECT_ID="$2"
                shift 2
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            --env)
                BUILD_ENV="$2"
                shift 2
                ;;
            --platform)
                BUILD_PLATFORM="$2"
                shift 2
                ;;
            --pack-type)
                PACK_TYPE="$2"
                shift 2
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    # 检查Taro CLI
    if ! command -v taro &> /dev/null; then
        log_warning "Taro CLI 未全局安装，尝试使用本地版本"
        if ! npx taro --version &> /dev/null; then
            log_error "Taro 未安装，请运行: npm install @tarojs/cli"
            exit 1
        fi
    fi
    
    log_success "依赖检查通过"
}

# 读取项目配置
read_project_config() {
    log_info "读取项目配置..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 不存在"
        exit 1
    fi
    
    # 读取package.json
    PACKAGE_NAME=$(node -e "console.log(require('./package.json').name || 'taro-mini-app')")
    PACKAGE_VERSION=$(node -e "console.log(require('./package.json').version || '1.0.0')")
    
    # 使用命令行参数或package.json中的值
    PROJECT_ID=${PROJECT_ID:-$PACKAGE_NAME}
    VERSION=${VERSION:-$PACKAGE_VERSION}
    
    log_success "项目: ${PROJECT_ID}, 版本: ${VERSION}"
}

# 执行构建
execute_build() {
    log_info "开始构建 (环境: ${BUILD_ENV}, 平台: ${BUILD_PLATFORM})..."
    
    # 设置环境变量
    export NODE_ENV=$BUILD_ENV
    
    # 执行Taro构建
    BUILD_CMD="npm run build:${BUILD_PLATFORM}"
    
    log_info "执行: ${BUILD_CMD}"
    
    if ! eval $BUILD_CMD; then
        log_error "构建失败"
        exit 1
    fi
    
    log_success "构建完成"
}

# 验证构建产物
verify_build() {
    log_info "验证构建产物..."
    
    local DIST_DIR="dist"
    
    if [ ! -d "$DIST_DIR" ]; then
        log_error "构建产物目录不存在: $DIST_DIR"
        exit 1
    fi
    
    # 检查是否有.js文件
    local JS_FILES=$(find "$DIST_DIR" -name "*.js" | wc -l)
    if [ "$JS_FILES" -eq 0 ]; then
        log_warning "未找到JavaScript文件，可能构建配置有问题"
    else
        log_success "找到 $JS_FILES 个JavaScript文件"
    fi
    
    # 检查sourcemap文件
    local SOURCEMAP_FILES=$(find "$DIST_DIR" -name "*.map" | wc -l)
    if [ "$SOURCEMAP_FILES" -eq 0 ]; then
        log_warning "未找到sourcemap文件，请检查构建配置"
        log_warning "确保在 config/index.ts 中配置了: chain.devtool('source-map')"
    else
        log_success "找到 $SOURCEMAP_FILES 个sourcemap文件"
    fi
}

# 创建源代码上传包（仅包含源代码文件）
create_source_code_package() {
    log_info "创建源代码上传包..."
    
    local TIMESTAMP=$(date +%s)
    local ZIP_NAME="${PROJECT_ID}-${VERSION}-source-${TIMESTAMP}.zip"
    
    # 创建临时目录
    local TEMP_DIR=".monitor-source-upload"
    mkdir -p "$TEMP_DIR"
    
    # 复制源代码文件（排除dist目录和node_modules）
    find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.vue" -o -name "*.css" -o -name "*.scss" -o -name "*.less" -o -name "*.html" -o -name "*.json" -o -name "*.md" \) \
        -not -path "./dist/*" -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
        local rel_path="${file#./}"
        local dir_path="$(dirname "$rel_path")"
        mkdir -p "$TEMP_DIR/$dir_path"
        cp "$file" "$TEMP_DIR/$rel_path"
    done
    
    # 复制配置文件
    if [ -d "config" ]; then
        cp -r config/ "$TEMP_DIR/"
    fi
    
    # 复制package.json和项目配置文件
    if [ -f "package.json" ]; then
        cp package.json "$TEMP_DIR/"
    fi
    if [ -f "tsconfig.json" ]; then
        cp tsconfig.json "$TEMP_DIR/"
    fi
    if [ -f "project.config.json" ]; then
        cp project.config.json "$TEMP_DIR/"
    fi
    
    # 创建构建信息文件
    cat > "$TEMP_DIR/build-info.json" << EOF
{
  "projectId": "$PROJECT_ID",
  "version": "$VERSION",
  "buildId": "$TIMESTAMP",
  "buildTime": "$(date -Iseconds)",
  "buildEnv": "$BUILD_ENV",
  "platform": "$BUILD_PLATFORM",
  "packageType": "source-code",
  "fileCount": $(find "$TEMP_DIR" -type f | wc -l)
}
EOF
    
    # 创建ZIP包
    if command -v zip &> /dev/null; then
        cd "$TEMP_DIR"
        zip -r "../$ZIP_NAME" . > /dev/null
        cd ..
    else
        log_warning "zip 命令未安装，跳过创建压缩包"
        ZIP_NAME="$TEMP_DIR"
    fi
    
    # 清理临时目录
    rm -rf "$TEMP_DIR"
    
    log_success "源代码上传包创建完成: $ZIP_NAME"
    echo "$ZIP_NAME"
}

# 创建Sourcemap上传包（仅包含Sourcemap文件）
create_sourcemap_package() {
    log_info "创建Sourcemap上传包..."
    
    local TIMESTAMP=$(date +%s)
    local ZIP_NAME="${PROJECT_ID}-${VERSION}-sourcemap-${TIMESTAMP}.zip"
    
    # 创建临时目录
    local TEMP_DIR=".monitor-sourcemap-upload"
    mkdir -p "$TEMP_DIR"
    
    # 复制Sourcemap文件
    if [ -d "dist" ]; then
        find dist/ -name "*.map" | while read file; do
            local rel_path="${file#dist/}"
            local dir_path="$(dirname "$rel_path")"
            mkdir -p "$TEMP_DIR/$dir_path"
            cp "$file" "$TEMP_DIR/$rel_path"
        done
    fi
    
    # 创建构建信息文件
    cat > "$TEMP_DIR/build-info.json" << EOF
{
  "projectId": "$PROJECT_ID",
  "version": "$VERSION",
  "buildId": "$TIMESTAMP",
  "buildTime": "$(date -Iseconds)",
  "buildEnv": "$BUILD_ENV",
  "platform": "$BUILD_PLATFORM",
  "packageType": "sourcemap",
  "sourcemapCount": $(find "$TEMP_DIR" -name "*.map" | wc -l)
}
EOF
    
    # 创建ZIP包
    if command -v zip &> /dev/null; then
        cd "$TEMP_DIR"
        zip -r "../$ZIP_NAME" . > /dev/null
        cd ..
    else
        log_warning "zip 命令未安装，跳过创建压缩包"
        ZIP_NAME="$TEMP_DIR"
    fi
    
    # 清理临时目录
    rm -rf "$TEMP_DIR"
    
    log_success "Sourcemap上传包创建完成: $ZIP_NAME"
    echo "$ZIP_NAME"
}

# 主函数
main() {
    echo -e "${CYAN}🚀 Monitor SDK Taro构建脚本${NC}"
    echo -e "${CYAN}============================${NC}"
    echo ""
    
    # 解析参数
    parse_args "$@"
    
    # 检查依赖
    check_dependencies
    
    # 读取配置
    read_project_config
    
    # 执行构建
    execute_build
    
    # 验证构建
    verify_build
    
    # 根据打包类型创建上传包
    local SOURCE_PACKAGE_PATH=""
    local SOURCEMAP_PACKAGE_PATH=""
    
    if [[ "$PACK_TYPE" == "both" || "$PACK_TYPE" == "source" ]]; then
        SOURCE_PACKAGE_PATH=$(create_source_code_package)
    fi
    
    if [[ "$PACK_TYPE" == "both" || "$PACK_TYPE" == "sourcemap" ]]; then
        SOURCEMAP_PACKAGE_PATH=$(create_sourcemap_package)
    fi
    
    echo ""
    echo -e "${GREEN}✅ 构建完成！${NC}"
    echo ""
    echo -e "${CYAN}📦 构建摘要:${NC}"
    echo "- 项目: $PROJECT_ID"
    echo "- 版本: $VERSION"
    echo "- 环境: $BUILD_ENV"
    echo "- 平台: $BUILD_PLATFORM"
    echo "- 打包类型: $PACK_TYPE"
    
    if [[ -n "$SOURCE_PACKAGE_PATH" ]]; then
        echo "- 源代码包: $SOURCE_PACKAGE_PATH"
    fi
    
    if [[ -n "$SOURCEMAP_PACKAGE_PATH" ]]; then
        echo "- Sourcemap包: $SOURCEMAP_PACKAGE_PATH"
    fi
    echo ""
    echo -e "${CYAN}📤 下一步操作:${NC}"
    if [[ -n "$SOURCE_PACKAGE_PATH" ]]; then
        echo "1. 将源代码包上传到监控平台源代码管理界面"
    fi
    if [[ -n "$SOURCEMAP_PACKAGE_PATH" ]]; then
        echo "2. 将Sourcemap包上传到监控平台Sourcemap管理界面"
    fi
    if [[ "$PACK_TYPE" == "both" ]]; then
        echo "3. 在监控平台配置源代码与Sourcemap的版本关联"
    fi
    echo ""
    echo -e "${YELLOW}📝 注意:${NC}"
    if [[ "$PACK_TYPE" == "both" ]]; then
        echo "- 源代码与Sourcemap文件需要分别上传到不同的管理界面"
        echo "- 上传后请确保在监控平台正确配置版本关联关系"
    elif [[ "$PACK_TYPE" == "source" ]]; then
        echo "- 请将源代码包上传到监控平台源代码管理界面"
    elif [[ "$PACK_TYPE" == "sourcemap" ]]; then
        echo "- 请将Sourcemap包上传到监控平台Sourcemap管理界面"
    fi
    echo ""
}

# 执行主函数
main "$@"