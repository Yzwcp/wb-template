import { Request, Response } from "express";
import cacheService from "../services/cache.service";
import { success, fail } from "../utils/response";
import logger from "../utils/logger";

/** 获取 Redis 信息 */
export async function getRedisInfo(
  _req: Request,
  res: Response,
): Promise<void> {
  const info = await cacheService.getRedisInfo();
  res.json(success(info));
}

/** 获取缓存 Keys（含 type/ttl/size，支持分页） */
export async function getKeys(req: Request, res: Response): Promise<void> {
  const { pattern } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 50;
  const allKeys = await cacheService.getKeys(pattern as string);
  const total = allKeys.length;
  const start = (page - 1) * pageSize;
  const list = allKeys.slice(start, start + pageSize);
  res.json(success({ list, total, page, pageSize }));
}

/** 获取所有缓存 Keys（不分页） */
export async function getAllKeys(req: Request, res: Response): Promise<void> {
  const { pattern } = req.query;
  const all = await cacheService.getKeys(pattern as string);
  res.json(success(all));
}

/** 获取 Key 详情 */
export async function getKeyDetail(req: Request, res: Response): Promise<void> {
  const { key } = req.query;
  if (!key) {
    res.json(fail(400, "Key不能为空"));
    return;
  }
  const detail = await cacheService.getKeyDetail(key as string);
  res.json(success(detail));
}

/** 删除 Key */
export async function deleteKey(req: Request, res: Response): Promise<void> {
  logger.info(`删除缓存Key: ${req.query.key}`);
  const { key } = req.query;
  if (!key) {
    res.json(fail(400, "Key不能为空"));
    return;
  }
  const result = await cacheService.deleteKey(key as string);
  res.json(success(result, "删除成功"));
}

/** 清空所有缓存 */
export async function clearCache(_req: Request, res: Response): Promise<void> {
  logger.info("清空所有缓存");
  const result = await cacheService.clearCache();
  res.json(success(result, "清空成功"));
}

/** 按模式清空缓存 */
export async function clearByPattern(
  req: Request,
  res: Response,
): Promise<void> {
  const { pattern } = req.body;
  if (!pattern) {
    res.json(fail(400, "匹配模式不能为空"));
    return;
  }
  logger.info(`按模式清空缓存: ${pattern}`);
  const result = await cacheService.clearByPattern(pattern);
  res.json(success(result, "清空成功"));
}
