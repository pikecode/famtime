import { View, Text, Switch } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useUserStore } from '../../stores/user';
import { getProfile, exportEventsToICal, getUserStats, UserStats } from '../../services/api';
import './index.less';

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const family = useUserStore((state) => state.family);
  const logout = useUserStore((state) => state.logout);

  const [settings, setSettings] = useState({
    enableReminder: true,
    quietHours: true,
  });
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    // 加载用户信息
    loadUserProfile();
    loadUserStats();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getProfile();
      console.log('Profile loaded:', profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const statsData = await getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSettingChange = (key: string, value: boolean) => {
    Taro.vibrateShort({ type: 'light' });
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleMenuClick = (item: any) => {
    Taro.vibrateShort({ type: 'light' });
    item.onClick();
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.vibrateShort({ type: 'medium' });
          logout();
          Taro.redirectTo({ url: '/pages/login/index' });
        }
      },
    });
  };

  const handleExportData = async () => {
    if (!family?.id) {
      Taro.showToast({ title: '请先加入家庭', icon: 'none' });
      return;
    }

    Taro.vibrateShort({ type: 'light' });

    try {
      Taro.showLoading({ title: '导出中...' });

      // 导出最近一年的数据
      const now = new Date();
      const startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        .toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        .toISOString().split('T')[0];

      const result = await exportEventsToICal(family.id, startDate, endDate);

      Taro.hideLoading();

      // 在小程序中，我们可以将内容复制到剪贴板或显示给用户
      Taro.setClipboardData({
        data: result.content,
        success: () => {
          Taro.showModal({
            title: '导出成功',
            content: 'iCal 日历数据已复制到剪贴板，您可以粘贴到其他日历应用中导入。',
            showCancel: false,
          });
        },
      });
    } catch (e) {
      Taro.hideLoading();
      Taro.showToast({ title: '导出失败', icon: 'none' });
    }
  };

  const menuItems = [
    {
      title: '消息通知',
      desc: '管理消息推送设置',
      icon: '🔔',
      onClick: () => Taro.navigateTo({ url: '/pages/notification/index' }),
    },
    {
      title: '导出日历',
      desc: '导出为 iCal 格式',
      icon: '📤',
      onClick: handleExportData,
    },
    {
      title: '家庭设置',
      desc: '管理家庭信息',
      icon: '🏠',
      onClick: () => Taro.showToast({ title: '家庭设置即将上线', icon: 'none' }),
    },
    {
      title: '关于我们',
      desc: '版本 1.0.0',
      icon: 'ℹ️',
      onClick: () => Taro.showToast({ title: '家庭日历 v1.0.0', icon: 'none' }),
    },
  ];

  return (
    <View className="profile-page">
      {/* 用户信息 */}
      <View className="user-section">
        <View className="user-avatar">
          <Text className="avatar-text">
            {user?.nickname?.charAt(0) || '?'}
          </Text>
        </View>
        <View className="user-info">
          <Text className="user-name">{user?.nickname || '未登录'}</Text>
          <Text className="user-role">
            {family ? `${family.name} · 成员` : '未加入家庭'}
          </Text>
        </View>
        <View className="edit-btn">编辑</View>
      </View>

      <View className="content-area">
        {/* 成就入口 */}
        <View
          className="achievement-entry"
          onClick={() => {
            Taro.vibrateShort({ type: 'light' });
            Taro.navigateTo({ url: '/pages/achievement/index' });
          }}
        >
          <View className="achievement-header">
            <Text className="achievement-title">🏆 我的成就</Text>
            <Text className="achievement-points">{stats?.totalPoints || 0} 积分</Text>
          </View>
          <View className="achievement-stats">
            <View className="stat-item">
              <Text className="stat-value">{stats?.totalEvents || 0}</Text>
              <Text className="stat-label">日程</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{stats?.currentStreak || 0}</Text>
              <Text className="stat-label">连续</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{stats?.totalMemories || 0}</Text>
              <Text className="stat-label">回忆</Text>
            </View>
          </View>
          <View className="achievement-action">
            <Text className="action-text">查看全部成就</Text>
            <Text className="menu-arrow">›</Text>
          </View>
        </View>

        {/* 快捷开关 */}
        <View className="section-card">
          <View className="setting-item">
            <View className="setting-info">
              <Text className="setting-title">开启提醒</Text>
              <Text className="setting-desc">接收日程提醒通知</Text>
            </View>
            <Switch
              checked={settings.enableReminder}
              onChange={(e) => handleSettingChange('enableReminder', e.detail.value)}
              color="#339AF0"
            />
          </View>
          <View className="setting-item">
            <View className="setting-info">
              <Text className="setting-title">免打扰时段</Text>
              <Text className="setting-desc">22:00 - 08:00 不发送提醒</Text>
            </View>
            <Switch
              checked={settings.quietHours}
              onChange={(e) => handleSettingChange('quietHours', e.detail.value)}
              color="#339AF0"
            />
          </View>
        </View>

        {/* 菜单列表 */}
        <View className="section-card">
          {menuItems.map((item, index) => (
            <View key={index} className="menu-item" onClick={() => handleMenuClick(item)}>
              <View className="menu-icon-wrapper">{item.icon}</View>
              <View className="menu-info">
                <Text className="menu-title">{item.title}</Text>
                <Text className="menu-desc">{item.desc}</Text>
              </View>
              <Text className="menu-arrow">›</Text>
            </View>
          ))}
        </View>

        {/* 退出登录 */}
        <View className="logout-btn" onClick={handleLogout}>
          <Text className="logout-text">退出登录</Text>
        </View>
      </View>
    </View>
  );
}
