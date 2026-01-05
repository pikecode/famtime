# FamTime - 家庭共享日历

一个以「家庭成员共同使用」为核心的微信小程序日历产品。

## 技术栈

| 层 | 技术 |
|---|------|
| 小程序前端 | Taro 3.6 + React 18 + TypeScript + Zustand |
| 后端 | NestJS 10 + TypeScript |
| 数据库 | PostgreSQL + Prisma ORM |
| 定时任务 | @nestjs/schedule |

## 项目结构

```
famtime/
├── apps/
│   ├── miniapp/          # Taro 小程序
│   │   ├── src/
│   │   │   ├── pages/    # 页面
│   │   │   ├── components/
│   │   │   ├── services/ # API 调用
│   │   │   ├── stores/   # Zustand 状态管理
│   │   │   └── utils/
│   │   └── config/
│   │
│   └── server/           # NestJS 后端
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/     # 认证
│       │   │   ├── family/   # 家庭
│       │   │   ├── member/   # 成员
│       │   │   ├── event/    # 日程
│       │   │   └── reminder/ # 提醒
│       │   └── prisma/
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   └── shared/           # 共享类型定义
│
├── package.json
└── pnpm-workspace.yaml
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
# 后端
cp apps/server/.env.example apps/server/.env
# 编辑 .env 填入你的配置
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate
```

### 4. 启动开发服务器

```bash
# 启动后端
pnpm dev:server

# 启动小程序（另一个终端）
pnpm dev:miniapp
```

### 5. 微信开发者工具

1. 打开微信开发者工具
2. 导入项目，选择 `apps/miniapp` 目录
3. 填入你的 AppID（在 `project.config.json` 中配置）

## API 文档

### 认证

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 微信登录 |

### 家庭

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/family | 创建家庭 |
| GET | /api/family/my | 获取我的家庭 |
| GET | /api/family/:id | 获取家庭详情 |
| POST | /api/family/join | 加入家庭 |
| DELETE | /api/family/:id/leave | 退出家庭 |
| POST | /api/family/:id/invite-code | 刷新邀请码 |

### 成员

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/family/:id/members | 获取成员列表 |
| PUT | /api/member/:id | 更新成员信息 |
| DELETE | /api/member/:id | 移除成员 |
| POST | /api/family/:id/transfer-admin | 转让管理权 |

### 日程

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/event | 创建日程 |
| GET | /api/events | 获取日程列表 |
| GET | /api/events/pending | 获取待确认日程 |
| GET | /api/event/:id | 获取日程详情 |
| PUT | /api/event/:id | 更新日程 |
| DELETE | /api/event/:id | 删除日程 |
| POST | /api/event/:id/accept | 接受日程 |
| POST | /api/event/:id/reject | 拒绝日程 |

## 核心功能

- [x] 家庭创建与邀请码加入
- [x] 日程 CRUD
- [x] 替他人创建日程（待确认流程）
- [x] 事件分类与颜色标记
- [x] 可见性控制（私密/家庭）
- [x] 多次提醒配置
- [x] 定时提醒任务
- [ ] 微信订阅消息推送
- [ ] 去年今天回忆
- [ ] 周/月总结

## License

MIT
