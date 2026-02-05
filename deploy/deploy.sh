#!/bin/bash

# FamTime 部署脚本
# 服务器: 47.92.236.28

set -e

echo "=========================================="
echo "FamTime 部署脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
DEPLOY_DIR="/opt/famtime"
REPO_URL="https://github.com/your-username/famtime.git"  # 替换为实际仓库地址

# 检查 Docker
check_docker() {
    echo -e "${YELLOW}检查 Docker...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker 未安装，正在安装...${NC}"
        curl -fsSL https://get.docker.com | sh
        systemctl start docker
        systemctl enable docker
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Docker Compose 未安装，正在安装...${NC}"
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi

    echo -e "${GREEN}Docker 已就绪${NC}"
}

# 创建部署目录
setup_directory() {
    echo -e "${YELLOW}设置部署目录...${NC}"
    mkdir -p $DEPLOY_DIR
    cd $DEPLOY_DIR
    echo -e "${GREEN}部署目录: $DEPLOY_DIR${NC}"
}

# 复制部署文件（本地部署时使用）
copy_files() {
    echo -e "${YELLOW}复制部署文件...${NC}"
    # 如果是本地执行，复制当前目录的文件
    if [ -f "./docker-compose.yml" ]; then
        echo "使用本地文件..."
    else
        echo -e "${RED}请确保在 deploy 目录下执行此脚本${NC}"
        exit 1
    fi
}

# 配置环境变量
setup_env() {
    echo -e "${YELLOW}配置环境变量...${NC}"
    if [ ! -f ".env" ]; then
        if [ -f ".env.production" ]; then
            cp .env.production .env
            echo -e "${GREEN}已从 .env.production 创建 .env${NC}"
        else
            echo -e "${RED}请创建 .env 文件${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}环境变量已配置${NC}"
}

# 配置 Nginx
setup_nginx() {
    echo -e "${YELLOW}配置 Nginx...${NC}"

    # 备份原有配置
    if [ -f "/etc/nginx/conf.d/famtime.conf" ]; then
        cp /etc/nginx/conf.d/famtime.conf /etc/nginx/conf.d/famtime.conf.bak
    fi

    # 复制新配置
    cp nginx.conf /etc/nginx/conf.d/famtime.conf

    # 测试配置
    nginx -t

    # 重载 Nginx
    systemctl reload nginx || nginx -s reload

    echo -e "${GREEN}Nginx 配置完成${NC}"
}

# 构建并启动服务
start_services() {
    echo -e "${YELLOW}构建并启动服务...${NC}"

    # 使用 docker compose（新版）或 docker-compose（旧版）
    if docker compose version &> /dev/null; then
        docker compose --env-file .env up -d --build
    else
        docker-compose --env-file .env up -d --build
    fi

    echo -e "${GREEN}服务已启动${NC}"
}

# 检查服务状态
check_status() {
    echo -e "${YELLOW}检查服务状态...${NC}"

    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi

    echo ""
    echo -e "${YELLOW}等待服务启动...${NC}"
    sleep 10

    # 检查健康状态
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}服务运行正常！${NC}"
    else
        echo -e "${RED}服务可能未完全启动，请检查日志${NC}"
        if docker compose version &> /dev/null; then
            docker compose logs --tail=50 server
        else
            docker-compose logs --tail=50 server
        fi
    fi
}

# 显示日志
show_logs() {
    echo -e "${YELLOW}显示最近日志...${NC}"
    if docker compose version &> /dev/null; then
        docker compose logs --tail=100
    else
        docker-compose logs --tail=100
    fi
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}停止服务...${NC}"
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    echo -e "${GREEN}服务已停止${NC}"
}

# 主函数
main() {
    case "${1:-deploy}" in
        deploy)
            check_docker
            setup_directory
            setup_env
            start_services
            setup_nginx
            check_status
            ;;
        start)
            start_services
            check_status
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            start_services
            check_status
            ;;
        status)
            check_status
            ;;
        logs)
            show_logs
            ;;
        *)
            echo "用法: $0 {deploy|start|stop|restart|status|logs}"
            exit 1
            ;;
    esac
}

main "$@"

echo ""
echo "=========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "API 地址: http://47.92.236.28/api"
echo "健康检查: http://47.92.236.28/health"
echo "=========================================="
