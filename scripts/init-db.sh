#!/bin/bash

# FamTime 数据库初始化脚本

set -e

echo "🚀 FamTime 数据库初始化"
echo "========================"

# 检查 PostgreSQL 是否安装
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL 未安装"
    echo "请先安装 PostgreSQL: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL 已安装"

# 读取配置
read -p "请输入数据库名称 [famtime]: " DB_NAME
DB_NAME=${DB_NAME:-famtime}

read -p "请输入数据库用户名 [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "请输入数据库密码: " DB_PASSWORD
echo

# 创建数据库
echo ""
echo "📦 创建数据库..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "数据库可能已存在"

# 生成 DATABASE_URL
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"

# 更新 .env 文件
echo ""
echo "📝 更新环境变量..."
if [ -f "apps/server/.env" ]; then
    # 备份原文件
    cp apps/server/.env apps/server/.env.backup
    # 更新 DATABASE_URL
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" apps/server/.env
    rm apps/server/.env.bak
    echo "✅ .env 文件已更新（原文件备份为 .env.backup）"
else
    # 从示例文件创建
    cp apps/server/.env.example apps/server/.env
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" apps/server/.env
    rm apps/server/.env.bak
    echo "✅ 已从 .env.example 创建 .env 文件"
fi

# 生成 Prisma Client
echo ""
echo "🔧 生成 Prisma Client..."
pnpm db:generate

# 推送数据库 schema
echo ""
echo "📊 创建数据库表..."
cd apps/server
npx prisma db push --skip-generate

echo ""
echo "✅ 数据库初始化完成！"
echo ""
echo "📋 数据库信息:"
echo "   名称: $DB_NAME"
echo "   用户: $DB_USER"
echo "   连接: $DATABASE_URL"
echo ""
echo "🎯 下一步:"
echo "   1. 启动后端: pnpm dev:server"
echo "   2. 启动前端: pnpm dev:miniapp"
echo "   3. 查看数据库: cd apps/server && npx prisma studio"
echo ""
