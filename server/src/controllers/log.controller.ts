import { Request, Response } from 'express';
import logService from '../services/log.service';
import { success, page } from '../utils/response';
import logger from '../utils/logger';

/** 获取操作日志列表 */
export async function getOperationLogs(req: Request, res: Response): Promise<void> {
  const { page: p, pageSize: ps, username, module, startDate, endDate } = req.query;
  const pageNum = parseInt(p as string) || 1;
  const pageSizeNum = parseInt(ps as string) || 10;

  const result = await logService.getOperationLogs({
    page: pageNum,
    pageSize: pageSizeNum,
    username: username as string,
    module: module as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.json(page(result.list, result.total, result.page, result.pageSize));
}

/** 清空操作日志 */
export async function clearOperationLogs(_req: Request, res: Response): Promise<void> {
  await logService.clearOperationLogs();
  res.json(success(null, '操作日志已清空'));
}

/** 获取登录日志列表 */
export async function getLoginLogs(req: Request, res: Response): Promise<void> {
  const { page: p, pageSize: ps, username, startDate, endDate } = req.query;
  const pageNum = parseInt(p as string) || 1;
  const pageSizeNum = parseInt(ps as string) || 10;

  const result = await logService.getLoginLogs({
    page: pageNum,
    pageSize: pageSizeNum,
    username: username as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.json(page(result.list, result.total, result.page, result.pageSize));
}

/** 清空登录日志 */
export async function clearLoginLogs(_req: Request, res: Response): Promise<void> {
  await logService.clearLoginLogs();
  res.json(success(null, '登录日志已清空'));
}
