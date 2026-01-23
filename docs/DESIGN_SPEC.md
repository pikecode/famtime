# FamTime 家庭共享日历 - 完整设计方案

## 一、产品定位与设计理念

### 1.1 核心定位
**家庭时间的共同守护者** - 不是个人效率工具，而是家庭情感连接的纽带。

### 1.2 设计原则
- **温暖** - 用色柔和，文案亲切，强调家庭连接感
- **克制** - 功能聚焦，不堆砌，每个功能都服务于「家庭协作」
- **不复杂** - 老人小孩都能用，核心操作3步内完成
- **情感化** - 通过回忆、总结等功能，让时间有温度

---

## 二、设计系统

### 2.1 色彩系统

#### 主色调
```
主色：#339AF0 (蓝色) - 信任、稳定、家庭
辅助色：#228BE6 (深蓝) - 用于渐变和强调
```

#### 语义色彩
```
生日：#FF6B6B (红色)
纪念日：#FF85A2 (粉色)
健康：#51CF66 (绿色)
家庭活动：#339AF0 (蓝色)
提醒：#FFD43B (黄色)
其他：#ADB5BD (灰色)
```

#### 中性色
```
文字主色：#212529
文字次要：#495057
文字辅助：#868E96
文字提示：#ADB5BD
背景主色：#FFFFFF
背景次要：#F8F9FA
边框：#E9ECEF
```

### 2.2 字体系统

#### 字号规范
```
超大标题：48px (权重 700-800)
大标题：40px (权重 700)
标题：36px (权重 600-700)
副标题：32px (权重 600)
正文：28-30px (权重 400-500)
辅助文字：24-26px (权重 400-500)
小字：20-22px (权重 400)
```

#### 字重规范
```
特别强调：800 (Extra Bold)
强调：700 (Bold)
次强调：600 (Semi Bold)
正常：500 (Medium)
轻量：400 (Regular)
```

### 2.3 圆角系统
```
超大圆角：48-64px (页面级卡片)
大圆角：32-40px (主要卡片)
中圆角：20-24px (次要卡片、按钮)
小圆角：12-16px (标签、徽章)
微圆角：8px (输入框、小元素)
```

### 2.4 间距系统
```
超大间距：80-120px (页面级分隔)
大间距：48-60px (区块间距)
中间距：32-40px (卡片内部)
常规间距：24px (元素间距)
小间距：16-20px (紧密元素)
微间距：8-12px (内联元素)
```

### 2.5 阴影系统
```
轻阴影：0 2px 8px rgba(0, 0, 0, 0.02)
常规阴影：0 4px 12px rgba(0, 0, 0, 0.02)
中阴影：0 4px 20px rgba(0, 0, 0, 0.02)
重阴影：0 8px 24px rgba(0, 0, 0, 0.03)
强调阴影：0 12px 32px rgba(51, 154, 240, 0.3)
```

---

## 三、页面架构

### 3.1 信息架构

```
FamTime
├── 日历 (Calendar)
│   ├── 月视图日历
│   ├── 今日事件列表
│   └── 新建日程 FAB
│
├── 家庭 (Family)
│   ├── 无家庭状态
│   │   ├── 创建家庭
│   │   └── 加入家庭
│   └── 有家庭状态
│       ├── 家庭信息
│       ├── 待处理事项
│       ├── 成员列表
│       └── 快捷操作
│
├── 回忆 (Memory)
│   ├── 去年今天
│   └── 时光总结
│       ├── 本月统计
│       └── 快捷入口
│
└── 我的 (Profile)
    ├── 用户信息
    ├── 快捷开关
    ├── 功能菜单
    └── 退出登录
```

### 3.2 页面流程

#### 首次使用流程
```
启动应用 → 自动登录 → 无家庭状态 → 创建/加入家庭 → 开始使用
```

#### 日程创建流程
```
日历页 → 点击 FAB → 填写信息 → 选择成员 → 保存 → 返回日历
```

#### 待确认流程
```
收到通知 → 进入家庭页 → 查看待处理 → 接受/拒绝 → 更新状态
```

---

## 四、交互设计

### 4.1 交互原则

#### 即时反馈
- 所有点击操作提供震动反馈（轻/中/重）
- 状态变化立即可见
- 加载状态使用骨架屏

#### 防误操作
- 删除操作二次确认
- 重要操作使用 Modal 确认
- 表单验证实时提示

#### 流畅动效
```css
/* 标准过渡 */
transition: all 0.2s ease;

/* 弹性过渡 */
transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* 淡入动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 4.2 手势交互

#### 点击反馈
```less
.clickable {
  &:active {
    opacity: 0.7;
    transform: scale(0.98);
  }
}
```

#### 卡片交互
```less
.card {
  transition: all 0.2s;

  &:active {
    transform: translateY(4px);
    background: #F8F9FA;
  }
}
```

### 4.3 状态设计

#### 加载状态
- 使用 Skeleton 骨架屏
- 避免空白页面
- 保持布局稳定

#### 空状态
- 友好的空状态插图（emoji）
- 清晰的引导文案
- 明确的操作入口

#### 错误状态
- Toast 提示错误信息
- 不阻断用户操作
- 提供重试机制

---

## 五、组件设计

### 5.1 基础组件

#### Button 按钮
```typescript
<Button
  type="primary|secondary|text"
  size="lg|md|sm"
  loading={boolean}
  disabled={boolean}
  onClick={handler}
>
  按钮文字
</Button>
```

#### Skeleton 骨架屏
```typescript
<Skeleton
  height={number}
  width={string|number}
  count={number}
  circle={boolean}
/>
```

### 5.2 业务组件

#### Calendar 日历组件
```typescript
<Calendar
  currentYear={number}
  currentMonth={number}
  selectedDate={string}
  events={Record<string, Event[]>}
  onDayClick={(day) => void}
  onPrevMonth={() => void}
  onNextMonth={() => void}
  onTodayClick={() => void}
/>
```

#### EventCard 事件卡片
```typescript
<EventCard
  id={string}
  title={string}
  description={string}
  startTime={Date}
  endTime={Date}
  category={EventCategory}
  status={EventStatus}
  isAllDay={boolean}
  onClick={(id) => void}
/>
```

---

## 六、技术架构

### 6.1 前端架构

```
apps/miniapp/
├── src/
│   ├── pages/              # 页面
│   │   ├── calendar/       # 日历
│   │   ├── family/         # 家庭
│   │   ├── memory/         # 回忆
│   │   ├── profile/        # 我的
│   │   └── event/          # 日程相关
│   │
│   ├── components/         # 组件
│   │   ├── Calendar/       # 日历组件
│   │   ├── EventCard/      # 事件卡片
│   │   ├── Button/         # 按钮
│   │   ├── Skeleton/       # 骨架屏
│   │   └── ...
│   │
│   ├── services/           # API 服务
│   │   └── api.ts          # API 封装
│   │
│   ├── stores/             # 状态管理
│   │   ├── user.ts         # 用户状态
│   │   └── event.ts        # 事件状态
│   │
│   ├── utils/              # 工具函数
│   │   ├── date.ts         # 日期处理
│   │   └── format.ts       # 格式化
│   │
│   └── custom-tab-bar/     # 自定义 TabBar
│
└── config/                 # 配置文件
```

### 6.2 后端架构

```
apps/server/
├── src/
│   ├── modules/
│   │   ├── auth/           # 认证模块
│   │   ├── family/         # 家庭模块
│   │   ├── member/         # 成员模块
│   │   ├── event/          # 事件模块
│   │   └── reminder/       # 提醒模块
│   │
│   ├── common/             # 公共模块
│   │   ├── decorators/     # 装饰器
│   │   ├── filters/        # 异常过滤器
│   │   ├── guards/         # 守卫
│   │   └── interceptors/   # 拦截器
│   │
│   └── prisma/             # Prisma ORM
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
└── prisma/
    └── schema.prisma       # 数据库模型
```

### 6.3 数据模型

#### 核心实体关系
```
User (用户)
  ├── 1:N → FamilyMember (家庭成员)
  ├── 1:N → Event (创建的事件)
  └── 1:1 → ReminderPreference (提醒偏好)

Family (家庭)
  ├── 1:N → FamilyMember (成员)
  └── 1:N → Event (事件)

Event (事件)
  ├── N:1 → Family (所属家庭)
  ├── N:1 → User (创建者)
  ├── N:1 → User (指派人)
  └── 1:N → EventReminder (提醒)
```

---

## 七、开发路线图

### Phase 1: MVP (2-3周)
**目标：核心功能可用**

#### Week 1: 基础设施
- [x] 项目初始化
- [x] 数据库设计
- [x] API 基础框架
- [x] 小程序基础页面

#### Week 2: 核心功能
- [ ] 用户认证
- [ ] 家庭创建/加入
- [ ] 日程 CRUD
- [ ] 日历展示

#### Week 3: 协作功能
- [ ] 替他人创建日程
- [ ] 待确认流程
- [ ] 提醒功能
- [ ] 测试优化

### Phase 2: 完善 (2周)
**目标：体验优化**

- [ ] 周/日视图
- [ ] 重复事件
- [ ] 成员管理
- [ ] 权限控制
- [ ] 性能优化

### Phase 3: 情感化 (1-2周)
**目标：情感连接**

- [ ] 去年今天
- [ ] 时光总结
- [ ] 数据可视化
- [ ] 分享功能

### Phase 4: 增强 (持续)
**目标：长期运营**

- [ ] 小组件
- [ ] AI 总结
- [ ] 家庭相册
- [ ] 数据导出

---

## 八、质量保障

### 8.1 性能指标

```
首屏加载：< 2s
页面切换：< 300ms
API 响应：< 500ms
动画帧率：60fps
```

### 8.2 兼容性

```
微信版本：>= 7.0.0
iOS：>= 10.0
Android：>= 5.0
```

### 8.3 可访问性

- 字号 >= 28px (适老化)
- 点击区域 >= 88px
- 颜色对比度 >= 4.5:1 (WCAG AA)
- 支持深色模式（二期）

---

## 九、设计资产

### 9.1 设计文件结构

```
design/
├── ui-kit/                 # UI 组件库
│   ├── buttons.sketch
│   ├── cards.sketch
│   └── forms.sketch
│
├── pages/                  # 页面设计
│   ├── calendar.sketch
│   ├── family.sketch
│   ├── memory.sketch
│   └── profile.sketch
│
├── icons/                  # 图标资源
│   └── tab-icons/
│
└── specs/                  # 设计规范
    ├── colors.md
    ├── typography.md
    └── spacing.md
```

### 9.2 导出规范

```
图标：SVG / PNG @2x @3x
插图：PNG @2x @3x
切图：WebP (优先) / PNG
命名：kebab-case (如 icon-calendar-active.png)
```

---

## 十、总结

### 10.1 设计亮点

1. **情感化设计** - 通过回忆、总结等功能，让时间有温度
2. **适老化友好** - 大字号、大按钮、简单交互
3. **克制的功能** - 不堆砌功能，专注家庭协作
4. **流畅的动效** - 震动反馈、过渡动画提升体验
5. **清晰的层次** - 通过圆角、阴影、间距建立视觉层次

### 10.2 技术亮点

1. **Monorepo 架构** - 前后端共享类型定义
2. **TypeScript 全栈** - 类型安全，减少错误
3. **Prisma ORM** - 类型安全的数据库访问
4. **Zustand 状态管理** - 轻量、简单、高效
5. **自定义 TabBar** - 灵活的交互设计

### 10.3 下一步行动

1. **完成 MVP 开发** - 按照路线图完成核心功能
2. **用户测试** - 邀请真实家庭测试使用
3. **迭代优化** - 根据反馈持续改进
4. **上线运营** - 小程序审核、推广运营

---

**文档版本**: v1.0
**最后更新**: 2026-01-23
**维护者**: Claude Opus 4.5
