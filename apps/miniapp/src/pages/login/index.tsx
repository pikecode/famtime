import { View, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import { login as apiLogin } from '../../services/api';
import './index.less';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  const handleLogin = async () => {
    try {
      setLoading(true);

      // 获取微信登录凭证
      const { code } = await Taro.login();

      // 调用后端登录接口
      const res = await apiLogin(code);

      // 保存 token 和用户信息
      Taro.setStorageSync('token', res.token);
      setUser(res.user);

      Taro.showToast({
        title: '登录成功',
        icon: 'success',
      });

      // 跳转到首页
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/calendar/index' });
      }, 1000);
    } catch (error: any) {
      console.error('Login failed:', error);
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="login-page">
      <View className="login-container">
        <View className="logo-section">
          <Image
            className="logo"
            src="https://via.placeholder.com/120"
            mode="aspectFit"
          />
          <View className="app-name">FamTime</View>
          <View className="app-slogan">让家人之间的每一个时刻都值得记录</View>
        </View>

        <View className="features">
          <View className="feature-item">
            <View className="feature-icon">📅</View>
            <View className="feature-text">共享日历</View>
          </View>
          <View className="feature-item">
            <View className="feature-icon">👨‍👩‍👧‍👦</View>
            <View className="feature-text">家庭管理</View>
          </View>
          <View className="feature-item">
            <View className="feature-icon">💝</View>
            <View className="feature-text">温馨回忆</View>
          </View>
        </View>

        <Button
          className="login-button"
          onClick={handleLogin}
          loading={loading}
        >
          {loading ? '登录中...' : '微信一键登录'}
        </Button>

        <View className="privacy-text">
          登录即表示同意《用户协议》和《隐私政策》
        </View>
      </View>
    </View>
  );
}
