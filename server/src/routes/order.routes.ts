import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { auth, requirePermission } from "../middleware/auth";

const router = Router();

// 支付/退款回调已迁移到统一回调 → POST /api/callback/notify
// 保留旧路由做兼容转发
router.post("/pay-callback", orderController.payCallback);
router.post("/refund-callback", orderController.refundCallback);

// 以下接口需要认证
router.use(auth);

// ===== 小程序接口（仅需登录，无需管理员权限） =====
router.get("/mp/list", orderController.mpList);
router.post("/mp/create", orderController.mpCreate);
router.post("/mp/pay", orderController.mpPay);

// ===== 管理后台接口（需管理员权限） =====
router.get("/list", requirePermission("order:list"), orderController.getList);
router.get("/", requirePermission("order:list"), orderController.getList);
router.post("/query-sync", orderController.queryAndSync);
router.post("/sync-refund", orderController.syncRefund);
router.post("/refund", orderController.refund);
router.post("/", requirePermission("order:add"), orderController.create);
router.get("/:id/refunds", orderController.getRefundRecords);
router.get("/:id", orderController.getById);

export default router;
