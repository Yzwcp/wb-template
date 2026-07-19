import { Request, Response } from "express";
import fileService from "../services/file.service";
import { success, fail } from "../utils/response";
import logger from "../utils/logger";

/** 上传文件（本地） */
export async function upload(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId || 0;
  const file = req.file;
  const result = await fileService.upload(file as Express.Multer.File, userId);
  res.json(success(result, "上传成功"));
}

/** 获取 OSS 直传预签名 URL */
export async function getUploadUrl(req: Request, res: Response): Promise<void> {
  const { fileName, contentType } = req.query;
  if (!fileName) {
    res.json(fail(400, "缺少 fileName"));
    return;
  }
  const result = fileService.getUploadUrl(
    fileName as string,
    (contentType as string) || "application/octet-stream",
  );
  res.json(success(result));
}

/** 保存 OSS 上传后的文件记录 */
export async function saveOssFile(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId || 0;
  const { originalName, url, mimeType, size, groupId } = req.body;
  if (!url) {
    res.json(fail(400, "文件URL不能为空"));
    return;
  }
  const result = await fileService.saveOssFile({
    originalName,
    url,
    mimeType,
    size,
    uploadBy: userId,
    groupId,
  });
  res.json(success(result, "保存成功"));
}

/** 获取文件列表（支持筛选） */
export async function getList(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const { keyword, fileType, uploadBy, groupId } = req.query;
  const result = await fileService.getList({
    page,
    pageSize,
    keyword: keyword as string,
    fileType: fileType as string,
    uploadBy: uploadBy ? parseInt(uploadBy as string) : undefined,
    groupId: groupId ? parseInt(groupId as string) : undefined,
  });
  res.json(success(result));
}

/** 获取文件详情 */
export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }
  const file = await fileService.getById(id);
  res.json(success(file));
}

/** 删除文件 */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }
  await fileService.delete(id);
  res.json(success(null, "删除成功"));
}

// ==================== 文件分组 ====================

/** 移动文件到分组 */
export async function moveToGroup(req: Request, res: Response): Promise<void> {
  const { fileIds, groupId } = req.body;
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    res.json(fail(400, "fileIds 不能为空"));
    return;
  }
  const result = await fileService.moveToGroup(fileIds, groupId || null);
  res.json(success(result, `成功移动 ${result.affectedCount} 个文件`));
}


/** 获取分组列表 */
export async function getGroups(_req: Request, res: Response): Promise<void> {
  const groups = await fileService.getGroups();
  res.json(success(groups));
}

/** 创建分组 */
export async function createGroup(req: Request, res: Response): Promise<void> {
  const { name } = req.body;
  if (!name) {
    res.json(fail(400, "分组名不能为空"));
    return;
  }
  const group = await fileService.createGroup(name);
  res.json(success(group, "创建成功"));
}

/** 更新分组 */
export async function updateGroup(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const { name } = req.body;
  if (isNaN(id) || !name) {
    res.json(fail(400, "参数错误"));
    return;
  }
  await fileService.updateGroup(id, name);
  res.json(success(null, "更新成功"));
}

/** 删除分组 */
export async function deleteGroup(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }
  await fileService.deleteGroup(id);
  res.json(success(null, "删除成功"));
}
