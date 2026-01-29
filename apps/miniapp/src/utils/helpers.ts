import Taro from '@tarojs/taro';

/**
 * 统一错误处理
 */
export function handleError(error: any, defaultMessage = '操作失败') {
  console.error('Error:', error);

  let message = defaultMessage;

  if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // 特殊错误处理
  if (message.includes('Network') || message.includes('timeout')) {
    message = '网络连接失败，请检查网络';
  } else if (message.includes('401') || message.includes('Unauthorized')) {
    message = '登录已过期，请重新登录';
    // 清除登录状态
    Taro.removeStorageSync('token');
    setTimeout(() => {
      Taro.reLaunch({ url: '/pages/login/index' });
    }, 1500);
  } else if (message.includes('403') || message.includes('不是该家庭成员')) {
    // 友好的家庭成员错误提示
    Taro.showModal({
      title: '需要加入家庭',
      content: '您还没有加入任何家庭，是否现在创建或加入？',
      confirmText: '去设置',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          Taro.redirectTo({ url: '/pages/onboarding/index' });
        }
      }
    });
    return message;
  } else if (message.includes('Forbidden')) {
    message = '没有权限执行此操作';
  } else if (message.includes('404')) {
    message = '请求的资源不存在';
  } else if (message.includes('500')) {
    message = '服务器错误，请稍后重试';
  }

  Taro.showToast({
    title: message,
    icon: 'none',
    duration: 2500,
  });

  return message;
}

/**
 * 显示成功提示
 */
export function showSuccess(message: string, duration = 1500) {
  Taro.vibrateShort({ type: 'light' });
  Taro.showToast({
    title: message,
    icon: 'success',
    duration,
  });
}

/**
 * 显示加载中
 */
export function showLoading(title = '加载中...') {
  Taro.showLoading({
    title,
    mask: true,
  });
}

/**
 * 隐藏加载
 */
export function hideLoading() {
  Taro.hideLoading();
}

/**
 * 确认对话框
 */
export function showConfirm(options: {
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Taro.showModal({
      title: options.title,
      content: options.content,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      },
    });
  });
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();

    if (now - previous > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      func.apply(context, args);
      previous = now;
    } else if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(context, args);
        previous = Date.now();
        timeout = null;
      }, wait);
    }
  };
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 相对时间格式化
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return formatDate(target, 'MM-DD');
  }
}
