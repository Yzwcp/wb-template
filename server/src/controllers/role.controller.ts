import { Request, Response } from 'express';
import roleService from '../services/role.service';
import { success, fail } from '../utils/response';

/** 获取角色列表 */
export async function getList(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const { keyword, status } = req.query;
  const statusNum = status ? parseInt(status as string) : undefined;
  const result = await roleService.getList({
    keyword: keyword as string,
    status: statusNum,
    page,
    pageSize,
  });
  res.json(success(result));
}

/** 获取角色详情 */
export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  const role = await roleService.getById(id);
  res.json(success(role));
}

/** 获取全部角色（不分页，用于下拉选择） */
export async function getAll(req: Request, res: Response): Promise<void> {
  const roles = await roleService.getAll();
  res.json(success(roles));
}

/** 创建角色 */
export async function create(req: Request, res: Response): Promise<void> {
  const { name, code, description, sort, status } = req.body;
  if (!name || !code) {
    res.json(fail(400, '角色名称和编码不能为空'));
    return;
  }
  const role = await roleService.create({ name, code, description, sort, status });
  res.json(success(role, '创建成功'));
}

/** 更新角色 */
export async function update(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  const { name, description, sort, status } = req.body;
  await roleService.update(id, { name, description, sort, status });
  res.json(success(null, '更新成功'));
}

/** 删除角色 */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  await roleService.remove(id);
  res.json(success(null, '删除成功'));
}

/** 分配菜单 */
export async function assignMenus(req: Request, res: Response): Promise<void> {
  const roleId = parseInt(req.params.id);
  if (isNaN(roleId)) {
    res.json(fail(400, '角色ID格式不正确'));
    return;
  }
  const { menuIds } = req.body;
  if (!menuIds || !Array.isArray(menuIds)) {
    res.json(fail(400, '菜单ID数组不能为空'));
    return;
  }
  await roleService.assignMenus(roleId, menuIds);
  res.json(success(null, '菜单分配成功'));
}
