import { Request, Response } from 'express';
import dictService from '../services/dict.service';
import { success, fail } from '../utils/response';

// ==================== 字典类型 ====================

/** 获取字典类型列表 */
export async function getTypes(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const { keyword, status } = req.query;
  const statusNum = status ? parseInt(status as string) : undefined;
  const result = await dictService.getTypes({
    keyword: keyword as string,
    status: statusNum,
    page,
    pageSize,
  });
  res.json(success(result));
}

/** 获取所有字典 */
export async function getAll(req: Request, res: Response): Promise<void> {
  const data = await dictService.getAll();
  res.json(success(data));
}

/** 创建字典类型 */
export async function createType(req: Request, res: Response): Promise<void> {
  const { name, code, status } = req.body;
  if (!name || !code) {
    res.json(fail(400, '字典名称和编码不能为空'));
    return;
  }
  const type = await dictService.createType({ name, code, status });
  res.json(success(type, '创建成功'));
}

/** 更新字典类型 */
export async function updateType(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  const { name, code, status } = req.body;
  await dictService.updateType(id, { name, code, status });
  res.json(success(null, '更新成功'));
}

/** 删除字典类型 */
export async function deleteType(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  await dictService.deleteType(id);
  res.json(success(null, '删除成功'));
}

// ==================== 字典数据 ====================

/** 根据类型编码获取字典数据 */
export async function getDataByCode(req: Request, res: Response): Promise<void> {
  const { typeCode } = req.params;
  if (!typeCode) {
    res.json(fail(400, '字典类型编码不能为空'));
    return;
  }
  const data = await dictService.getDataByCode(typeCode);
  res.json(success(data));
}

/** 获取字典数据分页列表 */
export async function getDataList(req: Request, res: Response): Promise<void> {
  const dictTypeId = parseInt(req.query.dictTypeId as string);
  if (isNaN(dictTypeId)) {
    res.json(fail(400, '字典类型ID不能为空'));
    return;
  }
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const keyword = req.query.keyword as string;
  const result = await dictService.getDataList({ dictTypeId, page, pageSize, keyword });
  res.json(success(result));
}

/** 创建字典数据 */
export async function createData(req: Request, res: Response): Promise<void> {
  const { typeId, label, value, sort, status } = req.body;
  if (!typeId || !label || value === undefined) {
    res.json(fail(400, '字典类型ID、标签和值不能为空'));
    return;
  }
  const data = await dictService.createData({ typeId, label, value, sort, status });
  res.json(success(data, '创建成功'));
}

/** 更新字典数据 */
export async function updateData(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  const { label, value, sort, status } = req.body;
  await dictService.updateData(id, { label, value, sort, status });
  res.json(success(null, '更新成功'));
}

/** 删除字典数据 */
export async function deleteData(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.json(fail(400, 'ID格式不正确'));
    return;
  }
  await dictService.deleteData(id);
  res.json(success(null, '删除成功'));
}
