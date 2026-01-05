import { Component } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
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

interface State {
  selected: number;
}

export default class CustomTabBar extends Component<{}, State> {
  state: State = {
    selected: 0,
  };

  switchTab = (index: number, url: string) => {
    Taro.vibrateShort({ type: 'light' });
    this.setState({ selected: index });
    Taro.switchTab({ url });
  };

  render() {
    const { selected } = this.state;

    return (
      <View className="custom-tab-bar">
        {tabs.map((tab, index) => (
          <View
            key={tab.pagePath}
            className={`tab-item ${index === selected ? 'active' : ''}`}
            onClick={() => this.switchTab(index, tab.pagePath)}
          >
            <Text className="tab-icon">
              {index === selected ? tab.activeIcon : tab.icon}
            </Text>
            <Text className="tab-text">{tab.text}</Text>
          </View>
        ))}
      </View>
    );
  }
}
