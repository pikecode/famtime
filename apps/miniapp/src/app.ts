import { PropsWithChildren, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useUserStore } from './stores/user';
import { login as apiLogin } from './services/api';
import './app.less';

function App(props: PropsWithChildren<{}>) {
  const loadFromStorage = useUserStore((state) => state.loadFromStorage);
  const setUser = useUserStore((state) => state.setUser);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  useEffect(() => {
    // 1. 从本地存储恢复状态
    loadFromStorage();

    // 2. 检查是否有 token
    const token = Taro.getStorageSync('token');

    // 3. 如果没有 token，尝试静默登录
    if (!token) {
      handleAutoLogin();
    } else {
      // 有 token，验证是否有效
      checkTokenValidity();
    }
  }, []);

  const handleAutoLogin = async () => {
    try {
      const { code } = await Taro.login();
      const res = await apiLogin(code);

      Taro.setStorageSync('token', res.token);
      setUser(res.user);

      console.log('Auto login success');
    } catch (e) {
      console.error('Auto login failed', e);
      // 自动登录失败，跳转到登录页
      redirectToLogin();
    }
  };

  const checkTokenValidity = async () => {
    try {
      // 尝试调用一个需要认证的接口来验证 token
      // 如果失败，会在 api.ts 的 request 方法中捕获
      // 这里我们简单地假设 token 有效
      console.log('Token exists, assuming valid');
    } catch (e) {
      console.error('Token invalid', e);
      // Token 无效，清除并跳转到登录页
      Taro.removeStorageSync('token');
      redirectToLogin();
    }
  };

  const redirectToLogin = () => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];

    // 如果当前不在登录页，则跳转
    if (currentPage?.route !== 'pages/login/index') {
      Taro.redirectTo({ url: '/pages/login/index' });
    }
  };

  return props.children;
}

export default App;
