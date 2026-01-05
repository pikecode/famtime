import { View } from '@tarojs/components';
import './index.less';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
  count?: number;
}

export default function Skeleton(props: SkeletonProps) {
  const { width, height, circle, className = '', count = 1 } = props;

  const style = {
    width: typeof width === 'number' ? `${width}rpx` : width,
    height: typeof height === 'number' ? `${height}rpx` : height,
    borderRadius: circle ? '50%' : '12rpx',
  };

  const skeletons = Array.from({ length: count }).map((_, i) => (
    <View
      key={i}
      className={`skeleton-item ${className}`}
      style={style}
    />
  ));

  return <>{skeletons}</>;
}
