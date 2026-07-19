import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { auth, requirePermission } from "../middleware/auth";

const router: Router = Router();

// 所有接口需要认证
router.use(auth);

// 用户列表
router.get("/", requirePermission("sys:user:list"), userController.getList);
router.get("/list", requirePermission("sys:user:list"), userController.getList);

// 用户详情
router.get("/:id", requirePermission("sys:user:list"), userController.getById);

// 创建用户
router.post("/", requirePermission("sys:user:add"), userController.create);

// 更新用户
router.post(
  "/:id",
  requirePermission("sys:user:update"),
  userController.update,
);

// 删除用户
router.post(
  "/:id/delete",
  requirePermission("sys:user:delete"),
  userController.remove,
);

// 更新用户状态
router.post(
  "/:id/status",
  requirePermission("sys:user:update"),
  userController.updateStatus,
);

// 分配角色
router.post(
  "/:id/roles",
  requirePermission("sys:user:role"),
  userController.assignRoles,
);

export default router;
