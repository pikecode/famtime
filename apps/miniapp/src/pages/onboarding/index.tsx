import { View, Text } from '@tarojs/components';
import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useUserStore } from '../../stores/user';
import Button from '../../components/Button';
import './index.less';

export default function OnboardingPage() {
  const { user, family } = useUserStore();

  useEffect(() => {
    // 如果未登录，跳转到登录页
    if (!user) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }

    // 如果已有家庭，跳转到主页
    if (family) {
      Taro.switchTab({ url: '/pages/calendar/index' });
    }
  }, [user, family]);

  const handleCreateFamily = () => {
    Taro.navigateTo({ url: '/pages/family/create/index' });
  };

  const handleJoinFamily = () => {
    Taro.navigateTo({ url: '/pages/family/join/index' });
  };

  return (
    <View className="onboarding-page">
      <View className="welcome-section">
        <Text className="welcome-icon">👨‍👩‍👧‍👦</Text>
        <Text className="welcome-title">欢迎来到 FamTime</Text>
        <Text className="welcome-subtitle">开始管理您的家庭时光</Text>
      </View>

      <View className="info-section">
        <View className="info-item">
          <Text className="info-icon">📅</Text>
          <Text className="info-text">共享家庭日历</Text>
        </View>
        <View className="info-item">
          <Text className="info-icon">⏰</Text>
          <Text className="info-text">智能提醒通知</Text>
        </View>
        <View className="info-item">
          <Text className="info-icon">💝</Text>
          <Text className="info-text">温馨回忆录</Text>
        </View>
      </View>

      <View className="action-section">
        <Button
          type="primary"
          className="action-button"
          onClick={handleCreateFamily}
        >
          创建新家庭
        </Button>
        <Button
          type="default"
          className="action-button"
          onClick={handleJoinFamily}
        >
          加入现有家庭
        </Button>
      </View>

      <View className="tip-section">
        <Text className="tip-text">💡 提示：您可以创建自己的家庭，或使用邀请码加入他人的家庭</Text>
      </View>
    </View>
  );
}
