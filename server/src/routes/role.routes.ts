import { Router } from 'express';
import * as roleController from '../controllers/role.controller';
import { auth, requirePermission } from '../middleware/auth';

const router = Router();

router.use(auth);

// 角色列表
router.get('/', requirePermission('sys:role:list'), roleController.getList);
router.get('/list', requirePermission('sys:role:list'), roleController.getList);
router.get('/all', requirePermission('sys:role:list'), roleController.getAll);

// 角色详情
router.get('/:id', requirePermission('sys:role:list'), roleController.getById);

// 创建角色
router.post('/', requirePermission('sys:role:add'), roleController.create);

// 更新角色
router.post('/:id', requirePermission('sys:role:edit'), roleController.update);

// 删除角色
router.post('/:id/delete', requirePermission('sys:role:delete'), roleController.remove);

// 分配菜单
router.post('/:id/menus', requirePermission('sys:role:menu'), roleController.assignMenus);

// 更新角色状态
router.post('/:id/status', requirePermission('sys:role:edit'), roleController.update);

export default router;
