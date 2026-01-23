# FamTime 开发指南

本文档提供完整的开发环境搭建和部署指南。

## 📋 目录

- [环境准备](#环境准备)
- [数据库设置](#数据库设置)
- [后端配置](#后端配置)
- [前端配置](#前端配置)
- [开发流程](#开发流程)
- [部署指南](#部署指南)
- [常见问题](#常见问题)

## 🔧 环境准备

### 必需软件

1. **Node.js** (>= 18.0.0)
   ```bash
   node --version  # 检查版本
   ```

2. **pnpm** (>= 8.0.0)
   ```bash
   npm install -g pnpm
   pnpm --version
   ```

3. **PostgreSQL** (>= 14.0)
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt-get install postgresql-14
   sudo systemctl start postgresql

   # Windows
   # 下载安装包: https://www.postgresql.org/download/windows/
   ```

4. **微信开发者工具**
   - 下载地址: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 可选软件

- **Git** - 版本控制
- **VS Code** - 推荐的代码编辑器
- **Postman** - API 测试工具

## 🗄️ 数据库设置

### 1. 创建数据库

```bash
# 连接到 PostgreSQL
psql postgres

# 创建数据库
CREATE DATABASE famtime;

# 创建用户（可选）
CREATE USER famtime_user WITH PASSWORD 'your_password';

# 授权
GRANT ALL PRIVILEGES ON DATABASE famtime TO famtime_user;

# 退出
\q
```

### 2. 配置数据库连接

```bash
# 复制环境变量文件
cp apps/server/.env.example apps/server/.env

# 编辑 .env 文件
# 修改 DATABASE_URL 为你的数据库连接字符串
DATABASE_URL="postgresql://famtime_user:your_password@localhost:5432/famtime?schema=public"
```

### 3. 运行数据库迁移

```bash
# 生成 Prisma Client
pnpm db:generate

# 创建数据库表（首次运行）
cd apps/server
npx prisma db push

# 或者使用迁移（推荐用于生产环境）
npx prisma migrate dev --name init
```

### 4. 查看数据库

```bash
# 使用 Prisma Studio 可视化查看数据库
cd apps/server
npx prisma studio
# 浏览器会自动打开 http://localhost:5555
```

## 🔐 后端配置

### 1. 环境变量配置

编辑 `apps/server/.env` 文件：

```env
# 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/famtime?schema=public"

# JWT 密钥（生产环境务必修改）
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# 微信小程序配置
WECHAT_APPID="wxb9607da16fecda68"
WECHAT_SECRET="your-wechat-app-secret"

# 服务器配置
PORT=3000
NODE_ENV=development

# CORS 配置
CORS_ORIGIN="*"

# OpenAI（可选，用于智能文案生成）
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-3.5-turbo"
```

### 2. 获取微信小程序密钥

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 复制 AppSecret 到 `.env` 文件的 `WECHAT_SECRET`

### 3. 启动后端服务

```bash
# 开发模式（热重载）
pnpm dev:server

# 生产模式
pnpm --filter server build
pnpm --filter server start:prod
```

服务将运行在 http://localhost:3000

## 📱 前端配置

### 1. 配置小程序 AppID

编辑 `apps/miniapp/project.config.json`：

```json
{
  "appid": "wxb9607da16fecda68",
  "projectname": "famtime"
}
```

### 2. 配置 API 地址

编辑 `apps/miniapp/src/services/api.ts`：

```typescript
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com/api'
  : 'http://localhost:3000/api';
```

### 3. 启动小程序开发

```bash
# 编译小程序
pnpm dev:miniapp

# 或构建生产版本
pnpm --filter miniapp build:weapp
```

### 4. 在微信开发者工具中打开

1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目目录选择: `apps/miniapp`
4. AppID: `wxb9607da16fecda68`
5. 点击"导入"

## 🔄 开发流程

### 日常开发

```bash
# 1. 启动后端（终端1）
pnpm dev:server

# 2. 启动前端（终端2）
pnpm dev:miniapp

# 3. 在微信开发者工具中预览
```

### 数据库变更

```bash
# 1. 修改 apps/server/prisma/schema.prisma

# 2. 生成迁移
cd apps/server
npx prisma migrate dev --name your_migration_name

# 3. 生成 Prisma Client
pnpm db:generate
```

### 添加新功能

1. **后端**:
   ```bash
   # 在 apps/server/src/modules/ 下创建新模块
   # 例如: apps/server/src/modules/notification/
   ```

2. **前端**:
   ```bash
   # 在 apps/miniapp/src/ 下添加页面或组件
   # 页面: apps/miniapp/src/pages/
   # 组件: apps/miniapp/src/components/
   ```

3. **共享类型**:
   ```bash
   # 在 packages/shared/src/types.ts 中添加类型定义
   ```

### Git 工作流

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature-name

# 2. 开发并提交
git add .
git commit -m "feat: 添加新功能"

# 3. 推送到远程
git push origin feature/your-feature-name

# 4. 创建 Pull Request
```

## 🚀 部署指南

### 后端部署

#### 使用 Docker

```bash
# 构建镜像
docker build -t famtime-server ./apps/server

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your-production-db-url" \
  -e JWT_SECRET="your-production-secret" \
  famtime-server
```

#### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 构建项目
pnpm --filter server build

# 启动服务
cd apps/server
pm2 start dist/main.js --name famtime-server

# 查看日志
pm2 logs famtime-server

# 设置开机自启
pm2 startup
pm2 save
```

### 前端部署

```bash
# 1. 构建生产版本
pnpm --filter miniapp build:weapp

# 2. 在微信开发者工具中上传代码
# 工具栏 -> 上传 -> 填写版本号和备注

# 3. 在微信公众平台提交审核
# 登录 mp.weixin.qq.com -> 版本管理 -> 提交审核
```

### 数据库部署

推荐使用云数据库服务：
- **阿里云 RDS**
- **腾讯云 PostgreSQL**
- **AWS RDS**
- **Supabase** (免费套餐)

## ❓ 常见问题

### 1. 数据库连接失败

**问题**: `Error: P1001: Can't reach database server`

**解决**:
```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 检查连接字符串是否正确
# 确保 DATABASE_URL 格式正确
```

### 2. Prisma Client 未生成

**问题**: `Cannot find module '@prisma/client'`

**解决**:
```bash
pnpm db:generate
```

### 3. 小程序编译失败

**问题**: `Module not found` 或 TypeScript 错误

**解决**:
```bash
# 清理缓存
rm -rf apps/miniapp/node_modules/.cache

# 重新安装依赖
pnpm install

# 重新编译
pnpm dev:miniapp
```

### 4. 端口被占用

**问题**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或修改 .env 中的 PORT
```

### 5. 微信登录失败

**问题**: 登录接口返回错误

**解决**:
- 检查 `WECHAT_APPID` 和 `WECHAT_SECRET` 是否正确
- 确保小程序已发布或在开发者列表中
- 检查服务器域名是否已在微信公众平台配置

## 📚 相关资源

- [Taro 文档](https://taro-docs.jd.com/)
- [NestJS 文档](https://docs.nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

## 📞 获取帮助

如果遇到问题：
1. 查看本文档的[常见问题](#常见问题)部分
2. 搜索 [GitHub Issues](https://github.com/your-repo/famtime/issues)
3. 创建新的 Issue 描述问题

---

**祝开发愉快！** 🎉
