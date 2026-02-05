/**
 * 简单的内存缓存工具
 * 用于缓存 API 请求结果，减少重复请求
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 过期时间（毫秒），默认 5 分钟
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 删除匹配前缀的所有缓存
   */
  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

// 导出单例
export const cache = new MemoryCache();

// 缓存时间常量
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 分钟 - 事件列表等频繁变化的数据
  MEDIUM: 5 * 60 * 1000,     // 5 分钟 - 成就、统计等
  LONG: 30 * 60 * 1000,      // 30 分钟 - 家庭信息等较少变化的数据
};

/**
 * 生成缓存键
 */
export function generateCacheKey(prefix: string, params?: Record<string, any>): string {
  if (!params) return prefix;
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}?${sortedParams}`;
}

/**
 * 带缓存的请求包装器
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // 先检查缓存
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 执行请求
  const data = await fetcher();

  // 存入缓存
  cache.set(key, data, ttl);

  return data;
}
