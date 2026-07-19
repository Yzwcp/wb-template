import { Router } from "express";
import * as logController from "../controllers/log.controller";
import { auth, requirePermission } from "../middleware/auth";

const router: Router = Router();

router.use(auth);

// ============ 操作日志 ============
router.get(
  "/operation",
  requirePermission("sys:log:list"),
  logController.getOperationLogs,
);
router.get(
  "/operation/list",
  requirePermission("sys:log:list"),
  logController.getOperationLogs,
);

// 清空操作日志
router.post(
  "/operation/clear",
  requirePermission("sys:log:delete"),
  logController.clearOperationLogs,
);

// ============ 登录日志 ============
router.get(
  "/login",
  requirePermission("sys:log:list"),
  logController.getLoginLogs,
);
router.get(
  "/login/list",
  requirePermission("sys:log:list"),
  logController.getLoginLogs,
);

// 清空登录日志
router.post(
  "/login/clear",
  requirePermission("sys:log:delete"),
  logController.clearLoginLogs,
);

export default router;
