import { View, Text, Switch } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useUserStore } from '../../stores/user';
import { getProfile } from '../../services/api';
import './index.less';

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const family = useUserStore((state) => state.family);
  const logout = useUserStore((state) => state.logout);

  const [settings, setSettings] = useState({
    enableReminder: true,
    quietHours: true,
  });

  useEffect(() => {
    // 加载用户信息
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getProfile();
      console.log('Profile loaded:', profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
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

  const menuItems = [
    {
      title: '消息通知',
      desc: '管理消息推送设置',
      icon: '🔔',
      onClick: () => Taro.navigateTo({ url: '/pages/notification/index' }),
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
