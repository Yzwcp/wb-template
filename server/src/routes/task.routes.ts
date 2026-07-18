import { Router } from 'express';
import { auth, requirePermission } from '../middleware/auth';

const router = Router();
router.use(auth);

// 任务列表
router.get('/', requirePermission('sys:task:list'), (_req, res) => {
  res.json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 10 }, message: 'ok' });
});
router.get('/list', requirePermission('sys:task:list'), (_req, res) => {
  res.json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 10 }, message: 'ok' });
});

export default router;
