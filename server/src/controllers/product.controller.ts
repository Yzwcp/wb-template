import { Request, Response } from 'express';
import productService from '../services/product.service';
import { success, fail } from '../utils/response';

export async function getList(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const keyword = req.query.keyword as string;
  const status = req.query.status ? parseInt(req.query.status as string) : undefined;
  const result = await productService.getList({ page, pageSize, keyword, status });
  res.json(success(result));
}

export async function getAll(req: Request, res: Response) {
  const list = await productService.getAll();
  res.json(success(list));
}

export async function getById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.json(fail(400, 'ID格式不正确')); return; }
  res.json(success(await productService.getById(id)));
}

export async function create(req: Request, res: Response) {
  const { name, description, price, coverImage, images, stock, sort, status } = req.body;
  if (!name) { res.json(fail(400, '商品名称不能为空')); return; }
  res.json(success(await productService.create({ name, description, price, coverImage, images, stock, sort, status }), '创建成功'));
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.json(fail(400, 'ID格式不正确')); return; }
  res.json(success(await productService.update(id, req.body), '更新成功'));
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.json(fail(400, 'ID格式不正确')); return; }
  await productService.remove(id);
  res.json(success(null, '删除成功'));
}
