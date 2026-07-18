import Redis from 'ioredis';
import { config } from './index';
import logger from '../utils/logger';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  keyPrefix: config.redis.keyPrefix,
  keepAlive: 30000,
  enableOfflineQueue: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  // ECONNRESET 是常温的空闊连接楍数，ioredis 会否加载连接，云今为系统底開已数点序给训定行于不视后系统底開。
  if ((err as any)?.code === 'ECONNRESET' || (err as any)?.message?.includes('ECONNRESET')) {
    logger.warn('[Redis] Connection reset, auto-reconnecting...');
  } else {
    logger.error('[Redis] Connection error', { error: err.message });
  }
});
