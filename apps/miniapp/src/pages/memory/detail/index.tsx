import { View, Text, Image, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { FamilyMemory, EventCategory, EventColors } from '@famtime/shared';
import { getMemory } from '../../../services/api';
import { handleError, formatDate } from '../../../utils/helpers';
import LoadingState from '../../../components/LoadingState';
import EmptyState from '../../../components/EmptyState';
import './index.less';

interface CategoryStat {
  category: EventCategory;
  count: number;
}

export default function MemoryDetailPage() {
  const router = useRouter();
  const memoryId = router.params.id;

  const [memory, setMemory] = useState<FamilyMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (memoryId) {
      fetchMemoryDetail();
    }
  }, [memoryId]);

  const fetchMemoryDetail = async () => {
    try {
      const data = await getMemory(memoryId!);
      setMemory(data);
    } catch (e) {
      handleError(e, '获取回忆详情失败');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    if (month) {
      return `${year}年${parseInt(month)}月`;
    }
    return `${year}年`;
  };

  const getCategoryIcon = (category: EventCategory) => {
    const icons = {
      [EventCategory.BIRTHDAY]: '🎂',
      [EventCategory.ANNIVERSARY]: '💕',
      [EventCategory.HEALTH]: '💚',
      [EventCategory.FAMILY_ACTIVITY]: '👨‍👩‍👧‍👦',
      [EventCategory.REMINDER]: '⏰',
      [EventCategory.OTHER]: '📌',
    };
    return icons[category] || '📌';
  };

  const getCategoryLabel = (category: EventCategory) => {
    const labels = {
      [EventCategory.BIRTHDAY]: '生日',
      [EventCategory.ANNIVERSARY]: '纪念日',
      [EventCategory.HEALTH]: '健康',
      [EventCategory.FAMILY_ACTIVITY]: '家庭活动',
      [EventCategory.REMINDER]: '提醒',
      [EventCategory.OTHER]: '其他',
    };
    return labels[category] || '其他';
  };

  const getCategoryStats = (highlights: FamilyMemory['highlights']): CategoryStat[] => {
    const stats = new Map<EventCategory, number>();

    highlights.forEach(highlight => {
      const count = stats.get(highlight.category) || 0;
      stats.set(highlight.category, count + 1);
    });

    return Array.from(stats.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  };

  const handleHighlightClick = (eventId: string) => {
    Taro.vibrateShort({ type: 'light' });
    Taro.navigateTo({
      url: `/pages/event/detail/index?id=${eventId}`
    });
  };

  if (loading) {
    return <LoadingState text="加载回忆中..." />;
  }

  if (error || !memory) {
    return (
      <View className="memory-detail-page">
        <EmptyState
          icon="😢"
          title="加载失败"
          description="无法获取回忆详情，请稍后重试"
          actionText="返回"
          onAction={() => Taro.navigateBack()}
        />
      </View>
    );
  }

  const categoryStats = getCategoryStats(memory.highlights);

  return (
    <ScrollView scrollY className="memory-detail-page">
      {/* Cover Image Section */}
      {memory.coverImage && (
        <View className="cover-section">
          <Image src={memory.coverImage} className="cover-image" mode="aspectFill" />
          <View className="cover-overlay">
            <View className="period-badge">
              <Text>{formatPeriod(memory.period)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Header Section */}
      <View className="header-section">
        {!memory.coverImage && (
          <View className="period-badge-inline">
            <Text>{formatPeriod(memory.period)}</Text>
          </View>
        )}
        <Text className="memory-title">{memory.title}</Text>
        <Text className="memory-summary">{memory.summary}</Text>
      </View>

      {/* Statistics Section */}
      <View className="statistics-section">
        <Text className="section-title">统计数据</Text>

        <View className="stat-card total-events">
          <Text className="stat-number">{memory.eventCount}</Text>
          <Text className="stat-label">个时刻</Text>
        </View>

        {categoryStats.length > 0 && (
          <View className="category-grid">
            {categoryStats.map((stat) => (
              <View
                key={stat.category}
                className="category-card"
                style={{
                  backgroundColor: `${EventColors[stat.category]}1A`,
                  borderColor: `${EventColors[stat.category]}33`
                }}
              >
                <Text className="category-icon">{getCategoryIcon(stat.category)}</Text>
                <Text className="category-count">{stat.count}</Text>
                <Text className="category-label">{getCategoryLabel(stat.category)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Highlights Section */}
      <View className="highlights-section">
        <Text className="section-title">精彩瞬间</Text>

        {memory.highlights.length === 0 ? (
          <EmptyState
            icon="✨"
            title="暂无精彩瞬间"
            description="这段时间还没有记录特别的时刻"
          />
        ) : (
          <View className="highlights-list">
            {memory.highlights.map((highlight, index) => (
              <View
                key={highlight.eventId}
                className="highlight-item"
                onClick={() => handleHighlightClick(highlight.eventId)}
              >
                <View
                  className="highlight-icon-wrapper"
                  style={{ backgroundColor: `${EventColors[highlight.category]}33` }}
                >
                  <Text className="highlight-icon">{getCategoryIcon(highlight.category)}</Text>
                </View>
                <View className="highlight-content">
                  <Text className="highlight-title">{highlight.title}</Text>
                  <Text className="highlight-date">{formatDate(highlight.date, 'MM-DD')}</Text>
                </View>
                <Text className="highlight-arrow">›</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="bottom-spacing" />
    </ScrollView>
  );
}
