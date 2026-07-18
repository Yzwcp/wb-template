import Redis from 'ioredis';
import { config } from './index';
import logger from '../utils/logger';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  keyPrefix: config.redis.keyPrefix,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
    logger.info('[Redis] Connected successfully');
});

redis.on('error', (err) => {
    logger.error('[Redis] Connection error', { error: err.message });
});
