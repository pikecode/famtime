import Taro from '@tarojs/taro';
import { createAppConfig } from 'app-config';
import { useUserStore } from './stores/user';

export default createAppConfig({
  onLaunch() {
    console.log('App launched');
  },

  onShow() {
    // 恢复用户状态
    useUserStore.getState().loadFromStorage();

    // 检查用户状态并导航
    setTimeout(() => {
      this.checkUserStatus();
    }, 100);
  },

  onHide() {
    console.log('App hide');
  },

  checkUserStatus() {
    const { user, family, families } = useUserStore.getState();
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = currentPage?.route || '';

    console.log('[App] Checking user status:', {
      hasUser: !!user,
      hasFamily: !!family,
      familiesCount: families?.length || 0,
      currentRoute
    });
    console.log('[App] User:', user);
    console.log('[App] Family:', family);
    console.log('[App] Families:', families);

    // 白名单页面：不需要检查状态
    const whiteList = ['pages/login/index'];
    if (whiteList.some(path => currentRoute.includes(path))) {
      console.log('[App] Current page is in whitelist, skipping check');
      return;
    }

    // 未登录 → 登录页
    if (!user) {
      console.log('[App] User not logged in, redirecting to login');
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }

    // 已登录但无家庭 → 引导页
    if (!family) {
      // 如果当前不在引导页或家庭相关页面，则跳转
      const familyPages = ['pages/onboarding/index', 'pages/family/create/index', 'pages/family/join/index'];
      if (!familyPages.some(path => currentRoute.includes(path))) {
        console.log('[App] User has no family, redirecting to onboarding');
        Taro.redirectTo({ url: '/pages/onboarding/index' });
      } else {
        console.log('[App] User on family setup page, allowing access');
      }
      return;
    }

    // 已登录且有家庭 → 允许访问所有页面
    console.log('[App] User is fully set up, allowing access');
  },
});
