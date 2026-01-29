import { View, Text } from '@tarojs/components';
import './index.less';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = '📭',
  title = '暂无数据',
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="empty-state-container">
      <View className="empty-icon">{icon}</View>
      <Text className="empty-title">{title}</Text>
      {description && <Text className="empty-description">{description}</Text>}
      {actionText && onAction && (
        <View className="empty-action" onClick={onAction}>
          <Text>{actionText}</Text>
        </View>
      )}
    </View>
  );
}
