import { Router } from 'express';
import * as permissionController from '../controllers/permission.controller';
import { auth, requirePermission } from '../middleware/auth';

const router = Router();

router.use(auth);

// 权限列表
router.get('/', requirePermission('sys:permission:list'), permissionController.getList);
router.get('/list', requirePermission('sys:permission:list'), permissionController.getList);

// 创建权限
router.post('/', requirePermission('sys:permission:add'), permissionController.create);

// 更新权限
router.post('/:id', requirePermission('sys:permission:edit'), permissionController.update);

// 删除权限
router.post('/:id/delete', requirePermission('sys:permission:delete'), permissionController.remove);

export default router;
