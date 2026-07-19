import { Router } from 'express';
import { auth, requirePermission } from '../middleware/auth';
import * as queueController from '../controllers/queue.controller';

const router = Router();
router.use(auth);

// 队列概览
router.get('/list', requirePermission('sys:queue:list'), queueController.getQueues);
router.get('/', requirePermission('sys:queue:list'), queueController.getQueues);

// 队列任务列表
router.get('/jobs', requirePermission('sys:queue:list'), queueController.getJobList);

// 重试任务
router.post('/:queue/:jobId/retry', requirePermission('sys:queue:list'), queueController.retryJob);

// 清理队列
router.post('/:queue/clean', requirePermission('sys:queue:list'), queueController.cleanQueue);

export default router;
