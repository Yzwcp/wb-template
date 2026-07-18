import { Router } from 'express';
import * as callbackController from '../controllers/callback.controller';

const router = Router();

// 统一回调入口（支付 + 退款）
// 微信配置的 notify_url 和 refund_notify_url 都指向此地址
router.post('/notify', callbackController.notify);

export default router;
