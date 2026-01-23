import { View, Text, Button, Switch } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import {
  requestEventReminderPermission,
  requestFamilyInvitePermission,
  requestMonthlyMemoryPermission,
  requestAllNotificationPermissions,
} from '../../utils/notification';
import './index.less';

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    eventReminder: true,
    familyInvite: true,
    monthlyMemory: true,
  });

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
      Taro.showToast({
        title: '授权成功',
        icon: 'success',
      });
    }
  };

  const notificationTypes = [
    {
      key: 'eventReminder',
      title: '日程提醒',
      desc: '在日程开始前提醒您',
      icon: '⏰',
    },
    {
      key: 'familyInvite',
      title: '家庭邀请',
      desc: '收到家庭邀请时通知您',
      icon: '👨‍👩‍👧‍👦',
    },
    {
      key: 'monthlyMemory',
      title: '月度回忆',
      desc: '每月生成回忆录时通知您',
      icon: '💝',
    },
  ];

  return (
    <View className="notification-settings">
      <View className="header">
        <Text className="title">消息通知设置</Text>
        <Text className="subtitle">管理您的消息推送偏好</Text>
      </View>

      <View className="content">
        {/* 通知类型列表 */}
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
                  checked={settings[item.key]}
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

        {/* 一键授权 */}
        <View className="action-section">
          <Button
            className="primary-btn"
            onClick={() => handleRequestPermission('all')}
          >
            一键授权所有通知
          </Button>
        </View>

        {/* 说明文字 */}
        <View className="tips-section">
          <Text className="tips-title">💡 温馨提示</Text>
          <Text className="tips-text">
            • 微信订阅消息需要您主动授权后才能推送
          </Text>
          <Text className="tips-text">
            • 每次授权后可以接收一次消息推送
          </Text>
          <Text className="tips-text">
            • 建议在创建日程时授权提醒通知
          </Text>
          <Text className="tips-text">
            • 您可以随时在此页面重新授权
          </Text>
        </View>
      </View>
    </View>
  );
}
