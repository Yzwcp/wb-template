import { Router } from "express";
import * as dictController from "../controllers/dict.controller";
import { auth, requirePermission } from "../middleware/auth";

const router = Router();

router.use(auth);

// ============ 字典类型 ============
// 字典类型列表
router.get(
  "/types",
  requirePermission("sys:dict:list"),
  dictController.getTypes,
);
router.get(
  "/type/list",
  requirePermission("sys:dict:list"),
  dictController.getTypes,
);
router.get(
  "/type/all",
  requirePermission("sys:dict:list"),
  dictController.getTypes,
);

// 获取所有字典（前端初始化，仅需登录）
router.get("/all", dictController.getAll);

// 创建字典类型
router.post(
  "/types",
  requirePermission("sys:dict:add"),
  dictController.createType,
);
router.post(
  "/type",
  requirePermission("sys:dict:add"),
  dictController.createType,
);

// 更新字典类型
router.post(
  "/types/:id",
  requirePermission("sys:dict:edit"),
  dictController.updateType,
);
router.post(
  "/type/:id",
  requirePermission("sys:dict:edit"),
  dictController.updateType,
);

// 删除字典类型
router.post(
  "/types/:id/delete",
  requirePermission("sys:dict:delete"),
  dictController.deleteType,
);
router.post(
  "/type/:id/delete",
  requirePermission("sys:dict:delete"),
  dictController.deleteType,
);

// ============ 字典数据 ============
// 注意：固定路径必须在 /:typeCode 之前注册，否则会被参数捕获

// 字典数据分页列表
router.get(
  "/data/list",
  requirePermission("sys:dict:list"),
  dictController.getDataList,
);
router.get(
  "/data",
  requirePermission("sys:dict:list"),
  dictController.getDataList,
);

// 根据类型编码获取字典数据（需登录，无额外鉴权）
router.get("/data/:typeCode", dictController.getDataByCode);

// 创建字典数据
router.post(
  "/data",
  requirePermission("sys:dict:add"),
  dictController.createData,
);

// 更新字典数据
router.post(
  "/data/:id",
  requirePermission("sys:dict:edit"),
  dictController.updateData,
);

// 删除字典数据
router.post(
  "/data/:id/delete",
  requirePermission("sys:dict:remove"),
  dictController.deleteData,
);

export default router;
