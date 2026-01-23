# FamTime - 家庭共享日历

> 一个专为家庭设计的共享日历小程序，让家人之间的时光管理更温暖、更有爱 ❤️

## ✨ 核心特性

### 🎯 基础功能
- **家庭管理** - 创建家庭、邀请成员、角色权限管理
- **智能日程** - 创建、编辑、删除日程，支持全天事件
- **为他人创建** - 妈妈可以帮爸爸创建日程，爸爸确认后加入
- **分类管理** - 生日、纪念日、健康、家庭活动等多种分类
- **提醒系统** - 灵活的提醒设置，支持免打扰时段

### 🔄 高级功能
- **重复日程** - 支持每天/每周/每月/每年重复，自定义结束条件
- **日程评论** - 家人可以在日程下讨论，增强互动
- **智能搜索** - 实时搜索日程标题，按分类筛选

### 💝 情感功能（核心差异化）
- **月度回忆录** - 自动生成温馨的家庭回忆，记录美好时光
- **智能文案** - AI 生成情感化的摘要和标题
- **精彩瞬间** - 自动提取重要事件，形成时光轴

## 🏗️ 技术架构

### 前端
- **框架**: Taro 3.6 + React 18 + TypeScript
- **状态管理**: Zustand
- **样式**: Less + 自定义设计系统
- **平台**: 微信小程序

### 后端
- **框架**: NestJS 10 + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT (计划中)
- **定时任务**: @nestjs/schedule

### 架构特点
- **Monorepo**: pnpm workspace 管理多包
- **类型共享**: @famtime/shared 包统一类型定义
- **模块化**: 清晰的模块划分和职责分离

## 📦 项目结构

```
famtime/
├── apps/
│   ├── miniapp/          # 微信小程序前端
│   │   ├── src/
│   │   │   ├── components/   # 可复用组件
│   │   │   │   ├── Button/
│   │   │   │   ├── Calendar/
│   │   │   │   ├── CommentList/
│   │   │   │   ├── EventCard/
│   │   │   │   ├── MemoryCard/
│   │   │   │   ├── RecurrencePicker/
│   │   │   │   ├── SearchBar/
│   │   │   │   └── Skeleton/
│   │   │   ├── pages/        # 页面
│   │   │   │   ├── calendar/  # 日历页
│   │   │   │   ├── family/    # 家庭页
│   │   │   │   ├── memory/    # 回忆页
│   │   │   │   ├── profile/   # 我的页
│   │   │   │   └── event/     # 事件相关页
│   │   │   ├── services/     # API 服务
│   │   │   └── stores/       # 状态管理
│   │   └── package.json
│   └── server/           # NestJS 后端
│       ├── src/
│       │   ├── modules/      # 业务模块
│       │   │   ├── auth/     # 认证
│       │   │   ├── family/   # 家庭
│       │   │   ├── member/   # 成员
│       │   │   ├── event/    # 日程
│       │   │   ├── reminder/ # 提醒
│       │   │   └── memory/   # 回忆录
│       │   ├── prisma/       # 数据库
│       │   └── main.ts
│       └── package.json
├── packages/
│   └── shared/           # 共享类型定义
│       └── src/types.ts
├── docs/                 # 文档
│   ├── DESIGN_SPEC.md
│   └── RECURRENCE_FEATURE.md
└── package.json
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14

### 安装依赖
```bash
pnpm install
```

### 配置环境变量
```bash
# 后端
cp apps/server/.env.example apps/server/.env
# 编辑 .env 填入你的配置
```

### 初始化数据库
```bash
# 生成 Prisma Client
pnpm db:generate

# 执行数据库迁移（需要先配置 DATABASE_URL）
pnpm db:migrate
```

### 开发模式

**启动小程序**
```bash
pnpm dev:miniapp
```

**启动后端服务**
```bash
pnpm dev:server
```

### 微信开发者工具
1. 打开微信开发者工具
2. 导入项目，选择 `apps/miniapp` 目录
3. AppID: `wxb9607da16fecda68`

### 构建

**构建小程序**
```bash
pnpm --filter miniapp build:weapp
```

**构建后端**
```bash
pnpm --filter server build
```

## 📊 数据模型

### 核心实体
- **User** - 用户（微信用户）
- **Family** - 家庭
- **FamilyMember** - 家庭成员（用户在家庭中的身份）
- **Event** - 事件/日程
- **EventComment** - 日程评论
- **EventReminder** - 事件提醒
- **FamilyMemory** - 家庭回忆录
- **ReminderPreference** - 用户提醒偏好

### 关键关系
- 一个家庭有多个成员
- 一个用户可以加入多个家庭
- 事件属于家庭，有创建者和执行人
- 重复事件通过 seriesMaster 关联

## 🎨 设计系统

### 色彩
- **主色**: #339AF0 (蓝色)
- **成功**: #51CF66 (绿色)
- **警告**: #FFD43B (黄色)
- **错误**: #FF6B6B (红色)
- **生日**: #FF6B6B
- **纪念日**: #FF85A2
- **健康**: #51CF66
- **家庭活动**: #339AF0

### 交互
- 触觉反馈增强用户体验
- 流畅的动画过渡（cubic-bezier）
- 骨架屏加载状态

## 📡 API 文档

### 家庭管理
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/family | 创建家庭 |
| GET | /api/family/my | 获取我的家庭 |
| POST | /api/family/join | 加入家庭 |

### 日程管理
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/event | 创建日程 |
| GET | /api/events | 获取日程列表 |
| GET | /api/event/:id | 获取日程详情 |
| PUT | /api/event/:id | 更新日程 |
| DELETE | /api/event/:id | 删除日程 |
| POST | /api/event/:id/accept | 接受日程 |
| POST | /api/event/:id/reject | 拒绝日程 |

### 评论
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /comments | 创建评论 |
| GET | /comments/event/:eventId | 获取事件评论 |
| DELETE | /comments/:id | 删除评论 |

### 回忆录
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /memories/generate/monthly | 生成月度回忆录 |
| GET | /memories/family/:familyId | 获取家庭回忆录列表 |
| GET | /memories/:id | 获取回忆录详情 |

## 🗺️ 开发路线图

### ✅ Phase 1 - MVP (已完成)
- [x] 家庭管理（创建/加入/邀请）
- [x] 日程 CRUD
- [x] "为他人创建"机制
- [x] 基础提醒
- [x] 静态设计

### ✅ Phase 2 - 功能增强 (已完成)
- [x] 重复日程（每天/每周/每月/每年）
- [x] 日程评论（家人互动）
- [x] 搜索/过滤（实时搜索+分类筛选）

### 🚧 Phase 3 - 情感功能 (进行中)
- [x] 月度回忆录（自动生成）
- [ ] 智能文案生成（AI 加持）
- [ ] 成就系统（提升留存）

### 📋 Phase 4 - 基础设施 (计划中)
- [ ] 微信登录
- [ ] 数据库部署
- [ ] 推送通知
- [ ] 性能优化

### 🎯 Phase 5 - 商业化 (未来)
- [ ] 家庭相册
- [ ] 高级提醒
- [ ] 数据导出
- [ ] 企业版

## 📈 项目统计

- **代码行数**: 2767+ 行
- **组件数量**: 8 个可复用组件
- **页面数量**: 9 个页面
- **API 端点**: 20+ 个
- **数据模型**: 8 个实体

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 👥 团队

由 Claude Opus 4.5 协助开发

---

**让家人之间的每一个时刻都值得记录 ❤️**
