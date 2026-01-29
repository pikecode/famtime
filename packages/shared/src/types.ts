// ============ 枚举与常量 ============

/** 事件类型 */
export enum EventCategory {
  BIRTHDAY = 'BIRTHDAY',           // 生日 - 红色
  ANNIVERSARY = 'ANNIVERSARY',     // 纪念日 - 粉色
  HEALTH = 'HEALTH',               // 健康相关 - 绿色
  FAMILY_ACTIVITY = 'FAMILY_ACTIVITY', // 家庭活动 - 蓝色
  REMINDER = 'REMINDER',           // 普通提醒 - 黄色
  OTHER = 'OTHER',                 // 其他 - 灰色
}

/** 事件颜色映射 */
export const EventColors: Record<EventCategory, string> = {
  [EventCategory.BIRTHDAY]: '#FF6B6B',
  [EventCategory.ANNIVERSARY]: '#FF85A2',
  [EventCategory.HEALTH]: '#51CF66',
  [EventCategory.FAMILY_ACTIVITY]: '#339AF0',
  [EventCategory.REMINDER]: '#FFD43B',
  [EventCategory.OTHER]: '#ADB5BD',
};

/** 事件状态 */
export enum EventStatus {
  PENDING = 'pending',       // 待确认（替他人创建）
  CONFIRMED = 'confirmed',   // 已确认
  REJECTED = 'rejected',     // 已拒绝
  CANCELLED = 'cancelled',   // 已取消
}

/** 可见性 */
export enum Visibility {
  PRIVATE = 'PRIVATE',   // 仅自己可见
  FAMILY = 'FAMILY',     // 家庭成员可见
}

/** 家庭成员角色 */
export enum MemberRole {
  ADMIN = 'admin',     // 管理员
  MEMBER = 'member',   // 普通成员
}

/** 重复类型 */
export enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/** 提醒类型 */
export enum ReminderType {
  AT_TIME = 'AT_TIME',     // 事件开始时
  BEFORE = 'BEFORE',       // 提前提醒
}

/** 回忆类型 */
export enum MemoryType {
  MONTHLY = 'monthly',       // 月度回忆
  YEARLY = 'yearly',         // 年度回忆
  ANNIVERSARY = 'anniversary', // 纪念日回忆
}

// ============ 接口定义 ============

/** 家庭 */
export interface Family {
  id: string;
  name: string;
  avatar?: string;
  creatorId: string;
  adminId: string;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 家庭成员 */
export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  nickname: string;
  role: MemberRole;
  color: string;
  joinedAt: Date;
}

/** 用户 */
export interface User {
  id: string;
  openid: string;
  unionid?: string;
  nickname: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 重复规则 */
export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number; // 间隔（默认1）
  endDate?: string; // 结束日期 ISO 8601
  count?: number; // 重复次数
  weekdays?: number[]; // 周几重复 [0-6]，0=周日
  monthDay?: number; // 每月第几天 [1-31]
}

/** 提醒配置 */
export interface ReminderConfig {
  type: ReminderType;
  beforeMinutes?: number;  // 提前多少分钟（type 为 BEFORE 时有效）
}

/** 事件/日程 */
export interface Event {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  isAllDay: boolean;
  category: EventCategory;
  visibility: Visibility;
  creatorId: string;
  assigneeId?: string;
  status: EventStatus;

  // 重复规则
  isRecurring: boolean;
  recurrenceRule?: string; // DAILY|WEEKLY|MONTHLY|YEARLY
  recurrenceEnd?: Date;
  recurrenceCount?: number;
  recurrenceData?: {
    weekdays?: number[];
    monthDay?: number;
  };

  // 重复事件关系
  seriesMasterId?: string;
  originalDate?: Date;

  reminders: ReminderConfig[];
  createdAt: Date;
  updatedAt: Date;
}

/** 事件评论 */
export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
}

/** 家庭回忆录 */
export interface FamilyMemory {
  id: string;
  familyId: string;
  type: MemoryType;
  period: string; // "2024-01" or "2024"
  title: string;
  summary: string;
  coverImage?: string;
  eventCount: number;
  highlights: Array<{
    eventId: string;
    title: string;
    date: string;
    category: EventCategory;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ============ API 请求/响应类型 ============

/** 创建家庭请求 */
export interface CreateFamilyDto {
  name: string;
  avatar?: string;
}

/** 加入家庭请求 */
export interface JoinFamilyDto {
  inviteCode: string;
  nickname: string;
}

/** 创建事件请求 */
export interface CreateEventDto {
  familyId: string;
  title: string;
  description?: string;
  startTime: string;  // ISO 8601
  endTime?: string;
  isAllDay: boolean;
  category: EventCategory;
  visibility: Visibility;
  assigneeId?: string;
  recurrence?: RecurrenceRule;
  reminders: ReminderConfig[];
}

/** 更新事件请求 */
export interface UpdateEventDto extends Partial<CreateEventDto> {}

/** 查询事件参数 */
export interface QueryEventsDto {
  familyId: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;
  status?: EventStatus;
}

/** 创建评论请求 */
export interface CreateCommentDto {
  eventId: string;
  content: string;
}

/** API 统一响应格式 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}
