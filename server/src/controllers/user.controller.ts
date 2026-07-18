import { Request, Response } from "express";
import userService from "../services/user.service";
import { success, fail, page } from "../utils/response";

/** 获取用户列表 */
export async function getList(req: Request, res: Response): Promise<void> {
  const { page: p, pageSize: ps, keyword, status } = req.query;
  const pageNum = parseInt(p as string) || 1;
  const pageSizeNum = parseInt(ps as string) || 10;
  const statusNum = status ? parseInt(status as string) : undefined;

  const result = await userService.getList({
    page: pageNum,
    pageSize: pageSizeNum,
    keyword: keyword as string,
    status: statusNum,
  });

  res.json(page(result.list, result.total, result.page, result.pageSize));
}

/** 获取用户详情 */
export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }
  const user = await userService.getById(id);
  res.json(success(user));
}

/** 创建用户 */
export async function create(req: Request, res: Response): Promise<void> {
  const {
    username,
    password,
    nickname,
    email,
    phone,
    avatar,
    status,
    platform = "pc",
  } = req.body;
  if (!username || !password) {
    res.json(fail(400, "用户名和密码不能为空"));
    return;
  }
  const user = await userService.create({
    username,
    password,
    nickname,
    email,
    phone,
    avatar,
    status,
    platform,
  });
  res.json(success(user, "创建成功"));
}

/** 更新用户 */
export async function update(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }
  const { nickname, email, phone, avatar, status } = req.body;
  await userService.update(id, { nickname, email, phone, avatar, status });
  res.json(success(null, "更新成功"));
}

/** 删除用户 */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }
  await userService.remove(id);
  res.json(success(null, "删除成功"));
}

/** 更新用户状态 */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, "ID格式不正确"));
    return;
  }
  const { status } = req.body;
  if (!status) {
    res.json(fail(400, "状态不能为空"));
    return;
  }
  await userService.updateStatus(id, status);
  res.json(success(null, "状态更新成功"));
}

/** 分配角色 */
export async function assignRoles(req: Request, res: Response): Promise<void> {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    res.json(fail(400, "用户ID格式不正确"));
    return;
  }
  const { roleIds } = req.body;
  if (!roleIds || !Array.isArray(roleIds)) {
    res.json(fail(400, "角色ID数组不能为空"));
    return;
  }
  await userService.assignRoles(userId, roleIds);
  res.json(success(null, "角色分配成功"));
}
