#!/bin/bash

# 监控系统一键部署脚本
# 支持DeepSeek AI错误分析和源代码定位

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi

    log_success "Docker和Docker Compose已安装"
}

# 检查环境配置文件
check_env() {
    if [ ! -f .env ]; then
        log_warning "未找到.env文件，从示例文件创建"
        cp .env.example .env
        
        log_info "请编辑.env文件配置以下关键参数："
        echo "    - DEEPSEEK_API_KEY: DeepSeek API密钥"
        echo "    - JWT_SECRET: JWT密钥"
        echo ""
        read -p "按回车键继续编辑.env文件，或Ctrl+C取消..."
        
        # 给用户时间编辑文件
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        else
            vi .env
        fi
    else
        log_success "找到.env配置文件"
    fi
}

# 构建Docker镜像
build_images() {
    log_info "开始构建Docker镜像..."
    
    # 构建server镜像
    if [ -f "server/Dockerfile" ]; then
        log_info "构建server镜像..."
        docker build -t monitor-server:latest -f server/Dockerfile server/
    else
        log_warning "未找到server/Dockerfile，跳过server镜像构建"
    fi

    # 构建admin镜像
    if [ -f "admin/Dockerfile" ]; then
        log_info "构建admin镜像..."
        docker build -t monitor-admin:latest -f admin/Dockerfile admin/
    else
        log_warning "未找到admin/Dockerfile，跳过admin镜像构建"
    fi

    log_success "Docker镜像构建完成"
}

# 启动Docker服务
start_services() {
    log_info "启动Docker服务..."
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        log_success "Docker服务启动成功"
    else
        log_error "Docker服务启动失败"
        exit 1
    fi
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务就绪..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose logs mysql 2>&1 | grep -q "ready for connections"; then
            log_success "MySQL服务就绪"
            break
        fi
        
        log_info "等待MySQL服务... (尝试 $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "MySQL服务启动超时"
        exit 1
    fi
    
    # 等待其他服务
    sleep 5
}

# 运行数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."
    
    # 等待MySQL完全启动
    sleep 10
    
    # 运行MySQL迁移
    if [ -d "server/database/migrations" ]; then
        log_info "执行MySQL数据库迁移"
        
        # 这里可以添加具体的迁移命令
        # 例如：docker-compose exec server npm run migration:run
    fi
}

# 显示部署结果
show_deployment_info() {
    echo ""
    echo "==========================================="
    echo "           监控系统部署完成"
    echo "==========================================="
    echo ""
    echo "服务状态："
    docker-compose ps
    echo ""
    echo "访问地址："
    echo "  - 管理后台: http://localhost:3001"
    echo "  - API文档: http://localhost:3000/api/docs"
    echo "  - Redis管理: http://localhost:8081"
    echo ""
    echo "日志查看："
    echo "  - 查看所有日志: docker-compose logs -f"
    echo "  - 查看server日志: docker-compose logs server -f"
    echo "  - 查看MySQL日志: docker-compose logs mysql -f"
    echo ""
    echo "下一步操作："
    echo "  1. 访问管理后台初始化系统"
    echo "  2. 配置项目SDK接入监控"
    echo "  3. 上传源代码映射文件"
    echo ""
    echo "DeepSeek AI配置："
    echo "  请确保在.env文件中配置了正确的DEEPSEEK_API_KEY"
    echo "  系统将自动使用DeepSeek进行错误分析和定位"
    echo ""
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查关键服务端口
    local services=("3306" "6379" "8123" "3000" "3001")
    
    for port in "${services[@]}"; do
        if nc -z localhost $port 2>/dev/null; then
            log_success "端口 $port 服务正常"
        else
            log_warning "端口 $port 服务未就绪"
        fi
    done
}

# 主部署函数
deploy() {
    log_info "开始部署监控系统..."
    echo ""
    
    # 检查依赖
    check_docker
    
    # 检查环境配置
    check_env
    
    # 构建镜像
    build_images
    
    # 启动服务
    start_services
    
    # 等待服务就绪
    wait_for_services
    
    # 运行迁移
    run_migrations
    
    # 健康检查
    health_check
    
    # 显示部署信息
    show_deployment_info
    
    log_success "监控系统部署完成！"
}

# 清理函数
cleanup() {
    log_info "清理Docker资源..."
    
    docker-compose down -v
    
    log_success "清理完成"
}

# 重启函数
restart() {
    log_info "重启服务..."
    
    docker-compose restart
    
    log_success "服务重启完成"
}

# 查看日志函数
logs() {
    docker-compose logs -f $@
}

# 显示帮助
show_help() {
    echo "使用说明："
    echo "  ./deploy.sh           - 部署或更新系统"
    echo "  ./deploy.sh cleanup   - 清理Docker资源"
    echo "  ./deploy.sh restart   - 重启服务"
    echo "  ./deploy.sh logs      - 查看日志"
    echo "  ./deploy.sh help      - 显示帮助"
    echo ""
    echo "功能特性："
    echo "  - 基于Docker一键部署"
    echo "  - 支持DeepSeek AI错误分析"
    echo "  - 源代码映射和定位"
    echo "  - 多项目错误监控"
    echo ""
}

# 根据参数执行不同操作
case "${1:-}" in
    "cleanup")
        cleanup
        ;;
    "restart")
        restart
        ;;
    "logs")
        shift
        logs "$@"
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        deploy
        ;;
    *)
        log_error "未知命令: $1"
        show_help
        exit 1
        ;;
esac