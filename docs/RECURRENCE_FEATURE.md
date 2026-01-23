# 重复日程功能实现文档

## 功能概述

实现了完整的重复日程功能，支持每天/每周/每月/每年重复，并可自定义结束条件。

## 实现内容

### 1. 数据模型更新 ✅

**Prisma Schema** (`apps/server/prisma/schema.prisma`)
```prisma
model Event {
  // 重复规则字段
  isRecurring     Boolean @default(false)
  recurrenceRule  String? // DAILY|WEEKLY|MONTHLY|YEARLY
  recurrenceEnd   DateTime?
  recurrenceCount Int?
  recurrenceData  Json? // {weekdays: [1,3,5], monthDay: 15}

  // 重复事件关系
  seriesMasterId String?
  seriesMaster   Event?  @relation("EventSeries")
  seriesInstances Event[] @relation("EventSeries")
  originalDate   DateTime?
}
```

### 2. 共享类型定义 ✅

**Shared Types** (`packages/shared/src/types.ts`)
```typescript
export interface RecurrenceRule {
  type: RecurrenceType; // DAILY|WEEKLY|MONTHLY|YEARLY
  interval?: number;
  endDate?: string;
  count?: number;
  weekdays?: number[]; // [0-6] 周日=0
  monthDay?: number; // [1-31]
}

export interface Event {
  // ... 其他字段
  isRecurring: boolean;
  recurrenceRule?: string;
  recurrenceEnd?: Date;
  recurrenceCount?: number;
  recurrenceData?: {
    weekdays?: number[];
    monthDay?: number;
  };
}
```

### 3. 后端服务 ✅

**RecurrenceService** (`apps/server/src/modules/event/recurrence.service.ts`)
- `generateOccurrences()`: 生成重复事件的所有实例日期
- `getOccurrencesInRange()`: 获取指定日期范围内的实例
- `formatRecurrenceText()`: 格式化重复规则为人类可读文本

**EventService 更新** (`apps/server/src/modules/event/event.service.ts`)
- 创建事件时处理重复规则
- 将 `RecurrenceRule` 转换为数据库字段

### 4. 前端组件 ✅

**RecurrencePicker** (`apps/miniapp/src/components/RecurrencePicker/`)
- 重复类型选择：不重复/每天/每周/每月/每年
- 每周重复时可选择星期几
- 结束条件：永不/指定日期/指定次数
- 实时显示重复规则摘要

**事件创建页面集成** (`apps/miniapp/src/pages/event/create/index.tsx`)
- 添加 `recurrence` 状态
- 集成 `RecurrencePicker` 组件
- 提交时包含重复规则

## 使用示例

### 创建每周三、五的课外班
```typescript
{
  type: RecurrenceType.WEEKLY,
  weekdays: [3, 5], // 周三、周五
  count: 20 // 共20次
}
```

### 创建每月15号的还款提醒
```typescript
{
  type: RecurrenceType.MONTHLY,
  monthDay: 15,
  endDate: '2025-12-31'
}
```

### 创建每年的生日提醒
```typescript
{
  type: RecurrenceType.YEARLY,
  // 永不结束
}
```

## 数据库迁移

执行以下命令应用数据库变更：

```bash
cd apps/server
npx prisma migrate dev --name add_recurrence_fields
```

## 测试要点

1. **基础重复**
   - [ ] 创建每天重复的事件
   - [ ] 创建每周重复的事件
   - [ ] 创建每月重复的事件
   - [ ] 创建每年重复的事件

2. **自定义规则**
   - [ ] 每周选择多个工作日
   - [ ] 设置重复次数
   - [ ] 设置结束日期

3. **日历显示**
   - [ ] 重复事件在日历上正确展开
   - [ ] 跨月查询时正确显示

4. **边界情况**
   - [ ] 2月29日的年度重复
   - [ ] 月末日期的月度重复
   - [ ] 超过100次的重复限制

## 后续优化

### Phase 2.1 - 编辑重复事件
- [ ] 编辑单个实例 vs 整个系列
- [ ] 删除单个实例 vs 整个系列
- [ ] 修改未来所有实例

### Phase 2.2 - 高级规则
- [ ] 每月第N个周X（如每月第2个周一）
- [ ] 排除特定日期
- [ ] 自定义间隔（每2周、每3个月）

### Phase 2.3 - 性能优化
- [ ] 虚拟化重复事件（不预生成实例）
- [ ] 按需展开重复规则
- [ ] 缓存已展开的实例

## 技术亮点

1. **简化的重复规则**：不使用复杂的 RRULE 标准，而是用简单的字段组合
2. **灵活的数据结构**：`recurrenceData` JSON 字段支持未来扩展
3. **前端友好**：RecurrencePicker 组件提供直观的交互体验
4. **性能考虑**：`generateOccurrences` 有最大次数限制防止无限循环

## 相关文件

- `apps/server/prisma/schema.prisma` - 数据模型
- `packages/shared/src/types.ts` - 类型定义
- `apps/server/src/modules/event/recurrence.service.ts` - 重复规则服务
- `apps/server/src/modules/event/event.service.ts` - 事件服务
- `apps/miniapp/src/components/RecurrencePicker/` - 重复规则选择器
- `apps/miniapp/src/pages/event/create/index.tsx` - 事件创建页面
