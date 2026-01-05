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

    // 2. 如果没有登录，尝试静默登录
    const token = Taro.getStorageSync('token');
    if (!token) {
      handleAutoLogin();
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
    }
  };

  return props.children;
}

export default App;
