import { redis } from '../config/redis';
import { BusinessError } from '../utils/response';

class CacheService {
  async getRedisInfo() {
    const info = await redis.info();
    const stats = this.parseRedisInfo(info);
    const dbSize = await redis.dbsize();
    return { ...stats, dbSize };
  }

  /** 获取匹配模式的 keys（含 type/ttl） */
  async getKeys(pattern: string = '*') {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [newCursor, foundKeys] = await redis.scan(cursor, 'MATCH', pattern || '*', 'COUNT', 100);
      cursor = newCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    // 限制数量，批量获取 type 和 ttl
    const limited = keys.slice(0, 200);
    const result: any[] = [];
    for (const key of limited) {
      const [type, ttl] = await Promise.all([redis.type(key), redis.ttl(key)]);
      result.push({ key, type, ttl });
    }
    return result;
  }

  /** 获取 key 详情 */
  async getKeyDetail(key: string) {
    const [type, ttl, size] = await Promise.all([
      redis.type(key),
      redis.ttl(key),
      redis.memory('USAGE', key).catch(() => 0),
    ]);

    let value: any = '';
    switch (type) {
      case 'string':
        value = await redis.get(key);
        if (value && value.length > 500) value = value.substring(0, 500) + '...';
        break;
      case 'list':
        value = await redis.lrange(key, 0, 19);
        break;
      case 'set':
        value = await redis.smembers(key);
        break;
      case 'zset':
        value = await redis.zrange(key, 0, 19, 'WITHSCORES');
        break;
      case 'hash':
        value = await redis.hgetall(key);
        break;
      default:
        value = '(unsupported type)';
    }

    return { key, type, ttl, value, size };
  }

  async deleteKey(key: string) {
    const result = await redis.del(key);
    return { deleted: result > 0 };
  }

  async clearCache() {
    await redis.flushall();
    return { message: '所有缓存已清空' };
  }

  async clearByPattern(pattern: string) {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [newCursor, foundKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = newCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');
    if (keys.length === 0) return { deleted: 0, message: '没有匹配的缓存' };
    const deleted = await redis.del(...keys);
    return { deleted, keys };
  }

  private parseRedisInfo(info: string) {
    const result: any = {};
    for (const line of info.split('\r\n')) {
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      result[line.substring(0, idx)] = line.substring(idx + 1);
    }
    return {
      version: result.redis_version || 'unknown',
      uptimeInDays: result.uptime_in_days || '0',
      connectedClients: result.connected_clients || '0',
      usedMemoryHuman: result.used_memory_human || '0',
      usedMemoryPeakHuman: result.used_memory_peak_human || '0',
      totalConnectionsReceived: result.total_connections_received || '0',
      totalCommandsProcessed: result.total_commands_processed || '0',
      instantaneousOpsPerSec: result.instantaneous_ops_per_sec || '0',
      keyspaceHits: result.keyspace_hits || '0',
      keyspaceMisses: result.keyspace_misses || '0',
    };
  }
}

export default new CacheService();
