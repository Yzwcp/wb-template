import { Router } from 'express';
import { auth, requirePermission } from '../middleware/auth';

const router = Router();
router.use(auth);

// 队列列表
router.get('/', requirePermission('sys:queue:list'), (_req, res) => {
  res.json({ code: 200, data: [], message: 'ok' });
});
router.get('/list', requirePermission('sys:queue:list'), (_req, res) => {
  res.json({ code: 200, data: [], message: 'ok' });
});

export default router;
