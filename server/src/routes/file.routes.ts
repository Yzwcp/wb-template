import { Router } from "express";
import * as fileController from "../controllers/file.controller";
import { auth, requirePermission } from "../middleware/auth";
import multer from "multer";
import path from "path";
import { config } from "../config";

const router: Router = Router();

router.use(auth);

// 配置文件上传
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.storage.localPath || "./uploads");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB限制

// OSS 直传预签名 URL
router.get("/upload-url", fileController.getUploadUrl);

// OSS 上传后保存文件记录
router.post("/save", fileController.saveOssFile);

// 上传文件
router.post(
  "/upload",
  upload.single("file"),
  requirePermission("sys:file:upload"),
  fileController.upload,
);

// 文件列表
// router.get("/", requirePermission("sys:file:list"), fileController.getList);
router.get("/list", requirePermission("sys:file:list"), fileController.getList);

// 文件详情
router.get("/:id", requirePermission("sys:file:list"), fileController.getById);

// 删除文件
router.post(
  "/:id/delete",
  requirePermission("sys:file:delete"),
  fileController.remove,
);

// 移动文件到分组
router.post(
  "/move-to-group",
  requirePermission("sys:file:update"),
  fileController.moveToGroup,
);

// ===== 文件分组 =====
router.get("/groups/list", fileController.getGroups);
router.post("/groups", fileController.createGroup);
router.post("/groups/:id", fileController.updateGroup);
router.post("/groups/:id/delete", fileController.deleteGroup);

export default router;
