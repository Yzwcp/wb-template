import { Queue, Worker } from 'bullmq';
import { config } from './index';
import logger from '../utils/logger';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

/** 微信回调通知队列 */
export const callbackQueue = new Queue('wechat-callback', {
  connection,
  prefix: config.redis.keyPrefix,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

/** 启动回调处理器（在 server.ts 中调用） */
export function startCallbackWorker() {
  const worker = new Worker(
    'wechat-callback',
    async (job) => {
      const { type, data } = job.data;
      const { processPayCallback, processRefundCallback } = await import('../jobs/process-callback');
      if (type === 'payment') {
        await processPayCallback(data);
      } else if (type === 'refund') {
        await processRefundCallback(data);
      }
    },
    { connection, prefix: config.redis.keyPrefix, concurrency: 5 },
  );

  worker.on('completed', (job) => {
      logger.info(`[Callback] Job ${job.id} completed: ${job.data.type}`);
  });
  worker.on('failed', (job, err) => {
      logger.error(`[Callback] Job ${job?.id} failed`, { error: err?.message });
  });

  return worker;
}
