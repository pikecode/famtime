import Taro from '@tarojs/taro';
import type {
  ApiResponse,
  Family,
  FamilyMember,
  Event,
  CreateFamilyDto,
  JoinFamilyDto,
  CreateEventDto,
  UpdateEventDto,
  QueryEventsDto,
} from '@famtime/shared';
import { cache, cachedFetch, generateCacheKey, CACHE_TTL } from '../utils/cache';

const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api'
  : 'https://ompeak.com/api';

// 请求拦截器 - 添加token
function getHeaders() {
  const token = Taro.getStorageSync('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// 通用请求方法
async function request<T>(
  url: string,
  options: Taro.request.Option = {}
): Promise<T> {
  try {
    const res = await Taro.request<ApiResponse<T>>({
      url: `${BASE_URL}${url}`,
      header: {
        ...getHeaders(),
        ...options.header,
      },
      timeout: 10000, // 10秒超时
      ...options,
    });

    // 检查HTTP状态码
    if (res.statusCode >= 400) {
      throw new Error(`HTTP ${res.statusCode}: ${res.data?.message || '请求失败'}`);
    }

    // 检查业务状态码
    if (res.data.code !== 0) {
      throw new Error(res.data.message || '操作失败');
    }

    return res.data.data as T;
  } catch (error: any) {
    // 网络错误处理
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        throw new Error('请求超时，请检查网络连接');
      } else if (error.errMsg.includes('fail')) {
        throw new Error('网络连接失败，请检查网络');
      }
    }
    throw error;
  }
}

// ============ 认证相关 ============

export async function login(code: string) {
  return request<{ token: string; user: { id: string; nickname: string } }>(
    '/auth/login',
    {
      method: 'POST',
      data: { code },
    }
  );
}

export async function getProfile() {
  return request<{ id: string; nickname: string; avatar?: string }>(
    '/auth/profile'
  );
}

export async function updateProfile(data: { nickname?: string; avatar?: string }) {
  return request<{ id: string; nickname: string; avatar?: string }>(
    '/auth/profile',
    {
      method: 'PUT',
      data,
    }
  );
}

// ============ 家庭相关 ============

export async function createFamily(data: CreateFamilyDto) {
  return request<Family>('/family', {
    method: 'POST',
    data,
  });
}

export async function getFamily(id: string) {
  return request<Family>(`/family/${id}`);
}

export async function getMyFamilies() {
  return request<Family[]>('/family/my');
}

export async function joinFamily(data: JoinFamilyDto) {
  return request<FamilyMember>('/family/join', {
    method: 'POST',
    data,
  });
}

export async function leaveFamily(familyId: string) {
  return request<void>(`/family/${familyId}/leave`, {
    method: 'DELETE',
  });
}

export async function refreshInviteCode(familyId: string) {
  return request<{ inviteCode: string }>(`/family/${familyId}/invite-code`, {
    method: 'POST',
  });
}

// ============ 成员相关 ============

export async function getFamilyMembers(familyId: string) {
  return request<FamilyMember[]>(`/family/${familyId}/members`);
}

export async function updateMember(
  memberId: string,
  data: { nickname?: string; color?: string }
) {
  return request<FamilyMember>(`/member/${memberId}`, {
    method: 'PUT',
    data,
  });
}

export async function removeMember(memberId: string) {
  return request<void>(`/member/${memberId}`, {
    method: 'DELETE',
  });
}

// ============ 日程相关 ============

export async function createEvent(data: CreateEventDto) {
  const result = await request<Event>('/event', {
    method: 'POST',
    data,
  });
  invalidateEventsCache();
  invalidateAchievementsCache();
  return result;
}

export async function getEvents(params: QueryEventsDto) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const cacheKey = generateCacheKey('events', params);
  return cachedFetch(
    cacheKey,
    () => request<Event[]>(`/events?${query}`),
    CACHE_TTL.SHORT
  );
}

export async function getPendingEvents(familyId: string) {
  return request<Event[]>(`/events/pending?familyId=${familyId}`);
}

export async function searchEvents(familyId: string, keyword: string, limit = 20) {
  return request<Event[]>(
    `/events/search?familyId=${familyId}&keyword=${encodeURIComponent(keyword)}&limit=${limit}`
  );
}

export async function getEvent(id: string) {
  return request<Event>(`/event/${id}`);
}

export async function updateEvent(id: string, data: UpdateEventDto) {
  const result = await request<Event>(`/event/${id}`, {
    method: 'PUT',
    data,
  });
  invalidateEventsCache();
  return result;
}

export async function deleteEvent(id: string) {
  const result = await request<void>(`/event/${id}`, {
    method: 'DELETE',
  });
  invalidateEventsCache();
  return result;
}

export async function acceptEvent(id: string) {
  return request<Event>(`/event/${id}/accept`, {
    method: 'POST',
  });
}

export async function rejectEvent(id: string) {
  return request<Event>(`/event/${id}/reject`, {
    method: 'POST',
  });
}

// ============ 评论相关 ============

export async function getEventComments(eventId: string) {
  return request<any[]>(`/comments/event/${eventId}`);
}

export async function createComment(data: { eventId: string; content: string }) {
  return request<any>('/comments', {
    method: 'POST',
    data,
  });
}

export async function deleteComment(commentId: string) {
  return request<void>(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// ============ 回忆相关 ============

export async function getThisDayMemories(familyId: string) {
  return request<Event[]>(`/memory/${familyId}/this-day`);
}

export async function getMonthlySummary(familyId: string, year: number, month: number) {
  return request<{
    totalEvents: number;
    familyTime: number;
    importantDays: number;
    pendingCount: number;
  }>(`/memory/${familyId}/summary?year=${year}&month=${month}`);
}

export async function getFamilyMemories(familyId: string) {
  return request<any[]>(`/memories/family/${familyId}`);
}

export async function getMemory(memoryId: string) {
  return request<any>(`/memories/${memoryId}`);
}

export async function generateMonthlyMemory(familyId: string, year: number, month: number) {
  return request<any>('/memories/generate/monthly', {
    method: 'POST',
    data: { familyId, year, month },
  });
}

// ============ 通知相关 ============

export interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(limit = 50, offset = 0) {
  return request<{ notifications: Notification[]; total: number }>(
    `/notification/list?limit=${limit}&offset=${offset}`
  );
}

export async function getUnreadNotificationCount() {
  return request<{ count: number }>('/notification/unread-count');
}

export async function markNotificationAsRead(id: string) {
  return request<void>(`/notification/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsAsRead() {
  return request<void>('/notification/read-all', { method: 'POST' });
}

export async function deleteNotification(id: string) {
  return request<void>(`/notification/${id}`, { method: 'DELETE' });
}

// ============ 模板相关 ============

export interface EventTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  duration?: number;
  isAllDay: boolean;
  category: string;
  visibility: string;
  reminders: Array<{ type: string; beforeMinutes?: number }>;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  creator: { id: string; nickname: string };
}

export async function getTemplates(familyId: string) {
  return request<EventTemplate[]>(`/templates?familyId=${familyId}`);
}

export async function getTemplate(id: string) {
  return request<EventTemplate>(`/templates/${id}`);
}

export async function createTemplate(data: {
  familyId: string;
  name: string;
  title: string;
  description?: string;
  duration?: number;
  isAllDay: boolean;
  category: string;
  visibility: string;
  reminders: Array<{ type: string; beforeMinutes?: number }>;
  isPublic: boolean;
}) {
  return request<EventTemplate>('/templates', {
    method: 'POST',
    data,
  });
}

export async function updateTemplate(id: string, data: Partial<EventTemplate>) {
  return request<EventTemplate>(`/templates/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteTemplate(id: string) {
  return request<void>(`/templates/${id}`, { method: 'DELETE' });
}

export async function useTemplate(id: string) {
  return request<EventTemplate>(`/templates/${id}/use`, { method: 'POST' });
}

// ============ 导出相关 ============

export async function exportEventsToICal(familyId: string, startDate: string, endDate: string) {
  return request<{ content: string; filename: string }>(
    `/events/export?familyId=${familyId}&startDate=${startDate}&endDate=${endDate}`
  );
}

// ============ 成就相关 ============

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  type: string;
  target: number;
  points: number;
  order: number;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface UserStats {
  id: string;
  userId: string;
  totalEvents: number;
  totalComments: number;
  totalMemories: number;
  eventsForOthers: number;
  acceptedEvents: number;
  currentStreak: number;
  longestStreak: number;
  lastEventDate: string | null;
  totalPoints: number;
  birthdayEvents: number;
  anniversaryEvents: number;
  healthEvents: number;
  familyActivityEvents: number;
  reminderEvents: number;
  otherEvents: number;
}

export async function getUserAchievements() {
  return cachedFetch(
    'achievements:user',
    () => request<Achievement[]>('/achievements/user'),
    CACHE_TTL.MEDIUM
  );
}

export async function getUserStats() {
  return cachedFetch(
    'achievements:stats',
    () => request<UserStats>('/achievements/stats'),
    CACHE_TTL.MEDIUM
  );
}

// ============ 缓存管理 ============

/**
 * 清除事件相关缓存（创建/更新/删除事件后调用）
 */
export function invalidateEventsCache() {
  cache.deleteByPrefix('events');
}

/**
 * 清除成就相关缓存
 */
export function invalidateAchievementsCache() {
  cache.deleteByPrefix('achievements');
}

/**
 * 清除所有缓存
 */
export function clearAllCache() {
  cache.clear();
}
