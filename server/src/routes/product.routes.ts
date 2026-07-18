import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { auth, requirePermission } from '../middleware/auth';

const router = Router();
router.use(auth);

// 固定路径必须在 /:id 之前
router.get('/', productController.getList);
router.get('/list', productController.getList);
router.get('/all', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', productController.create);
router.post('/:id', productController.update);
router.post('/:id/delete', productController.remove);

export default router;
