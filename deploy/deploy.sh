#!/bin/bash

# 监控系统一键部署脚本
# 支持DeepSeek AI错误分析和源代码定位
# 支持多环境部署和监控

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$SCRIPT_DIR/.env"
ENV_EXAMPLE="$SCRIPT_DIR/env.example"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
LOG_FILE="$SCRIPT_DIR/deploy.log"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1" | tee -a "$LOG_FILE"
}

# 初始化日志
init_log() {
    echo "=== 监控系统部署日志 - $(date) ===" > "$LOG_FILE"
    log_info "部署脚本开始执行"
}

# 检查系统要求
check_system_requirements() {
    log_step "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" != "darwin"* ]] && [[ "$OSTYPE" != "linux-gnu"* ]]; then
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    
    # 检查内存
    local total_mem=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || sysctl -n hw.memsize 2>/dev/null | awk '{print $0/1024/1024}')
    if [[ -n "$total_mem" ]] && [[ $total_mem -lt 4096 ]]; then
        log_warning "系统内存不足，建议至少4GB内存"
    fi
    
    # 检查磁盘空间
    local available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ -n "$available_space" ]] && [[ $available_space -lt 10 ]]; then
        log_warning "磁盘空间不足，建议至少10GB可用空间"
    fi
    
    log_success "系统要求检查完成"
}

# 检查Docker是否安装
check_docker() {
    log_step "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        log_info "安装命令："
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  brew install --cask docker"
        else
            echo "  curl -fsSL https://get.docker.com | sh"
        fi
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        log_info "安装命令："
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  brew install docker-compose"
        else
            echo "  sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"
        fi
        exit 1
    fi

    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker服务未启动，请启动Docker服务"
        exit 1
    fi

    # 检查Docker Compose版本
    local compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    log_info "Docker Compose版本: $compose_version"
    
    log_success "Docker环境检查完成"
}

# 检查环境配置文件
check_env() {
    log_step "检查环境配置..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "未找到.env文件，从示例文件创建"
        
        if [ ! -f "$ENV_EXAMPLE" ]; then
            log_error "未找到env.example文件，请检查部署目录"
            exit 1
        fi
        
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        
        log_info "请编辑.env文件配置以下关键参数："
        echo "    - DEEPSEEK_API_KEY: DeepSeek API密钥"
        echo "    - JWT_SECRET: JWT密钥"
        echo "    - 数据库密码"
        echo ""
        read -p "按回车键继续编辑.env文件，或Ctrl+C取消..."
        
        # 给用户时间编辑文件
        if command -v nano &> /dev/null; then
            nano "$ENV_FILE"
        elif command -v vim &> /dev/null; then
            vim "$ENV_FILE"
        else
            vi "$ENV_FILE"
        fi
        
        # 验证必要的环境变量
        validate_env_vars
    else
        log_success "找到.env配置文件"
        validate_env_vars
    fi
}

# 验证环境变量
validate_env_vars() {
    log_info "验证环境变量..."
    
    # 检查必要的环境变量
    local required_vars=("JWT_SECRET" "MYSQL_PASSWORD" "CLICKHOUSE_PASSWORD")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE" || grep -q "^${var}=$" "$ENV_FILE" || grep -q "^${var}=.*default.*" "$ENV_FILE"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warning "以下环境变量需要配置："
        for var in "${missing_vars[@]}"; do
            echo "    - $var"
        done
        echo ""
        read -p "按回车键继续编辑.env文件，或Ctrl+C取消..."
        
        if command -v nano &> /dev/null; then
            nano "$ENV_FILE"
        elif command -v vim &> /dev/null; then
            vim "$ENV_FILE"
        else
            vi "$ENV_FILE"
        fi
    fi
    
    log_success "环境变量验证完成"
}

# 检查端口占用
check_ports() {
    log_step "检查端口占用..."
    
    local ports=("3306" "6379" "8123" "9000" "3000" "3001" "8081")
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -i :$port &> /dev/null; then
            occupied_ports+=("$port")
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        log_warning "以下端口已被占用："
        for port in "${occupied_ports[@]}"; do
            echo "    - 端口 $port"
        done
        echo ""
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    log_success "端口检查完成"
}

# 构建Docker镜像
build_images() {
    log_step "开始构建Docker镜像..."
    
    # 构建server镜像
    if [ -f "$PROJECT_ROOT/server/Dockerfile" ]; then
        log_info "构建server镜像..."
        docker build -t monitor-server:latest -f "$PROJECT_ROOT/server/Dockerfile" "$PROJECT_ROOT/server/"
        if [ $? -eq 0 ]; then
            log_success "server镜像构建成功"
        else
            log_error "server镜像构建失败"
            exit 1
        fi
    else
        log_warning "未找到server/Dockerfile，跳过server镜像构建"
    fi

    # 构建admin镜像
    if [ -f "$PROJECT_ROOT/admin/Dockerfile" ]; then
        log_info "构建admin镜像..."
        docker build -t monitor-admin:latest -f "$PROJECT_ROOT/admin/Dockerfile" "$PROJECT_ROOT/admin/"
        if [ $? -eq 0 ]; then
            log_success "admin镜像构建成功"
        else
            log_error "admin镜像构建失败"
            exit 1
        fi
    else
        log_warning "未找到admin/Dockerfile，跳过admin镜像构建"
    fi

    log_success "Docker镜像构建完成"
}

# 启动Docker服务
start_services() {
    log_step "启动Docker服务..."
    
    # 切换到部署目录
    cd "$SCRIPT_DIR"
    
    # 启动基础服务
    log_info "启动基础服务（MySQL、ClickHouse、Redis）..."
    docker-compose up -d mysql clickhouse redis
    
    # 等待基础服务就绪
    wait_for_base_services
    
    # 启动应用服务
    log_info "启动应用服务（Server、Admin）..."
    docker-compose up -d server admin
    
    if [ $? -eq 0 ]; then
        log_success "Docker服务启动成功"
    else
        log_error "Docker服务启动失败"
        exit 1
    fi
}

# 等待基础服务就绪
wait_for_base_services() {
    log_info "等待基础服务就绪..."
    
    # 等待MySQL
    wait_for_service "mysql" "ready for connections" 60
    
    # 等待ClickHouse
    wait_for_service "clickhouse" "ready for connections" 60
    
    # 等待Redis
    wait_for_service "redis" "Ready to accept connections" 30
    
    log_success "基础服务就绪"
}

# 等待服务就绪
wait_for_service() {
    local service_name=$1
    local ready_pattern=$2
    local max_attempts=$3
    local attempt=1
    
    log_info "等待 $service_name 服务就绪..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose logs "$service_name" 2>&1 | grep -q "$ready_pattern"; then
            log_success "$service_name 服务就绪"
            return 0
        fi
        
        log_info "等待 $service_name 服务... (尝试 $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "$service_name 服务启动超时"
    return 1
}

# 运行数据库迁移
run_migrations() {
    log_step "运行数据库迁移..."
    
    # 等待MySQL完全启动
    sleep 10
    
    # 运行MySQL迁移
    if [ -d "$PROJECT_ROOT/server/database/migrations" ]; then
        log_info "执行MySQL数据库迁移"
        
        # 等待server服务就绪
        wait_for_service "server" "Application is ready" 120
        
        # 执行迁移
        docker-compose exec -T server npm run migration:run || {
            log_warning "数据库迁移失败，这可能是正常的（如果数据库已是最新版本）"
        }
    fi
    
    log_success "数据库迁移完成"
}

# 健康检查
health_check() {
    log_step "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "健康检查尝试 $attempt/$max_attempts"
        
        # 检查关键服务端口
        local services=("3306" "6379" "8123" "3000" "3001")
        local all_healthy=true
        
        for port in "${services[@]}"; do
            if nc -z localhost $port 2>/dev/null; then
                log_success "端口 $port 服务正常"
            else
                log_warning "端口 $port 服务未就绪"
                all_healthy=false
            fi
        done
        
        if $all_healthy; then
            log_success "所有服务健康检查通过"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "健康检查失败，请检查服务状态"
            show_service_status
            return 1
        fi
        
        sleep 5
        ((attempt++))
    done
    
    return 0
}

# 显示服务状态
show_service_status() {
    echo ""
    echo "==========================================="
    echo "           服务状态"
    echo "==========================================="
    docker-compose ps
    echo ""
    
    echo "==========================================="
    echo "           服务日志"
    echo "==========================================="
    docker-compose logs --tail=20
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
    echo "  - 管理后台: http://localhost:${ADMIN_PORT:-3001}"
    echo "  - API文档: http://localhost:${SERVER_PORT:-3000}/api/docs"
    echo "  - Redis管理: http://localhost:8081 (用户名: admin, 密码: admin123)"
    echo ""
    echo "监控工具（可选）："
    echo "  - Prometheus: http://localhost:9090 (使用 --profile monitoring 启动)"
    echo "  - Grafana: http://localhost:3002 (用户名: admin, 密码: admin123)"
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
    echo "部署日志已保存到: $LOG_FILE"
}

# 主部署函数
deploy() {
    log_info "开始部署监控系统..."
    echo ""
    
    # 初始化日志
    init_log
    
    # 检查依赖
    check_system_requirements
    check_docker
    check_env
    check_ports
    
    # 构建镜像
    build_images
    
    # 启动服务
    start_services
    
    # 运行迁移
    run_migrations
    
    # 健康检查
    if health_check; then
        # 显示部署信息
        show_deployment_info
        log_success "监控系统部署完成！"
    else
        log_error "部署完成但健康检查失败，请检查服务状态"
        exit 1
    fi
}

# 清理函数
cleanup() {
    log_step "清理Docker资源..."
    
    cd "$SCRIPT_DIR"
    
    # 停止并删除容器
    docker-compose down -v
    
    # 删除镜像
    docker rmi monitor-server:latest monitor-admin:latest 2>/dev/null || true
    
    # 清理未使用的资源
    docker system prune -f
    
    log_success "清理完成"
}

# 重启函数
restart() {
    log_step "重启服务..."
    
    cd "$SCRIPT_DIR"
    docker-compose restart
    
    log_success "服务重启完成"
}

# 查看日志函数
logs() {
    cd "$SCRIPT_DIR"
    docker-compose logs -f "$@"
}

# 状态检查函数
status() {
    cd "$SCRIPT_DIR"
    echo "==========================================="
    echo "           服务状态"
    echo "==========================================="
    docker-compose ps
    echo ""
    
    echo "==========================================="
    echo "           资源使用"
    echo "==========================================="
    docker stats --no-stream
}

# 更新函数
update() {
    log_step "更新系统..."
    
    cd "$SCRIPT_DIR"
    
    # 拉取最新代码
    if [ -d "$PROJECT_ROOT/.git" ]; then
        log_info "拉取最新代码..."
        cd "$PROJECT_ROOT"
        git pull
        cd "$SCRIPT_DIR"
    fi
    
    # 重新构建镜像
    build_images
    
    # 重启服务
    docker-compose up -d --force-recreate
    
    log_success "系统更新完成"
}

# 备份函数
backup() {
    log_step "备份数据..."
    
    local backup_dir="$SCRIPT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份数据库
    log_info "备份MySQL数据..."
    docker-compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD:-root123} monitor > "$backup_dir/mysql_backup.sql"
    
    # 备份存储文件
    if [ -d "$PROJECT_ROOT/server/storage" ]; then
        log_info "备份存储文件..."
        tar -czf "$backup_dir/storage_backup.tar.gz" -C "$PROJECT_ROOT/server" storage/
    fi
    
    log_success "备份完成: $backup_dir"
}

# 显示帮助
show_help() {
    echo "监控系统部署脚本使用说明："
    echo ""
    echo "基础命令："
    echo "  ./deploy.sh           - 部署或更新系统"
    echo "  ./deploy.sh status    - 查看服务状态"
    echo "  ./deploy.sh logs      - 查看日志"
    echo "  ./deploy.sh restart   - 重启服务"
    echo ""
    echo "管理命令："
    echo "  ./deploy.sh update    - 更新系统"
    echo "  ./deploy.sh backup    - 备份数据"
    echo "  ./deploy.sh cleanup   - 清理Docker资源"
    echo "  ./deploy.sh help      - 显示帮助"
    echo ""
    echo "高级功能："
    echo "  ./deploy.sh --profile monitoring  - 启动包含监控工具的完整部署"
    echo ""
    echo "功能特性："
    echo "  - 基于Docker一键部署"
    echo "  - 支持DeepSeek AI错误分析"
    echo "  - 源代码映射和定位"
    echo "  - 多项目错误监控"
    echo "  - 自动健康检查"
    echo "  - 环境变量配置"
    echo "  - 资源限制管理"
    echo ""
    echo "环境要求："
    echo "  - Docker 20.10+"
    echo "  - Docker Compose 2.0+"
    echo "  - 至少4GB内存"
    echo "  - 至少10GB磁盘空间"
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
    "status")
        status
        ;;
    "update")
        update
        ;;
    "backup")
        backup
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