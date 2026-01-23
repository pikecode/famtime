import { View, Text, ScrollView } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { FamilyMemory, EventCategory, EventColors } from '@famtime/shared';
import './index.less';

interface MemoryCardProps {
  memory: FamilyMemory;
  onClick: (memory: FamilyMemory) => void;
}

export default function MemoryCard({ memory, onClick }: MemoryCardProps) {
  const handleClick = () => {
    Taro.vibrateShort({ type: 'light' });
    onClick(memory);
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

  return (
    <View className="memory-card" onClick={handleClick}>
      <View className="memory-header">
        <View className="period-badge">
          <Text>{formatPeriod(memory.period)}</Text>
        </View>
        <View className="event-count">
          <Text>{memory.eventCount} 个时刻</Text>
        </View>
      </View>

      <View className="memory-content">
        <Text className="memory-title">{memory.title}</Text>
        <Text className="memory-summary">{memory.summary}</Text>
      </View>

      {memory.highlights && memory.highlights.length > 0 && (
        <View className="highlights-section">
          <Text className="highlights-label">精彩瞬间</Text>
          <ScrollView scrollX className="highlights-scroll" showScrollbar={false}>
            <View className="highlights-list">
              {memory.highlights.map((highlight, index) => (
                <View
                  key={index}
                  className="highlight-item"
                  style={{ backgroundColor: EventColors[highlight.category] + '20' }}
                >
                  <Text className="highlight-icon">
                    {getCategoryIcon(highlight.category)}
                  </Text>
                  <Text className="highlight-title">{highlight.title}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View className="memory-footer">
        <Text className="view-detail">查看详情 ›</Text>
      </View>
    </View>
  );
}
