import { create } from 'zustand';
import Taro from '@tarojs/taro';

interface User {
  id: string;
  nickname: string;
  avatar?: string;
}

interface Family {
  id: string;
  name: string;
  avatar?: string;
}

interface UserState {
  user: User | null;
  family: Family | null;
  isLoggedIn: boolean;

  setUser: (user: User | null) => void;
  setFamily: (family: Family | null) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  family: null,
  isLoggedIn: false,

  setUser: (user) => {
    set({ user, isLoggedIn: !!user });
    if (user) {
      Taro.setStorageSync('user', JSON.stringify(user));
    } else {
      Taro.removeStorageSync('user');
    }
  },

  setFamily: (family) => {
    set({ family });
    if (family) {
      Taro.setStorageSync('family', JSON.stringify(family));
    } else {
      Taro.removeStorageSync('family');
    }
  },

  logout: () => {
    set({ user: null, family: null, isLoggedIn: false });
    Taro.removeStorageSync('user');
    Taro.removeStorageSync('family');
    Taro.removeStorageSync('token');
  },

  loadFromStorage: () => {
    try {
      const userStr = Taro.getStorageSync('user');
      const familyStr = Taro.getStorageSync('family');

      if (userStr) {
        const user = JSON.parse(userStr);
        set({ user, isLoggedIn: true });
      }

      if (familyStr) {
        const family = JSON.parse(familyStr);
        set({ family });
      }
    } catch (e) {
      console.error('Failed to load from storage', e);
    }
  },
}));
