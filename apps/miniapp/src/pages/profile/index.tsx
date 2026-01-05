import { View, Text, Switch } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './index.less';

export default function ProfilePage() {
  const [userInfo] = useState({
    nickname: '小明',
    avatar: '',
  });

  const [settings, setSettings] = useState({
    enableReminder: true,
    quietHours: true,
  });

  const handleSettingChange = (key: string, value: boolean) => {
    Taro.vibrateShort({ type: 'light' });
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleMenuClick = (item: any) => {
    Taro.vibrateShort({ type: 'light' });
    item.onClick();
  };

  const menuItems = [
    {
      title: '提醒设置',
      desc: '设置提醒时间和免打扰',
      icon: '🔔',
      onClick: () => Taro.showToast({ title: '提醒设置即将上线', icon: 'none' }),
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
            {userInfo.nickname.charAt(0)}
          </Text>
        </View>
        <View className="user-info">
          <Text className="user-name">{userInfo.nickname}</Text>
          <Text className="user-role">我们的家 · 成员</Text>
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
        <View className="logout-btn" onClick={() => Taro.vibrateShort({ type: 'medium' })}>
          <Text className="logout-text">退出登录</Text>
        </View>
      </View>
    </View>
  );
}
