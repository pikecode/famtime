import { View, Text, Button, Switch, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  requestEventReminderPermission,
  requestFamilyInvitePermission,
  requestMonthlyMemoryPermission,
  requestAllNotificationPermissions,
} from '../../utils/notification';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from '../../services/api';
import './index.less';

const notificationIcons: Record<string, string> = {
  EVENT_REMINDER: '⏰',
  EVENT_INVITE: '📅',
  FAMILY_INVITE: '👨‍👩‍👧‍👦',
  MONTHLY_MEMORY: '💝',
  SYSTEM: '📢',
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

export default function NotificationPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    eventReminder: true,
    familyInvite: true,
    monthlyMemory: true,
  });

  useDidShow(() => {
    fetchNotifications();
  });

  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(listRes.notifications);
      setUnreadCount(countRes.count);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    Taro.vibrateShort({ type: 'light' });

    // 标记为已读
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // 根据类型跳转
    const data = notification.data || {};
    switch (notification.type) {
      case 'EVENT_REMINDER':
      case 'EVENT_INVITE':
        if (data.eventId) {
          Taro.navigateTo({ url: `/pages/event/detail/index?id=${data.eventId}` });
        }
        break;
      case 'MONTHLY_MEMORY':
        if (data.memoryId) {
          Taro.navigateTo({ url: `/pages/memory/detail/index?id=${data.memoryId}` });
        }
        break;
      case 'FAMILY_INVITE':
        Taro.navigateTo({ url: '/pages/family/join/index' });
        break;
    }
  };

  const handleMarkAllRead = async () => {
    Taro.vibrateShort({ type: 'light' });
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      Taro.showToast({ title: '已全部标记为已读', icon: 'success' });
    } catch (e) {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    Taro.vibrateShort({ type: 'light' });
  };

  const handleRequestPermission = async (type: string) => {
    Taro.vibrateShort({ type: 'light' });
    let success = false;

    switch (type) {
      case 'eventReminder':
        success = await requestEventReminderPermission();
        break;
      case 'familyInvite':
        success = await requestFamilyInvitePermission();
        break;
      case 'monthlyMemory':
        success = await requestMonthlyMemoryPermission();
        break;
      case 'all':
        success = await requestAllNotificationPermissions();
        break;
    }

    if (success) {
      Taro.showToast({ title: '授权成功', icon: 'success' });
    }
  };

  const notificationTypes = [
    { key: 'eventReminder', title: '日程提醒', desc: '在日程开始前提醒您', icon: '⏰' },
    { key: 'familyInvite', title: '家庭邀请', desc: '收到家庭邀请时通知您', icon: '👨‍👩‍👧‍👦' },
    { key: 'monthlyMemory', title: '月度回忆', desc: '每月生成回忆录时通知您', icon: '💝' },
  ];

  return (
    <View className="notification-page">
      {/* 标签切换 */}
      <View className="tab-header">
        <View
          className={`tab-item ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <Text>消息</Text>
          {unreadCount > 0 && <View className="badge">{unreadCount > 99 ? '99+' : unreadCount}</View>}
        </View>
        <View
          className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Text>设置</Text>
        </View>
      </View>

      {activeTab === 'list' ? (
        <View className="list-content">
          {/* 操作栏 */}
          {notifications.length > 0 && unreadCount > 0 && (
            <View className="action-bar">
              <Text className="action-btn" onClick={handleMarkAllRead}>
                全部标为已读
              </Text>
            </View>
          )}

          {/* 通知列表 */}
          {loading ? (
            <View className="loading-state">
              <Text>加载中...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-icon">🔔</Text>
              <Text className="empty-text">暂无消息通知</Text>
            </View>
          ) : (
            <ScrollView scrollY className="notification-list">
              {notifications.map((item) => (
                <View
                  key={item.id}
                  className={`notification-item ${!item.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <View className="item-icon">
                    {notificationIcons[item.type] || '📢'}
                  </View>
                  <View className="item-content">
                    <Text className="item-title">{item.title}</Text>
                    <Text className="item-desc">{item.content}</Text>
                    <Text className="item-time">{formatTime(item.createdAt)}</Text>
                  </View>
                  {!item.isRead && <View className="unread-dot" />}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <View className="settings-content">
          <View className="section-card">
            {notificationTypes.map((item) => (
              <View key={item.key} className="notification-item">
                <View className="item-left">
                  <View className="item-icon">{item.icon}</View>
                  <View className="item-info">
                    <Text className="item-title">{item.title}</Text>
                    <Text className="item-desc">{item.desc}</Text>
                  </View>
                </View>
                <View className="item-right">
                  <Switch
                    checked={settings[item.key as keyof typeof settings]}
                    onChange={(e) => handleToggle(item.key, e.detail.value)}
                    color="#339AF0"
                  />
                  <Button
                    className="auth-btn"
                    size="mini"
                    onClick={() => handleRequestPermission(item.key)}
                  >
                    授权
                  </Button>
                </View>
              </View>
            ))}
          </View>

          <View className="action-section">
            <Button className="primary-btn" onClick={() => handleRequestPermission('all')}>
              一键授权所有通知
            </Button>
          </View>

          <View className="tips-section">
            <Text className="tips-title">温馨提示</Text>
            <Text className="tips-text">• 微信订阅消息需要您主动授权后才能推送</Text>
            <Text className="tips-text">• 每次授权后可以接收一次消息推送</Text>
            <Text className="tips-text">• 建议在创建日程时授权提醒通知</Text>
          </View>
        </View>
      )}
    </View>
  );
}
