import { Request, Response } from 'express';
import menuService from '../services/menu.service';
import { success, fail } from '../utils/response';

/** 获取菜单树 */
export async function getTree(_req: Request, res: Response): Promise<void> {
  const tree = await menuService.getTree();
  res.json(success(tree));
}

/** 获取菜单详情 */
export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  const menu = await menuService.getById(id);
  res.json(success(menu));
}

/** 创建菜单 */
export async function create(req: Request, res: Response): Promise<void> {
  const { parentId, name, type, path, component, icon, permission, sort, visible, status } = req.body;
  if (!name || !type) {
    res.json(fail(400, '菜单名称和类型不能为空'));
    return;
  }
  const menu = await menuService.create({
    parentId, name, type, path, component, icon, permission, sort, visible, status,
  });
  res.json(success(menu, '创建成功'));
}

/** 更新菜单 */
export async function update(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  const { parentId, name, type, path, component, icon, permission, sort, visible, status } = req.body;
  await menuService.update(id, {
    parentId, name, type, path, component, icon, permission, sort, visible, status,
  });
  res.json(success(null, '更新成功'));
}

/** 删除菜单 */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  await menuService.remove(id);
  res.json(success(null, '删除成功'));
}
