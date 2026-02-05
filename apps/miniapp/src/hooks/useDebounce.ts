import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 防抖值 Hook
 * 当值变化后，延迟指定时间才更新
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 防抖回调 Hook
 * 返回一个防抖版本的回调函数
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // 保持回调函数的最新引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * 节流回调 Hook
 * 在指定时间内只执行一次
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRunRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRunRef.current >= delay) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      }
    },
    [delay]
  ) as T;

  return throttledCallback;
}
