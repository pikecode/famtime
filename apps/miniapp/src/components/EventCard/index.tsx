import { View, Text } from '@tarojs/components';
import { memo, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { EventCategory, EventColors, EventStatus } from '@famtime/shared';
import './index.less';

interface EventCardProps {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  category: EventCategory;
  status: EventStatus;
  creatorName: string;
  assigneeName?: string;
  isAllDay: boolean;
  onClick?: (id: string) => void;
}

const formatTime = (date: Date) => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const categoryLabels: Record<EventCategory, string> = {
  [EventCategory.BIRTHDAY]: '生日',
  [EventCategory.ANNIVERSARY]: '纪念日',
  [EventCategory.HEALTH]: '健康',
  [EventCategory.FAMILY_ACTIVITY]: '家庭活动',
  [EventCategory.REMINDER]: '提醒',
  [EventCategory.OTHER]: '其他',
};

export default memo(function EventCard(props: EventCardProps) {
  const {
    id,
    title,
    description,
    startTime,
    endTime,
    category,
    status,
    creatorName,
    assigneeName,
    isAllDay,
    onClick,
  } = props;

  const handleClick = useCallback(() => {
    Taro.vibrateShort({ type: 'light' });
    onClick?.(id);
  }, [id, onClick]);

  return (
    <View
      className={`event-card ${status === EventStatus.PENDING ? 'pending' : ''}`}
      onClick={handleClick}
    >
      <View
        className="event-color-bar"
        style={{ backgroundColor: EventColors[category] }}
      />
      <View className="event-content">
        <View className="event-header">
          <Text className="event-title">{title}</Text>
          {status === EventStatus.PENDING && (
            <View className="pending-badge">待确认</View>
          )}
        </View>
        <View className="event-meta">
          <Text className="event-time">
            {isAllDay ? '全天' : formatTime(startTime)}
            {endTime && ` - ${formatTime(endTime)}`}
          </Text>
          <View className="event-category-tag">
            <View 
              className="category-dot" 
              style={{ backgroundColor: EventColors[category] }} 
            />
            <Text className="category-text">{categoryLabels[category]}</Text>
          </View>
        </View>
        {description && (
          <Text className="event-desc">{description}</Text>
        )}
        {assigneeName && assigneeName !== creatorName && (
          <View className="event-assignee">
            <Text className="assignee-icon">👤</Text>
            <Text className="assignee-text">
              {creatorName} → {assigneeName}
            </Text>
          </View>
        )}
      </View>
      <View className="event-arrow">›</View>
    </View>
  );
});
