import { Router } from "express";
import * as globalConfigController from "../controllers/globalConfig.controller";
import { auth, requirePermission } from "../middleware/auth";

const router = Router();

router.use(auth);

// 获取启用的配置
router.get(
  "/active",
  requirePermission("sys:config:list"),
  globalConfigController.getActive,
);

// 设置启用配置
router.post(
  "/:id/active",
  requirePermission("sys:config:edit"),
  globalConfigController.setActive,
);

// 创建配置
router.post(
  "/",
  requirePermission("sys:config:add"),
  globalConfigController.create,
);

// 更新配置
router.post(
  "/:id",
  requirePermission("sys:config:edit"),
  globalConfigController.update,
);

// 删除配置
router.post(
  "/:id/delete",
  requirePermission("sys:config:delete"),
  globalConfigController.remove,
);
// 获取配置列表
router.get(
  "/",
  requirePermission("sys:config:list"),
  globalConfigController.getList,
);
export default router;
