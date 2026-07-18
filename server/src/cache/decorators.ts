import { redis } from '../config/redis';

function buildKey(prefix: string, args: any[]): string {
  if (args.length === 0) return prefix;
  const serialized = args
    .map((a) => {
      if (a === null || a === undefined) return 'nil';
      if (typeof a === 'object') {
        const sorted = Object.keys(a)
          .sort()
          .reduce((acc: Record<string, any>, k) => {
            acc[k] = a[k];
            return acc;
          }, {} as Record<string, any>);
        return JSON.stringify(sorted);
      }
      return String(a);
    })
    .join(':');
  return prefix + ':' + serialized;
}

export interface CacheableOptions {
  /** 缓存键前缀（或自定义函数，参数为方法入参） */
  key?: string | ((...args: any[]) => string);
  /** 过期时间（秒） */
  ttl: number;
  /** 是否为列表查询（空列表也缓存，防止缓存穿透） */
  list?: boolean;
}

/**
 * 读缓存装饰器：方法执行前先查 Redis，命中直接返回；
 * 未命中则执行业务方法，结果写入 Redis 后返回。
 */
export function Cacheable(options: CacheableOptions) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      let cacheKey: string;
      if (typeof options.key === 'function') {
        cacheKey = options.key(...args);
      } else {
        cacheKey = options.key
          ? buildKey(options.key, args)
          : buildKey(_propertyKey, args);
      }

      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return JSON.parse(cached);
      }

      const result = await original.apply(this, args);

      if (result !== null && result !== undefined) {
        if (options.list && Array.isArray(result) && result.length === 0) {
          if (options.ttl > 0) {
            await redis.setex(cacheKey, options.ttl, '[]');
          } else {
            await redis.set(cacheKey, '[]');
          }
        } else {
          if (options.ttl > 0) {
            await redis.setex(cacheKey, options.ttl, JSON.stringify(result));
          } else {
            await redis.set(cacheKey, JSON.stringify(result));
          }
        }
      }

      return result;
    };
    return descriptor;
  };
}

export interface CacheEvictOptions {
  /** 需要失效的键（支持静态字符串和方法参数函数） */
  keys: (string | ((...args: any[]) => string))[];
  /** 需要按通配模式批量失效的键，如 product:list:* */
  patterns?: string[];
}

/**
 * 写缓存失效装饰器：方法执行后自动删除指定缓存键。
 * patterns 通过 KEYS 扫出所有匹配键后批量 DEL。
 */
export function CacheEvict(options: CacheEvictOptions) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const result = await original.apply(this, args);

      const delKeys: string[] = [];
      for (const k of options.keys) {
        delKeys.push(typeof k === 'function' ? k(...args) : k);
      }

      const promises: Promise<any>[] = [];
      if (delKeys.length > 0) {
        promises.push(redis.del(...delKeys));
      }

      if (options.patterns?.length) {
        for (const pattern of options.patterns) {
          promises.push(clearPattern(pattern));
        }
      }

      await Promise.all(promises);
      return result;
    };
    return descriptor;
  };
}

/**
 * KEYS 的 pattern 不被 @ioredis/commands 识别为 key 参数，
 * ioredis 不会自动加 keyPrefix。所以手动拼接前缀后扫描，
 * 返回的 key 带前缀，del 时又会自动加前缀导致双倍前缀，
 * 因此先剥去前缀再传给 del。
 */
async function clearPattern(pattern: string) {
  const prefix = getKeyPrefix();
  const full = prefix + pattern;
  const keys = await redis.keys(full);
  if (keys.length > 0) {
    // keys 返回的 key 含前缀，剥掉后再传给 del（del 会自动补前缀）
    const clean = prefix
      ? keys.map((k) => (k.startsWith(prefix) ? k.slice(prefix.length) : k))
      : keys;
    await redis.del(...clean);
  }
}

function getKeyPrefix(): string {
  const r = redis as any;
  return typeof r.options?.keyPrefix === 'string' ? r.options.keyPrefix : '';
}

export { redis };
