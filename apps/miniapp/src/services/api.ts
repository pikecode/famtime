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
