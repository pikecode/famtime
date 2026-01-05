import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.less';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'full';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
}

export default function Button(props: ButtonProps) {
  const {
    children,
    onClick,
    type = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    haptic = 'light',
  } = props;

  const handleClick = () => {
    if (disabled || loading) return;
    if (haptic !== 'none') {
      Taro.vibrateShort({ type: haptic });
    }
    onClick?.();
  };

  return (
    <View
      className={`custom-button btn-${type} btn-${size} ${disabled ? 'btn-disabled' : ''} ${loading ? 'btn-loading' : ''} ${className}`}
      onClick={handleClick}
    >
      {loading && <View className="loading-spinner" />}
      <Text className="btn-text">{children}</Text>
    </View>
  );
}
