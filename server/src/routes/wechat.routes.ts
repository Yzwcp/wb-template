import { Router } from 'express';
import * as wechatController from '../controllers/wechat.controller';
import { auth } from '../middleware/auth';

const router = Router();

router.use(auth);

// 获取 OpenID
router.post('/openid', wechatController.getOpenid);

// 获取手机号
router.post('/phone', wechatController.getPhone);

// 发送订阅消息
router.post('/subscribe', wechatController.sendSubscribe);

// 统一下单
router.post('/pay/unified-order', wechatController.unifiedOrder);

// 查询订单
router.post('/pay/query', wechatController.queryOrder);

// 申请退款
router.post('/refund', wechatController.refund);

// 查询退款
router.post('/refund/query', wechatController.queryRefund);

export default router;
