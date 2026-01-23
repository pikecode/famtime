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

const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api'
  : 'https://your-domain.com/api';

// 通用请求方法
async function request<T>(
  url: string,
  options: Taro.request.Option = {}
): Promise<T> {
  const token = Taro.getStorageSync('token');

  const res = await Taro.request<ApiResponse<T>>({
    url: `${BASE_URL}${url}`,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.header,
    },
    ...options,
  });

  if (res.data.code !== 0) {
    throw new Error(res.data.message);
  }

  return res.data.data as T;
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
  return request<Event>('/event', {
    method: 'POST',
    data,
  });
}

export async function getEvents(params: QueryEventsDto) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return request<Event[]>(`/events?${query}`);
}

export async function getEvent(id: string) {
  return request<Event>(`/event/${id}`);
}

export async function updateEvent(id: string, data: UpdateEventDto) {
  return request<Event>(`/event/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteEvent(id: string) {
  return request<void>(`/event/${id}`, {
    method: 'DELETE',
  });
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
