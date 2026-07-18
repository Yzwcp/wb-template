import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { auth } from "../middleware/auth";

const router: Router = Router();

// 登录（无需认证）
router.post("/login", authController.login);

// 小程序登录（无需认证）
router.post("/mp-login", authController.mpLogin);

// 刷新Token（需要携带refreshToken，但不需要通过auth中间件验证，在controller内处理）
router.post("/refresh", authController.refresh);

// 以下接口需要认证
router.post("/logout", auth, authController.logout);
router.get("/info", auth, authController.getUserInfo);
router.post("/password", auth, authController.changePassword);

// 验证码（无需认证）
router.get("/captcha", authController.getCaptcha);

export default router;
