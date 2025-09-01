#!/bin/bash

# 监控系统快速启动脚本
# 适用于首次部署和快速测试

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}      监控系统快速启动向导${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否在deploy目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}请在deploy目录下运行此脚本${NC}"
    exit 1
fi

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}请先安装Docker${NC}"
    echo "macOS: brew install --cask docker"
    echo "Linux: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}请先安装Docker Compose${NC}"
    echo "macOS: brew install docker-compose"
    echo "Linux: sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

# 检查Docker服务
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}请启动Docker服务${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker环境检查通过${NC}"
echo ""

# 环境配置
if [ ! -f ".env" ]; then
    echo -e "${BLUE}配置环境变量...${NC}"
    
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${GREEN}✓ 已创建.env文件${NC}"
    else
        echo -e "${YELLOW}未找到env.example文件，请手动创建.env文件${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}⚠️  重要：请编辑.env文件配置以下参数：${NC}"
    echo "  - DEEPSEEK_API_KEY: DeepSeek API密钥"
    echo "  - JWT_SECRET: JWT密钥（生产环境必须修改）"
    echo "  - 数据库密码"
    echo ""
    
    read -p "按回车键编辑.env文件..."
    
    # 编辑环境文件
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        vi .env
    fi
    
    echo -e "${GREEN}✓ 环境配置完成${NC}"
    echo ""
else
    echo -e "${GREEN}✓ 找到.env配置文件${NC}"
    echo ""
fi

# 选择部署模式
echo -e "${BLUE}选择部署模式：${NC}"
echo "1) 基础部署 (推荐)"
echo "2) 完整部署 (包含监控工具)"
echo "3) 开发模式"
echo ""

read -p "请选择 (1-3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo -e "${BLUE}开始基础部署...${NC}"
        ./deploy.sh
        ;;
    2)
        echo -e "${BLUE}开始完整部署...${NC}"
        ./deploy.sh
        echo ""
        echo -e "${BLUE}启动监控工具...${NC}"
        docker-compose --profile monitoring up -d prometheus grafana
        echo -e "${GREEN}✓ 监控工具启动完成${NC}"
        ;;
    3)
        echo -e "${BLUE}开始开发模式部署...${NC}"
        NODE_ENV=development ./deploy.sh
        ;;
    *)
        echo -e "${YELLOW}无效选择，使用基础部署${NC}"
        ./deploy.sh
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}      部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}访问地址：${NC}"
echo "  - 管理后台: http://localhost:3001"
echo "  - API文档: http://localhost:3000/api/docs"
echo "  - Redis管理: http://localhost:8081 (admin/admin123)"
echo ""

if [[ $REPLY == "2" ]]; then
    echo -e "${BLUE}监控工具：${NC}"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3002 (admin/admin123)"
    echo ""
fi

echo -e "${BLUE}常用命令：${NC}"
echo "  - 查看状态: ./deploy.sh status"
echo "  - 查看日志: ./deploy.sh logs"
echo "  - 重启服务: ./deploy.sh restart"
echo "  - 清理资源: ./deploy.sh cleanup"
echo ""

echo -e "${YELLOW}下一步：${NC}"
echo "  1. 访问管理后台初始化系统"
echo "  2. 配置项目SDK接入监控"
echo "  3. 上传源代码映射文件"
echo ""

echo -e "${GREEN}祝您使用愉快！${NC}"
