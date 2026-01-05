import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import './index.less';

interface TabItem {
  pagePath: string;
  text: string;
  icon: string;
  activeIcon: string;
}

const tabs: TabItem[] = [
  {
    pagePath: '/pages/calendar/index',
    text: '日历',
    icon: '📅',
    activeIcon: '📆',
  },
  {
    pagePath: '/pages/family/index',
    text: '家庭',
    icon: '👨‍👩‍👧',
    activeIcon: '👨‍👩‍👧‍👦',
  },
  {
    pagePath: '/pages/memory/index',
    text: '回忆',
    icon: '💭',
    activeIcon: '💝',
  },
  {
    pagePath: '/pages/profile/index',
    text: '我的',
    icon: '👤',
    activeIcon: '😊',
  },
];

export default function TabBar() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const path = '/' + currentPage.route;
    const index = tabs.findIndex((tab) => tab.pagePath === path);
    if (index !== -1) {
      setCurrent(index);
    }
  }, []);

  const handleTabClick = (index: number) => {
    if (index === current) return;
    setCurrent(index);
    Taro.switchTab({ url: tabs[index].pagePath });
  };

  return (
    <View className="custom-tab-bar">
      {tabs.map((tab, index) => (
        <View
          key={tab.pagePath}
          className={`tab-item ${index === current ? 'active' : ''}`}
          onClick={() => handleTabClick(index)}
        >
          <Text className="tab-icon">
            {index === current ? tab.activeIcon : tab.icon}
          </Text>
          <Text className="tab-text">{tab.text}</Text>
        </View>
      ))}
    </View>
  );
}
