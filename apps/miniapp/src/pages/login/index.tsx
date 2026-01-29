import { View, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import { login as apiLogin, getMyFamilies } from '../../services/api';
import { handleError, showLoading, hideLoading, showSuccess } from '../../utils/helpers';
import './index.less';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { setToken, setUser, setFamily, setFamilies } = useUserStore();

  const handleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);
      showLoading('登录中...');

      // 获取微信登录凭证
      const { code } = await Taro.login();

      // 调用后端登录接口
      const res = await apiLogin(code);

      // 保存 token 和用户信息
      setToken(res.token);
      setUser(res.user);

      // 获取用户的家庭列表
      try {
        console.log('[Login] Fetching user families...');
        const families = await getMyFamilies();
        console.log('[Login] User families response:', JSON.stringify(families, null, 2));
        console.log('[Login] Families count:', families?.length || 0);

        if (families && families.length > 0) {
          console.log('[Login] Setting families to store:', families);
          setFamilies(families);
          setFamily(families[0]); // 使用第一个家庭
          console.log('[Login] Current family set to:', families[0]);
        } else {
          console.log('[Login] No families found, clearing store');
          // 清除可能存在的旧家庭信息
          setFamily(null);
          setFamilies([]);
        }
      } catch (familyError) {
        console.error('[Login] Failed to fetch families:', familyError);
        // 清除可能存在的旧家庭信息
        setFamily(null);
        setFamilies([]);
      }

      hideLoading();
      showSuccess('登录成功');

      // 跳转由 app.tsx 的 checkUserStatus 处理
      // 如果有家庭 → 日历页
      // 如果无家庭 → 引导页
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/calendar/index' });
      }, 1000);
    } catch (error: any) {
      hideLoading();
      handleError(error, '登录失败');
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
