import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { config } from '../config';
import { success, fail, page } from '../utils/response';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

const QUEUE_NAMES = ['wechat-callback'];

function getQueue(name: string): Queue {
  return new Queue(name, {
    connection,
    prefix: config.redis.keyPrefix,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });
}

/** 获取所有队列概览 */
export async function getQueues(_req: Request, res: Response): Promise<void> {
  const result = await Promise.all(
    QUEUE_NAMES.map(async (name) => {
      const q = getQueue(name);
      try {
        const [counts, paused] = await Promise.all([
          q.getJobCounts(),
          q.isPaused(),
        ]);
        return {
          name,
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
          paused,
        };
      } finally {
        await q.close();
      }
    }),
  );
  res.json(success(result));
}

/** 获取指定队列的任务列表 */
export async function getJobList(req: Request, res: Response): Promise<void> {
  const queueName = (req.query.queue || req.params.queue) as string | undefined;
  if (!queueName) {
    res.json(fail(400, 'queue 不能为空'));
    return;
  }

  const pageNum = parseInt((req.query.page as string) || '1');
  const pageSizeNum = parseInt((req.query.pageSize as string) || '10');
  const q = getQueue(queueName);

  try {
    const allJobs = await q.getJobs(['failed', 'waiting', 'active', 'delayed', 'completed'], 0, 999);
    allJobs.sort((a, b) => ((b.processedOn || b.timestamp || 0) - (a.processedOn || a.timestamp || 0)));

    const total = allJobs.length;
    const start = (pageNum - 1) * pageSizeNum;
    const paged = allJobs.slice(start, start + pageSizeNum);

    const list = await Promise.all(
      paged.map(async (job) => ({
        id: job.id!,
        name: job.name,
        queue: queueName,
        data: job.data,
        attemptsMade: job.attemptsMade,
        status: await job.getState(),
        processedOn: job.processedOn || 0,
        finishedOn: job.finishedOn || 0,
        failedReason: job.failedReason || '',
      })),
    );

    res.json(success({ list, total, page: pageNum, pageSize: pageSizeNum }));
  } finally {
    await q.close();
  }
}

/** 重试失败任务 */
export async function retryJob(req: Request, res: Response): Promise<void> {
  const { queue, jobId } = req.params;
  const q = getQueue(queue);
  try {
    const job = await q.getJob(jobId);
    if (!job) {
      res.json(fail(400, '任务不存在'));
      return;
    }
    await job.retry();
    res.json(success(null, '已重试'));
  } finally {
    await q.close();
  }
}

/** 清理队列（清空已完成的、失败的任务） */
export async function cleanQueue(req: Request, res: Response): Promise<void> {
  const { queue } = req.params;
  const q = getQueue(queue);
  try {
    await Promise.all([
      q.clean(0, 1000, 'completed'),
      q.clean(0, 1000, 'failed'),
      q.clean(0, 1000, 'delayed'),
      q.clean(0, 1000, 'wait'),
    ]);
    res.json(success(null, '队列已清理'));
  } finally {
    await q.close();
  }
}
