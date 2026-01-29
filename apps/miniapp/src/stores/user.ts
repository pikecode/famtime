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
  token: string | null;
  user: User | null;
  family: Family | null;
  families: Family[];
  isLoggedIn: boolean;

  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setFamily: (family: Family | null) => void;
  setFamilies: (families: Family[]) => void;
  switchFamily: (familyId: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  token: null,
  user: null,
  family: null,
  families: [],
  isLoggedIn: false,

  setToken: (token) => {
    set({ token });
    if (token) {
      Taro.setStorageSync('token', token);
    } else {
      Taro.removeStorageSync('token');
    }
  },

  setUser: (user) => {
    set({ user, isLoggedIn: !!user });
    if (user) {
      Taro.setStorageSync('user', JSON.stringify(user));
    } else {
      Taro.removeStorageSync('user');
    }
  },

  setFamily: (family) => {
    console.log('[Store] setFamily called with:', family);
    set({ family });
    if (family) {
      Taro.setStorageSync('family', JSON.stringify(family));
      console.log('[Store] Family saved to storage:', family);
    } else {
      Taro.removeStorageSync('family');
      console.log('[Store] Family removed from storage');
    }
  },

  setFamilies: (families) => {
    console.log('[Store] setFamilies called with:', families);
    set({ families });
    if (families && families.length > 0) {
      Taro.setStorageSync('families', JSON.stringify(families));
      console.log('[Store] Families saved to storage, count:', families.length);
    } else {
      Taro.removeStorageSync('families');
      console.log('[Store] Families removed from storage');
    }
  },

  switchFamily: (familyId) => {
    const { families } = get();
    const family = families.find(f => f.id === familyId);
    if (family) {
      set({ family });
      Taro.setStorageSync('family', JSON.stringify(family));
    }
  },

  logout: () => {
    set({ token: null, user: null, family: null, families: [], isLoggedIn: false });
    Taro.removeStorageSync('token');
    Taro.removeStorageSync('user');
    Taro.removeStorageSync('family');
    Taro.removeStorageSync('families');
  },

  loadFromStorage: () => {
    try {
      const token = Taro.getStorageSync('token');
      const userStr = Taro.getStorageSync('user');
      const familyStr = Taro.getStorageSync('family');
      const familiesStr = Taro.getStorageSync('families');

      if (token) {
        set({ token });
      }

      if (userStr) {
        const user = JSON.parse(userStr);
        set({ user, isLoggedIn: true });
      }

      if (familyStr) {
        const family = JSON.parse(familyStr);
        set({ family });
      }

      if (familiesStr) {
        const families = JSON.parse(familiesStr);
        set({ families });
      }
    } catch (e) {
      console.error('Failed to load from storage', e);
    }
  },
}));
