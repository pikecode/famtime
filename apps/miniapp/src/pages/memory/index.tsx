import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { useUserStore } from '../../stores/user';
import { getThisDayMemories, getMonthlySummary } from '../../services/api';
import './index.less';

interface MemoryEvent {
  id: string;
  title: string;
  startTime: string;
  description?: string;
}

export default function MemoryPage() {
  const family = useUserStore((state) => state.family);
  const [activeTab, setActiveTab] = useState<'thisDay' | 'summary'>('thisDay');
  const [thisDayMemories, setThisDayMemories] = useState<MemoryEvent[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    if (family?.id) {
      fetchData();
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const [memories, summary] = await Promise.all([
        getThisDayMemories(family!.id),
        getMonthlySummary(family!.id, now.getFullYear(), now.getMonth() + 1)
      ]);
      setThisDayMemories(memories as any);
      setMonthlySummary(summary);
    } catch (e) {
      console.error('Fetch memory data failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'thisDay' | 'summary') => {
    Taro.vibrateShort({ type: 'light' });
    setActiveTab(tab);
  };

  if (!family?.id) {
    return <View className="memory-page empty"><Text>请先加入家庭以查看回忆</Text></View>;
  }

  return (
    <View className="memory-page">
      {/* Tab 切换 */}
      <View className="tabs-container">
        <View className="tabs-pill">
          <View
            className={`tab-item ${activeTab === 'thisDay' ? 'active' : ''}`}
            onClick={() => handleTabChange('thisDay')}
          >
            <Text>去年今天</Text>
          </View>
          <View
            className={`tab-item ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => handleTabChange('summary')}
          >
            <Text>时光总结</Text>
          </View>
        </View>
      </View>

      {activeTab === 'thisDay' ? (
        <View className="this-day-section">
          {thisDayMemories.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-icon">📅</Text>
              <Text className="empty-title">去年的今天</Text>
              <Text className="empty-desc">还没有记录，开始创造回忆吧</Text>
            </View>
          ) : (
            <View className="memory-list">
              <Text className="memory-date">去年的今天</Text>
              {thisDayMemories.map((memory) => (
                <View key={memory.id} className="memory-card">
                  <View className="memory-header">
                    <Text className="memory-title">{memory.title}</Text>
                    <Text className="memory-time">{new Date(memory.startTime).getFullYear()}年</Text>
                  </View>
                  {memory.description && (
                    <Text className="memory-desc">{memory.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className="summary-section">
          {/* 情感化文案 */}
          <View className="summary-hero">
            <Text className="hero-title">本月家庭时光</Text>
            <Text className="hero-desc">
              这个月，你们共创造了 {monthlySummary?.familyTime || 0} 个温暖时刻
            </Text>
          </View>

          {/* 数据统计 */}
          <View className="stats-grid">
            <View className="stat-card">
              <Text className="stat-number">{monthlySummary?.totalEvents || 0}</Text>
              <Text className="stat-label">总事件</Text>
            </View>
            <View className="stat-card">
              <Text className="stat-number">{monthlySummary?.familyTime || 0}</Text>
              <Text className="stat-label">共度时光</Text>
            </View>
            <View className="stat-card">
              <Text className="stat-number">{monthlySummary?.importantDays || 0}</Text>
              <Text className="stat-label">重要纪念</Text>
            </View>
            <View className="stat-card">
              <Text className="stat-number">{monthlySummary?.pendingCount || 0}</Text>
              <Text className="stat-label">待完成</Text>
            </View>
          </View>

          {/* 快捷入口 */}
          <View className="quick-links">
            <View className="quick-link">
              <Text className="link-text">查看周总结</Text>
              <Text className="link-arrow">›</Text>
            </View>
            <View className="quick-link">
              <Text className="link-text">查看月总结</Text>
              <Text className="link-arrow">›</Text>
            </View>
            <View className="quick-link">
              <Text className="link-text">年度回顾</Text>
              <Text className="link-arrow">›</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
