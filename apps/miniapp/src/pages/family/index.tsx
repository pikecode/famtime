import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { MemberRole, FamilyMember, Event } from '@famtime/shared';
import { useUserStore } from '../../stores/user';
import { getFamilyMembers, getPendingEvents, acceptEvent, rejectEvent } from '../../services/api';
import './index.less';

export default function FamilyPage() {
  const family = useUserStore((state) => state.family);
  const setFamily = useUserStore((state) => state.setFamily);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    if (family?.id) {
      fetchFamilyData();
    } else {
      setLoading(false);
    }
  });

  const fetchFamilyData = async () => {
    try {
      const [membersData, eventsData] = await Promise.all([
        getFamilyMembers(family!.id),
        getPendingEvents(family!.id)
      ]);
      setMembers(membersData);
      setPendingEvents(eventsData);
    } catch (e) {
      console.error('Fetch family data failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = () => {
    Taro.vibrateShort({ type: 'medium' });
    Taro.navigateTo({ url: '/pages/family/create/index' });
  };

  const handleJoinFamily = () => {
    Taro.vibrateShort({ type: 'light' });
    Taro.navigateTo({ url: '/pages/family/join/index' });
  };

  const handleInvite = () => {
    Taro.vibrateShort({ type: 'light' });
    Taro.navigateTo({ url: '/pages/family/invite/index' });
  };

  const handleEventDetail = (eventId: string) => {
    Taro.navigateTo({ url: `/pages/event/detail/index?id=${eventId}` });
  };

  const handleAcceptEvent = async (eventId: string, e: any) => {
    e.stopPropagation();
    Taro.vibrateShort({ type: 'medium' });
    try {
      await acceptEvent(eventId);
      Taro.showToast({ title: '已接受', icon: 'success' });
      fetchFamilyData();
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  };

  const handleRejectEvent = async (eventId: string, e: any) => {
    e.stopPropagation();
    Taro.vibrateShort({ type: 'light' });
    try {
      await rejectEvent(eventId);
      Taro.showToast({ title: '已拒绝', icon: 'none' });
      fetchFamilyData();
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  };

  // 调试辅助：模拟加入家庭
  const handleDebugJoin = () => {
    const mockFamily = { id: 'debug-family-id', name: '我的温馨家园' };
    setFamily(mockFamily);
    Taro.showToast({ title: '已模拟加入', icon: 'success' });
  };

  if (!family?.id) {
    return (
      <View className="family-page no-family">
        <View className="welcome-section">
          <Text className="welcome-icon">👨‍👩‍👧‍👦</Text>
          <Text className="welcome-title">欢迎使用家庭日历</Text>
          <Text className="welcome-desc">
            创建或加入一个家庭，开始记录你们的共同时光
          </Text>
        </View>

        <View className="action-buttons">
          <View className="primary-btn" onClick={handleCreateFamily}>
            <Text className="btn-icon">✨</Text>
            <View className="btn-content">
              <Text className="btn-title">创建家庭</Text>
              <Text className="btn-desc">成为管理员，邀请家人加入</Text>
            </View>
          </View>

          <View className="secondary-btn" onClick={handleJoinFamily}>
            <Text className="btn-icon">🔗</Text>
            <View className="btn-content">
              <Text className="btn-title">加入家庭</Text>
              <Text className="btn-desc">使用邀请码加入已有家庭</Text>
            </View>
          </View>
        </View>

        <View className="debug-toggle" onClick={handleDebugJoin}>
          <Text>[调试] 点击此处快速模拟加入家庭</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="family-page has-family">
      <View className="family-header">
        <View className="family-avatar">
          <Text className="avatar-icon">🏠</Text>
        </View>
        <Text className="family-name">{family.name}</Text>
        <Text className="member-count">{members.length} 位成员</Text>
      </View>

      {pendingEvents.length > 0 && (
        <View className="section pending-section">
          <View className="section-header">
            <View className="section-title-row">
              <Text className="section-title">待处理</Text>
              <View className="badge">{pendingEvents.length}</View>
            </View>
          </View>
          <View className="pending-list">
            {pendingEvents.map((event) => (
              <View
                key={event.id}
                className="pending-card"
                onClick={() => handleEventDetail(event.id)}
              >
                <View className="pending-main">
                  <Text className="pending-title">{event.title}</Text>
                  <Text className="pending-meta">
                    新邀请 · {new Date(event.startTime).getMonth() + 1}月{new Date(event.startTime).getDate()}日
                  </Text>
                </View>
                <View className="pending-actions">
                  <View className="action-btn reject" onClick={(e) => handleRejectEvent(event.id, e)}>
                    <Text>拒绝</Text>
                  </View>
                  <View className="action-btn accept" onClick={(e) => handleAcceptEvent(event.id, e)}>
                    <Text>接受</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="section">
        <View className="section-header">
          <Text className="section-title">家庭成员</Text>
          <Text className="section-action" onClick={handleInvite}>+ 邀请</Text>
        </View>
        <View className="member-grid">
          {members.map((member) => (
            <View key={member.id} className="member-card">
              <View className="member-avatar" style={{ backgroundColor: member.color || '#339AF0' }}>
                <Text className="avatar-initial">{member.nickname.charAt(0)}</Text>
              </View>
              <Text className="member-name">{member.nickname}</Text>
              {member.role === MemberRole.ADMIN && (
                <View className="admin-tag"><Text>管理员</Text></View>
              )}
            </View>
          ))}
          <View className="member-card add-member" onClick={handleInvite}>
            <View className="add-avatar"><Text className="add-icon">+</Text></View>
            <Text className="add-text">邀请</Text>
          </View>
        </View>
      </View>

      <View className="section">
        <View className="section-header">
          <Text className="section-title">快捷操作</Text>
        </View>
        <View className="quick-actions">
          <View className="quick-action-item" onClick={handleInvite}>
            <Text className="action-icon">📨</Text>
            <Text className="action-text">邀请家人</Text>
          </View>
          <View className="quick-action-item" onClick={() => setFamily(null)}>
            <Text className="action-icon">🚪</Text>
            <Text className="action-text">退出家庭</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
