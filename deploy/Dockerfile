# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# 安装依赖
RUN pnpm install --no-frozen-lockfile

# 复制源代码
COPY apps/server ./apps/server
COPY packages/shared ./packages/shared

# 生成 Prisma Client
RUN cd apps/server && pnpm prisma generate

# 构建 shared 包
RUN pnpm --filter @famtime/shared build

# 构建应用
RUN pnpm --filter server build

# 生产阶段
FROM node:18-slim AS production

# 使用阿里云镜像源并安装 OpenSSL
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# 只安装生产依赖（使用淘宝镜像）
RUN pnpm config set registry https://registry.npmmirror.com && pnpm install --no-frozen-lockfile --prod

# 从构建阶段复制构建产物
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# 复制 Prisma schema（用于迁移）
COPY apps/server/prisma ./apps/server/prisma

# 安装 prisma CLI 并生成 Prisma Client
RUN npm install -g prisma@5.22.0 && cd apps/server && prisma generate

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/apps/server

# 启动命令
CMD ["node", "dist/main"]
