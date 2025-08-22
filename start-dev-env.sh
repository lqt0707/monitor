#!/bin/bash

# 一键启动测试环境调试脚本 (Bash版本)
# 包含服务端、管理后台启动和SDK测试功能

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
NC='\033[0m' # No Color

# 配置信息
SERVER_PORT=3001
ADMIN_PORT=5173
SERVER_DIR="./server"
ADMIN_DIR="./admin"
SDK_DIR="./sdk/taroWechatMini"

# 日志函数
log() {
    local message=$1
    local color=${2:-$WHITE}
    local timestamp=$(date '+%H:%M:%S')
    echo -e "${color}[${timestamp}] ${message}${NC}"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # 端口被占用
    else
        return 0  # 端口可用
    fi
}

# 检查服务健康状态
check_health() {
    local url=$1
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null)
    if [ "$response" = "200" ]; then
        return 0  # 健康
    else
        return 1  # 不健康
    fi
}

# 等待服务启动
wait_for_service() {
    local name=$1
    local url=$2
    local max_retries=${3:-30}
    
    log "等待 ${name} 服务启动..." $YELLOW
    
    for ((i=1; i<=max_retries; i++)); do
        if check_health "$url"; then
            log "✅ ${name} 服务已启动" $GREEN
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    echo ""
    log "❌ ${name} 服务启动超时" $RED
    return 1
}

# 检查依赖是否已安装
check_dependencies() {
    local dir=$1
    local name=$2
    
    if [ ! -d "${dir}/node_modules" ]; then
        log "${name} 依赖未安装，开始安装..." $YELLOW
        
        cd "$dir" || exit 1
        npm install
        
        if [ $? -eq 0 ]; then
            log "${name} 依赖安装完成" $GREEN
        else
            log "${name} 依赖安装失败" $RED
            exit 1
        fi
        
        cd - > /dev/null || exit 1
    fi
}

# 构建SDK
build_sdk() {
    log "构建 Taro SDK..." $BLUE
    
    cd "$SDK_DIR" || exit 1
    npm run build
    
    if [ $? -eq 0 ]; then
        log "✅ SDK 构建完成" $GREEN
    else
        log "❌ SDK 构建失败" $RED
        exit 1
    fi
    
    cd - > /dev/null || exit 1
}

# 运行数据格式测试
run_data_format_test() {
    log "运行数据格式测试..." $BLUE
    
    node test-data-format.js
    
    if [ $? -eq 0 ]; then
        log "✅ 数据格式测试通过" $GREEN
    else
        log "❌ 数据格式测试失败" $RED
    fi
}

# 显示服务状态
show_service_status() {
    log "" $CYAN
    log "=== 服务状态检查 ===" $CYAN
    
    # 检查服务端
    if check_health "http://localhost:${SERVER_PORT}/api/health"; then
        log "服务端: ✅ 运行中 (http://localhost:${SERVER_PORT})" $GREEN
    else
        log "服务端: ❌ 未运行" $RED
    fi
    
    # 检查管理后台
    if check_health "http://localhost:${ADMIN_PORT}/"; then
        log "管理后台: ✅ 运行中 (http://localhost:${ADMIN_PORT})" $GREEN
    else
        log "管理后台: ❌ 未运行" $RED
    fi
}

# 显示使用说明
show_usage() {
    log "" $CYAN
    log "=== 测试环境已启动 ===" $CYAN
    log "📊 管理后台: http://localhost:${ADMIN_PORT}" $GREEN
    log "🔌 服务端API: http://localhost:${SERVER_PORT}" $GREEN
    log "📚 API文档: http://localhost:${SERVER_PORT}/api-docs" $GREEN
    log "🔍 健康检查: http://localhost:${SERVER_PORT}/api/health" $GREEN
    log "" $CYAN
    log "=== 可用的测试命令 ===" $CYAN
    log "• 运行数据格式测试: node test-data-format.js" $YELLOW
    log "• 运行集成测试: node test-integration.js" $YELLOW
    log "• 测试管理员功能: node test-admin-only.js" $YELLOW
    log "" $CYAN
    log "按 Ctrl+C 停止所有服务" $WHITE
}

# 优雅退出处理
cleanup() {
    log "" $YELLOW
    log "正在停止所有服务..." $YELLOW
    
    # 停止后台进程
    if [ -n "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    
    if [ -n "$ADMIN_PID" ]; then
        kill $ADMIN_PID 2>/dev/null
    fi
    
    # 等待进程结束
    sleep 2
    
    # 强制停止如果还在运行
    if [ -n "$SERVER_PID" ]; then
        kill -9 $SERVER_PID 2>/dev/null
    fi
    
    if [ -n "$ADMIN_PID" ]; then
        kill -9 $ADMIN_PID 2>/dev/null
    fi
    
    log "所有服务已停止" $GREEN
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    log "🚀 启动测试环境..." $CYAN
    
    # 检查端口占用
    if ! check_port $SERVER_PORT; then
        log "端口 ${SERVER_PORT} 已被占用，请先关闭占用进程" $RED
        exit 1
    fi
    
    if ! check_port $ADMIN_PORT; then
        log "端口 ${ADMIN_PORT} 已被占用，请先关闭占用进程" $RED
        exit 1
    fi
    
    # 检查必要工具
    command -v node >/dev/null 2>&1 || { log "需要安装 Node.js" $RED; exit 1; }
    command -v npm >/dev/null 2>&1 || { log "需要安装 npm" $RED; exit 1; }
    command -v curl >/dev/null 2>&1 || { log "需要安装 curl" $RED; exit 1; }
    
    # 检查和安装依赖
    check_dependencies "$SERVER_DIR" "服务端"
    check_dependencies "$ADMIN_DIR" "管理后台"
    check_dependencies "$SDK_DIR" "SDK"
    
    # 构建SDK
    build_sdk
    
    # 启动服务端
    log "启动服务端..." $BLUE
    cd "$SERVER_DIR" || exit 1
    npm run start:dev > ../server.log 2>&1 &
    SERVER_PID=$!
    cd - > /dev/null || exit 1
    
    # 等待服务端启动
    if ! wait_for_service "服务端" "http://localhost:${SERVER_PORT}/api/health"; then
        log "服务端启动失败，查看 server.log 获取详细信息" $RED
        exit 1
    fi
    
    # 运行数据格式测试
    run_data_format_test
    
    # 启动管理后台
    log "启动管理后台..." $BLUE
    cd "$ADMIN_DIR" || exit 1
    npm run dev > ../admin.log 2>&1 &
    ADMIN_PID=$!
    cd - > /dev/null || exit 1
    
    # 等待管理后台启动
    if ! wait_for_service "管理后台" "http://localhost:${ADMIN_PORT}/"; then
        log "管理后台启动失败，但服务端仍在运行，查看 admin.log 获取详细信息" $YELLOW
    fi
    
    # 显示服务状态和使用说明
    show_service_status
    show_usage
    
    # 定期检查服务状态
    while true; do
        sleep 30
        show_service_status
    done
}

# 运行主函数
main "$@"