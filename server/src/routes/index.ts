import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import roleRoutes from "./role.routes";
import menuRoutes from "./menu.routes";
import permissionRoutes from "./permission.routes";
import dictRoutes from "./dict.routes";
import fileRoutes from "./file.routes";
import cacheRoutes from "./cache.routes";
import logRoutes from "./log.routes";
import taskRoutes from "./task.routes";
import queueRoutes from "./queue.routes";
import globalConfigRoutes from "./globalConfig.routes";
import wechatRoutes from "./wechat.routes";
import orderRoutes from "./order.routes";
import productRoutes from "./product.routes";
import callbackRoutes from "./callback.routes";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/role", roleRoutes);
router.use("/menu", menuRoutes);
router.use("/permission", permissionRoutes);
router.use("/dict", dictRoutes);
router.use("/file", fileRoutes);
router.use("/cache", cacheRoutes);
router.use("/log", logRoutes);
router.use("/task", taskRoutes);
router.use("/queue", queueRoutes);
router.use("/global-config", globalConfigRoutes);
router.use("/wechat", wechatRoutes);
router.use("/order", orderRoutes);
router.use("/product", productRoutes);
router.use("/callback", callbackRoutes);

export default router;
