import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { getUserAchievements, getUserStats, Achievement, UserStats } from '../../services/api';
import './index.less';

const CATEGORY_MAP: Record<string, string> = {
  ALL: '全部',
  ONBOARDING: '新手',
  EVENT: '日程',
  FAMILY: '家庭',
  STREAK: '连续',
  MEMORY: '回忆',
  SPECIAL: '特殊',
};

export default function AchievementPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [achievementsData, statsData] = await Promise.all([
        getUserAchievements(),
        getUserStats(),
      ]);
      setAchievements(achievementsData);
      setStats(statsData);
    } catch (error: any) {
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(
    (a) => activeCategory === 'ALL' || a.category === activeCategory
  );

  const completedCount = achievements.filter((a) => a.isCompleted).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <View className="achievement-page">
        <View className="empty-state">
          <Text className="empty-icon">...</Text>
          <Text className="empty-text">加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="achievement-page">
      {/* 统计卡片 */}
      <View className="stats-card">
        <View className="stats-header">
          <Text className="stats-title">成就统计</Text>
          <Text className="stats-points">{stats?.totalPoints || 0} 积分</Text>
        </View>
        <View className="stats-grid">
          <View className="stat-item">
            <Text className="stat-value">{stats?.totalEvents || 0}</Text>
            <Text className="stat-label">日程</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{stats?.currentStreak || 0}</Text>
            <Text className="stat-label">连续天数</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{stats?.totalMemories || 0}</Text>
            <Text className="stat-label">回忆录</Text>
          </View>
        </View>
      </View>

      {/* 进度条 */}
      <View className="progress-section">
        <View className="progress-header">
          <Text className="progress-title">成就进度</Text>
          <Text className="progress-count">
            {completedCount}/{totalCount}
          </Text>
        </View>
        <View className="progress-bar">
          <View
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </View>

      {/* 分类标签 */}
      <View className="category-tabs">
        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
          <View
            key={key}
            className={`tab-item ${activeCategory === key ? 'active' : ''}`}
            onClick={() => setActiveCategory(key)}
          >
            {label}
          </View>
        ))}
      </View>

      {/* 成就列表 */}
      <View className="achievement-list">
        {filteredAchievements.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">🏆</Text>
            <Text className="empty-text">暂无成就</Text>
          </View>
        ) : (
          filteredAchievements.map((achievement) => (
            <View
              key={achievement.id}
              className={`achievement-card ${
                achievement.isCompleted ? 'completed' : 'locked'
              }`}
            >
              <View className="achievement-icon">{achievement.icon}</View>
              <View className="achievement-info">
                <Text className="achievement-name">{achievement.name}</Text>
                <Text className="achievement-desc">{achievement.description}</Text>
                {!achievement.isCompleted && (
                  <View className="achievement-progress">
                    <View className="mini-progress-bar">
                      <View
                        className="mini-progress-fill"
                        style={{
                          width: `${Math.min(
                            (achievement.progress / achievement.target) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </View>
                    <Text className="progress-text">
                      {achievement.progress}/{achievement.target}
                    </Text>
                  </View>
                )}
              </View>
              <View className="achievement-badge">
                {achievement.isCompleted ? (
                  <Text className="completed-badge">已完成</Text>
                ) : (
                  <Text className="points-badge">+{achievement.points}</Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
