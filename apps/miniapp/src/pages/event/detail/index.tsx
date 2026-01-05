import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { EventCategory, EventColors, EventStatus, Visibility, Event } from '@famtime/shared';
import { getEvent, acceptEvent, rejectEvent, deleteEvent } from '../../../services/api';
import './index.less';

const categoryLabels: Record<EventCategory, string> = {
  [EventCategory.BIRTHDAY]: '生日',
  [EventCategory.ANNIVERSARY]: '纪念日',
  [EventCategory.HEALTH]: '健康',
  [EventCategory.FAMILY_ACTIVITY]: '家庭活动',
  [EventCategory.REMINDER]: '提醒',
  [EventCategory.OTHER]: '其他',
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekDay}`;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export default function EventDetailPage() {
  const router = useRouter();
  const eventId = router.params.id;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventDetail();
    }
  }, [eventId]);

  const fetchEventDetail = async () => {
    try {
      const data = await getEvent(eventId!);
      setEvent(data);
    } catch (e) {
      Taro.showToast({ title: '获取详情失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !event) {
    return <View className="detail-page loading"><Text>加载中...</Text></View>;
  }

  const isPending = event.status === EventStatus.PENDING;

  const handleAccept = async () => {
    Taro.vibrateShort({ type: 'medium' });
    try {
      await acceptEvent(event.id);
      Taro.showToast({ title: '已接受', icon: 'success' });
      fetchEventDetail();
    } catch (e) {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleReject = async () => {
    Taro.vibrateShort({ type: 'light' });
    try {
      await rejectEvent(event.id);
      Taro.showToast({ title: '已拒绝', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (e) {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleEdit = () => {
    Taro.vibrateShort({ type: 'light' });
    Taro.navigateTo({ url: `/pages/event/create/index?id=${event.id}` });
  };

  const handleDelete = async () => {
    Taro.vibrateShort({ type: 'light' });
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      confirmColor: '#FF6B6B',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteEvent(event.id);
            Taro.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1500);
          } catch (e) {
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      },
    });
  };

  return (
    <View className="detail-page">
      {/* 状态栏 */}
      {isPending && (
        <View className="status-bar pending">
          <Text className="status-icon">⏳</Text>
          <Text className="status-text">待您确认</Text>
        </View>
      )}

      {/* 头部信息 */}
      <View className="header-section">
        <View className="category-badge" style={{ backgroundColor: EventColors[event.category] }}>
          <Text className="category-label">{categoryLabels[event.category]}</Text>
        </View>
        <Text className="event-title">{event.title}</Text>

        <View className="time-info">
          <View className="time-row">
            <Text className="time-icon">📅</Text>
            <Text className="time-text">{formatDate(event.startTime)}</Text>
          </View>
          {!event.isAllDay && (
            <View className="time-row">
              <Text className="time-icon">🕐</Text>
              <Text className="time-text">
                {formatTime(event.startTime)}
                {event.endTime && ` - ${formatTime(event.endTime)}`}
              </Text>
            </View>
          )}
          {event.isAllDay && (
            <View className="time-row">
              <Text className="time-icon">🌅</Text>
              <Text className="time-text">全天</Text>
            </View>
          )}
        </View>
      </View>

      {/* 参与者信息 */}
      <View className="info-section">
        <View className="section-title">参与者</View>
        <View className="people-row">
          <View className="person">
            <View className="person-avatar" style={{ backgroundColor: '#339AF0' }}>
              <Text>家</Text>
            </View>
            <View className="person-info">
              <Text className="person-name">家庭成员</Text>
              <Text className="person-role">创建者</Text>
            </View>
          </View>
          {event.assigneeId && (
            <>
              <View className="arrow-icon">→</View>
              <View className="person">
                <View className="person-avatar" style={{ backgroundColor: '#51CF66' }}>
                  <Text>参</Text>
                </View>
                <View className="person-info">
                  <Text className="person-name">执行人</Text>
                  <Text className="person-role">参与者</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* 提醒设置 */}
      <View className="info-section">
        <View className="section-title">提醒</View>
        <View className="reminder-tags">
          {event.reminders.map((reminder, index) => (
            <View key={index} className="reminder-tag">
              <Text>🔔 {reminder.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 可见性 */}
      <View className="info-section">
        <View className="section-title">可见性</View>
        <View className="visibility-info">
          <Text className="visibility-icon">
            {event.visibility === Visibility.FAMILY ? '👨‍👩‍👧‍👦' : '🔒'}
          </Text>
          <Text className="visibility-text">
            {event.visibility === Visibility.FAMILY ? '家庭成员可见' : '仅自己可见'}
          </Text>
        </View>
      </View>

      {/* 备注 */}
      {event.description && (
        <View className="info-section">
          <View className="section-title">备注</View>
          <View className="description-box">
            <Text className="description-text">{event.description}</Text>
          </View>
        </View>
      )}

      {/* 底部操作栏 */}
      <View className="action-bar">
        {isPending ? (
          // 待确认状态的操作
          <View className="pending-actions">
            <View className="action-btn reject" onClick={handleReject}>
              <Text>拒绝</Text>
            </View>
            <View className="action-btn accept" onClick={handleAccept}>
              <Text>接受</Text>
            </View>
          </View>
        ) : (
          // 已确认状态的操作
          <View className="normal-actions">
            <View className="action-btn secondary" onClick={handleDelete}>
              <Text>删除</Text>
            </View>
            <View className="action-btn primary" onClick={handleEdit}>
              <Text>编辑</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
