import { View, Text } from '@tarojs/components';
import './index.less';

interface LoadingStateProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingState({ text = '加载中...', size = 'medium' }: LoadingStateProps) {
  return (
    <View className={`loading-state-container ${size}`}>
      <View className="loading-spinner">
        <View className="spinner-dot"></View>
        <View className="spinner-dot"></View>
        <View className="spinner-dot"></View>
      </View>
      {text && <Text className="loading-text">{text}</Text>}
    </View>
  );
}
