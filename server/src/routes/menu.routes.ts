import { Router } from "express";
import * as menuController from "../controllers/menu.controller";
import { auth, requirePermission } from "../middleware/auth";

const router: Router = Router();

router.use(auth);

// 菜单树
router.get("/tree", requirePermission("sys:menu:list"), menuController.getTree);
router.get("/list", requirePermission("sys:menu:list"), menuController.getTree);

// 菜单详情
router.get("/:id", requirePermission("sys:menu:list"), menuController.getById);

// 创建菜单
router.post("/", requirePermission("sys:menu:add"), menuController.create);

// 更新菜单
router.post(
  "/:id",
  requirePermission("sys:menu:update"),
  menuController.update,
);

// 删除菜单
router.post(
  "/:id/delete",
  requirePermission("sys:menu:delete"),
  menuController.remove,
);

export default router;
