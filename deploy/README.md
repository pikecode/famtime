# FamTime 部署指南

## 服务器信息
- IP: 47.92.236.28
- 系统: CentOS 7
- 配置: 2核 CPU, 1.7GB 内存, 40GB 磁盘

## 部署架构

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (80)                        │
│                   反向代理                           │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              Docker Network                          │
│  ┌─────────────────┐    ┌─────────────────────┐    │
│  │   PostgreSQL    │◄───│   NestJS Server     │    │
│  │   (5432)        │    │   (3000)            │    │
│  └─────────────────┘    └─────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## 快速部署

### 1. 上传部署文件到服务器

```bash
# 在本地执行
scp -r deploy/* root@47.92.236.28:/opt/famtime/
```

### 2. SSH 登录服务器

```bash
ssh root@47.92.236.28
```

### 3. 执行部署

```bash
cd /opt/famtime
chmod +x deploy.sh
./deploy.sh deploy
```

## 手动部署步骤

### 1. 安装 Docker（如未安装）

```bash
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker
```

### 2. 安装 Docker Compose

```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3. 配置环境变量

```bash
cd /opt/famtime
cp .env.production .env
# 编辑 .env 修改敏感配置
vim .env
```

### 4. 启动服务

```bash
docker-compose up -d --build
```

### 5. 配置 Nginx

```bash
cp nginx.conf /etc/nginx/conf.d/famtime.conf
nginx -t
systemctl reload nginx
```

## 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f server
docker-compose logs -f postgres

# 重启服务
docker-compose restart server

# 停止所有服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 进入数据库
docker-compose exec postgres psql -U famtime -d famtime

# 执行数据库迁移
docker-compose exec server npx prisma migrate deploy

# 查看数据库数据
docker-compose exec server npx prisma studio
```

## 数据备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U famtime famtime > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20240101.sql | docker-compose exec -T postgres psql -U famtime famtime
```

## 更新部署

```bash
cd /opt/famtime

# 拉取最新代码（如果使用 Git）
git pull

# 重新构建并启动
docker-compose up -d --build

# 执行数据库迁移
docker-compose exec server npx prisma migrate deploy
```

## 故障排查

### 服务无法启动

```bash
# 查看详细日志
docker-compose logs server

# 检查数据库连接
docker-compose exec server npx prisma db push --accept-data-loss
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
docker-compose ps postgres

# 重启数据库
docker-compose restart postgres
```

### Nginx 502 错误

```bash
# 检查后端服务是否运行
curl http://localhost:3000/api/health

# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/famtime_error.log
```

## 安全建议

1. **修改默认密码**: 编辑 `.env` 文件，修改 `POSTGRES_PASSWORD` 和 `JWT_SECRET`
2. **配置防火墙**: 只开放 80/443 端口
3. **启用 HTTPS**: 使用 Let's Encrypt 配置 SSL 证书
4. **定期备份**: 设置 cron 任务定期备份数据库

## 文件说明

| 文件 | 说明 |
|------|------|
| `Dockerfile` | Docker 镜像构建文件 |
| `docker-compose.yml` | Docker Compose 编排文件 |
| `.env.production` | 生产环境变量模板 |
| `nginx.conf` | Nginx 反向代理配置 |
| `deploy.sh` | 自动化部署脚本 |
