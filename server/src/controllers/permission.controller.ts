import { Request, Response } from 'express';
import permissionService from '../services/permission.service';
import { success, fail } from '../utils/response';

/** 获取权限列表 */
export async function getList(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const { keyword } = req.query;
  const result = await permissionService.getList({ keyword: keyword as string, page, pageSize });
  res.json(success(result));
}

/** 创建权限 */
export async function create(req: Request, res: Response): Promise<void> {
  const { name, code, description } = req.body;
  if (!name || !code) {
    res.json(fail(400, '权限名称和编码不能为空'));
    return;
  }
  const permission = await permissionService.create({ name, code, description });
  res.json(success(permission, '创建成功'));
}

/** 更新权限 */
export async function update(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  const { name, description } = req.body;
  await permissionService.update(id, { name, description });
  res.json(success(null, '更新成功'));
}

/** 删除权限 */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  await permissionService.remove(id);
  res.json(success(null, '删除成功'));
}
