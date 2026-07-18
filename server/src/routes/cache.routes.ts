import { Router } from "express";
import * as cacheController from "../controllers/cache.controller";
import { auth, requirePermission } from "../middleware/auth";

const router: Router = Router();
router.use(auth);

// Redis 信息
router.get(
  "/info",
  requirePermission("sys:cache:list"),
  cacheController.getRedisInfo,
);

// 缓存 Keys 列表（分页）
router.get(
  "/keys",
  requirePermission("sys:cache:list"),
  cacheController.getKeys,
);

// 获取所有 Key（不分页）— 必须在 /keys/:key 前
router.get(
  "/keys/all",
  requirePermission("sys:cache:list"),
  cacheController.getAllKeys,
);

// Key 详情
router.get(
  "/keys/:key",
  requirePermission("sys:cache:list"),
  cacheController.getKeyDetail,
);
router.get(
  "/key",
  requirePermission("sys:cache:list"),
  cacheController.getKeyDetail,
);

// 删除 Key
router.post(
  "/key/delete",
  requirePermission("sys:cache:delete"),
  cacheController.deleteKey,
);

// 清空所有缓存
router.post(
  "/clear",
  requirePermission("sys:cache:delete"),
  cacheController.clearCache,
);

export default router;
